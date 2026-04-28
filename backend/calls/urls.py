from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CallViewSet, FollowUpViewSet

# DefaultRouter auto-generates standard REST endpoints for each registered ViewSet
router = DefaultRouter()
router.register(r'', CallViewSet, basename='call')
router.register(r'followups', FollowUpViewSet, basename='followup')

urlpatterns = [
    path('', include(router.urls)),
]