import json
import asyncio
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.db.models import Q
from .models import Room, Message, User, BlockedUser, GameWarning
from chat.services import get_user_from_key

# Helper functions


@sync_to_async
def get_other_user(user, room):
    """Get the other user in the room based on the room object."""
    return room.user1_id if room.user2_id == user['id'] else room.user2_id

class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_id = None
        self.roomGroupName = None
        self.user = None
    async def connect(self):
        # Get token from cookies
        cookies = self.scope.get('cookies', {})
        self.key = cookies.get('access_token')
        if not self.key:
            print("No access token found in cookies")
            await self.close()
            return
        # Get room ID from URL route parameters
        self.room_id = self.scope['url_route']['kwargs']['pk']
        self.roomGroupName = f'chat_room_{self.room_id}'

        try:
            room = await database_sync_to_async(Room.objects.get)(id=self.room_id)
            self.user = await database_sync_to_async(get_user_from_key)(self.key)
            self.other_user = await get_other_user(self.user,room)
            self.user_id = self.user['id']
        except Room.DoesNotExist:
            await self.close()
            return

        if await self.is_blocked(self.user['id'], self.other_user):
            print("websocket closed because of blocked user")
            await self.close()  # Close WebSocket if blocked
            return
        # Add the channel to the group and accept the connection
        await self.channel_layer.group_add(self.roomGroupName, self.channel_name)
        await self.accept()

        # Mark messages as seen
        await self.mark_received_messages_as_seen()

        self.message_update_task = asyncio.create_task(self.listen_for_unseen_messages())
        self.seen_update_task = asyncio.create_task(self.seen_send())

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        print("disconnecting from room: ", self.roomGroupName)
        await self.channel_layer.group_discard(self.roomGroupName, self.channel_name)
        if hasattr(self, "message_update_task"):
            self.message_update_task.cancel()
        if hasattr(self, "seen_update_task"):
            self.seen_update_task.cancel()

    async def receive(self, text_data):
        """Handle received WebSocket messages."""
        try:
            data = json.loads(text_data)
            message = data.get("message")
            username = data.get("username")
            room_name = data.get("room_name")
            type = data.get("type")
            matchId = data.get("match_id")



            if not (message and username and room_name):
                return

            # Get the room using ID instead of slug
            room = await database_sync_to_async(Room.objects.get)(id=self.room_id)
            # Check if user is blocked
            if await self.is_blocked(self.user['id'], self.other_user):
                await self.send(json.dumps({"message": "You are blocked from sending messages."}))
                return

            # Save message to the database
            new_message = await database_sync_to_async(Message.objects.create)(
                    room=room, 
                    user_id=self.user['id'],
                    content=message,
                    type=type,
                    matchId=matchId

                )
            

            await self.send(json.dumps({
                "action": "sendMessage",
                "message": message,
                "username": username,
                "message_id": new_message.id,
                "room_id": self.room_id,
                "type": type,
                "matchId": matchId
            }))
        except Room.DoesNotExist as e:
            await self.send(json.dumps({"error": str(e)}))


    async def is_blocked(self, user_id, other_user):
        """Check if the user is blocked by the other user."""
        return await database_sync_to_async(
            BlockedUser.objects.filter(Q(blocker_id=user_id, blocked_id=other_user) | Q(blocker_id=other_user, blocked_id=user_id)).exists
        )()

    async def mark_received_messages_as_seen(self):
        """Mark received messages as seen."""
        await database_sync_to_async(self.update_received_messages)()

    def update_received_messages(self):
        """Update unseen messages to seen for the other user."""
        Message.objects.filter(id=self.room_id, user_id=self.other_user, seen=False).update(seen=True)

    async def update_message_status(self, message_id):
        """Update the status of a message to seen."""
        try:
            message = await database_sync_to_async(Message.objects.get)(id=message_id)
            if message.user != self.user:
                message.seen = True
                await database_sync_to_async(message.save)()
        except Message.DoesNotExist:
            pass


    async def listen_for_unseen_messages(self):
        while True:
            try:
                room = await database_sync_to_async(Room.objects.get)(id=self.room_id)
                unseen_messages = await database_sync_to_async(list)(Message.objects.filter( room=room,user_id=self.other_user, seen=False))
                for message in unseen_messages:
                    await self.send(json.dumps({
                        "action": "sendMessage",
                        "message": message.content,
                        "user_id": self.other_user,
                        "message_id": message.id,
                        "type": message.type,
                        "matchId": message.matchId,
                        "seen": True
                    }))
                    message.seen = True
                    await database_sync_to_async(message.save)()
            except Exception as e:
                print(e)
            await asyncio.sleep(1)

    async def seen_send(self):
        while True:
            try:
                # Fetch unseen messages for the current user in this room
                room = await database_sync_to_async(Room.objects.get)(id=self.room_id)
                seen_messages = await database_sync_to_async(list)(
                    Message.objects.filter(
                        room=room,
                        user_id=self.user['id'],
                        seen=True,
                        seen_send=False
                    )
                )
                for message in seen_messages:
                    await self.send(json.dumps({
                        "action": "sendSeenMessage",
                        "message": message.content,
                        "message_id":message.id,
                        "user_id": self.other_user,
                        "message_id": message.id,
                        "type": message.type,
                        "matchId": message.matchId,
                        "seen_send": True
                    }))
                    # Mark the message as sent
                    message.seen_send = True
                    await database_sync_to_async(message.save)()

            except Exception as e:
                print(f"Error in seen_send: {e}", flush=True)

            await asyncio.sleep(1)



