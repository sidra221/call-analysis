from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from calls.models import CallAnalysis
from accounts.permissions import IsQA, IsManagerOrQA
from .models import Report
from .serializers import ReportSerializer
from config.responses import success_response

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all().order_by('-created_at')
    serializer_class = ReportSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsQA()]
        return [IsAuthenticated(), IsManagerOrQA()]

    def perform_create(self, serializer):
        # 🔥 حساب Top Issues
        top_issues_qs = CallAnalysis.objects.values('main_issue').annotate(
            count=Count('id')
        ).order_by('-count')[:5]

        top_issues = list(top_issues_qs)

        # 🔥 حساب Sentiment
        sentiment_qs = CallAnalysis.objects.values('sentiment').annotate(
            count=Count('id')
        )

        sentiment_stats = {item['sentiment']: item['count'] for item in sentiment_qs}

        serializer.save(
            created_by=self.request.user,
            top_issues=top_issues,
            sentiment_stats=sentiment_stats
        )