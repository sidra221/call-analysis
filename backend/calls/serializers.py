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
            'status',
            'created_at',
            'analysis'
        ]
        read_only_fields = ['uploaded_by', 'status', 'created_at']

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
            'transcript',
            'sentiment',
            'sentiment_score',
            'main_issue',
            'keywords',
            'needs_follow_up',
            'priority',
            'analyzed_at'
        ]
        read_only_fields = ['analyzed_at']


class FollowUpSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = FollowUp
        fields = [
            'id',
            'call',
            'note',
            'created_by',
            'created_by_username',
            'created_at'
        ]
        read_only_fields = ['created_by', 'created_at']


class CallListSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    sentiment = serializers.SerializerMethodField()

    class Meta:
        model = Call
        fields = [
            'id',
            'uploaded_by_username',
            'audio_file',
            'status',
            'sentiment',
            'created_at'
        ]

    def get_sentiment(self, obj):
        try:
            analysis = CallAnalysis.objects.get(call=obj)
            return analysis.sentiment
        except CallAnalysis.DoesNotExist:
            return None

