from rest_framework import serializers
from .models import Match, Player


class MatchSerializer(serializers.ModelSerializer):
    target_score = serializers.IntegerField(allow_null=False)
    player1 = serializers.PrimaryKeyRelatedField(required=False, allow_null=True, queryset=Player.objects.all())
    player2 = serializers.PrimaryKeyRelatedField(required=False, allow_null=True, queryset=Player.objects.all())
    player1_score = serializers.IntegerField(required=False, default=0)
    player2_score = serializers.IntegerField(required=False, default=0)
    winner = serializers.PrimaryKeyRelatedField(required=False, allow_null=True, queryset=Player.objects.all())
    status = serializers.CharField(required=False)
    created_at = serializers.DateTimeField(required=False, read_only=True)

    class Meta:
        model = Match
        fields = [
            "player1",
            "player2",
            "player1_score",
            "player2_score",
            "winner",
            "target_score",
            "status",
            "created_at",
        ]


class MatchScoreSerializer(serializers.ModelSerializer):
    player1_score = serializers.IntegerField(required=True)
    player2_score = serializers.IntegerField(required=True)

    class Meta:
        model = Match
        fields = ["player1_score", "player2_score"]

    def update(self, instance, validated_data):
        instance.player1_score = validated_data.get(
            "player1_score", instance.player1_score
        )
        instance.player2_score = validated_data.get(
            "player2_score", instance.player2_score
        )

        if instance.player1_score >= instance.target_score:
            instance.winner = instance.player1
            instance.status = Match.Status.FINISHED
        elif instance.player2_score >= instance.target_score:
            instance.winner = instance.player2
            instance.status = Match.Status.FINISHED

        instance.save()
        return instance
