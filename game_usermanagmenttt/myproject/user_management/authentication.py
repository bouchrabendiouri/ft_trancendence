from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
import logging
# # Create or get a logger
logger = logging.getLogger('user_management')  # or use 'django' for the global logger

class CookieTokenAuthentication(BaseAuthentication):
    def authenticate(self, request):
        # Log request headers and cookies for debugging
       
        # logger.debug(f"Request Cookies: {request.COOKIES}")

        # Retrieve access token from cookies
        token = request.COOKIES.get('access_token')

        if not token:
            # logger.warning("No token found in cookie.")
            raise AuthenticationFailed('No token found in cookiie.')

        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            user = get_user_model().objects.get(id=user_id)

        except Exception as e:
            logger.error(f"Invalid token: {str(e)}")
            raise AuthenticationFailed(f'Invalid token: {str(e)}')

        # logger.info(f"User {user.username} authenticated successfully.")
        return (user, token)