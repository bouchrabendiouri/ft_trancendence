from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import Room, Message, GameWarning
from django.http import JsonResponse 
import json
from django.contrib.auth.models import User
from .models import BlockedUser
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from chat.services import get_user_from_key, get_friends
import logging
logger = logging.getLogger("chat")

@csrf_exempt
def tournament_notification(request):
    try:
                data = json.loads(request.body)  # Load JSON data
                user1_id = data.get('user1_id')
                opponent1_username = data.get('opponent1_username')
                user2_id = data.get('user2_id')
                opponent2_username = data.get('opponent2_username')
                if not user1_id or not opponent1_username or not user2_id or not opponent2_username:
                    return JsonResponse({"error": "Missing required parameters"}, status=400)
                
                GameWarning.objects.bulk_create([
                    GameWarning(
                        user_id=user1_id,
                        warning=f"Get ready for the next game with {opponent1_username}!",
                    ),
                    GameWarning(
                        user_id=user2_id,
                        warning=f"Get ready for the next game with {opponent2_username}!",
                    ),
                ])
                return JsonResponse({'ok': 'success'})
    except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)


@csrf_exempt
def chat_page(request):
    
    # Get token from cookies
    access_token = request.COOKIES.get('access_token')
    
    if not access_token:
        return JsonResponse({"error": "No access token found in cookies"}, status=401)
    
    # Get user using the token from cookie
    current_user = get_user_from_key(access_token)
    if not current_user:
        return JsonResponse({"error": "Invalid token"}, status=401)

    # Rest of your existing code...
    rooms = list(Room.objects.values("id", "name"))
    friends = get_friends(access_token)
        
    response = JsonResponse({
        "rooms": rooms,
        "current_user": current_user,
        "friends": friends,
    })
    
    return response

@csrf_exempt 
def create_room(request):
    if request.method == "POST":
        try:
            access_token = request.COOKIES.get('access_token')
            if not access_token:
                return JsonResponse({"error": "No access token found in cookies"}, status=401)

            data = json.loads(request.body)
            
            user2_id = data.get('user2_id')

            if not user2_id:
                return JsonResponse({"error": "user2_id is required"}, status=400)
            
            # Use the token from Authorization header instead of cookies
            friends = get_friends(access_token)
            user1 = get_user_from_key(access_token)
            user2 = next(user for user in friends if user['id'] == user2_id)

            # Create room name from usernames
            room_name = f"user{user1['id']}-user{user2['id']}"
            # Check if room already exists between these users
            existing_room = Room.objects.filter(
                (Q(user1_id=user1['id']) & Q(user2_id=user2['id'])) |
                (Q(user1_id=user2['id']) & Q(user2_id=user1['id']))
            ).first()
            if not existing_room:
                new_room = Room.objects.create(
                    name=room_name,
                    user1_id=user1['id'],
                    user2_id=user2['id'],
                )
                return JsonResponse({
                    "room": {
                        "id": new_room.id,
                        "name": new_room.name,
                        "user1_id": new_room.user1_id,
                        "user2_id": new_room.user2_id
                    }
                })
            else:
                return JsonResponse({
                    "room": {
                        "id": existing_room.id,
                        "name": existing_room.name,
                        "user1_id": existing_room.user1_id,
                        "user2_id": existing_room.user2_id
                    }
                })

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    
    return JsonResponse({"error": "Invalid request method"}, status=405)

def room(request, pk):
    access_token = request.COOKIES.get('access_token')
    if not access_token:
        return JsonResponse({"error": "No access token found in cookies"}, status=401)
    
    try:
        friends = get_friends(access_token)
        current_user = get_user_from_key(access_token)
        room = Room.objects.get(pk=pk)
        # Get the other user's info from friends list
        other_user = next(user for user in friends if user['id'] == (room.user2_id if current_user['id'] == room.user1_id else room.user1_id))
    

        filtered_messages = [
            {
                "id": msg.id,  # Added message ID
                "type": msg.type,
                "sender": msg.user_id,
                "text": msg.content,
                "seen": msg.seen,
                "matchId": msg.matchId,
                "timestamp": msg.timestamp.isoformat() if hasattr(msg, 'timestamp') else None  # Added timestamp if available
            }
            for msg in Message.objects.filter(room=room)
        ]
        profile = {
            "id": other_user['id'], 
            "username": other_user['username'],
            "bio": f"Profile of {other_user['username']}"
        }
        data = {
            'room_id': room.id,  # Changed from slug to room_id
            'messages': filtered_messages,
            'user_id': current_user['id'],
            'username': current_user['username'],
            'other_user_id': other_user['id'],
            'other_user_username': other_user['username'],
            'profile': profile,
        }
        return JsonResponse(data)
    
    except Room.DoesNotExist:
        return JsonResponse({"error": "Room not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt 
def block_user(request):
        access_token = request.COOKIES.get('access_token')
        if not access_token:
                return JsonResponse({"error": "No access token found in cookies"}, status=401)
        blocker = get_user_from_key(access_token)
        if not blocker:
            return JsonResponse({'status': 'error', 'message': 'Blocker user not found'}, status=400)

        try:
            data = json.loads(request.body.decode('utf-8'))
            blocked_id = int(data.get('blocked_id'))
            blocked_instance, created = BlockedUser.objects.get_or_create(blocker_id=blocker['id'], blocked_id=blocked_id)
            if created:
                print("New block entry created:", blocked_instance)
            else:
                print("Block entry already exists:", blocked_instance)
            
            return JsonResponse({
                'status': 'success', 
                'message': 'User blocked successfully',
            })
        
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
        except ValueError:
            return JsonResponse({'status': 'error', 'message': 'Invalid blocked user ID'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
