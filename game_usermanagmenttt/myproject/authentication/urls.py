# urls.py
from django.urls import path
from . import views
# from .views import refresh_access_token
urlpatterns = [
    path('login42/', views.login, name='login42'),
    path('callback/', views.callback, name='callback'),
    # path('refresh-token/', refresh_access_token, name='refresh-token'),
]
