import logging

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from pydub.utils import mediainfo

from .models import Call, CallAnalysis
from .ai_client import analyze_audio_file
from .services import map_ai_response, _normalize_keywords

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=5, max_retries=3)
def analyze_call(self, call_id: str, force: bool = False):

    channel_layer = get_channel_layer()
    group = f'call_{call_id}'

    try:

        with transaction.atomic():

            call = Call.objects.select_for_update().get(id=call_id)

            if call.status == 'processing':
                logger.warning(
                    "Skipping duplicate analyze_call for call %s (already processing)",
                    call_id,
                )
                return {
                    "call_id": call_id,
                    "status": "skipped",
                    "reason": "already_processing",
                }

            if call.status == 'completed' and not force:
                logger.warning(
                    "Skipping analyze_call for call %s (already completed)",
                    call_id,
                )
                return {
                    "call_id": call_id,
                    "status": "skipped",
                    "reason": "already_completed",
                }

            call.status = 'processing'

            call.save(update_fields=[
                'status',
                'updated_at'
            ])

        audio_path = call.audio_file.path

        # -----------------------------------
        # حساب مدة الملف الصوتي
        # -----------------------------------
        try:

            info = mediainfo(audio_path)

            duration = float(info["duration"])

            call.duration = round(duration, 2)

            logger.info(f"CALL DURATION = {call.duration}")

        except Exception as e:

            logger.error(f"Duration error: {e}")

            call.duration = 0.0

        # -----------------------------------
        # تحليل AI
        # -----------------------------------
        try:

            ai_result = analyze_audio_file(audio_path)

        except Exception as e:

            logger.error(f"AI analysis failed: {e}")

            ai_result = {
                "main_issue": "Analysis failed",
                "sentiment": "neutral",
                "sentiment_score": 0,
                "keywords": [],
                "priority": "low",
                "needs_followup": False,
                "transcript": "",
                "duration": call.duration,
            }

        mapped = map_ai_response(call, ai_result)

        raw_keywords = ai_result.get('keywords') or ai_result.get('keywords_detail')
        mapped['keywords'] = _normalize_keywords(raw_keywords)
        if not mapped['keywords'] and raw_keywords:
            logger.warning(
                "Keywords empty after normalization for call %s (type=%s)",
                call_id,
                type(raw_keywords).__name__,
            )

        with transaction.atomic():

            analysis, created = CallAnalysis.objects.get_or_create(
                call=call,
                defaults=mapped
            )

            for k, v in mapped.items():
                setattr(analysis, k, v)

            analysis.save()

            call.status = 'completed'
            call.updated_at = timezone.now()

            call.save(update_fields=[
                'status',
                'updated_at',
                'duration'
            ])

        async_to_sync(channel_layer.group_send)(
            group,
            {
                "type": "analysis_completed",
                "call_id": call_id,
                "analysis_id": analysis.id,
            }
        )

        return {
            "call_id": call_id,
            "analysis_id": analysis.id,
            "status": "completed"
        }

    except Exception as exc:

        logger.exception("analyze_call failed for call %s: %s", call_id, exc)

        Call.objects.filter(id=call_id).update(
            status='failed',
            updated_at=timezone.now()
        )

        async_to_sync(channel_layer.group_send)(
            group,
            {
                "type": "analysis_failed",
                "call_id": call_id,
                "error": str(exc),
            }
        )

        raise