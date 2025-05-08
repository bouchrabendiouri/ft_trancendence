from django.urls import path, re_path
from user_management.consumers import StatusConsumer

websocket_urlpatterns = [
    path('ws/status/<int:id>/', StatusConsumer.as_asgi()),
    # re_path(r'ws/notifications/(?P<user_id>\w+)/$', StatusConsumer.as_asgi()),  # String user_id
]