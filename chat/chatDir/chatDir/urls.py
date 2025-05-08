"""
URL configuration for chatDir project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# chatDir/urls.py
from django.contrib import admin
from django.urls import path, include
from chat import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/contacts/", views.chat_page, name="contacts-api"),
    path('api/create_room/', views.create_room, name='create_room'),
    path('api/block_user/', views.block_user, name='block_user'),
    path('api/room/<int:pk>/', views.room, name='room-api'),
    path('ws/chat/<int:pk>/', views.room, name='room'),
    path('api/tournament_notification/', views.tournament_notification, name='tournament_notification'),
    # Make sure your WebSocket URL pattern is defined in the routing.py
]
