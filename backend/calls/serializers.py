from rest_framework import serializers
from accounts.models import UserProfile
from .models import Call, CallAnalysis, FollowUp


class CallAnalysisSerializer(serializers.ModelSerializer):
    call_id = serializers.IntegerField(source='call.id', read_only=True)

    class Meta:
        model = CallAnalysis
        fields = [
            'id', 'call_id', 'main_issue', 'sentiment', 'sentiment_score',
            'keywords', 'priority', 'needs_followup', 'is_reviewed',
            'transcript', 'confidence_score', 'detected_language',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class CallSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(
        source='uploaded_by.username', read_only=True
    )
    uploaded_by_role = serializers.SerializerMethodField()
    analysis = CallAnalysisSerializer(read_only=True)

    class Meta:
        model = Call
        fields = [
            'id', 'uploaded_by', 'uploaded_by_username', 'uploaded_by_role',
            'audio_file', 'file_path', 'status', 'duration',
            'created_at', 'updated_at', 'analysis',
        ]

    def get_uploaded_by_role(self, obj):
        try:
            return obj.uploaded_by.profile.role
        except (UserProfile.DoesNotExist, AttributeError):
            return None
        read_only_fields = ['uploaded_by', 'status', 'created_at', 'updated_at']


class CallCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Call
        fields = ['audio_file']

    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        validated_data['status'] = 'pending'
        return super().create(validated_data)


class CallListSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(
        source='uploaded_by.username', read_only=True
    )
    uploaded_by_role = serializers.SerializerMethodField()
    sentiment = serializers.SerializerMethodField()
    priority = serializers.SerializerMethodField()
    is_reviewed = serializers.SerializerMethodField()
    analysis = CallAnalysisSerializer(read_only=True)

    class Meta:
        model = Call
        fields = [
            'id', 'uploaded_by_username', 'uploaded_by_role', 'audio_file', 'file_path',
            'status', 'duration', 'sentiment', 'priority',
            'is_reviewed', 'created_at', 'updated_at', 'analysis',
        ]

    def get_uploaded_by_role(self, obj):
        try:
            return obj.uploaded_by.profile.role
        except (UserProfile.DoesNotExist, AttributeError):
            return None

    def get_sentiment(self, obj):
        try:
            return obj.analysis.sentiment
        except Exception:
            return 'neutral'

    def get_priority(self, obj):
        try:
            return obj.analysis.priority
        except Exception:
            return 'low'

    def get_is_reviewed(self, obj):
        try:
            return obj.analysis.is_reviewed
        except Exception:
            return False


class FollowUpSerializer(serializers.ModelSerializer):
    assigned_to_username = serializers.CharField(
        source='assigned_to.username', read_only=True
    )
    call_id = serializers.IntegerField(source='call.id', read_only=True)

    class Meta:
        model = FollowUp
        fields = [
            'id', 'call', 'call_id', 'assigned_to', 'assigned_to_username',
            'notes', 'status', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']