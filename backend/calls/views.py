from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from .models import Call, CallAnalysis
from .serializers import (
    CallSerializer,
    CallCreateSerializer,
    CallListSerializer,
    CallAnalysisSerializer
)
from accounts.permissions import IsManagerOrQA


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
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        تحميل ملف صوتي
        """
        call = self.get_object()
        
        if not call.audio_file:
            return Response(
                {"error": "Audio file not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            file = call.audio_file.open('rb')
            response = FileResponse(
                file,
                content_type='audio/mpeg'  # أو audio/wav حسب نوع الملف
            )
            response['Content-Disposition'] = f'attachment; filename="{call.audio_file.name}"'
            return response
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def positive(self, request):
        """
        عرض الملفات الصوتية الإيجابية
        """
        calls = self.get_queryset().filter(
            analysis__sentiment='positive'
        ).distinct()
        
        serializer = CallListSerializer(calls, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def negative(self, request):
        """
        عرض الملفات الصوتية السلبية
        """
        calls = self.get_queryset().filter(
            analysis__sentiment='negative'
        ).distinct()
        
        serializer = CallListSerializer(calls, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def neutral(self, request):
        """
        عرض الملفات الصوتية المحايدة
        """
        calls = self.get_queryset().filter(
            analysis__sentiment='neutral'
        ).distinct()
        
        serializer = CallListSerializer(calls, many=True)
        return Response(serializer.data)

