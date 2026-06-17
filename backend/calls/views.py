import logging
import httpx
from datetime import date

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, TextField, Count
from django.db.models.functions import Cast
from django.http import FileResponse

from .pagination import LargeDataPagination

from .models import Call, CallAnalysis, FollowUp
from .serializers import (
    CallSerializer,
    CallCreateSerializer,
    CallListSerializer,
    CallAnalysisSerializer,
    FollowUpSerializer,
)

from accounts.permissions import IsManagerOrQA
from config.responses import success_response, error_response
from .tasks import analyze_call
from logs.utils import create_log


logger = logging.getLogger(__name__)


def _user_role(user):
    try:
        return user.profile.role.lower()
    except Exception:
        return None


class CallViewSet(viewsets.ModelViewSet):

    permission_classes = [IsAuthenticated, IsManagerOrQA]

    queryset = Call.objects.all().order_by('-created_at')

    pagination_class = LargeDataPagination

    # ─────────────────────────────────────
    # Serializer selection
    # ─────────────────────────────────────
    def get_serializer_class(self):

        if self.action == 'create':
            return CallCreateSerializer

        elif self.action == 'list':
            return CallListSerializer

        return CallSerializer

    # ─────────────────────────────────────
    # Query filters
    # ─────────────────────────────────────
    def get_queryset(self):

        queryset = super().get_queryset()

        sentiment = self.request.query_params.get('sentiment')

        if sentiment:

            call_ids = CallAnalysis.objects.filter(
                sentiment=sentiment
            ).values_list('call_id', flat=True)

            queryset = queryset.filter(id__in=call_ids)

        status_filter = self.request.query_params.get('status')

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        user_filter = self.request.query_params.get('user')

        if user_filter:
            queryset = queryset.filter(
                uploaded_by__username=user_filter
            )

        reviewed_filter = self.request.query_params.get('reviewed')

        if reviewed_filter is not None:

            reviewed_value = str(reviewed_filter).lower() in (
                'true',
                '1',
                'yes'
            )

            queryset = queryset.filter(
                analysis__is_reviewed=reviewed_value
            )

        search = self.request.query_params.get('search')

        if search:

            queryset = queryset.annotate(
                keywords_text=Cast(
                    'analysis__keywords',
                    output_field=TextField()
                )
            ).filter(
                Q(analysis__transcript__icontains=search) |
                Q(analysis__main_issue__icontains=search) |
                Q(keywords_text__icontains=search)
            )

        return queryset

    # ─────────────────────────────────────
    # Create call + trigger AI analysis
    # ─────────────────────────────────────
    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        call = serializer.save(
            uploaded_by=request.user
        )

        # Trigger AI processing asynchronously
        analyze_call.delay(call.id)

        response_serializer = CallSerializer(call)

        create_log(
            request.user,
            'upload_call',
            f'Uploaded call #{call.id}'
        )

        return success_response(
            response_serializer.data,
            status_code=status.HTTP_201_CREATED
        )

    # ─────────────────────────────────────
    # Save uploader
    # ─────────────────────────────────────
    def perform_create(self, serializer):

        serializer.save(
            uploaded_by=self.request.user
        )

    # ─────────────────────────────────────
    # Destroy call
    # ─────────────────────────────────────
    def destroy(self, request, *args, **kwargs):
        call = self.get_object()
        call_id = call.id
        create_log(request.user, 'delete_call', f'Deleted call #{call_id}')
        return super().destroy(request, *args, **kwargs)

    # ─────────────────────────────────────
    # Update call + analysis
    # ─────────────────────────────────────
    def partial_update(self, request, *args, **kwargs):

        call = self.get_object()

        payload = request.data.copy()

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

        call_serializer = self.get_serializer(
            call,
            data=payload,
            partial=True
        )

        call_serializer.is_valid(
            raise_exception=True
        )

        call_serializer.save()

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
                analysis,
                data=analysis_payload,
                partial=True
            )

            analysis_serializer.is_valid(
                raise_exception=True
            )

            analysis_serializer.save()

            if analysis_serializer.validated_data.get(
                'needs_followup'
            ) is True:

                default_notes = (
                    followup_notes
                    or getattr(analysis, 'followup_reason', '')
                    or ""
                )
                followup = FollowUp.objects.create(
                    call=call,
                    assigned_to=request.user,
                    created_by=request.user,
                    creator_notes=default_notes,
                )
                
                create_log(
                    request.user,
                    'create_followup',
                    f'Created followup for call #{call.id}'
                )

        return success_response(
            CallSerializer(call).data
        )

    # ─────────────────────────────────────
    # Download audio
    # ─────────────────────────────────────
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):

        call = self.get_object()

        if not call.audio_file:

            return error_response(
                "Audio file not found",
                code="audio_not_found",
                status_code=404
            )

        try:

            file = call.audio_file.open('rb')

            response = FileResponse(
                file,
                content_type='audio/mpeg'
            )

            response[
                'Content-Disposition'
            ] = f'attachment; filename="{call.audio_file.name}"'

            return response

        except Exception as e:

            return error_response(
                str(e),
                code="download_error",
                status_code=500
            )

    # ─────────────────────────────────────
    # Process AI manually
    # ─────────────────────────────────────
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):

        call = self.get_object()

        async_result = analyze_call.delay(call.id, force=True)
        
        create_log(
            request.user,
            'call_processing',
            f'Started processing call #{call.id}'
        )

        return success_response(
            {
                "task_id": async_result.id,
                "call_id": call.id,
                "status": "queued"
            },
            status_code=status.HTTP_202_ACCEPTED
        )

    # ─────────────────────────────────────
    # Mark reviewed
    # ─────────────────────────────────────
    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated, IsManagerOrQA],
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

        analysis.save(
            update_fields=['is_reviewed', 'updated_at']
        )

        create_log(
            request.user,
            'review_call',
            f'Reviewed call #{call.id}'
        )

        return success_response(
            {
                "call_id": call.id,
                "is_reviewed": True
            }
        )

    # ─────────────────────────────────────
    # Sentiment filters
    # ─────────────────────────────────────
    @action(detail=False, methods=['get'])
    def positive(self, request):

        calls = self.get_queryset().filter(
            analysis__sentiment='positive'
        ).distinct()

        return success_response(
            CallListSerializer(calls, many=True).data
        )

    @action(detail=False, methods=['get'])
    def negative(self, request):

        calls = self.get_queryset().filter(
            analysis__sentiment='negative'
        ).distinct()

        return success_response(
            CallListSerializer(calls, many=True).data
        )

    @action(detail=False, methods=['get'])
    def neutral(self, request):

        calls = self.get_queryset().filter(
            analysis__sentiment='neutral'
        ).distinct()

        return success_response(
            CallListSerializer(calls, many=True).data
        )


