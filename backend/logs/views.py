from django.db.models import Q

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsManager
from calls.pagination import LargeDataPagination
from config.responses import success_response
from .models import ActivityLog
from .serializers import ActivityLogSerializer


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = ActivityLog.objects.select_related('user').all()
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated, IsManager]
    pagination_class = LargeDataPagination

    def get_queryset(self):
        queryset = ActivityLog.objects.select_related('user').order_by('-created_at')

        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(user__username__icontains=search)
                | Q(description__icontains=search)
                | Q(action__icontains=search.replace(' ', '_'))
            )

        action = self.request.query_params.get('action', '').strip()
        if action and action != 'all':
            queryset = queryset.filter(action=action)

        username = self.request.query_params.get('username', '').strip()
        if username:
            queryset = queryset.filter(user__username__icontains=username)

        date = self.request.query_params.get('date', '').strip()
        if date:
            queryset = queryset.filter(created_at__date=date)

        return queryset

    @action(detail=False, methods=['get'], url_path='usernames')
    def usernames(self, request):
        """Return distinct usernames that appear in activity logs."""
        usernames = (
            ActivityLog.objects
            .values_list('user__username', flat=True)
            .distinct()
            .order_by('user__username')
        )
        return success_response(list(usernames))