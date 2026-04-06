from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, TextField
from django.db.models.functions import Cast
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from .models import Call, CallAnalysis, FollowUp
from .serializers import (
    CallSerializer,
    CallCreateSerializer,
    CallListSerializer,
    CallAnalysisSerializer,
    FollowUpSerializer,
)
from accounts.permissions import IsManagerOrQA, IsManager
from config.responses import success_response, error_response
from .tasks import analyze_call


class CallViewSet(viewsets.ModelViewSet):
    """
    ViewSet لإدارة المكالمات الصوتية
    """
    permission_classes = [IsAuthenticated, IsManagerOrQA]
    queryset = Call.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return CallCreateSerializer
        elif self.action == 'list':
            return CallListSerializer
        return CallSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # فلترة حسب sentiment
        sentiment = self.request.query_params.get('sentiment', None)
        if sentiment:
            # الحصول على الـ calls التي لديها analysis مع sentiment محدد
            call_ids = CallAnalysis.objects.filter(
                sentiment=sentiment
            ).values_list('call_id', flat=True)
            queryset = queryset.filter(id__in=call_ids)
        
        # فلترة حسب status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # فلترة حسب المستخدم (اختياري)
        user_filter = self.request.query_params.get('user', None)
        if user_filter:
            queryset = queryset.filter(uploaded_by__username=user_filter)

        # فلترة حسب review status (analysis.is_reviewed)
        reviewed_filter = self.request.query_params.get('reviewed', None)
        if reviewed_filter is not None:
            reviewed_value = str(reviewed_filter).lower() in ('true', '1', 'yes')
            queryset = queryset.filter(analysis__is_reviewed=reviewed_value)

        # بحث ضمن transcript/main_issue/keywords
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.annotate(
                keywords_text=Cast('analysis__keywords', output_field=TextField())
            ).filter(
                Q(analysis__transcript__icontains=search) |
                Q(analysis__main_issue__icontains=search) |
                Q(keywords_text__icontains=search)
            )
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    def partial_update(self, request, *args, **kwargs):
        call = self.get_object()
        payload = request.data.copy()

        # Extract analysis-related fields from call PATCH payload
        analysis_fields = {
            'main_issue',
            'sentiment_score',
            'keywords',
            'priority',
            'needs_followup',
            'transcript',
            'sentiment',
        }
        analysis_payload = {}
        for key in list(payload.keys()):
            if key in analysis_fields:
                analysis_payload[key] = payload.pop(key)

        followup_notes = payload.pop('notes', None)

        # Update call fields if present
        call_serializer = self.get_serializer(call, data=payload, partial=True)
        call_serializer.is_valid(raise_exception=True)
        call_serializer.save()

        # Update existing analysis if analysis fields were sent
        if analysis_payload:
            try:
                analysis = call.analysis
            except CallAnalysis.DoesNotExist:
                return error_response(
                    "Call analysis not found. Run processing first.",
                    code="analysis_not_found",
                    status_code=400
                )
            analysis_serializer = CallAnalysisSerializer(analysis, data=analysis_payload, partial=True)
            analysis_serializer.is_valid(raise_exception=True)
            analysis_serializer.save()

            # If needs_followup marked true with notes, create follow-up item for assignee/current user
            if analysis_serializer.validated_data.get('needs_followup') is True:
                FollowUp.objects.create(
                    call=call,
                    assigned_to=request.user,
                    notes=followup_notes or ""
                )

        return success_response(CallSerializer(call).data)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        تحميل ملف صوتي
        """
        call = self.get_object()
        
        if not call.audio_file:
            return error_response("Audio file not found", code="audio_not_found", status_code=404)
        
        try:
            file = call.audio_file.open('rb')
            response = FileResponse(
                file,
                content_type='audio/mpeg'  # أو audio/wav حسب نوع الملف
            )
            response['Content-Disposition'] = f'attachment; filename="{call.audio_file.name}"'
            return response
        except Exception as e:
            return error_response(str(e), code="download_error", status_code=500)

    @action(detail=False, methods=['get'])
    def positive(self, request):
        """
        عرض الملفات الصوتية الإيجابية
        """
        calls = self.get_queryset().filter(
            analysis__sentiment='positive'
        ).distinct()
        
        serializer = CallListSerializer(calls, many=True)
        return success_response(serializer.data)

    @action(detail=False, methods=['get'])
    def negative(self, request):
        """
        عرض الملفات الصوتية السلبية
        """
        calls = self.get_queryset().filter(
            analysis__sentiment='negative'
        ).distinct()
        
        serializer = CallListSerializer(calls, many=True)
        return success_response(serializer.data)

    @action(detail=False, methods=['get'])
    def neutral(self, request):
        """
        عرض الملفات الصوتية المحايدة
        """
        calls = self.get_queryset().filter(
            analysis__sentiment='neutral'
        ).distinct()
        
        serializer = CallListSerializer(calls, many=True)
        return success_response(serializer.data)

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """
        تشغيل تحليل الخلفية عبر Celery
        """
        call = self.get_object()
        async_result = analyze_call.delay(call.id)
        return success_response(
            {"task_id": async_result.id, "call_id": call.id, "status": "queued"},
            status_code=status.HTTP_202_ACCEPTED
        )

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated, IsManager],
        url_path='mark-reviewed'
    )
    def mark_reviewed(self, request, pk=None):
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
            "is_reviewed": True
        })


class FollowUpViewSet(viewsets.ModelViewSet):
    queryset = FollowUp.objects.select_related('call', 'assigned_to').order_by('-created_at')
    serializer_class = FollowUpSerializer
    permission_classes = [IsAuthenticated, IsManagerOrQA]
    http_method_names = ['get', 'post', 'patch']

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsManager()]
        return [permission() for permission in self.permission_classes]

    def create(self, request, *args, **kwargs):
        call_id = request.data.get('call_id')
        assigned_to = request.data.get('assigned_to')
        notes = request.data.get('notes', '')

        if not call_id:
            return error_response("call_id is required", code="validation_error", status_code=400)
        if not assigned_to:
            return error_response("assigned_to is required", code="validation_error", status_code=400)

        try:
            call = Call.objects.get(id=call_id)
        except Call.DoesNotExist:
            return error_response("Call not found", code="call_not_found", status_code=404)

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
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return success_response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(serializer.data)
