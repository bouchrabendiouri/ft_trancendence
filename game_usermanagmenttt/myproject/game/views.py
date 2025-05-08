from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Player, Match
from .serializers import MatchSerializer, MatchScoreSerializer
from django.shortcuts import render , get_object_or_404
from django.http import JsonResponse
from user_management.models import CustomUser
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from user_management.serializers import UserSerializer
import json


@csrf_exempt
@permission_classes([IsAuthenticated])
@api_view(["POST"])
def create_game(request):
    try:
        serializer = MatchSerializer(data=request.data)
        if serializer.is_valid():
            player1 = Player.objects.get(user=request.user)
            match = serializer.save(player1=player1)

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "game_notifications",
                {
                    "type": "send_game_event",
                    "data": {
                        "type": "new_game_added",
                    },
                },
            )

            return Response(
                {"match_id": match.id, "message": "Game created successfully"},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Player.DoesNotExist:
        return Response(
            {"message": "Player profile not found for the logged-in user"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_game_scores(request):
    if request.method == "GET":
        players = Player.objects.all()
        players_data = []
        match_history = []

        for player in players:
            player_matches = Match.objects.filter(
                status=Match.Status.FINISHED
            ).filter(player1=player) | Match.objects.filter(
                status=Match.Status.FINISHED
            ).filter(player2=player)

            for match in player_matches:
                winner = match.winner
                loser = match.player1 if match.winner == match.player2 else match.player2 if match.winner else None

                match_history.append({
                    "match_id": match.id,
                    "date": match.created_at.strftime("%Y-%m-%d"),
                    "winner": {
                        "id": winner.player_id if winner else None,
                        "total_score": winner.total_score if winner else None,
                        "total_matches": winner.total_matches if winner else None,
                        "total_wins": winner.total_wins if winner else None,
                        "total_losses": winner.total_losses if winner else None,
                        "level": winner.level if winner else None,
                        "energy": winner.energy if winner else None,
                        "skills_point": winner.skills_point if winner else None,
                        "player_score": match.player1_score if match.player1 == winner else match.player2_score,
                        "opponent_score": match.player2_score if match.player1 == winner else match.player1_score,
                        "user": {
                            "id": winner.user.id if winner and winner.user else None,
                            "email": winner.user.email if winner and winner.user else None,
                            "username": winner.user.username if winner and winner.user else None,
                            "avatar": winner.user.avatar.url if winner and winner.user and winner.user.avatar else None,
                            "first_name": winner.user.first_name if winner and winner.user else None,
                            "last_name": winner.user.last_name if winner and winner.user else None,
                            "last_active": winner.user.last_active if winner and winner.user else None,
                        } if winner and winner.user else None,
                    } if winner else None,
                    "loser": {
                        "id": loser.player_id if loser else None,
                        "total_score": loser.total_score if loser else None,
                        "total_matches": loser.total_matches if loser else None,
                        "total_wins": loser.total_wins if loser else None,
                        "total_losses": loser.total_losses if loser else None,
                        "level": loser.level if loser else None,
                        "energy": loser.energy if loser else None,
                        "skills_point": loser.skills_point if loser else None,
                        "player_score": match.player1_score if match.player1 == loser else match.player2_score,
                        "opponent_score": match.player2_score if match.player1 == loser else match.player1_score,
                        "user": {
                            "id": loser.user.id if loser and loser.user else None,
                            "email": loser.user.email if loser and loser.user else None,
                            "username": loser.user.username if loser and loser.user else None,
                            "avatar": loser.user.avatar.url if loser and loser.user and loser.user.avatar else None,
                            "first_name": loser.user.first_name if loser and loser.user else None,
                            "last_name": loser.user.last_name if loser and loser.user else None,
                            "last_active": loser.user.last_active if loser and loser.user else None,
                        } if loser and loser.user else None,
                    } if loser else None,
                })

            players_data.append({
                'player_id': player.player_id,
                'total_score': player.total_score,
                'total_matches': player.total_matches,
                'total_wins': player.total_wins,
                'total_losses': player.total_losses,
                'level': player.level,
                'energy': player.energy,
                'skills_point': player.skills_point,
                'user': {
                    'id': player.user.id if player.user else None,
                    'email': player.user.email if player.user else None,
                    'username': player.user.username if player.user else None,
                    'avatar': player.user.avatar.url if player.user and player.user.avatar else None,
                    'first_name': player.user.first_name if player.user else None,
                    'last_name': player.user.last_name if player.user else None,
                    'last_active': player.user.last_active if player.user else None
                } if player.user else None
            })

        return JsonResponse({"matches": match_history, 'players': players_data})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_pending_matches(request):
    try:
        current_player = Player.objects.get(user=request.user)
        pending_matches = Match.objects.filter(
            status=Match.Status.PENDING
        ).exclude(player1=current_player)

        matches_data = [
            {
                "match_id": match.id,
                "user": UserSerializer(match.player1.user).data,
                "target_score": match.target_score,
                "created_at": match.created_at,
                "status": match.status,
            }
            for match in pending_matches
        ]
        return Response(matches_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_dashboard(request):
    if request.method == "GET":
        current_user = request.user
        try:
            player = Player.objects.get(user=current_user)
        except Player.DoesNotExist:
            return JsonResponse({"error": "Player data not found"}, status=404)

        matches = Match.objects.filter(player1=player) | Match.objects.filter(player2=player)
        match_history = []

        for match in matches:
            winner = match.winner
            loser = match.player1 if match.winner == match.player2 else match.player2 if match.winner else None

            match_history.append({
                "match_id": match.id,
                "date": match.created_at.strftime("%Y-%m-%d"),
                "winner": {
                    "id": winner.player_id if winner else None,
                    "total_score": winner.total_score if winner else None,
                    "total_matches": winner.total_matches if winner else None,
                    "total_wins": winner.total_wins if winner else None,
                    "total_losses": winner.total_losses if winner else None,
                    "level": winner.level if winner else None,
                    "energy": winner.energy if winner else None,
                    "skills_point": winner.skills_point if winner else None,
                    "player_score": match.player1_score if match.player1 == winner else match.player2_score,
                    "opponent_score": match.player2_score if match.player1 == winner else match.player1_score,
                    "user": {
                        "id": winner.user.id if winner and winner.user else None,
                        "email": winner.user.email if winner and winner.user else None,
                        "username": winner.user.username if winner and winner.user else None,
                        "avatar": winner.user.avatar.url if winner and winner.user and winner.user.avatar else None,
                        "first_name": winner.user.first_name if winner and winner.user else None,
                        "last_name": winner.user.last_name if winner and winner.user else None,
                        "last_active": winner.user.last_active if winner and winner.user else None,
                    } if winner and winner.user else None,
                } if winner else None,
                "loser": {
                    "id": loser.player_id if loser else None,
                    "total_score": loser.total_score if loser else None,
                    "total_matches": loser.total_matches if loser else None,
                    "total_wins": loser.total_wins if loser else None,
                    "total_losses": loser.total_losses if loser else None,
                    "level": loser.level if loser else None,
                    "energy": loser.energy if loser else None,
                    "skills_point": loser.skills_point if loser else None,
                    "player_score": match.player1_score if match.player1 == loser else match.player2_score,
                    "opponent_score": match.player2_score if match.player1 == loser else match.player1_score,
                    "user": {
                        "id": loser.user.id if loser and loser.user else None,
                        "email": loser.user.email if loser and loser.user else None,
                        "username": loser.user.username if loser and loser.user else None,
                        "avatar": loser.user.avatar.url if loser and loser.user and loser.user.avatar else None,
                        "first_name": loser.user.first_name if loser and loser.user else None,
                        "last_name": loser.user.last_name if loser and loser.user else None,
                        "last_active": loser.user.last_active if loser and loser.user else None,
                    } if loser and loser.user else None,
                } if loser else None,
            })

        player_data = {
            "player_id": player.player_id,
            "total_score": player.total_score,
            "total_matches": player.total_matches,
            "total_wins": player.total_wins,
            "total_losses": player.total_losses,
            "level": player.level,
            "energy": player.energy,
            "skills_point": player.skills_point,
            "user": {
                "id": player.user.id,
                "email": player.user.email,
                "username": player.user.username,
                "avatar": player.user.avatar.url if player.user.avatar else None,
                "first_name": player.user.first_name,
                "last_name": player.user.last_name,
                "last_active": player.user.last_active,
            },
        }

        return JsonResponse({"player": player_data, "match_history": match_history})


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def check_nicknames(request):
    nicknames = request.POST.getlist("nickname")
    errors = []

    for nickname in nicknames:
        if not CustomUser.objects.filter(username=nickname).exists():
            errors.append(f"Nickname '{nickname}' does not exist.")

    if len(nicknames) != len(set(nicknames)):
        errors.append("Duplicate nicknames found.")

    if errors:
        return Response(
            {"ok": False, "message": "Nickname(s) error.", "errors": errors},
            status=status.HTTP_200_OK,
        )
    return Response(
        {"ok": True, "message": "Nicknames processed", "errors": errors},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def join_game(request, match_id):
    try:
        match = Match.objects.get(id=match_id, status=Match.Status.PENDING)
        player2 = Player.objects.get(user=request.user)

        if match.player1 == player2:
            return Response(
                {"error": "Cannot join your own game"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        match.player2 = player2
        match.status = Match.Status.IN_PROGRESS
        match.save()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "game_notifications",
            {
                "type": "send_game_event",
                "data": {
                    "type": "game_joined",
                },
            },
        )

        return Response({
                "match_id": match.id,
                "player1": {
                    "id": match.player1.player_id,
                    "username": match.player1.user.username,
                    "avatar": match.player1.user.avatar.url if match.player1.user.avatar else None
                },
                "player2": {
                    "id": match.player2.player_id,
                    "username": match.player2.user.username,
                    "avatar": match.player2.user.avatar.url if match.player2.user.avatar else None
                },
                "target_score": match.target_score,
            }, status=status.HTTP_200_OK)

    except Match.DoesNotExist:
        return Response(
            {"error": "Match not found or not available"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Player.DoesNotExist:
        return Response(
            {"error": "Player profile not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def get_avatar(request):

    nicknames = request.POST.getlist('nickname')

    users_data = []
    not_found_nicknames = []

    for nickname in nicknames:
        try:
            user = CustomUser.objects.get(username=nickname)
            
            if user.avatar:
                users_data.append({
                    'id': user.id,
                    'avatar': user.avatar.url,
                })
        except CustomUser.DoesNotExist:
            not_found_nicknames.append(nickname)  
    if not_found_nicknames:
        return JsonResponse({
            'ok': False,
            'error': 'Users not found',
            'not_found': not_found_nicknames
        }, status=status.HTTP_404_NOT_FOUND)

  
    return JsonResponse({
        'ok': True,
        'users': users_data
    }, status=status.HTTP_200_OK)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def finish_match(request, match_id):
    try:
        match = Match.objects.get(id=match_id, status=Match.Status.IN_PROGRESS)
        
        player1_score = request.data.get("player1_score")
        player2_score = request.data.get("player2_score")

        if player1_score is None or player2_score is None:
            return Response(
                {"error": "Les scores des joueurs sont requis"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        match.player1_score = player1_score
        match.player2_score = player2_score

        if player1_score > player2_score:
            match.winner = match.player1
            player1_win = True
        elif player2_score > player1_score:
            match.winner = match.player2
            player1_win = False
        else:
            match.winner = None  
            player1_win = None  

        match.status = Match.Status.FINISHED
        match.save()

        player1 = match.player1
        player2 = match.player2

        if player1_win is True:
            player1.update_stats(win=True)
            player2.update_stats(win=False)
        elif player1_win is False:
            player1.update_stats(win=False)
            player2.update_stats(win=True)

        return Response(
            {
                "message": "Match terminé et enregistré avec succès",
                "match_id": match.id,
                "player1_score": match.player1_score,
                "player2_score": match.player2_score,
                "winner": match.winner.player_id if match.winner else None,
                "player1_data": {
                    "total_score": player1.total_score,
                    "total_matches": player1.total_matches,
                    "total_wins": player1.total_wins,
                    "total_losses": player1.total_losses,
                    "level": player1.level,
                },
                "player2_data": {
                    "total_score": player2.total_score,
                    "total_matches": player2.total_matches,
                    "total_wins": player2.total_wins,
                    "total_losses": player2.total_losses,
                    "level": player2.level,
                },
            },
            status=status.HTTP_200_OK,
        )

    except Match.DoesNotExist:
        return Response(
            {"error": "Match non trouvé ou déjà terminé"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_match_score(request, match_id):
    try:
        match = Match.objects.get(id=match_id, status=Match.Status.IN_PROGRESS)
        serializer = MatchScoreSerializer(match, data=request.data)

        if serializer.is_valid():
            updated_match = serializer.save()
            return Response(MatchSerializer(updated_match).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Match.DoesNotExist:
        return Response(
            {"message": "Match not found ar already finished"},
            status=status.HTTP_404_NOT_FOUND,
        )

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_unjoined_match(request, match_id):
    try:
        match = Match.objects.get(id=match_id, status=Match.Status.PENDING)
        
        if match.player2 is None:
            match.delete()
            return Response({"message": "Match deleted successfully"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Match has already been joined"}, status=status.HTTP_400_BAD_REQUEST)
    
    except Match.DoesNotExist:
        return Response({"error": "Match not found or already in progress"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_players_of_the_week(request):

    top_players = list(Player.objects.exclude(total_wins=0).order_by("-total_wins")[:3])

    if len(top_players) == 0:
        return JsonResponse({"len": 0}, safe=False, status=200)

    players_data = [
        {
            "rank": index + 1,
            "player_id": player.player_id,
            "total_wins": player.total_wins,
            "total_matches": player.total_matches,
            "total_score": player.total_score,
            "level": player.level, 
            "username": player.user.username if player.user else "Anonyme",
            "first_name": player.user.first_name if player.user else "Anonyme",
            "last_name": player.user.last_name if player.user else "Anonyme",
            "avatar": player.user.avatar.url if player.user and player.user.avatar else None
        }
        for index, player in enumerate(top_players)
    ]

    response_data = {
        "len": len(players_data),
        "players": players_data
    }

    return JsonResponse(response_data, safe=False, status=200)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_game_chat(request):
    try:
        data = json.loads(request.body)
        player2_id = data.get("player2_id")  # Changed from friend_id
        player1 = get_object_or_404(Player, user=request.user)
        player2 = get_object_or_404(Player, user_id=player2_id)  # Changed from friend
        match = Match.objects.create(
            player1=player1,
            player2=player2,
            status=Match.Status.PENDING,
            target_score=3
        )
        return Response({
            "message": "Game request sent.",
            "match_id": match.id
        }, status=status.HTTP_201_CREATED)

        """ channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{player2_id}",
            {
                "type": "game_invite",
                "match_id": match.id,
                "player1": {
                    "id": player1.player_id,
                    "username": player1.user.username,
                    "avatar": player1.user.avatar.url if player1.user.avatar else None
                }
            }
        )

        return Response({"message": "Game request sent."}, status=status.HTTP_201_CREATED)"""
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_game_chat(request, match_id):
    try:
        match = get_object_or_404(Match, id=match_id, status=Match.Status.PENDING)
        player2 = get_object_or_404(Player, user=request.user)

        if match.player2 != player2:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        match.status = Match.Status.IN_PROGRESS
        match.save()

        """channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{match.player1.user.id}",
            {
                "type": "game_start",
                "match_id": match.id,
                "player1": {
                    "id": match.player1.player_id,
                    "username": match.player1.user.username,
                    "avatar": match.player1.user.avatar.url if match.player1.user.avatar else None
                },
                "player2": {
                    "id": player2.player_id,
                    "username": player2.user.username,
                    "avatar": player2.user.avatar.url if player2.user.avatar else None
                }
            }
        )"""
        return Response({
            "message": "Game started",
            "match_id": match.id,
            "player1": match.player1.user.username,
            "player2": player2.user.username
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)