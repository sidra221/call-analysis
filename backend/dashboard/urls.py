from django.urls import path
from .views import DashboardSummaryView, DashboardTopicsView

urlpatterns = [
    path('summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('topics/', DashboardTopicsView.as_view(), name='dashboard-topics'),
]

