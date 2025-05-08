from rest_framework import generics, permissions
from rest_framework.response import Response
from .models import CustomUser, CustomTOTPDevice
from rest_framework_simplejwt.tokens import AccessToken
from .models import CustomUser
from rest_framework.decorators import api_view
from .serializers import RegisterSerializer, UserSerializer, InvitationSerializer, FriendshipSerializer
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from .serializers import MatchSerializer
from django.utils import timezone
from datetime import timedelta
from django.shortcuts import get_object_or_404
from .models import Invitation, Friendship
from django.db import transaction
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.decorators import permission_classes
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
# from .consumers import send_notification
from channels.layers import get_channel_layer
from django.db.models import Q
from asgiref.sync import sync_to_async
from rest_framework_simplejwt.tokens import RefreshToken
import asyncio
import logging
# logging.basicConfig(level=logging.DEBUG)

import pyotp
import qrcode
import io
import base64
import logging

from io import BytesIO
from django.http import JsonResponse, HttpResponse
from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework.permissions import IsAuthenticated


logger = logging.getLogger('user_management')

class Check2FAScanStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        device = CustomTOTPDevice.objects.filter(user=user).first()

        if device:
            device.refresh_from_db()  # Ensure fresh data from DB
            logger.debug(f"Scan status: {device.scanned}")

        scanned_status = device.scanned if device else False

        return Response({"scanned": scanned_status}, status=status.HTTP_200_OK)

