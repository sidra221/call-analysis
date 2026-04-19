import logging
from celery import shared_task
from django.db import transaction
from django.utils import timezone
from .models import Call, CallAnalysis
from .ai_client import analyze_audio_file
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .services import map_ai_response

logger = logging.getLogger(__name__)


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=5, max_retries=3)
def analyze_call(self, call_id: int) -> dict:
    call = Call.objects.select_for_update(of=('self',)).get(id=call_id)

    try:
        logger.info(f"[START] AI analysis for call_id={call.id}")

        # تحديث الحالة
        with transaction.atomic():
            call.status = 'analyzing'
            call.save(update_fields=['status', 'updated_at'])

        # WebSocket notify started
        channel_layer = get_channel_layer()
        group = f'call_{call.id}'
        async_to_sync(channel_layer.group_send)(group, {
            "type": "analysis_started",
            "call_id": call.id,
            "message": "Analysis started"
        })

        # 🧠 استدعاء AI
        audio_path = call.audio_file.path

        try:
            ai_result = analyze_audio_file(audio_path)
            logger.info(f"[AI SUCCESS] call_id={call.id}")
        except Exception as ai_error:
            logger.error(f"[AI FAILED] call_id={call.id} error={str(ai_error)}")

            # 🔁 fallback
            ai_result = {
                "main_issue": "Analysis failed",
                "sentiment_score": 0,
                "keywords": [],
                "priority": "low",
                "needs_followup": False,
                "transcript": "",
                "sentiment": "neutral"
            }

        # 🧩 mapping
        mapped = map_ai_response(call, ai_result)

        # 💾 حفظ
        with transaction.atomic():
            analysis, created = CallAnalysis.objects.get_or_create(
                call=call,
                defaults=mapped
            )

            if not created:
                for key, value in mapped.items():
                    if key != 'call':
                        setattr(analysis, key, value)
                analysis.save()

            call.status = 'completed'
            call.updated_at = timezone.now()
            call.save(update_fields=['status', 'updated_at'])

        logger.info(f"[SAVED] Analysis saved for call_id={call.id}")

        # WebSocket notify completed
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
        logger.error(f"[ERROR] call_id={call.id} error={str(exc)}")

        with transaction.atomic():
            call.status = 'failed'
            call.updated_at = timezone.now()
            call.save(update_fields=['status', 'updated_at'])

        # WebSocket notify failed
        channel_layer = get_channel_layer()
        group = f'call_{call.id}'
        async_to_sync(channel_layer.group_send)(group, {
            "type": "analysis_failed",
            "call_id": call.id,
            "error": str(exc),
        })

        raise