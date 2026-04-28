import logging
from celery import shared_task
from django.db import transaction
from django.utils import timezone

from .models import Call, CallAnalysis
from .ai_client import analyze_audio_file
from .services import map_ai_response
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=5, max_retries=3)
def analyze_call(self, call_id: str) -> dict:
    """
    Celery background task that processes a single audio call through the AI service.

    Lifecycle:
    1. Lock the call row and set status to 'processing'
    2. Notify WebSocket clients that analysis has started
    3. Send the audio file to the external AI service
    4. Map and save the AI results into CallAnalysis
    5. Set call status to 'completed' and notify WebSocket clients
    6. On any failure: set status to 'failed', notify clients, and re-raise

    Configured with automatic retries (up to 3) with exponential backoff.
    """
    channel_layer = get_channel_layer()
    group = f'call_{call_id}'

    try:
        # Lock the call row and mark it as processing inside a transaction
        with transaction.atomic():
            call = Call.objects.select_for_update(of=('self',)).get(id=call_id)
            call.status = 'processing'
            call.save(update_fields=['status', 'updated_at'])

        logger.info(f"[START] AI analysis for call_id={call_id}")

        # Notify connected WebSocket clients that processing has begun
        async_to_sync(channel_layer.group_send)(group, {
            "type": "analysis_started",
            "call_id": call_id,
            "message": "Analysis started",
        })

        # Call the external AI service with the audio file
        audio_path = call.audio_file.path
        try:
            ai_result = analyze_audio_file(audio_path)
            logger.info(f"[AI SUCCESS] call_id={call_id}")
        except Exception as ai_error:
            # If the AI service fails, use a safe fallback result
            logger.error(f"[AI FAILED] call_id={call_id} error={str(ai_error)}")
            ai_result = {
                "main_issue": "Analysis failed",
                "sentiment_score": 0,
                "keywords": [],
                "priority": "low",
                "needs_followup": False,
                "transcript": "",
                "sentiment": "neutral",
            }

        # Map the AI response to model fields
        mapped = map_ai_response(call, ai_result)

        # Save or update the CallAnalysis record
        with transaction.atomic():
            analysis, created = CallAnalysis.objects.get_or_create(
                call=call,
                defaults=mapped
            )
            # If analysis already existed, update all fields
            if not created:
                for key, value in mapped.items():
                    if key != 'call':
                        setattr(analysis, key, value)
                analysis.save()

            # Mark the call as completed
            call.status = 'completed'
            call.updated_at = timezone.now()
            call.save(update_fields=['status', 'updated_at'])

        logger.info(f"[SAVED] Analysis saved for call_id={call_id}")

        # Notify WebSocket clients that analysis is complete
        async_to_sync(channel_layer.group_send)(group, {
            "type": "analysis_completed",
            "call_id": call_id,
            "analysis_id": analysis.id,
            "message": "Analysis completed",
        })

        return {
            'call_id': call_id,
            'status': call.status,
            'analysis_id': analysis.id,
        }

    except Exception as exc:
        logger.error(f"[ERROR] call_id={call_id} error={str(exc)}")

        # Mark the call as failed without raising inside the atomic block
        with transaction.atomic():
            Call.objects.filter(id=call_id).update(
                status='failed',
                updated_at=timezone.now()
            )

        # Notify WebSocket clients about the failure
        async_to_sync(channel_layer.group_send)(group, {
            "type": "analysis_failed",
            "call_id": call_id,
            "error": str(exc),
        })

        # Re-raise so Celery can handle retries
        raise