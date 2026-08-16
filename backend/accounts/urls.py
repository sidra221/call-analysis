from django.urls import path
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    LogoutView,
    AuthenticatedUserView,
    ChangePasswordView,
    AvatarUploadView,
    UsersListView,
    UserDetailView,
    UserStatsView,
    UserActivityView,
    UsersForFollowupsView,
)

urlpatterns = [
    # Public
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token-refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # Authenticated user
    path('me/', AuthenticatedUserView.as_view(), name='authenticated-user'),
    path('me/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('me/avatar/', AvatarUploadView.as_view(), name='avatar-upload'),

    # Users management (Manager only)
    path('users/', UsersListView.as_view(), name='users-list'),
    path('users/<int:pk>/stats/', UserStatsView.as_view(), name='user-stats'),
    path('users/<int:pk>/activity/', UserActivityView.as_view(), name='user-activity'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),

    # Users for followups (Manager and QA)
    path('users-for-followups/', UsersForFollowupsView.as_view(), name='users-for-followups'),
]