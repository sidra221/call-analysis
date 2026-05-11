import json
import logging
import httpx
from datetime import date

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from django.conf import settings

from calls.models import CallAnalysis
from accounts.permissions import IsQA, IsManagerOrQA
from .models import Report
from .serializers import ReportSerializer, ReportGenerateSerializer
from calls.pagination import LargeDataPagination
from config.responses import success_response, error_response

logger = logging.getLogger(__name__)


def _build_ai_prompt(calls_data: list, date_from: date, date_to: date) -> str:
    """
    Build the prompt sent to the AI service for report generation.
    Summarizes call data into a structured text block and asks the AI
    to return a JSON object with summary, positives, and recommendations.
    """
    lines = []
    for c in calls_data:
        lines.append(
            f"- Issue: {c['main_issue']} | Sentiment: {c['sentiment']} | "
            f"Keywords: {', '.join(c['keywords'] or [])} | "
            f"Needs followup: {'Yes' if c['needs_followup'] else 'No'}"
        )
    calls_text = "\n".join(lines) if lines else "No calls found in this period."

    return f"""You are a quality analyst specialized in call centers.

Below is a summary of calls from {date_from} to {date_to}:

{calls_text}

Please provide:
1. A summary of the most recurring problems with suggested solutions for each.
2. A summary of the most mentioned positives that deserve recognition.
3. General recommendations to improve service quality.

Respond with JSON only in this exact format, no extra text:
{{
  "summary": "problems and suggested solutions here",
  "positives": "positives summary here",
  "recommendations": "recommendations here"
}}"""


def _call_ai_for_report(prompt: str) -> dict:
    """
    Send the generated prompt to the AI service and parse the JSON response.

    Raises:
        RuntimeError: if the network request fails or the AI returns a non-200 status.
        ValueError: if the response cannot be parsed as valid JSON.
    """
    # Use a /chat endpoint on the same AI service base URL
    url = settings.AI_SERVICE_URL.replace('/analyze', '/chat')
    timeout = settings.AI_SERVICE_TIMEOUT

    headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}
    if settings.AI_SERVICE_API_KEY:
        headers['Authorization'] = f'Bearer {settings.AI_SERVICE_API_KEY}'

    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.post(url, headers=headers, json={"prompt": prompt})
    except httpx.RequestError as e:
        logger.error(f"[REPORT AI NETWORK ERROR] {str(e)}")
        raise RuntimeError("AI service network error")

    if response.status_code != 200:
        logger.error(f"[REPORT AI ERROR] {response.text}")
        raise RuntimeError(f"AI service error: {response.status_code}")

    try:
        data = response.json()
        # The AI may return text inside a 'text' or 'content' field
        text = data.get('text') or data.get('content') or ''
        # Strip markdown code fences if present
        text = text.strip().strip('```json').strip('```').strip()
        return json.loads(text)
    except Exception as e:
        logger.error(f"[REPORT AI PARSE ERROR] {str(e)}")
        raise ValueError("Could not parse AI response for report")


class ReportViewSet(viewsets.ModelViewSet):
    """
    Handles report generation, listing, editing, and publishing.

    Permissions:
    - QA: can generate, edit (draft only), and publish reports
    - Manager + QA: can view all reports

    Custom actions:
    - generate: create a new AI-drafted report for a date range
    - publish: promote a draft report to published status
    """

    queryset = Report.objects.all().order_by('-created_at')
    serializer_class = ReportSerializer
    pagination_class = LargeDataPagination

    def get_permissions(self):
        """Return appropriate permissions based on the current action."""
        if self.action in ('create', 'partial_update', 'generate', 'publish'):
            return [IsAuthenticated(), IsQA()]
        return [IsAuthenticated(), IsManagerOrQA()]

    def perform_create(self, serializer):
        """
        Compute top issues and sentiment stats before saving a manually created report.
        Used when creating a report directly via POST rather than the generate endpoint.
        """
        date_from = serializer.validated_data.get('date_from')
        date_to = serializer.validated_data.get('date_to')

        analyses = CallAnalysis.objects.filter(
            call__created_at__date__gte=date_from,
            call__created_at__date__lte=date_to,
        )

        top_issues = list(
            analyses.values('main_issue')
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
        )

        sentiment_stats = {
            item['sentiment']: item['count']
            for item in analyses.values('sentiment').annotate(count=Count('id'))
        }

        serializer.save(
            created_by=self.request.user,
            top_issues=top_issues,
            sentiment_stats=sentiment_stats
        )

    def partial_update(self, request, *args, **kwargs):
        """
        Allow QA to edit summary, recommendations, or positives on a draft report.
        Rejects edits on already-published reports.
        PATCH /api/reports/reports/{id}/
        """
        instance = self.get_object()

        if instance.status == 'published':
            return error_response(
                "Cannot edit a published report.",
                code="report_published",
                status_code=400
            )

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(serializer.data)

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        """
        Generate a new AI-drafted report for a given date range.
        The AI analyzes calls in the period and produces summary, positives,
        and recommendations. The report is saved as a draft for QA review.
        POST /api/reports/reports/generate/
        Body: { "period": "daily", "date_from": "2026-04-01", "date_to": "2026-04-28" }
        """
        input_serializer = ReportGenerateSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        period = input_serializer.validated_data['period']
        date_from = input_serializer.validated_data['date_from']
        date_to = input_serializer.validated_data['date_to']

        # Fetch call analysis data for the specified period
        analyses = CallAnalysis.objects.filter(
            call__created_at__date__gte=date_from,
            call__created_at__date__lte=date_to,
        ).values('main_issue', 'sentiment', 'keywords', 'needs_followup')

        # Compute statistics for the period
        top_issues = list(
            CallAnalysis.objects.filter(
                call__created_at__date__gte=date_from,
                call__created_at__date__lte=date_to,
            ).values('main_issue')
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
        )

        sentiment_stats = {
            item['sentiment']: item['count']
            for item in CallAnalysis.objects.filter(
                call__created_at__date__gte=date_from,
                call__created_at__date__lte=date_to,
            ).values('sentiment').annotate(count=Count('id'))
        }

        # Ask the AI to generate the report content
        try:
            prompt = _build_ai_prompt(list(analyses), date_from, date_to)
            ai_content = _call_ai_for_report(prompt)
        except Exception as e:
            logger.error(f"[REPORT GENERATION ERROR] {str(e)}")
            return error_response(
                "AI service failed to generate report. You can create it manually.",
                code="ai_generation_failed",
                status_code=503
            )

        # Save the report as a draft
        report = Report.objects.create(
            created_by=request.user,
            period=period,
            status='draft',
            date_from=date_from,
            date_to=date_to,
            summary=ai_content.get('summary', ''),
            recommendations=ai_content.get('recommendations', ''),
            positives=ai_content.get('positives', ''),
            top_issues=top_issues,
            sentiment_stats=sentiment_stats,
        )

        return success_response(ReportSerializer(report).data, status_code=201)

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        """
        Publish a draft report so it becomes visible to the Manager.
        Can only be called on reports that are currently in draft status.
        POST /api/reports/reports/{id}/publish/
        """
        report = self.get_object()

        if report.status == 'published':
            return error_response(
                "Report is already published.",
                code="already_published",
                status_code=400
            )

        report.status = 'published'
        report.save(update_fields=['status', 'updated_at'])

        return success_response(ReportSerializer(report).data)