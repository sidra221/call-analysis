from django.contrib import admin
from .models import Call, CallAnalysis, FollowUp, Report


@admin.register(Call)
class CallAdmin(admin.ModelAdmin):
    list_display = ('id', 'uploaded_by', 'status', 'duration', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at')
    search_fields = ('id',)
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(CallAnalysis)
class CallAnalysisAdmin(admin.ModelAdmin):
    list_display = (
        'call',
        'main_issue',
        'sentiment_score',
        'priority',
        'needs_followup',
        'sentiment',
        'created_at',
        'updated_at'
    )

    list_filter = ('sentiment', 'priority', 'needs_followup', 'created_at')
    search_fields = ('main_issue',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(FollowUp)
class FollowUpAdmin(admin.ModelAdmin):
    list_display = ('call', 'assigned_to', 'status', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at')
    search_fields = ('notes',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_by', 'period_start', 'period_end', 'created_at', 'updated_at')
    list_filter = ('created_at',)
    search_fields = ('title',)
    readonly_fields = ('created_at', 'updated_at')
