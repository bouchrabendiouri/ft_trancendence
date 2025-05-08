import json
import logging
import jwt
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from channels.exceptions import DenyConnection
from django.conf import settings

# Get logger
logger = logging.getLogger('user_management')


class StatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.user = await self.check_token()
            if not self.user:
                logger.debug("User not found, closing connection.")
                await self.close()
                return
            # Set the group name for the current user
            self.group_name = f"user_{self.user.id}"
            logger.debug(f"User {self.user.id} group name: {self.group_name}")

            # Add user to their own group
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await self.accept()

            # Also add friends to their respective groups
            friends_ids = await self.get_user_friends(self.user)
            for friend_id in friends_ids:
                friend_group_name = f"user_{friend_id}"
                logger.debug(f"Adding user {friend_id} to their group: {friend_group_name}")
                await self.channel_layer.group_add(friend_group_name, self.channel_name)

        except Exception as e:
            logger.error(f"Error during WebSocket connection: {e}")
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.change_status(False)
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

            # Also ensure we remove from each friend's group
            friends_ids = await self.get_user_friends(self.user)
            self.user.is_online = False
            await self.save_user()
            for friend_id in friends_ids:
                friend_group_name = f"user_{friend_id}"
                await self.channel_layer.group_discard(friend_group_name, self.channel_name)
        else:
            logger.error("group_name is not set, skipping group discard.")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            logger.debug(f"Received data: {data}")
            action = data.get("action")
            if action == "updateStatus":
                status = data.get("status")
                self.user.is_online = status
                await self.save_user()
                await self.change_status(status)
            else:
                logger.warning("No status provided in updateStatus action.")
        except Exception as e:
            logger.error(f"Error processing received data: {e}")

    async def change_status(self, status):
        try:
            logger.debug(f"Changing status to {status}.")
            friends_ids = await self.get_user_friends(self.user)
            for friend_id in friends_ids:
                group_name = f"user_{friend_id}"
                try:
                    logger.debug(f"Sending status update to group: {group_name}")
                    await self.channel_layer.group_send(
                        group_name,
                        {
                            "type": "status_update",
                            "action": "status",
                            "id": self.user.id,
                            "status": status,
                            "username": self.user.username,
                        }
                    )
                    logger.debug("Message sent successfully.")
                except Exception as e:
                    logger.error(f"Error sending message to group {group_name}: {e}")
        except Exception as e:
            logger.error(f"Error fetching friends: {e}")

    async def status_update(self, event):
        logger.debug(f"Sending status update: {event}")
        await self.send(text_data=json.dumps({
            "action": event["action"],
            "id": event["id"],
            "status": event["status"],
            "username": event["username"],
        }))

    async def check_token(self):
        token = self.scope['cookies'].get('access_token')  # Assuming token is passed in cookies
        if not token:
            raise DenyConnection("No token provided")

        try:
            decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = decoded_token.get('user_id')
            user = await self.get_user(user_id)
            if not user:
                raise DenyConnection("Invalid token")
            return user
        except jwt.ExpiredSignatureError:
            raise DenyConnection("Token expired")
        except jwt.InvalidTokenError:
            raise DenyConnection("Invalid token")
        except Exception as e:
            logger.error(f"Error decoding token: {e}")
            raise DenyConnection("Error processing token")

    @database_sync_to_async
    def get_user(self, user_id):
        from .models import CustomUser
        try:
            return CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return None

    @database_sync_to_async
    def get_user_friends(self, user):
        from .models import Friendship
        friends_as_user1 = Friendship.objects.filter(user1=user).values_list('user2', flat=True)
        friends_as_user2 = Friendship.objects.filter(user2=user).values_list('user1', flat=True)
        friends = list(friends_as_user1) + list(friends_as_user2)
        return list(set(friends))

    @database_sync_to_async
    def save_user(self):
        self.user.save()
