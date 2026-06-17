import logging
from io import BytesIO

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from django.conf import settings
from django.http import FileResponse
from django.utils import timezone

from calls.models import CallAnalysis
from accounts.permissions import IsQA, IsManager, IsManagerOrQA
from accounts.models import UserProfile
from .models import Report
from .serializers import ReportSerializer, ReportGenerateSerializer, ReportAddNotesSerializer
from .pdf_utils import generate_report_pdf
from .tasks import generate_report_task
from calls.pagination import LargeDataPagination
from config.responses import success_response, error_response
from logs.utils import create_log

logger = logging.getLogger(__name__)


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
        if self.action in ('create', 'partial_update', 'generate', 'publish', 'destroy'):
            return [IsAuthenticated(), IsQA()]
        if self.action in ('download', 'approve', 'add_notes'):
            return [IsAuthenticated(), IsManager()]
        return [IsAuthenticated(), IsManagerOrQA()]

    def get_queryset(self):
        """Managers see published QA reports; QA sees only their own reports."""
        queryset = super().get_queryset()
        try:
            profile = UserProfile.objects.get(user=self.request.user)
            role = profile.role.lower()
            if role == 'manager':
                queryset = queryset.filter(
                    status__in=['published', 'reviewed'],
                    created_by__profile__role='qa',
                )
            elif role == 'qa':
                queryset = queryset.filter(created_by=self.request.user)
        except UserProfile.DoesNotExist:
            pass
        return queryset

    def list(self, request, *args, **kwargs):
        """Return all reports without DRF pagination wrapper."""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return success_response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Return a single report in the standard response format."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(serializer.data)

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
        """Delete a draft report owned by the QA user."""
        report = self.get_object()

        if report.created_by_id != request.user.id:
            return error_response(
                "You can only delete your own reports.",
                code="not_owner",
                status_code=403,
            )

        if report.status != 'draft':
            return error_response(
                "Only draft reports can be deleted.",
                code="not_draft",
                status_code=400,
            )

        report_id = report.id
        report.delete()
        create_log(request.user, 'delete_report', f'Deleted report #{report_id}')
        return success_response({"message": f"Report #{report_id} deleted"})

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

        try:
            report_id = generate_report_task.delay(
                request.user.id,
                period,
                str(date_from),
                str(date_to),
            ).get(timeout=settings.AI_SERVICE_TIMEOUT)
        except Exception as e:
            logger.error(f"[REPORT GENERATION ERROR] {str(e)}")
            return error_response(
                "AI service failed to generate report. You can create it manually.",
                code="ai_generation_failed",
                status_code=503
            )

        report = Report.objects.get(id=report_id)
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

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """Mark a published report as reviewed by the Manager."""
        report = self.get_object()

        if report.status == 'draft':
            return error_response(
                "Cannot review a draft report.",
                code="report_draft",
                status_code=400,
            )

        if report.status == 'reviewed':
            return error_response(
                "Report is already reviewed.",
                code="already_reviewed",
                status_code=400,
            )

        report.status = 'reviewed'
        report.reviewed_by = request.user
        report.reviewed_at = timezone.now()
        report.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'updated_at'])

        create_log(
            request.user,
            'review_report',
            f'Reviewed report #{report.id}',
        )

        return success_response(ReportSerializer(report).data)

    @action(detail=True, methods=['post'], url_path='add-notes')
    def add_notes(self, request, pk=None):
        """Add manager feedback notes and notify the QA report creator."""
        report = self.get_object()

        if report.status == 'draft':
            return error_response(
                "Cannot add notes to a draft report.",
                code="report_draft",
                status_code=400,
            )

        input_serializer = ReportAddNotesSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        report.manager_notes = input_serializer.validated_data['notes']
        report.reviewed_by = request.user
        report.reviewed_at = timezone.now()
        report.save(update_fields=['manager_notes', 'reviewed_by', 'reviewed_at', 'updated_at'])

        create_log(
            request.user,
            'add_report_notes',
            f'Added notes to report #{report.id}',
        )

        return success_response(ReportSerializer(report).data)

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        """Download report as a PDF file (Manager only)."""
        report = self.get_object()
        report_data = ReportSerializer(report).data

        try:
            pdf_bytes = generate_report_pdf(report_data)
        except Exception as exc:
            logger.exception('[REPORT PDF] generation failed')
            return error_response(
                f'Could not generate PDF: {exc}',
                code='pdf_generation_failed',
                status_code=500,
            )

        filename = f'report_{report.id}_{report.period}.pdf'
        buffer = BytesIO(pdf_bytes)
        response = FileResponse(
            buffer,
            content_type='application/pdf',
            as_attachment=True,
            filename=filename,
        )
        response['Content-Length'] = len(pdf_bytes)
        return response