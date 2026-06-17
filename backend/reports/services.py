import logging
from datetime import date, timedelta

from django.conf import settings
from django.contrib.auth.models import User
from django.db.models import Count
from django.utils import timezone

from calls.models import CallAnalysis
from calls.services import flatten_keywords
from logs.utils import create_log

from .ai_client import call_ai_for_report
from .models import Report

logger = logging.getLogger(__name__)


def build_positives_fallback(analyses_data, sentiment_stats):
    lines = []
    positive_count = sentiment_stats.get('positive', 0)
    if positive_count:
        lines.append(f"• {positive_count} call(s) ended with positive customer sentiment.")

    for analysis in analyses_data:
        if analysis.get('sentiment') != 'positive':
            continue
        issue = (analysis.get('main_issue') or '').strip()
        if issue:
            lines.append(f"• Positive interaction: {issue}")
        if len(lines) >= 4:
            break

    return "\n".join(lines) if lines else "No major positive highlights identified for this period."


def build_recommendations_fallback(repeated_issues):
    lines = []
    seen = set()

    for issue in repeated_issues:
        solution = (issue.get('suggested_solution') or '').strip()
        if not solution or solution in seen:
            continue
        seen.add(solution)
        lines.append(f"• {solution}")
        if len(lines) >= 5:
            break

    if lines:
        return "\n".join(lines)

    return "• Continue monitoring call quality and assign follow-ups for recurring issues."


def period_date_range(period: str, *, reference: date | None = None) -> tuple[date, date]:
    today = reference or timezone.localdate()

    if period == 'daily':
        target = today - timedelta(days=1)
        return target, target

    if period == 'weekly':
        last_monday = today - timedelta(days=today.weekday() + 7)
        last_sunday = last_monday + timedelta(days=6)
        return last_monday, last_sunday

    raise ValueError(f"Unsupported report period: {period}")


def resolve_auto_report_user() -> User | None:
    username = (settings.AUTO_REPORT_USERNAME or '').strip()
    if username:
        user = User.objects.filter(username=username, is_active=True).first()
        if user:
            return user
        logger.error("[AUTO REPORT] AUTO_REPORT_USERNAME=%s not found", username)

    return User.objects.filter(is_active=True, profile__role='qa').order_by('id').first()


def _fetch_analyses_data(date_from: date, date_to: date) -> list[dict]:
    return [
        {
            **row,
            'keywords': flatten_keywords(row.get('keywords')),
        }
        for row in CallAnalysis.objects.filter(
            call__created_at__date__gte=date_from,
            call__created_at__date__lte=date_to,
        ).values('main_issue', 'sentiment', 'keywords', 'needs_followup', 'priority', 'transcript')
    ]


def _compute_report_stats(date_from: date, date_to: date) -> tuple[list, dict]:
    analyses_qs = CallAnalysis.objects.filter(
        call__created_at__date__gte=date_from,
        call__created_at__date__lte=date_to,
    )

    top_issues = list(
        analyses_qs.values('main_issue')
        .annotate(count=Count('id'))
        .order_by('-count')[:5]
    )

    sentiment_stats = {
        item['sentiment']: item['count']
        for item in analyses_qs.values('sentiment').annotate(count=Count('id'))
    }

    return top_issues, sentiment_stats


def generate_report_for_period(
    created_by,
    period: str,
    date_from: date,
    date_to: date,
    *,
    skip_if_exists: bool = False,
    log_prefix: str = 'Generated',
) -> Report | None:
    if skip_if_exists and Report.objects.filter(
        period=period,
        date_from=date_from,
        date_to=date_to,
    ).exists():
        logger.info(
            "[AUTO REPORT] Skipping %s report (%s → %s): already exists",
            period,
            date_from,
            date_to,
        )
        return None

    analyses_data = _fetch_analyses_data(date_from, date_to)
    _top_issues, sentiment_stats = _compute_report_stats(date_from, date_to)

    try:
        ai_content = call_ai_for_report(analyses_data)
    except Exception as exc:
        logger.error("[REPORT GENERATION ERROR] %s", exc)
        raise

    repeated_issues = ai_content.get('repeated_issues', [])
    logger.info("[REPORT AI] Got %s repeated issues", len(repeated_issues))

    summary_lines = [
        f"• {item.get('issue', '')} (x{item.get('count', 0)}): {item.get('suggested_solution', '')}"
        for item in repeated_issues
    ]
    summary = "\n".join(summary_lines) if summary_lines else "No recurring issues detected."

    positives = (ai_content.get('positives') or '').strip()
    recommendations = (ai_content.get('recommendations') or '').strip()
    if not positives:
        positives = build_positives_fallback(analyses_data, sentiment_stats)
    if not recommendations:
        recommendations = build_recommendations_fallback(repeated_issues)

    report = Report.objects.create(
        created_by=created_by,
        period=period,
        status='draft',
        date_from=date_from,
        date_to=date_to,
        summary=summary,
        recommendations=recommendations,
        positives=positives,
        top_issues=repeated_issues,
        sentiment_stats=sentiment_stats,
    )

    create_log(
        created_by,
        'generate_report',
        f'{log_prefix} report #{report.id} for period {period} ({date_from} → {date_to})',
    )

    return report
