from django.urls import path
from .views import DashboardSummaryView, DashboardTopicsView, DashboardOverviewView, LiveDemoView

urlpatterns = [
    # Main overview — total counts and top keywords
    path('', DashboardOverviewView.as_view(), name='dashboard-overview'),

    # Full statistics — sentiment, priority, follow-ups, time periods
    path('summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),

    # Topic analysis — recurring issues and keyword trends
    path('topics/', DashboardTopicsView.as_view(), name='dashboard-topics'),

    # Live feed — latest 5 calls with sentiment
    path('live/', LiveDemoView.as_view(), name='dashboard-live'),
]