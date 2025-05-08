# serializers.py
from rest_framework import serializers
from .models import CustomUser
from .models import Match
from django.db import IntegrityError
from django.utils import timezone
from datetime import timedelta
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import AccessToken
from .models import Invitation, Friendship
import logging

logger = logging.getLogger('user_management')

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id','email', 'username', 'avatar','password', 'first_name','last_name', 'is_online']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.avatar:
            ret['avatar'] = instance.avatar.url
        else:
            ret['avatar'] = settings.MEDIA_URL + "default.png"
        return ret
       
        
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username', 'password', 'confirm_password', 'avatar', 'first_name', 'last_name']
    def create(self, validated_data):
        validated_data.pop('confirm_password') 
        avatar_data = validated_data.get('avatar',None)
        if not avatar_data:  # If avatar is None, use default.png
            validated_data['avatar'] = 'default.png'
        logger.debug(avatar_data)
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            username=validated_data['username'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            avatar=validated_data['avatar']       
        )
        return user

class MatchSerializer(serializers.ModelSerializer):
  class Meta:
      model = Match
      fields = ['id', 'player1', 'player2', 'winner', 'score', 'date_played']

class InvitationSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = Invitation
        fields = ['id','sender_id','receiver_id','status','sender','receiver']

class FriendshipSerializer(serializers.ModelSerializer):
    user1 = UserSerializer(read_only=True)
    user2 = UserSerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ['user1','user2','created_at']