class NotificationConsumer(AsyncWebsocketConsumer):
    user = None
    key = None

    async def connect(self):
        try:
            # Get token from cookies
            cookies = self.scope.get('cookies', {})
            self.key = cookies.get('access_token')
            
            if not self.key:
                print("No access token found in cookies")
                await self.close()
                return

            # Fetch the user from the database using the token
            self.user = await database_sync_to_async(get_user_from_key)(self.key)
            if not self.user:
                print("Invalid user token")
                await self.close()
                return

            await self.accept()

            # Get unseen messages
            unseen_messages = await self.get_unseen_messages()
            
            # Format messages
            messages_list = [{
                "action": "sendMessage",
                "message": message.content,
                "user_id": message.user_id,
                "message_id": message.id,
                "type": message.type,
                "matchId": message.matchId,
            } for message in unseen_messages]
            
            await self.send(json.dumps({
                "action": "sendMessages",
                "messages": messages_list
            }))

        except Exception as e:
            print(f"Connection error: {e}")
            await self.close()

    @database_sync_to_async
    def get_unseen_messages(self):
        return list(
            Message.objects.filter(
                Q(room__user1_id=self.user['id']) | Q(room__user2_id=self.user['id']),
                seen=False
            ).exclude(user_id=self.user['id'])
        )

    async def receive(self, text_data):
        # Get data from the received message
        data = json.loads(text_data)
        # Wrap the database query in database_sync_to_async
        @database_sync_to_async
        def get_unseen_messages():
            return list(
                Message.objects.filter(
                    Q(room__user1_id=self.user['id']) | Q(room__user2_id=self.user['id']),
                    seen=False
                ).exclude(user_id=self.user['id'])
            )

        # Get unseen messages
        unseen_messages = await get_unseen_messages()
        # Format messages
        messages_list = [{
            "action": "sendMessage",
            "message": message.content,
            "user_id": message.user_id,
            "message_id": message.id,
            "message": message.type,
            "matchId": message.matchId,
        } for message in unseen_messages]

        # Send the messages
        await self.send(json.dumps({
            "action": "sendMessages",
            "messages": messages_list
        }))

    async def disconnect(self, close_code):
        pass


class GameWarningsConsumer(AsyncWebsocketConsumer):
    user = None
    key = None

    @database_sync_to_async
    def get_unseen_game_warnings(self):
        return list(
            GameWarning.objects.filter(
                user_id=self.user['id'],
                seen=False
            )
        )
    @database_sync_to_async
    def save_warning(self, warning):
            warning.seen = False
            warning.save()
    async def connect(self):
        try:
            # Get token from cookies
            cookies = self.scope.get('cookies', {})
            self.key = cookies.get('access_token')
            
            if not self.key:
                print("No access token found in cookies")
                await self.close()
                return

            # Fetch the user from the database using the token
            self.user = await database_sync_to_async(get_user_from_key)(self.key)
            if not self.user:
                print("Invalid user token")
                await self.close()
                return

            await self.accept()

            unseen_game_warnings = await self.get_unseen_game_warnings()
            # Format messages
            warnings_list = []
            
            for warning in unseen_game_warnings:
                warnings_list.append({
                    "warning": warning.warning,
                    "warning_id": warning.id,
                    "created_at": warning.created_at.isoformat(),
                })
                if warnings_list:
                    #warning.seen = True
                    await database_sync_to_async(warning.save)()
            await self.send(json.dumps({
                "action": "sendWarnings",
                "warnings": warnings_list
            }))

        except Exception as e:
            print(f"Connection error: {e}")
            await self.close()

    

    async def receive(self, text_data):
        try:
            unseen_game_warnings = await self.get_unseen_game_warnings()
            
            warnings_list = []
            
            for warning in unseen_game_warnings:
                warnings_list.append({
                    "warning": warning.warning,
                    "warning_id": warning.id,
                    "created_at": warning.created_at.isoformat(),
                })
                if warnings_list:
                    warning.seen = True
                    await database_sync_to_async(warning.save)()
            
            await self.send(json.dumps({
                "action": "sendWarnings",
                "warnings": warnings_list
            }))

        except Exception as e:
            print(f"Connection error: {e}")
            await self.close()

    async def disconnect(self, close_code):
        pass