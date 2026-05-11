from rest_framework import serializers
from .models import Call, CallAnalysis, FollowUp


class CallAnalysisSerializer(serializers.ModelSerializer):
    """
    Serializes CallAnalysis data.
    Used when returning full call details including AI results.
    Also used for partial updates to individual analysis fields.
    """

    # Expose the parent call's UUID directly instead of the analysis PK
    call_id = serializers.UUIDField(source='call.id', read_only=True)

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
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class CallSerializer(serializers.ModelSerializer):
    """
    Full serializer for a Call record.
    Includes nested analysis data and the uploader's username.
    Used for retrieve and update actions.
    """

    # Display uploader's username instead of just the user ID
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)

    # Embed the full analysis object directly in the call response
    analysis = CallAnalysisSerializer(read_only=True)

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
        read_only_fields = ['uploaded_by', 'status', 'created_at', 'updated_at']


class CallCreateSerializer(serializers.ModelSerializer):
    """
    Minimal serializer for creating a new Call.
    Only accepts the audio file — all other fields are set automatically.
    """

    class Meta:
        model = Call
        fields = ['audio_file']

    def create(self, validated_data):
        """Attach the requesting user and set default status before saving."""
        validated_data['uploaded_by'] = self.context['request'].user
        validated_data['status'] = 'pending'
        return super().create(validated_data)


class CallListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing calls.
    Omits the heavy analysis object — only exposes sentiment and review status.
    Used in the list action and sentiment filter endpoints.
    """

    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)

    # Pulled from the related analysis without nesting the full object
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
        """Return the sentiment label from the related analysis, or None if not yet analyzed."""
        if hasattr(obj, 'analysis'):
            return obj.analysis.sentiment
        return None

    def get_is_reviewed(self, obj):
        """Return the review status from the related analysis, or False if not yet analyzed."""
        if hasattr(obj, 'analysis'):
            return obj.analysis.is_reviewed
        return False


class FollowUpSerializer(serializers.ModelSerializer):
    """
    Serializes FollowUp records.
    Exposes the assigned user's username and the parent call's UUID.
    """

    # Human-readable username instead of just the user ID
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)

    # UUID of the parent call for easy reference
    call_id = serializers.UUIDField(source='call.id', read_only=True)

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
        read_only_fields = ['created_at', 'updated_at']