class Generate2FAQRCodeView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        logger.debug(f"Request received in Generate2FAQRCodeView for user {user.id}")

        if not user.is_authenticated:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        device, created = CustomTOTPDevice.objects.get_or_create(user=user, confirmed=False)

        # If the QR Code has already been scanned, do not regenerate it
        if not created and device.scanned:
            return Response({"error": "QR Code already scanned. Enter your OTP."}, status=status.HTTP_400_BAD_REQUEST)

        otpauth_url = device.config_url
        logger.debug(f"Generated OTP URL: {otpauth_url}")

        try:
            qr = qrcode.make(otpauth_url)
            img_buffer = BytesIO()
            qr.save(img_buffer, format="PNG")
            img_buffer.seek(0)
            png_data = img_buffer.getvalue()

            logger.debug(f"QR Code generated for user {user.id}")

        except Exception as e:
            logger.exception("Error generating QR Code")
            return Response({"error": "Failed to generate QR code"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return HttpResponse(png_data, content_type="image/png")
        
class VerifyOTPView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        otp_code = request.data.get("otp")
        user = request.user 

        device = CustomTOTPDevice.objects.filter(user=user).first()

        if not device:
            return Response({"error": "No 2FA device found. Please scan the QR code first."}, status=status.HTTP_400_BAD_REQUEST)

        if not device.verify_token(otp_code):
            return Response({"error": "Invalid OTP code. Try again."}, status=status.HTTP_400_BAD_REQUEST)

        if user.is_2fa_enabled == False:
            # Enable 2FA for the first time
            device.scanned = True
            device.confirmed = True
            device.save()
            
            user.is_2fa_enabled = True 
            user.save()

            return Response({
                "message": "2FA verification successful. 2FA is now enabled."
            }, status=status.HTTP_200_OK)
        else:
            # Verify 2FA for subsequent logins
            return Response({
                "message": "2FA verification successful."
            }, status=status.HTTP_200_OK)


class CookiecokieView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        token = request.COOKIES.get('access_token')
        if not token:
            raise AuthenticationFailed('No token found in cookiie.')
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            user =get_user_model().objects.get(id=user_id)
            user_data = UserSerializer(user).data
        except Exception as e:
            logger.error(f"Invalid token: {str(e)}")
            return Response(
                {"detail : NO"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(user_data,status=status.HTTP_200_OK)
logger = logging.getLogger('user_management')
class RegisterView(APIView):
    logger.debug("the register view is")
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        logger.debug(f"the request data is: {request.data}")
        try:
            if serializer.is_valid(raise_exception=True):
                user = serializer.save() 
                access_token = AccessToken.for_user(user)
                access_token.set_exp(lifetime=timedelta(days=1))
                access_token = str(access_token)
                avatar_url = request.build_absolute_uri(user.avatar.url if user.avatar else settings.MEDIA_URL + "default.png")
                logger.debug(f"avatar_url is :: {avatar_url}")
                user_data = {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'avatar': avatar_url,
                }
                response = Response(user_data, status=status.HTTP_201_CREATED)
                response.set_cookie(
                    "access_token", value=access_token, httponly=True, secure=True
                )
                return response
        except ValidationError as e:
            error_messages = []
            if 'email' in e.detail:
                error_messages.append(str(e.detail['email'][0]))
            else:
                error_messages.append(str(e.detail['username'][0]))
            # error_message = " Or ".join(error_messages)
            logger.debug(error_messages)
            return Response(
                {"detail": error_messages},  # e.detail contains the error message(s)
                status=status.HTTP_400_BAD_REQUEST
            )
            
class ListusersView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, *args, **kwargs):
   
        freindships = Friendship.objects.filter(user1=request.user) | Friendship.objects.filter(user2=request.user)
        friends = []
        for freindship in freindships:
            if freindship.user1 == request.user:
                friends.append(freindship.user2)
            else:
                friends.append(freindship.user1)
        unique_friends = list(set(friends))
        users = CustomUser.objects.exclude(id=request.user.id).exclude(id__in=[friend.id for friend in unique_friends])
        user_data = []
        for user in users:
            invitation = Invitation.objects.filter(
                Q(sender=request.user, receiver=user) | Q(sender=user, receiver=request.user)
            ).first()
            data = {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'avatar': user.avatar.url if user.avatar else 'media/default.png',
            }
            if invitation:
                if  invitation.sender == request.user:
                    data['invit'] = 'added'
                elif invitation.receiver == request.user:
                    data['invit'] = 'receive_invit'
                else:
                    data['invit'] = 'none'
            else: 
                data['invit'] = 'none'
            user_data.append(data)
        return Response(user_data, status=status.HTTP_200_OK)

class LoginView(APIView):
      authentication_classes = []
      permission_classes = [permissions.AllowAny]
      def post(self, request, *args, **kwargs):
        logger.debug(f"Request data: {request.data}")
        email = request.data.get('email')
        password = request.data.get('password')
        logging.debug(f"email user: {email}")
        logging.debug(f"password user: {password}")
        user = authenticate(request, email=email, password=password)
        logger.debug(f"Authenticated user: {user}")
        if user is not None:
            access_token = AccessToken.for_user(user)
            access_token.set_exp(lifetime=timedelta(days=1))
            access_token = str(access_token)
            user_data = {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'avatar': user.avatar.url if user.avatar else None, 
            }
            # logger.debug("Authenticated user:authenticated ttttttttttttttttttttttttttt")
            response = Response(user_data, status=status.HTTP_201_CREATED)
            response.set_cookie(
                "access_token", value=access_token, httponly=True, secure=True
            )
            logger.debug(f"access_token :{access_token}")
            return response
        else:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user

        # Update user status to offline
        self.update_user_status(user)

        # Notify friends about logout asynchronously
        self.notify_friends_about_logout(user)

        # Create and configure response (no need to await this)
        response = JsonResponse({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)

        # Set cookie deletion (no need to await this either)
        response.delete_cookie("access_token", path="/")
        
        return response

    @sync_to_async
    def update_user_status(self, user):
        with transaction.atomic():
            user.is_online = False
            user.save()

    async def notify_friends_about_logout(self, user):
        # This function should be async since it's doing async I/O (WebSocket communication)
        channel_layer = get_channel_layer()
        
        # Await the result of the async function that gets the friends list
        friends_ids = await self.get_user_friends(user)

        # Now we can safely iterate over friends_ids because we awaited the async call
        for friend_id in friends_ids:
            group_name = f"user_{friend_id}"
            try:
                await channel_layer.group_send(
                    group_name,
                    {
                        "type": "status_update",
                        "action": "status",
                        "id": user.id,
                        "status": False,
                        "username": user.username,
                    }
                )
                logger.debug(f"Sent logout notification to {group_name}")
            except Exception as e:
                logger.error(f"Error sending logout message to {group_name}: {e}")

    @sync_to_async
    def get_user_friends(self, user):
        from .models import Friendship
        friends_as_user1 = list(Friendship.objects.filter(user1=user).values_list('user2', flat=True))
        friends_as_user2 = list(Friendship.objects.filter(user2=user).values_list('user1', flat=True))
        return list(set(friends_as_user1 + friends_as_user2))


class RecordMatchView(APIView):
 
  permission_classes = [permissions.IsAuthenticated]  # Add this line
  def post(self, request, *args, **kwargs):
      data = request.data
      match = Match.objects.create(
          player1_id=data['player1_id'],
          player2_id=data['player2_id'],
          winner_id=data['winner_id'],
          score=data.get('score', '')
      )
      serializer = MatchSerializer(match)
      return Response(serializer.data, status=status.HTTP_201_CREATED)

class MatchHistoryView(APIView):
 
  permission_classes = [permissions.IsAuthenticated]  
  def get(self, request, *args, **kwargs):
      matches = Match.objects.filter(player1=request.user) | Match.objects.filter(player2=request.user)
      serializer = MatchSerializer(matches, many=True)
      return Response(serializer.data, status=status.HTTP_200_OK)

class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer

    def get_object(self):
        user_id = self.kwargs['id']
        logger.debug(f"User ID: {user_id}")
        try:
            user = CustomUser.objects.get(id=user_id)
            logger.debug(f"User avatar URL: {user.avatar.url}") 
            return user
        except CustomUser.DoesNotExist:
            logger.error(f"User with ID {user_id} does not exist.")
            raise NotFound(f"User with ID {user_id} not found.")

    def update(self, request, *args, **kwargs):
        logger.debug(f"#########updatee:{request.data}")
        instance = self.get_object()
        # Initialize the serializer with the data from the request
        # serializer = self.get_serializer(instance, data=request.data, partial=True)
        logger.debug(f"the request is files : {request.FILES}")
        avatar = request.FILES.get('avatar', None)
        if avatar:
            request.data['avatar'] = avatar  # Add avatar to the request data
        # Initialize the serializer with the data from the request
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        try:
            # Check if the data is valid
            # logger.debug("the avatar is ")
            serializer.is_valid(raise_exception=True)
            # avatar = request.avatar
            self.perform_update(serializer)
            return Response(serializer.data)
        
        except ValidationError as e:
            # Catch validation error and return 400 with the error details
            logger.error(f"Validation failed: {str(e)}")
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Catch any other unexpected errors and return 400 with a generic message
            logger.error(f"Unexpected error during update: {str(e)}")
            return Response({"detail": "An unexpected error occurred during the update."}, status=status.HTTP_400_BAD_REQUEST)
class InvitationResponseView(APIView):
    "give me the action of invitation !!!"
    permission_classes = [permissions.IsAuthenticated] 
    def post(self, request, invitation_id, action):
        invitation = get_object_or_404(Invitation,id=invitation_id)
        # logger.debug(f"Request User: {request.user.id}, Receiver ID: {invitation.receiver_id.id}")
        if request.user.id != invitation.receiver.id:
            return Response({'error': 'You are not authorized to responce to this invitation'},status=status.HTTP_400_BAD_REQUEST)
        if invitation.status != 'pending':
            return Response({'error': 'This invitation is no longer pending'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            if action == 'accept':
                with transaction.atomic():
                    invitation.status = 'accepted'
                    friendship = Friendship.objects.create(
                        user1=request.user,
                        user2=invitation.sender
                    )
                    invitation_data = InvitationSerializer(invitation).data
                    friendship_data = FriendshipSerializer(friendship).data
                    invitation.delete()
                return Response({
                    'message': 'Freindship invitation accepted successfully.',
                    'invitation': invitation_data,
                    'freindship': friendship_data
                },status.HTTP_200_OK)

            elif action == 'reject':
                invitation.status = 'rejected'
                invitation_data = InvitationSerializer(invitation).data
                invitation.delete()
                return Response({
                    'message': 'Freindship invitation rejected !!!',
                    'invitation': invitation_data
                },status.HTTP_200_OK)
            else:
                return Response({'error': 'Invalid action !!!'},status.HTTP_400_BAD_REQUEST)
        except Exception as e:
                return Response({'error': f'error here {str(e)}'}, status.HTTP_500_INTERNAL_SERVER_ERROR)
class FriendListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        user = request.user
        friendships = Friendship.objects.filter(user1=user) | Friendship.objects.filter(user2=user)
        friends = []
        for friendship in friendships:
            if friendship.user1 == user:
                friends.append(friendship.user2)
            else:
                friends.append(friendship.user1)
        unique_friends = list(set(friends))
        serialized_friends = UserSerializer(unique_friends, many=True)
        return Response(serialized_friends.data, status=status.HTTP_200_OK)
class FriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        receiver_id = request.data.get('receiver_id')
        if not receiver_id:
            return Response({'error': 'Receiver ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        logger.debug(f"receiver_id: {receiver_id} (type: {type(receiver_id)}), request.user.id: {request.user.id} (type: {type(request.user.id)})")
        # logger.debug(f"receiver_id: {receiver_id},request.user.id: {request.user.id}")
        receiver_id = int(receiver_id)
        if receiver_id == request.user.id:
            return Response({'error': 'You cannot send a friend request to yourself.'}, status=status.HTTP_400_BAD_REQUEST)
        receiver = get_object_or_404(CustomUser, id=receiver_id)
        if Invitation.objects.filter(
            Q(sender=request.user, receiver=receiver) | 
            Q(sender=receiver, receiver=request.user)
        ).exists():
            return Response({'error': 'An invitation already exists between these users.'}, status=status.HTTP_400_BAD_REQUEST)
        invitation = Invitation.objects.create(
            sender=request.user, 
            receiver=receiver
        )
        return Response({'message': 'Friend request sent successfully.'}, status=status.HTTP_201_CREATED)
    def get(self, request):
        invitations=Invitation.objects.filter(receiver=request.user)
        serialized_invitations = InvitationSerializer(invitations, many=True)
        return Response(serialized_invitations.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_token(request):
    try:
        refresh = RefreshToken.for_user(request.user)
        user_data = {
            'id': request.user.id,
            'email': request.user.email,
            'username': request.user.username,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'avatar': request.user.avatar.url if request.user.avatar else None,
            'access_token': str(refresh.access_token),
        }
        return Response(user_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)