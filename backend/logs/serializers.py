from rest_framework import serializers
from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source='user.username',
        read_only=True
    )

    class Meta:
        model = ActivityLog
        fields = [
            'id',
            'username',
            'action',
            'description',
            'created_at'
        ]