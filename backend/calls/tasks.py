from celery import shared_task
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from .models import Call, CallAnalysis
from .ai_client import analyze_audio_file
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=5, max_retries=3)
def analyze_call(self, call_id: int) -> dict:
    call = Call.objects.select_for_update(of=('self',)).get(id=call_id)
    try:
        with transaction.atomic():
            call.status = 'analyzing'
            call.save(update_fields=['status', 'updated_at'])

        # notify started
        channel_layer = get_channel_layer()
        group = f'call_{call.id}'
        async_to_sync(channel_layer.group_send)(group, {
            "type": "analysis_started",
            "call_id": call.id,
            "message": "Analysis started"
        })

        # Call external AI service with the audio file path
        audio_path = call.audio_file.path
        ai_result = analyze_audio_file(audio_path)

        main_issue = ai_result['main_issue']
        sentiment_score = float(ai_result['sentiment_score'])
        keywords = list(ai_result.get('keywords') or [])
        priority = ai_result['priority']
        needs_followup = bool(ai_result['needs_followup'])
        transcript = ai_result.get('transcript') or ''
        sentiment = ai_result['sentiment']

        with transaction.atomic():
            analysis, created = CallAnalysis.objects.get_or_create(
                call=call,
                defaults={
                    'main_issue': main_issue,
                    'sentiment_score': sentiment_score,
                    'keywords': keywords,
                    'priority': priority,
                    'needs_followup': needs_followup,
                    'transcript': transcript,
                    'sentiment': sentiment,
                }
            )
            if not created:
                analysis.main_issue = main_issue
                analysis.sentiment_score = sentiment_score
                analysis.keywords = keywords
                analysis.priority = priority
                analysis.needs_followup = needs_followup
                analysis.transcript = transcript
                analysis.sentiment = sentiment
                analysis.save()

            call.status = 'completed'
            call.updated_at = timezone.now()
            call.save(update_fields=['status', 'updated_at'])

        # notify completed
        async_to_sync(channel_layer.group_send)(group, {
            "type": "analysis_completed",
            "call_id": call.id,
            "analysis_id": analysis.id,
            "message": "Analysis completed"
        })

        return {
            'call_id': call_id,
            'status': call.status,
            'analysis_id': analysis.id,
        }
    except Exception as exc:
        with transaction.atomic():
            call.status = 'failed'
            call.updated_at = timezone.now()
            call.save(update_fields=['status', 'updated_at'])
        # notify failed
        channel_layer = get_channel_layer()
        group = f'call_{call.id}'
        async_to_sync(channel_layer.group_send)(group, {
            "type": "analysis_failed",
            "call_id": call.id,
            "error": str(exc),
        })
        raise