class FollowUpViewSet(viewsets.ModelViewSet):

    queryset = FollowUp.objects.select_related(
        'call',
        'assigned_to',
        'assigned_to__profile',
        'created_by',
        'created_by__profile',
    ).order_by('-created_at')

    serializer_class = FollowUpSerializer

    permission_classes = [
        IsAuthenticated,
        IsManagerOrQA
    ]

    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_queryset(self):
        qs = super().get_queryset()
        role = _user_role(self.request.user)
        if role == 'manager':
            return qs
        if role == 'qa':
            return qs.filter(
                Q(assigned_to_id=self.request.user.pk)
                | Q(created_by_id=self.request.user.pk)
            ).distinct()
        return qs.none()

    # ─────────────────────────────────────
    # Create follow-up
    # ─────────────────────────────────────
    def create(self, request, *args, **kwargs):

        role = _user_role(request.user)
        if role not in ('manager', 'qa'):
            return error_response(
                "Only managers and QA can create follow-ups",
                code="permission_denied",
                status_code=403,
            )

        call_id = request.data.get('call_id')

        assigned_to = request.data.get('assigned_to')

        creator_notes = (
            request.data.get('creator_notes')
            or request.data.get('notes', '')
        )

        if not call_id:

            return error_response(
                "call_id is required",
                code="validation_error",
                status_code=400
            )

        if not assigned_to:

            return error_response(
                "assigned_to is required",
                code="validation_error",
                status_code=400
            )

        try:
            call = Call.objects.get(id=call_id)

        except Call.DoesNotExist:

            return error_response(
                "Call not found",
                code="call_not_found",
                status_code=404
            )

        from django.contrib.auth.models import User

        try:
            assigned_user = User.objects.select_related('profile').get(
                id=assigned_to
            )

        except User.DoesNotExist:

            return error_response(
                "Assigned user not found",
                code="user_not_found",
                status_code=404
            )

        if not hasattr(assigned_user, 'profile') or assigned_user.profile.role != 'qa':
            return error_response(
                "Follow-ups can only be assigned to QA users",
                code="invalid_assignee",
                status_code=400
            )

        followup = FollowUp.objects.create(
            call=call,
            assigned_to=assigned_user,
            created_by=request.user,
            creator_notes=creator_notes,
            status='pending'
        )

        create_log(
            request.user,
            'create_followup',
            f'Created followup for call #{call.id}'
        )

        return success_response(
            FollowUpSerializer(followup).data,
            status_code=201
        )

    # ─────────────────────────────────────
    # List follow-ups
    # ─────────────────────────────────────
    def list(self, request, *args, **kwargs):

        serializer = self.get_serializer(
            self.get_queryset(),
            many=True
        )

        return success_response(serializer.data)

    # ─────────────────────────────────────
    # Update follow-up
    # ─────────────────────────────────────
    def partial_update(self, request, *args, **kwargs):

        instance = self.get_object()
        role = _user_role(request.user)

        if role == 'manager':
            return error_response(
                "Managers can only view follow-ups",
                code="permission_denied",
                status_code=403,
            )

        is_assignee = instance.assigned_to_id == request.user.id
        is_creator = instance.created_by_id == request.user.id

        if not is_assignee and not is_creator:
            return error_response(
                "You can only update follow-ups you created or are assigned to",
                code="permission_denied",
                status_code=403,
            )

        patch_data = {}

        if is_creator and 'creator_notes' in request.data:
            patch_data['creator_notes'] = request.data.get('creator_notes', '')

        if is_assignee:
            if 'assignee_notes' in request.data or 'notes' in request.data:
                patch_data['assignee_notes'] = request.data.get(
                    'assignee_notes',
                    request.data.get('notes', instance.assignee_notes),
                )
            if 'status' in request.data:
                patch_data['status'] = request.data['status']

        if not patch_data:
            return error_response(
                "No valid fields to update",
                code="validation_error",
                status_code=400,
            )

        new_status = patch_data.get('status', instance.status)
        new_assignee_notes = patch_data.get(
            'assignee_notes',
            instance.assignee_notes,
        )
        if new_status == 'done' and not (new_assignee_notes or '').strip():
            return error_response(
                "Follow-up notes are required before marking as done",
                code="validation_error",
                status_code=400,
            )

        if new_status == 'done' and not is_assignee:
            return error_response(
                "Only the assigned QA can mark a follow-up as done",
                code="permission_denied",
                status_code=403,
            )

        serializer = self.get_serializer(
            instance,
            data=patch_data,
            partial=True
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()
        
        create_log(
            request.user,
            'update_followup',
            f'Updated followup for call #{instance.call.id}'
        )

        return success_response(serializer.data)

    # ─────────────────────────────────────
    # Destroy follow-up
    # ─────────────────────────────────────
    def destroy(self, request, *args, **kwargs):
        role = _user_role(request.user)
        followup = self.get_object()

        if role == 'manager':
            call_id = followup.call.id
            create_log(request.user, 'delete_followup', f'Deleted followup for call #{call_id}')
            return super().destroy(request, *args, **kwargs)

        if role == 'qa' and followup.created_by_id == request.user.pk:
            call_id = followup.call.id
            create_log(request.user, 'delete_followup', f'Deleted followup for call #{call_id}')
            return super().destroy(request, *args, **kwargs)

        return error_response(
            "Only the creator can delete this follow-up",
            code="permission_denied",
            status_code=403,
        )