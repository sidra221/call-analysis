from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth.models import User

from .serializers import RegisterSerializer, UserListSerializer
from .permissions import IsQA, IsManager, IsManagerOrQA
from .models import UserProfile
from config.responses import success_response, error_response
from logs.utils import create_log


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
            role = profile.role
        except UserProfile.DoesNotExist:
            role = None

        return success_response({
            "user": request.user.username,
            "email": request.user.email,
            "role": role,
        })


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