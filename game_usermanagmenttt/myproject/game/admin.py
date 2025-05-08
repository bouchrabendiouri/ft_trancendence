from django.contrib import admin
from .models import Player, Match


class PlayerAdmin(admin.ModelAdmin):
    list_display = ('player_id', 'total_score', 'total_matches', 'total_wins', 'total_losses', 'level')  # Les champs que vous voulez afficher
    search_fields = ['player_id'] 
    list_filter = ('level',) 

class MatchAdmin(admin.ModelAdmin):
    list_display = ('player1', 'player2', 'player1_score', 'player2_score', 'winner', 'created_at')  # Afficher les champs de match
    list_filter = ('created_at', 'winner')
    search_fields = ['player1__player_id', 'player2__player_id']

admin.site.register(Player, PlayerAdmin)
admin.site.register(Match, MatchAdmin)

