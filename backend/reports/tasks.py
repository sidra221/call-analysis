import logging
from datetime import date

from celery import shared_task
from django.conf import settings
from django.contrib.auth.models import User

from .ai_client import call_ai_for_report
from .services import generate_report_for_period, period_date_range, resolve_auto_report_user

logger = logging.getLogger(__name__)


@shared_task
def generate_report_ai(analyses_data):
    return call_ai_for_report(analyses_data)


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=60, max_retries=2)
def generate_report_task(
    self,
    created_by_id: int,
    period: str,
    date_from: str,
    date_to: str,
    *,
    skip_if_exists: bool = False,
    log_prefix: str = 'Generated',
):
    try:
        created_by = User.objects.get(id=created_by_id, is_active=True)
    except User.DoesNotExist as exc:
        logger.error("[REPORT TASK] User %s not found", created_by_id)
        raise exc

    if isinstance(date_from, str):
        date_from = date.fromisoformat(date_from)
    if isinstance(date_to, str):
        date_to = date.fromisoformat(date_to)

    try:
        report = generate_report_for_period(
            created_by,
            period,
            date_from,
            date_to,
            skip_if_exists=skip_if_exists,
            log_prefix=log_prefix,
        )
    except Exception as exc:
        logger.exception("[REPORT TASK] Failed %s report for user %s", period, created_by_id)
        raise self.retry(exc=exc)

    return report.id if report else None


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=60, max_retries=2)
def generate_scheduled_report(self, period: str):
    if not settings.AUTO_REPORT_ENABLED:
        logger.info("[AUTO REPORT] Disabled — skipping %s report", period)
        return {'status': 'disabled', 'period': period}

    if period not in ('daily', 'weekly'):
        raise ValueError(f"Unsupported report period: {period}")

    created_by = resolve_auto_report_user()
    if not created_by:
        logger.error("[AUTO REPORT] No QA user available for %s report", period)
        return {'status': 'failed', 'period': period, 'reason': 'no_qa_user'}

    date_from, date_to = period_date_range(period)

    try:
        report = generate_report_for_period(
            created_by,
            period,
            date_from,
            date_to,
            skip_if_exists=True,
            log_prefix='Auto-generated',
        )
    except Exception as exc:
        logger.exception("[AUTO REPORT] Failed to generate %s report", period)
        raise self.retry(exc=exc)

    if report is None:
        return {
            'status': 'skipped',
            'period': period,
            'date_from': str(date_from),
            'date_to': str(date_to),
            'reason': 'already_exists',
        }

    return {
        'status': 'created',
        'period': period,
        'report_id': report.id,
        'date_from': str(date_from),
        'date_to': str(date_to),
    }
