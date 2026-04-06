from rest_framework import serializers
from .models import Call, CallAnalysis, FollowUp


class CallSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    analysis = serializers.SerializerMethodField()

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
            'analysis'
        ]
        read_only_fields = ['uploaded_by', 'status', 'created_at', 'updated_at']

    def get_analysis(self, obj):
        try:
            analysis = CallAnalysis.objects.get(call=obj)
            return CallAnalysisSerializer(analysis).data
        except CallAnalysis.DoesNotExist:
            return None


class CallCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Call
        fields = ['audio_file']
        read_only_fields = ['uploaded_by', 'status', 'created_at']

    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        validated_data['status'] = 'pending'
        return super().create(validated_data)


class CallAnalysisSerializer(serializers.ModelSerializer):
    call_id = serializers.IntegerField(source='call.id', read_only=True)

    class Meta:
        model = CallAnalysis
        fields = [
            'id',
            'call_id',
            'main_issue',
            'sentiment_score',
            'keywords',
            'priority',
            'needs_followup',
            'is_reviewed',
            'transcript',
            'sentiment',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class FollowUpSerializer(serializers.ModelSerializer):
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)
    call_id = serializers.IntegerField(source='call.id', read_only=True)

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
            'updated_at'
        ]
        read_only_fields = ['assigned_to', 'created_at', 'updated_at']


class CallListSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
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
            'updated_at'
        ]

    def get_sentiment(self, obj):
        try:
            analysis = CallAnalysis.objects.get(call=obj)
            return analysis.sentiment
        except CallAnalysis.DoesNotExist:
            return None

    def get_is_reviewed(self, obj):
        try:
            analysis = CallAnalysis.objects.get(call=obj)
            return analysis.is_reviewed
        except CallAnalysis.DoesNotExist:
            return False
