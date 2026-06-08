from rest_framework import serializers
from accounts.models import UserProfile
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    """
    Full serializer for a Report record.
    Used for listing, retrieving, and updating reports.
    The created_by, top_issues, and sentiment_stats fields are read-only
    because they are set automatically at creation time.
    """

    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True)
    created_by_role = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id',
            'created_by',
            'created_by_username',
            'created_by_role',
            'period',
            'status',
            'date_from',
            'date_to',
            'summary',
            'recommendations',
            'positives',
            'top_issues',
            'sentiment_stats',
            'manager_notes',
            'reviewed_by',
            'reviewed_by_username',
            'reviewed_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'created_by',
            'top_issues',
            'sentiment_stats',
            'manager_notes',
            'reviewed_by',
            'reviewed_at',
            'created_at',
            'updated_at',
        ]

    def get_created_by_role(self, obj):
        try:
            return obj.created_by.profile.role
        except UserProfile.DoesNotExist:
            return 'qa'


class ReportGenerateSerializer(serializers.Serializer):
    """
    Input serializer for the report generation endpoint.
    QA provides the period type and date range — the AI fills in the content.
    """

    period = serializers.ChoiceField(choices=['daily', 'weekly'])
    date_from = serializers.DateField()
    date_to = serializers.DateField()

    def validate(self, data):
        """Ensure the date range is valid (start must be before end)."""
        if data['date_from'] > data['date_to']:
            raise serializers.ValidationError("date_from must be before date_to.")
        return data


class ReportAddNotesSerializer(serializers.Serializer):
    """Input serializer for manager notes on a published report."""

    notes = serializers.CharField(allow_blank=False, trim_whitespace=True)
