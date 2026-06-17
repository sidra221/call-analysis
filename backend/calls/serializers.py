from rest_framework import serializers
from accounts.models import UserProfile
from .models import Call, CallAnalysis, FollowUp
from .services import _normalize_keywords


def _uploader_avatar(user, context):
    try:
        profile = user.profile
        if profile.avatar:
            request = context.get('request')
            if request:
                return request.build_absolute_uri(profile.avatar.url)
            return profile.avatar.url
    except (UserProfile.DoesNotExist, AttributeError):
        pass
    return None


def _uploader_avatar_style(user):
    try:
        style = user.profile.avatar_style
        return 'initial' if style == 'dicebear' else style
    except (UserProfile.DoesNotExist, AttributeError):
        return 'initial'


class CallAnalysisSerializer(serializers.ModelSerializer):
    call_id = serializers.IntegerField(source='call.id', read_only=True)

    class Meta:
        model = CallAnalysis
        fields = [
            'id', 'call_id', 'main_issue', 'sentiment', 'sentiment_score',
            'keywords', 'priority', 'needs_followup', 'followup_reason',
            'summary', 'meta_intent', 'meta_intents', 'llm_refined',
            'is_reviewed',
            'transcript', 'confidence_score', 'detected_language',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['keywords'] = _normalize_keywords(data.get('keywords'))
        return data


class CallSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(
        source='uploaded_by.username', read_only=True
    )
    uploaded_by_role = serializers.SerializerMethodField()
    uploaded_by_avatar = serializers.SerializerMethodField()
    uploaded_by_avatar_style = serializers.SerializerMethodField()
    analysis = CallAnalysisSerializer(read_only=True)

    class Meta:
        model = Call
        fields = [
            'id', 'uploaded_by', 'uploaded_by_username', 'uploaded_by_role',
            'uploaded_by_avatar', 'uploaded_by_avatar_style',
            'audio_file', 'file_path', 'status', 'duration',
            'created_at', 'updated_at', 'analysis',
        ]
        read_only_fields = ['uploaded_by', 'status', 'created_at', 'updated_at']

    def get_uploaded_by_role(self, obj):
        try:
            return obj.uploaded_by.profile.role
        except (UserProfile.DoesNotExist, AttributeError):
            return None

    def get_uploaded_by_avatar(self, obj):
        return _uploader_avatar(obj.uploaded_by, self.context)

    def get_uploaded_by_avatar_style(self, obj):
        return _uploader_avatar_style(obj.uploaded_by)


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
    uploaded_by_avatar = serializers.SerializerMethodField()
    uploaded_by_avatar_style = serializers.SerializerMethodField()
    sentiment = serializers.SerializerMethodField()
    priority = serializers.SerializerMethodField()
    is_reviewed = serializers.SerializerMethodField()
    analysis = CallAnalysisSerializer(read_only=True)

    class Meta:
        model = Call
        fields = [
            'id', 'uploaded_by_username', 'uploaded_by_role',
            'uploaded_by_avatar', 'uploaded_by_avatar_style',
            'audio_file', 'file_path',
            'status', 'duration', 'sentiment', 'priority',
            'is_reviewed', 'created_at', 'updated_at', 'analysis',
        ]

    def get_uploaded_by_role(self, obj):
        try:
            return obj.uploaded_by.profile.role
        except (UserProfile.DoesNotExist, AttributeError):
            return None

    def get_uploaded_by_avatar(self, obj):
        return _uploader_avatar(obj.uploaded_by, self.context)

    def get_uploaded_by_avatar_style(self, obj):
        return _uploader_avatar_style(obj.uploaded_by)

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
    assigned_to_role = serializers.SerializerMethodField()
    assigned_to_avatar = serializers.SerializerMethodField()
    assigned_to_avatar_style = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(
        source='created_by.username', read_only=True
    )
    created_by_role = serializers.SerializerMethodField()
    created_by_avatar = serializers.SerializerMethodField()
    created_by_avatar_style = serializers.SerializerMethodField()
    call_id = serializers.IntegerField(source='call.id', read_only=True)

    class Meta:
        model = FollowUp
        fields = [
            'id', 'call', 'call_id', 'assigned_to', 'assigned_to_username',
            'assigned_to_role', 'assigned_to_avatar', 'assigned_to_avatar_style',
            'created_by', 'created_by_username', 'created_by_role',
            'created_by_avatar', 'created_by_avatar_style',
            'creator_notes', 'assignee_notes',
            'status', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def get_assigned_to_role(self, obj):
        try:
            return obj.assigned_to.profile.role
        except (UserProfile.DoesNotExist, AttributeError):
            return None

    def get_assigned_to_avatar(self, obj):
        return _uploader_avatar(obj.assigned_to, self.context)

    def get_assigned_to_avatar_style(self, obj):
        return _uploader_avatar_style(obj.assigned_to)

    def get_created_by_role(self, obj):
        if not obj.created_by:
            return None
        try:
            return obj.created_by.profile.role
        except (UserProfile.DoesNotExist, AttributeError):
            return None

    def get_created_by_avatar(self, obj):
        if not obj.created_by:
            return None
        return _uploader_avatar(obj.created_by, self.context)

    def get_created_by_avatar_style(self, obj):
        if not obj.created_by:
            return None
        return _uploader_avatar_style(obj.created_by)

    def validate_assigned_to(self, value):
        if not hasattr(value, 'profile') or value.profile.role != 'qa':
            raise serializers.ValidationError(
                "Follow-ups can only be assigned to QA users."
            )
        return value

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        status = attrs.get('status', instance.status if instance else 'pending')
        assignee_notes = attrs.get(
            'assignee_notes',
            instance.assignee_notes if instance else '',
        )
        if status == 'done' and not (assignee_notes or '').strip():
            raise serializers.ValidationError({
                'assignee_notes': 'Follow-up notes are required before marking as done.',
            })
        if instance and 'creator_notes' in attrs:
            raise serializers.ValidationError({
                'creator_notes': 'Creator notes cannot be changed after creation.',
            })
        return attrs