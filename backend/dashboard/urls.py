from django.urls import path
from .views import DashboardSummaryView, DashboardTopicsView, DashboardOverviewView, LiveDemoView

urlpatterns = [
    path('', DashboardOverviewView.as_view(), name='dashboard-overview'),
    path('summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('topics/', DashboardTopicsView.as_view(), name='dashboard-topics'),
    path('live/', LiveDemoView.as_view(), name='dashboard-live'),
]

