from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
#authenticate with email

class EmailBackend(BaseBackend):
    def authenticate(self, request, email=None, password=None):
        try:
          
            user_model = get_user_model()
            user = user_model.objects.get(email=email)
            if user.check_password(password):
                return user
            return None
        except user_model.DoesNotExist:
            return None