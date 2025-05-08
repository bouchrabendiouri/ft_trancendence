from django.test import TestCase
from user_management.models import CustomUser
from .models import Player, Match

class GameTests(TestCase):
    def setUp(self):
        # Créez deux utilisateurs CustomUser
        self.user1 = CustomUser.objects.create_user(username='user1', password='password1')
        self.user2 = CustomUser.objects.create_user(username='user2', password='password2')
        
        # Créez des joueurs associés aux utilisateurs
        self.player1 = Player.objects.create(user=self.user1, player_id='player1')
        self.player2 = Player.objects.create(user=self.user2, player_id='player2')

    def test_match_between_users(self):
        # Simulez un match entre les deux joueurs
        match = Match.objects.create(
            player1=self.player1,
            player2=self.player2,
            player1_score=5,
            player2_score=3,
        )
        
        # Vérifiez les statistiques après le match
        self.player1.refresh_from_db()
        self.player2.refresh_from_db()

        self.assertEqual(self.player1.total_wins, 1)
        self.assertEqual(self.player1.total_losses, 0)
        self.assertEqual(self.player1.total_matches, 1)
        self.assertEqual(self.player2.total_wins, 0)
        self.assertEqual(self.player2.total_losses, 1)
        self.assertEqual(self.player2.total_matches, 1)

    def test_player_statistics_update(self):
        # Créez un match avec des scores pour tester la mise à jour des statistiques
        match = Match.objects.create(
            player1=self.player1,
            player2=self.player2,
            player1_score=3,
            player2_score=5,
        )
        
        # Vérifiez les statistiques après le match
        self.player1.refresh_from_db()
        self.player2.refresh_from_db()

        self.assertEqual(self.player1.total_wins, 0)
        self.assertEqual(self.player1.total_losses, 1)
        self.assertEqual(self.player1.total_matches, 1)
        self.assertEqual(self.player2.total_wins, 1)
        self.assertEqual(self.player2.total_losses, 0)
        self.assertEqual(self.player2.total_matches, 1)

