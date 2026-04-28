from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, TextField
from django.db.models.functions import Cast
from django.http import FileResponse

from .models import Call, CallAnalysis, FollowUp
from .serializers import (
    CallSerializer,
    CallCreateSerializer,
    CallListSerializer,
    CallAnalysisSerializer,
    FollowUpSerializer,
)
from .pagination import LargeDataPagination
from accounts.permissions import IsManagerOrQA, IsManager
from config.responses import success_response, error_response
from .tasks import analyze_call


class CallViewSet(viewsets.ModelViewSet):
    """
    Handles all CRUD operations for Call records.
    Also exposes custom actions: process, download, mark-reviewed,
    and sentiment filters (positive, negative, neutral).
    Accessible by Manager and QA roles only.
    """

    permission_classes = [IsAuthenticated, IsManagerOrQA]
    pagination_class = LargeDataPagination
    queryset = Call.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        """
        Return the appropriate serializer based on the current action.
        - create: minimal serializer (audio file only)
        - list: lightweight serializer without nested analysis
        - everything else: full serializer with nested analysis
        """
        if self.action == 'create':
            return CallCreateSerializer
        elif self.action == 'list':
            return CallListSerializer
        return CallSerializer

    def get_queryset(self):
        """
        Return a filtered queryset based on optional query parameters:
        - sentiment: filter by AI-detected sentiment label
        - status: filter by call processing status
        - user: filter by uploader username
        - reviewed: filter by whether the analysis has been reviewed
        - search: full-text search across transcript, main_issue, and keywords
        """
        queryset = super().get_queryset()

        # Filter by sentiment label (positive / negative / neutral)
        sentiment = self.request.query_params.get('sentiment')
        if sentiment:
            call_ids = CallAnalysis.objects.filter(
                sentiment=sentiment
            ).values_list('call_id', flat=True)
            queryset = queryset.filter(id__in=call_ids)

        # Filter by call processing status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by the username of whoever uploaded the call
        user_filter = self.request.query_params.get('user')
        if user_filter:
            queryset = queryset.filter(uploaded_by__username=user_filter)

        # Filter by review status (true/false)
        reviewed_filter = self.request.query_params.get('reviewed')
        if reviewed_filter is not None:
            reviewed_value = str(reviewed_filter).lower() in ('true', '1', 'yes')
            queryset = queryset.filter(analysis__is_reviewed=reviewed_value)

        # Full-text search across transcript, main_issue, and keywords JSON
        search = self.request.query_params.get('search')
        if search:
            # Cast the keywords JSONField to text so icontains works on it
            queryset = queryset.annotate(
                keywords_text=Cast('analysis__keywords', output_field=TextField())
            ).filter(
                Q(analysis__transcript__icontains=search) |
                Q(analysis__main_issue__icontains=search) |
                Q(keywords_text__icontains=search)
            )

        return queryset

    def perform_create(self, serializer):
        """Automatically attach the requesting user as the uploader."""
        serializer.save(uploaded_by=self.request.user)

    def partial_update(self, request, *args, **kwargs):
        """
        Handle PATCH requests that may update both Call and CallAnalysis fields.
        Fields that belong to CallAnalysis are extracted and saved separately.
        If needs_followup is set to True, a FollowUp is created automatically
        using get_or_create to avoid duplicate follow-ups.
        """
        call = self.get_object()
        payload = request.data.copy()

        # Fields that belong to CallAnalysis, not to Call itself
        analysis_fields = {
            'main_issue',
            'sentiment_score',
            'keywords',
            'priority',
            'needs_followup',
            'transcript',
            'sentiment',
        }

        # Split payload into call fields and analysis fields
        analysis_payload = {}
        for key in list(payload.keys()):
            if key in analysis_fields:
                analysis_payload[key] = payload.pop(key)

        # Extract optional notes for auto-created follow-up
        followup_notes = payload.pop('notes', None)

        # Update Call fields
        call_serializer = self.get_serializer(call, data=payload, partial=True)
        call_serializer.is_valid(raise_exception=True)
        call_serializer.save()

        # Update CallAnalysis fields if any were provided
        if analysis_payload:
            try:
                analysis = call.analysis
            except CallAnalysis.DoesNotExist:
                return error_response(
                    "Call analysis not found. Run processing first.",
                    code="analysis_not_found",
                    status_code=400
                )

            analysis_serializer = CallAnalysisSerializer(
                analysis, data=analysis_payload, partial=True
            )
            analysis_serializer.is_valid(raise_exception=True)
            analysis_serializer.save()

            # Auto-create a follow-up if needs_followup was explicitly set to True
            if analysis_serializer.validated_data.get('needs_followup') is True:
                FollowUp.objects.get_or_create(
                    call=call,
                    defaults={
                        'assigned_to': request.user,
                        'notes': followup_notes or ''
                    }
                )

        return success_response(CallSerializer(call).data)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Stream the audio file for download.
        GET /api/calls/{id}/download/
        """
        call = self.get_object()

        if not call.audio_file:
            return error_response("Audio file not found", code="audio_not_found", status_code=404)

        try:
            file = call.audio_file.open('rb')
            response = FileResponse(file, content_type='audio/mpeg')
            response['Content-Disposition'] = f'attachment; filename="{call.audio_file.name}"'
            return response
        except Exception as e:
            return error_response(str(e), code="download_error", status_code=500)

    @action(detail=False, methods=['get'])
    def positive(self, request):
        """
        Return all calls with a positive sentiment analysis.
        GET /api/calls/positive/
        """
        calls = self.get_queryset().filter(analysis__sentiment='positive').distinct()
        return success_response(CallListSerializer(calls, many=True).data)

    @action(detail=False, methods=['get'])
    def negative(self, request):
        """
        Return all calls with a negative sentiment analysis.
        GET /api/calls/negative/
        """
        calls = self.get_queryset().filter(analysis__sentiment='negative').distinct()
        return success_response(CallListSerializer(calls, many=True).data)

    @action(detail=False, methods=['get'])
    def neutral(self, request):
        """
        Return all calls with a neutral sentiment analysis.
        GET /api/calls/neutral/
        """
        calls = self.get_queryset().filter(analysis__sentiment='neutral').distinct()
        return success_response(CallListSerializer(calls, many=True).data)

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """
        Queue the call for AI analysis via a Celery background task.
        Returns a task_id immediately — the client can track progress via WebSocket.
        POST /api/calls/{id}/process/

        Rejects the request if the call is already processing or completed.
        """
        call = self.get_object()

        # Prevent duplicate processing
        if call.status in ('processing', 'completed'):
            return error_response(
                f"Call is already {call.status}. Cannot process again.",
                code="already_processed",
                status_code=400
            )

        async_result = analyze_call.delay(str(call.id))
        return success_response(
            {"task_id": async_result.id, "call_id": call.id, "status": "queued"},
            status_code=status.HTTP_202_ACCEPTED
        )

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated, IsManagerOrQA],
        url_path='mark-reviewed'
    )
    def mark_reviewed(self, request, pk=None):
        """
        Mark a call's analysis as manually reviewed by a QA or Manager.
        POST /api/calls/{id}/mark-reviewed/
        """
        call = self.get_object()

        try:
            analysis = call.analysis
        except CallAnalysis.DoesNotExist:
            return error_response(
                "Call analysis not found. Run processing first.",
                code="analysis_not_found",
                status_code=400
            )

        analysis.is_reviewed = True
        analysis.save(update_fields=['is_reviewed', 'updated_at'])

        return success_response({
            "call_id": call.id,
            "is_reviewed": True,
        })


class FollowUpViewSet(viewsets.ModelViewSet):
    """
    Handles listing, creating, and updating follow-up tasks.
    Follow-ups are assigned to any user and track whether
    a call issue has been resolved.
    Accessible by Manager and QA roles only.
    Supports GET, POST, and PATCH only — DELETE is disabled.
    """

    queryset = FollowUp.objects.select_related('call', 'assigned_to').order_by('-created_at')
    serializer_class = FollowUpSerializer
    permission_classes = [IsAuthenticated, IsManagerOrQA]
    pagination_class = LargeDataPagination
    http_method_names = ['get', 'post', 'patch']

    def create(self, request, *args, **kwargs):
        """
        Manually create a follow-up for a specific call.
        POST /api/calls/followups/
        Required fields: call_id, assigned_to (user ID).
        Optional field: notes.
        """
        call_id = request.data.get('call_id')
        assigned_to = request.data.get('assigned_to')
        notes = request.data.get('notes', '')

        if not call_id:
            return error_response("call_id is required", code="validation_error", status_code=400)
        if not assigned_to:
            return error_response("assigned_to is required", code="validation_error", status_code=400)

        # Validate that the referenced call exists
        try:
            call = Call.objects.get(id=call_id)
        except Call.DoesNotExist:
            return error_response("Call not found", code="call_not_found", status_code=404)

        # Validate that the assigned user exists
        from django.contrib.auth.models import User
        try:
            assigned_user = User.objects.get(id=assigned_to)
        except User.DoesNotExist:
            return error_response("Assigned user not found", code="user_not_found", status_code=404)

        followup = FollowUp.objects.create(
            call=call,
            assigned_to=assigned_user,
            notes=notes,
            status='pending'
        )

        return success_response(FollowUpSerializer(followup).data, status_code=201)

    def list(self, request, *args, **kwargs):
        """
        Return a paginated list of all follow-up tasks.
        GET /api/calls/followups/
        """
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """
        Update the status or notes of an existing follow-up.
        PATCH /api/calls/followups/{id}/
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(serializer.data)