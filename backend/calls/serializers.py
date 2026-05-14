from rest_framework import serializers
from .models import Call, CallAnalysis, FollowUp


class CallAnalysisSerializer(serializers.ModelSerializer):
    """
    Serializes CallAnalysis data.
    """

    call_id = serializers.UUIDField(
        source='call.id',
        read_only=True
    )

    class Meta:
        model = CallAnalysis

        fields = [
            'id',
            'call_id',
            'main_issue',
            'sentiment',
            'sentiment_score',
            'keywords',
            'priority',
            'needs_followup',
            'is_reviewed',
            'transcript',
            'confidence_score',
            'detected_language',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'created_at',
            'updated_at'
        ]


class CallSerializer(serializers.ModelSerializer):

    uploaded_by_username = serializers.CharField(
        source='uploaded_by.username',
        read_only=True
    )

    analysis = CallAnalysisSerializer(
        read_only=True
    )

    class Meta:
        model = Call

        fields = [
            'id',
            'uploaded_by',
            'uploaded_by_username',
            'audio_file',
            'file_path',
            'status',
            'duration',
            'created_at',
            'updated_at',
            'analysis',
        ]

        read_only_fields = [
            'uploaded_by',
            'status',
            'created_at',
            'updated_at'
        ]


class CallCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Call
        fields = ['audio_file']

    def create(self, validated_data):

        validated_data['uploaded_by'] = (
            self.context['request'].user
        )

        validated_data['status'] = 'pending'

        return super().create(validated_data)


class CallListSerializer(serializers.ModelSerializer):

    uploaded_by_username = serializers.CharField(
        source='uploaded_by.username',
        read_only=True
    )

    sentiment = serializers.SerializerMethodField()

    is_reviewed = serializers.SerializerMethodField()

    class Meta:
        model = Call

        fields = [
            'id',
            'uploaded_by_username',
            'audio_file',
            'file_path',
            'status',
            'duration',
            'sentiment',
            'is_reviewed',
            'created_at',
            'updated_at',
        ]

    def get_sentiment(self, obj):

        if hasattr(obj, 'analysis'):
            return obj.analysis.sentiment

        return None

    def get_is_reviewed(self, obj):

        if hasattr(obj, 'analysis'):
            return obj.analysis.is_reviewed

        return False


class FollowUpSerializer(serializers.ModelSerializer):

    assigned_to_username = serializers.CharField(
        source='assigned_to.username',
        read_only=True
    )

    call_id = serializers.UUIDField(
        source='call.id',
        read_only=True
    )

    class Meta:
        model = FollowUp

        fields = [
            'id',
            'call',
            'call_id',
            'assigned_to',
            'assigned_to_username',
            'notes',
            'status',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'created_at',
            'updated_at'
        ]