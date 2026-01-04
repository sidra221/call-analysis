from django.contrib import admin
from .models import Call, CallAnalysis, FollowUp


@admin.register(Call)
class CallAdmin(admin.ModelAdmin):
    list_display = ('id', 'uploaded_by', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('id',)
    ordering = ('-created_at',)


@admin.register(CallAnalysis)
class CallAnalysisAdmin(admin.ModelAdmin):
    list_display = (
        'call',
        'sentiment',
        'sentiment_score',
        'main_issue',
        'priority',
        'needs_follow_up',
        'analyzed_at'
    )

    list_filter = ('sentiment', 'priority', 'needs_follow_up')
    search_fields = ('main_issue',)
    readonly_fields = ('analyzed_at',)


@admin.register(FollowUp)
class FollowUpAdmin(admin.ModelAdmin):
    list_display = ('call', 'created_by', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('note',)
