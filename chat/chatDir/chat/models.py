from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Room(models.Model):
    name = models.CharField(max_length=100)
    room_id = models.IntegerField(default=None, null=True, blank=True)
    #user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='room_user1', default=1)
    #user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='room_user2', default=2)
    user1_id = models.IntegerField(default=None, null=True, blank=True)
    user2_id = models.IntegerField(default=None, null=True, blank=True)

    def __str__(self):
        return self.name

class Message(models.Model):
    content = models.TextField()
    type = models.CharField(max_length=50, default='text')  # Add a default value
    #user = models.ForeignKey(User, on_delete=models.CASCADE)
    matchId = models.IntegerField(default=None, null=True, blank=True)
    user_id = models.IntegerField(default=None, null=True, blank=True)
    recipient_id = models.IntegerField(default=None, null=True, blank=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    created_on = models.DateTimeField(auto_now_add=True)
    seen = models.BooleanField(default=False)  # New field to track seen status
    seen_send = models.BooleanField(default=False)
    seen_on = models.DateTimeField(null=True, blank=True)  # Add this field

class GameWarning(models.Model):
    user_id = models.IntegerField(default=None, null=True, blank=True)
    warning = models.CharField(max_length=150, default=None, null=True, blank=True)
    seen = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class BlockedUser(models.Model):
    blocker_id = models.IntegerField(default=None, null=True, blank=True)
    blocked_id = models.IntegerField(default=None, null=True, blank=True)
