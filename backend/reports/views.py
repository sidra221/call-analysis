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
from logs.utils import create_log

logger = logging.getLogger(__name__)

def _call_ai_for_report(analyses_data: list) -> dict:
    url = settings.AI_SERVICE_URL.replace('/analyze-call', '') + '/generate-report'
    timeout = settings.AI_SERVICE_TIMEOUT

    headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}
    if settings.AI_SERVICE_API_KEY:
        headers['Authorization'] = f'Bearer {settings.AI_SERVICE_API_KEY}'

    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.post(url, headers=headers, json={"analyses": analyses_data})
    except httpx.RequestError as e:
        logger.error(f"[REPORT AI NETWORK ERROR] {str(e)}")
        raise RuntimeError("AI service network error")

    if response.status_code != 200:
        logger.error(f"[REPORT AI ERROR] {response.text}")
        raise RuntimeError(f"AI service error: {response.status_code}")

    try:
        return response.json()
    except Exception as e:
        logger.error(f"[REPORT AI PARSE ERROR] {str(e)}")
        raise ValueError("Could not parse AI response for report")

class ReportViewSet(viewsets.ModelViewSet):
    """
    Handles report generation, listing, editing, and publishing.
    Permissions:
    - QA: generate, edit (draft only), publish
    - Manager + QA: view all reports
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
        """Compute stats before saving a manually created report."""
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
        """Allow QA to edit draft reports only."""
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

    def destroy(self, request, *args, **kwargs):
        """Delete a report and log the action."""
        report = self.get_object()
        report_id = report.id
        create_log(request.user, 'delete_report', f'Deleted report #{report_id}')
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        """
        Generate AI report from calls in a date range.
        Sends analyses to /generate-report on AI Service.
        POST /api/reports/reports/generate/
        Body: { "period": "daily", "date_from": "YYYY-MM-DD", "date_to": "YYYY-MM-DD" }
        """
        input_serializer = ReportGenerateSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        period = input_serializer.validated_data['period']
        date_from = input_serializer.validated_data['date_from']
        date_to = input_serializer.validated_data['date_to']

        # Fetch analyses with all fields needed by AI
        analyses_data = list(
            CallAnalysis.objects.filter(
                call__created_at__date__gte=date_from,
                call__created_at__date__lte=date_to,
            ).values('main_issue', 'sentiment', 'keywords', 'needs_followup', 'priority', 'transcript')
        )

        # Compute statistics
        top_issues = list(
            CallAnalysis.objects.filter(
                call__created_at__date__gte=date_from,
                call__created_at__date__lte=date_to,
            ).values('main_issue').annotate(count=Count('id')).order_by('-count')[:5]
        )

        sentiment_stats = {
            item['sentiment']: item['count']
            for item in CallAnalysis.objects.filter(
                call__created_at__date__gte=date_from,
                call__created_at__date__lte=date_to,
            ).values('sentiment').annotate(count=Count('id'))
        }

        # Call AI Service
        try:
            ai_content = _call_ai_for_report(analyses_data)
            repeated_issues = ai_content.get('repeated_issues', [])
            logger.info(f"[REPORT AI] Got {len(repeated_issues)} repeated issues")
        except Exception as e:
            logger.error(f"[REPORT GENERATION ERROR] {str(e)}")
            return error_response(
                "AI service failed to generate report. You can create it manually.",
                code="ai_generation_failed",
                status_code=503
            )

        # Build summary from AI issues
        summary_lines = [
            f"• {i.get('issue', '')} (x{i.get('count', 0)}): {i.get('suggested_solution', '')}"
            for i in repeated_issues
        ]
        summary = "\n".join(summary_lines) if summary_lines else "No recurring issues detected."

        # Save as draft
        report = Report.objects.create(
            created_by=request.user,
            period=period,
            status='draft',
            date_from=date_from,
            date_to=date_to,
            summary=summary,
            recommendations="",
            positives="",
            top_issues=repeated_issues,
            sentiment_stats=sentiment_stats,
        )

        create_log(request.user, 'generate_report', f'Generated report #{report.id} for period {period}')

        return success_response(ReportSerializer(report).data, status_code=201)

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        """Publish a draft report so Manager can see it."""
        report = self.get_object()

        if report.status == 'published':
            return error_response(
                "Report is already published.",
                code="already_published",
                status_code=400
            )

        report.status = 'published'
        report.save(update_fields=['status', 'updated_at'])

        create_log(
            request.user,
            'publish_report',
            f'Published report #{report.id}'
        )

        return success_response(ReportSerializer(report).data)