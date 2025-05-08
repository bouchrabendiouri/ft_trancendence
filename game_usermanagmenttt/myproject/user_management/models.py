# models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django_otp.plugins.otp_totp.models import TOTPDevice


class CustomTOTPDevice(TOTPDevice):
    scanned = models.BooleanField(default=False)
class CustomUser(AbstractUser):
    email = models.EmailField(_('email address'), unique=True, blank=False)
    avatar = models.ImageField(upload_to='',default='default.png' ,blank=True, null=True)
    last_active = models.DateTimeField(auto_now=True)
    first_name = models.CharField(max_length=30,blank=False,null=False)
    last_name = models.CharField(max_length=30,blank= False,null=False)
    is_2fa_enabled = models.BooleanField(default=False) 
    is_online = models.BooleanField(default=False) 
    INVIT_CHOICES = [
        ('none','none'),
        ('added','added'),
        ('receive_invit','receive_invit'),
    ]
    invit=models.CharField(max_length=30,choices=INVIT_CHOICES,default='none')
    # invit = models.CharField(max_length=30,default='none')
    # friends = models.ManyToManyField(
    #     'self',
    #     through='Friendship',
    #     # symmetrical=True 
    # )
    # friends = models.ManyToManyField('self', blank=True)

class Friendship(models.Model):
    user1 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='user1_friendships')
    user2 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='user2_friendships')
    created_at = models.DateTimeField(auto_now_add=True)

class Match(models.Model):
  player1 = models.ForeignKey(CustomUser, related_name='matches_as_player1', on_delete=models.CASCADE)
  player2 = models.ForeignKey(CustomUser, related_name='matches_as_player2', on_delete=models.CASCADE)
  winner = models.ForeignKey(CustomUser, related_name='matches_won', on_delete=models.CASCADE, null=True, blank=True)
  date_played = models.DateTimeField(auto_now_add=True)
  score = models.CharField(max_length=10, blank=True, null=True)

class Invitation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
   
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='sent_invitation')
    receiver = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='received_invitation')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
   
