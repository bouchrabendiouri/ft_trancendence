from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from channels.exceptions import DenyConnection
from django.conf import settings
from urllib.parse import parse_qs

import json
import logging
import jwt

logger = logging.getLogger("game")


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.user = await self.check_token()
            if not self.user:
                logger.debug("User not found, closing connection.")
                await self.close()
                return

            # Add user to their own group and the general game group
            self.user_group = f"user_{self.user.id}"
            self.game_group = "game_notifications"

            await self.channel_layer.group_add(
                self.user_group, self.channel_name
            )
            await self.channel_layer.group_add(
                self.game_group, self.channel_name
            )
            await self.accept()

        except Exception as e:
            logger.error(f"Error during WebSocket connection: {e}")
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, "user_group"):
            await self.channel_layer.group_discard(
                self.user_group, self.channel_name
            )
        if hasattr(self, "game_group"):
            await self.channel_layer.group_discard(
                self.game_group, self.channel_name
            )

    async def send_game_event(self, event):
        await self.send(text_data=json.dumps(event["data"]))

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            event_type = data["type"]
            if event_type == "game_state":
                match_id = data["match_id"]
                opponent_id = data["opponent_id"]

                await self.channel_layer.group_send(
                    f"user_{opponent_id}",
                    {
                        "type": "send_game_event",
                        "data": {
                            "type": "game_state_update",
                            "match_id": match_id,
                            "target_score": data["target_score"],
                            "player1": data["player1"],
                            "player2": data["player2"],
                            "ball_position": data["ball_position"],
                            "paddle1_y": data["paddle1_y"],
                            "paddle2_y": data["paddle2_y"],
                            "score": data["score"],
                        },
                    },
                )
            elif event_type == "opponent_paddle_direction":
                game_host_id = data["game_host_id"]

                await self.channel_layer.group_send(
                    f"user_{game_host_id}",
                    {
                        "type": "send_game_event",
                        "data": {
                            "type": "opponent_paddle_direction",
                            "direction": data["direction"],
                        },
                    },
                )
            elif event_type == "game_final_score":
                opponent_id = data["opponent_id"]

                await self.channel_layer.group_send(
                    f"user_{opponent_id}",
                    {
                        "type": "send_game_event",
                        "data": {
                            "type": "game_final_score",
                            "score_player1": data["score_player1"],
                            "score_player2": data["score_player2"],
                        },
                    },
                )

        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
        except KeyError as e:
            logger.error(f"Missing required field: {e}")
        except Exception as e:
            logger.error(f"Error processing message: {e}")

    async def check_token(self):
        query_string = self.scope["query_string"].decode()
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]

        if not token:
            raise DenyConnection("No token provided")

        try:
            decoded_token = jwt.decode(
                token, settings.SECRET_KEY, algorithms=["HS256"]
            )
            user_id = decoded_token.get("user_id")
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
