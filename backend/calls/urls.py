from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CallViewSet, FollowUpViewSet

router = DefaultRouter()

# IMPORTANT:
# register followups FIRST
router.register(r'followups', FollowUpViewSet, basename='followup')

# calls routes
router.register(r'calls', CallViewSet, basename='call')

urlpatterns = [
    path('', include(router.urls)),
]