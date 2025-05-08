# asgi.py
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator  # Important!
from chat.routing import websocket_urlpatterns  # Correct import!

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chatDir.settings')
django_application = get_asgi_application()  # Store the result

application = ProtocolTypeRouter({
    "http": django_application, # Use the stored result
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                websocket_urlpatterns  # Correct usage!
            )
        ),
    ),
})