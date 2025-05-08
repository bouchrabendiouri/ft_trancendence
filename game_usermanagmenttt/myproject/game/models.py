from django.db import models
from user_management.models import CustomUser
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.core.cache import cache

class Player(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='player_profile', null=True, blank=True)
    player_id = models.CharField(max_length=100, unique=True)
    total_score = models.IntegerField(default=0)
    total_matches = models.IntegerField(default=0)
    total_wins = models.IntegerField(default=0)
    total_losses = models.IntegerField(default=0)
    level = models.IntegerField(default=0)
    energy = models.IntegerField(default=100)
    skills_point = models.IntegerField(default=5)

    def update_stats(self, win):
        if win:
            self.total_wins += 1
            self.total_score += 5 
        else:
            self.total_losses += 1

        self.total_matches += 1
        self.update_level()
        self.save()

    def update_level(self):
        self.level = self.total_score // 10
        self.save()

    def __str__(self):
        return f"Player {self.player_id} - Level {self.level} - Score {self.total_score}"


class Match(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING'
        IN_PROGRESS = 'IN_PROGRESS'
        FINISHED = 'FINISHED'

    player1 = models.ForeignKey(Player, related_name='matches_as_player1', on_delete=models.CASCADE)
    player2 = models.ForeignKey(Player, related_name='matches_as_player2', on_delete=models.CASCADE, null=True)
    player1_score = models.IntegerField(default=0)
    player2_score = models.IntegerField(default=0)
    winner = models.ForeignKey(Player, related_name='won_matches', on_delete=models.CASCADE, null=True)
    target_score = models.IntegerField(blank=False, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Match between {self.player1} and {self.player2} - Winner: {self.winner}"


@receiver(post_save, sender=CustomUser)
def create_player_profile(sender, instance, created, **kwargs):
    if created:
        player, created = Player.objects.get_or_create(
            player_id=str(instance.id),
            defaults={
                'user': instance,
                'total_score': 0,
                'total_matches': 0,
                'total_wins': 0,
                'total_losses': 0,
                'level': 0,
                'energy': 100,
                'skills_point': 5
            }
        )
        if not created and not player.user:
            player.user = instance
            player.save()


class Tournament(models.Model):
    players = models.ManyToManyField(CustomUser, related_name='tournaments')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Tournament {self.id}"
