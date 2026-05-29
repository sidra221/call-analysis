from django.urls import path
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    AuthenticatedUserView,
    UsersListView,
    UserDeleteView,
    ManagerOnlyView,
    QAOnlyView,
    ManagerOrQAView,
    UsersForFollowupsView,
)

urlpatterns = [
    # Public
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token-refresh'),

    # Authenticated user
    path('me/', AuthenticatedUserView.as_view(), name='authenticated-user'),

    # Users management (Manager only)
    path('users/', UsersListView.as_view(), name='users-list'),
    path('users/<int:pk>/', UserDeleteView.as_view(), name='user-delete'),

    # Users for followups (Manager and QA)
    path('users-for-followups/', UsersForFollowupsView.as_view(), name='users-for-followups'),

    # Role-based test endpoints
    path('manager-only/', ManagerOnlyView.as_view(), name='manager-only'),
    path('qa-only/', QAOnlyView.as_view(), name='qa-only'),
    path('manager-or-qa/', ManagerOrQAView.as_view(), name='manager-or-qa'),
]