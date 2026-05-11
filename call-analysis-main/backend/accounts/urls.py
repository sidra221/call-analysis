from django.urls import path
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    AuthenticatedUserView,
    ManagerOnlyView,
    QAOnlyView,
    ManagerOrQAView,
)

urlpatterns = [
    # --- Public endpoints (no authentication required) ---
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token-refresh'),

    # --- Protected endpoints (authentication required) ---
    path('me/', AuthenticatedUserView.as_view(), name='authenticated-user'),
    path('manager-only/', ManagerOnlyView.as_view(), name='manager-only'),
    path('qa-only/', QAOnlyView.as_view(), name='qa-only'),
    path('manager-or-qa/', ManagerOrQAView.as_view(), name='manager-or-qa'),
]