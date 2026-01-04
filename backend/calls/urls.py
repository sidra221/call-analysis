from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CallViewSet

router = DefaultRouter()
router.register(r'calls', CallViewSet, basename='call')

urlpatterns = [
    path('', include(router.urls)),
]

