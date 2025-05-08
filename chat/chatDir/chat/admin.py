from django.contrib import admin
from .models import Room, Message, BlockedUser, GameWarning

# Register your models here.
admin.site.register(Room)
admin.site.register(Message)
admin.site.register(BlockedUser)
admin.site.register(GameWarning)
