from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth.models import User

from .serializers import RegisterSerializer, UserListSerializer
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

    return {
        "id": user.id,
        "user": user.username,
        "email": user.email,
        "role": role,
        "avatar": avatar,
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

    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


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

        try:
            profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            return error_response("User profile not found", code="not_found", status_code=404)

        if profile.avatar:
            profile.avatar.delete(save=False)

        profile.avatar = file
        profile.save()

        create_log(request.user, 'avatar_updated', 'Profile avatar updated')

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
        serializer = UserListSerializer(users, many=True)
        return success_response(serializer.data)


class UserDeleteView(APIView):
    """
    Deletes a user by ID.
    Only accessible by Manager.
    DELETE /api/accounts/users/<id>/
    """
    permission_classes = [IsAuthenticated, IsManager]

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
        
        # Then delete the user
        user.delete()
        
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
    Returns list of users (agents and managers) for follow-up assignment.
    Accessible by QA and Manager.
    GET /api/accounts/users-for-followups/
    """
    permission_classes = [IsAuthenticated, IsManagerOrQA]

    def get(self, request):
        from django.contrib.auth.models import User
        from .models import UserProfile
        
        users = User.objects.filter(
            profile__role__in=['agent', 'manager']
        ).select_related('profile').order_by('username')
        
        serializer = UserListSerializer(users, many=True)
        return success_response(serializer.data)