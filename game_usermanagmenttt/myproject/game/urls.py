from django.urls import path
from . import views

urlpatterns = [
    path('scores/list/', views.get_game_scores, name='get_game_scores'),
    path('scores/player/',views.user_dashboard, name = 'get_player'),
    path('check_nickname/', views.check_nicknames, name='check_nickname'),
    path('get_avatar/', views.get_avatar, name='get_avatar'),
    path('create/', views.create_game, name='create_game'),
    path('pending-matches/', views.get_pending_matches, name='pending-matches'),
    path('<int:match_id>/join/', views.join_game, name='join-game'),
    path('match/<int:match_id>/score/', views.update_match_score, name='update-match-score'),
    path('match/<int:match_id>/delete_unjoined/', views.delete_unjoined_match, name='delete-unjoined-match'),
    path('players_of_the_week/', views.get_players_of_the_week, name="players_of_the_week"),
    path('match/<int:match_id>/finish/', views.finish_match, name="finish_match"),
    path('create_game_chat/', views.create_game_chat, name="create_game_chat"),
    path('accept_game_chat/<int:match_id>/', views.accept_game_chat, name="accept_game_chat"),
]