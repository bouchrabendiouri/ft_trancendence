# views.py
import requests
from rest_framework.decorators import api_view
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import redirect
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from user_management.models import CustomUser
from django.contrib.auth import login as auth_login
from rest_framework import status
from rest_framework.response import Response
from rest_framework import permissions
from django.utils import timezone
from datetime import timedelta
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from django.core.files.base import ContentFile
from rest_framework_simplejwt.tokens import AccessToken
import logging
import os
# Create a logger instance
logger = logging.getLogger('authentication')

REDIRECT_URI = 'https://10.14.8.10:8443/auth/callback/'
CLIENT_ID = 'u-s4t2ud-34d662ce43a4ee1a1ea0cfd6c5237edb098bcb4111806c30d5f52ca800cb5b6d'
CLIENT_SECRET = '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'

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def login(request):
    logger.debug("i am heeeeere1113333333311")
    auth_url = (
        f'https://api.intra.42.fr/oauth/authorize?client_id={CLIENT_ID}'
        f'&redirect_uri={REDIRECT_URI}&response_type=code'
    )
    logger.debug(f"auth urls is :  {auth_url}")
    return Response({"auth_url": auth_url}, status=status.HTTP_200_OK)
@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def callback(request):
    logger.debug("i am heeeeere111555555555511")
    code = request.GET.get('code')
    if not code:
        logger.debug("no code ")
        return Response({"detail": "Authorization code is missing."}, status=status.HTTP_400_BAD_REQUEST)
    token_url = 'https://api.intra.42.fr/oauth/token'
    data = {
        'grant_type': 'authorization_code',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'redirect_uri': REDIRECT_URI,
        'code': code,
    }
    response = requests.post(token_url, data=data)
    response_data = response.json()
    if response.status_code != 200 or 'access_token' not in response_data:
        logger.debug(f"code: {response.status_code}")
        logger.debug("failled to obtain access token ")
        return Response({
            "detail": "Failed to obtain access token.",
            "error": response_data.get('error', 'Unknown error'),
        }, status=status.HTTP_400_BAD_REQUEST)
    access_token = response_data['access_token']
    api_url = 'https://api.intra.42.fr/v2/me'
    headers = {
        'Authorization': f'Bearer {access_token}',
    }
    api_response = requests.get(api_url, headers=headers)
    if api_response.status_code != 200:
        logger.debug("no code !=200 ")
        return Response({
            "detail": "Failed to retrieve user data.",
            "error": api_response.json().get('error', 'Unknown error'),
        }, status=status.HTTP_400_BAD_REQUEST)
    user_data = api_response.json()
    id = user_data.get('id')
    email=user_data.get('email')
    username=user_data.get('login')
    first_name=user_data.get('first_name')
    last_name=user_data.get('last_name')
    avatar_data = user_data.get('image')
    try:
        user = CustomUser.objects.get(username=username)
    except CustomUser.DoesNotExist:
        user = CustomUser.objects.create_user(
            id = id,
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
        )
    if isinstance(avatar_data, dict) and 'link' in avatar_data:
        avatar_url = avatar_data['link']  
    else:
        avatar_url = None
    # if avatar_url:
    #     avatar_response = requests.get(avatar_url)
    #     if avatar_response.status_code == 200:
    #         user.avatar.save(f'{username}_avatar.jpg', ContentFile(avatar_response.content), save=False)
    #     else:
    #         print("Failed to download avatar image.")
    # logger.debug(f"user avatr is {user.avatar}")
    # user.set_unusable_password()
    # user.save()
    if avatar_url:
        avatar_response = requests.get(avatar_url)
        if avatar_response.status_code == 200:
            file_name = f"{user.username}_avatar.jpg"
            file_path = os.path.join(settings.MEDIA_ROOT, file_name)  
            logger.debug("mida root is ", file_path)
            user.avatar.save(file_name, ContentFile(avatar_response.content), save=False)
        else:
            print("Failed to download avatar image.")
    logger.debug(f"user avatr is {user.avatar}")
    user.set_unusable_password()
    user.save()
    auth_login(request, user, backend='django.contrib.auth.backends.ModelBackend')
    access_token = AccessToken.for_user(user)
    access_token.set_exp(lifetime=timedelta(days=1))
    access_token = str(access_token)
    response= redirect('https://10.14.8.10:8443/home')

    # logger.debug("access_token is ",access_token)
    response.set_cookie(
        "access_token", value=access_token, httponly=True, secure=True
    )
    return response