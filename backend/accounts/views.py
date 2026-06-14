from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth.models import User

from .serializers import (
    RegisterSerializer,
    UserListSerializer,
    UserUpdateSerializer,
    CustomTokenObtainPairSerializer,
)
from .permissions import IsQA, IsManager, IsManagerOrQA
from .models import UserProfile
from config.responses import success_response, error_response
from logs.utils import create_log

AVATAR_MAX_BYTES = 2 * 1024 * 1024
AVATAR_ALLOWED_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}


def _serialize_user(request, user, profile=None):
    if profile is None:
        try:
            profile = UserProfile.objects.get(user=user)
        except UserProfile.DoesNotExist:
            profile = None

    role = profile.role if profile else None
    avatar = None
    if profile and profile.avatar:
        avatar = request.build_absolute_uri(profile.avatar.url)

    avatar_style = 'initial'
    if profile:
        avatar_style = profile.avatar_style if profile.avatar_style != 'dicebear' else 'initial'

    return {
        "id": user.id,
        "user": user.username,
        "email": user.email,
        "role": role,
        "avatar": avatar,
        "avatar_style": avatar_style,
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            create_log(user, 'user_created', f'User {user.username} registered')
            return success_response({"message": "User registered successfully"}, status_code=201)
        return error_response(str(serializer.errors), code="validation_error", status_code=400)


class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class CustomTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class AuthenticatedUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            profile = None

        return success_response(_serialize_user(request, request.user, profile))


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not current_password or not new_password:
            return error_response(
                "Current and new password are required",
                code="validation_error",
                status_code=400,
            )

        if len(new_password) < 8:
            return error_response(
                "Password must be at least 8 characters",
                code="validation_error",
                status_code=400,
            )

        user = request.user
        if not user.check_password(current_password):
            return error_response(
                "Current password is incorrect",
                code="validation_error",
                status_code=400,
            )

        user.set_password(new_password)
        user.save()

        create_log(user, 'password_changed', 'User changed their password')

        return success_response({"message": "Password updated successfully"})


class AvatarUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_profile(self, user):
        try:
            return UserProfile.objects.get(user=user)
        except UserProfile.DoesNotExist:
            return None

    def post(self, request):
        file = request.FILES.get('avatar')
        if not file:
            return error_response("No image file provided", code="validation_error", status_code=400)

        if file.size > AVATAR_MAX_BYTES:
            return error_response("Image must be 2 MB or smaller", code="validation_error", status_code=400)

        content_type = getattr(file, 'content_type', '') or ''
        if content_type not in AVATAR_ALLOWED_TYPES:
            return error_response(
                "Unsupported image type. Use JPEG, PNG, WebP, or GIF",
                code="validation_error",
                status_code=400,
            )

        profile = self._get_profile(request.user)
        if profile is None:
            return error_response("User profile not found", code="not_found", status_code=404)

        if profile.avatar:
            profile.avatar.delete(save=False)

        profile.avatar = file
        profile.save()

        create_log(request.user, 'avatar_updated', 'Profile avatar updated')

        return success_response(_serialize_user(request, request.user, profile))

    def put(self, request):
        avatar_style = request.data.get('avatar_style')
        valid_styles = [choice[0] for choice in UserProfile.AVATAR_STYLE_CHOICES]
        if avatar_style not in valid_styles:
            return error_response(
                f"Invalid avatar style. Must be one of: {', '.join(valid_styles)}",
                code="validation_error",
                status_code=400,
            )

        profile = self._get_profile(request.user)
        if profile is None:
            return error_response("User profile not found", code="not_found", status_code=404)

        if profile.avatar:
            profile.avatar.delete(save=False)
            profile.avatar = None

        profile.avatar_style = avatar_style
        profile.save()

        create_log(request.user, 'avatar_updated', f'Profile avatar set to {avatar_style}')

        return success_response(_serialize_user(request, request.user, profile))


class UsersListView(APIView):
    """
    Returns list of all users with their profiles.
    Only accessible by Manager.
    GET /api/accounts/users/
    """
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        users = User.objects.select_related('profile').all().order_by('date_joined')
        serializer = UserListSerializer(users, many=True, context={'request': request})
        return success_response(serializer.data)


class UserStatsView(APIView):
    """
    Returns activity statistics for a user.
    GET /api/accounts/users/<id>/stats/
    """
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return error_response("User not found", code="not_found", status_code=404)

        from calls.models import Call
        from reports.models import Report
        from logs.models import ActivityLog

        return success_response({
            'calls_uploaded': Call.objects.filter(uploaded_by=user).count(),
            'followups_created': ActivityLog.objects.filter(
                user=user, action='create_followup',
            ).count(),
            'reports_created': Report.objects.filter(created_by=user).count(),
        })


class UserActivityView(APIView):
    """
    Returns recent activity log entries for a user.
    GET /api/accounts/users/<id>/activity/
    """
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return error_response("User not found", code="not_found", status_code=404)

        from logs.models import ActivityLog

        logs = ActivityLog.objects.filter(user=user).order_by('-created_at')[:10]
        data = [
            {
                'action': log.action,
                'description': log.description,
                'created_at': log.created_at,
            }
            for log in logs
        ]
        return success_response(data)


class UserDetailView(APIView):
    """
    Retrieve, update, or delete a user by ID.
    Only accessible by Manager.
    GET/PATCH/DELETE /api/accounts/users/<id>/
    """
    permission_classes = [IsAuthenticated, IsManager]

    def _get_user(self, pk):
        try:
            return User.objects.select_related('profile').get(pk=pk)
        except User.DoesNotExist:
            return None

    def get(self, request, pk):
        user = self._get_user(pk)
        if user is None:
            return error_response("User not found", code="not_found", status_code=404)

        serializer = UserListSerializer(user, context={'request': request})
        return success_response(serializer.data)

    def patch(self, request, pk):
        user = self._get_user(pk)
        if user is None:
            return error_response("User not found", code="not_found", status_code=404)

        if user == request.user and 'role' in request.data:
            return error_response(
                "You cannot change your own role",
                code="forbidden",
                status_code=400,
            )

        if user == request.user and request.data.get('is_active') is False:
            return error_response(
                "You cannot deactivate your own account",
                code="forbidden",
                status_code=400,
            )

        serializer = UserUpdateSerializer(
            data=request.data,
            context={'user_instance': user},
            partial=True,
        )
        if not serializer.is_valid():
            return error_response(str(serializer.errors), code="validation_error", status_code=400)

        serializer.update(user, serializer.validated_data)
        create_log(request.user, 'user_updated', f'Updated user {user.username}')

        response_serializer = UserListSerializer(user, context={'request': request})
        return success_response(response_serializer.data)

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return error_response("User not found", code="not_found", status_code=404)

        if user == request.user:
            return error_response("You cannot delete your own account", code="forbidden", status_code=400)

        # Save username before deletion
        username = user.username
        
        # Create log BEFORE deleting the user
        create_log(request.user, 'user_deleted', f'Deleted user {username}')

        # Skip cascade delete logs (calls/followups) — user_deleted already covers this
        from django.db.models.signals import post_delete
        from calls.models import Call, FollowUp
        from logs.signals import log_call_deleted, log_followup_deleted

        post_delete.disconnect(log_call_deleted, sender=Call)
        post_delete.disconnect(log_followup_deleted, sender=FollowUp)
        try:
            user.delete()
        finally:
            post_delete.connect(log_call_deleted, sender=Call)
            post_delete.connect(log_followup_deleted, sender=FollowUp)
        
        from rest_framework import status
        from rest_framework.response import Response
        return Response(status=status.HTTP_204_NO_CONTENT)


class ManagerOnlyView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        return success_response({
            "message": "This is a Manager-only endpoint",
            "user": request.user.username,
            "role": "manager",
        })


class QAOnlyView(APIView):
    permission_classes = [IsAuthenticated, IsQA]

    def get(self, request):
        return success_response({
            "message": "This is a QA-only endpoint",
            "user": request.user.username,
            "role": "qa",
        })


class ManagerOrQAView(APIView):
    permission_classes = [IsAuthenticated, IsManagerOrQA]

    def get(self, request):
        profile = UserProfile.objects.get(user=request.user)
        return success_response({
            "message": "This endpoint is accessible to Managers and QAs",
            "user": request.user.username,
            "role": profile.role,
        })


class UsersForFollowupsView(APIView):
    """
    Returns list of QA users for follow-up assignment.
    Accessible by QA and Manager.
    GET /api/accounts/users-for-followups/
    """
    permission_classes = [IsAuthenticated, IsManagerOrQA]

    def get(self, request):
        from django.contrib.auth.models import User
        from .models import UserProfile
        
        users = User.objects.filter(
            profile__role='qa'
        ).select_related('profile').order_by('username')
        
        serializer = UserListSerializer(users, many=True, context={'request': request})
        return success_response(serializer.data)