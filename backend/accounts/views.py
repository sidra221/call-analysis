from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import RegisterSerializer
from .permissions import IsQA, IsManager, IsManagerOrQA
from .models import UserProfile
from config.responses import success_response, error_response


class RegisterView(APIView):
    """
    Public endpoint for creating a new user account.
    No authentication required.
    POST /api/accounts/register/
    """

    permission_classes = [AllowAny]

    def post(self, request):
        """Validate input and create a new User + UserProfile."""
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return success_response({"message": "User registered successfully"}, status_code=201)
        return error_response(str(serializer.errors), code="validation_error", status_code=400)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Public login endpoint.
    Returns an access token and a refresh token on valid credentials.
    POST /api/accounts/login/
    """

    permission_classes = [AllowAny]


class CustomTokenRefreshView(TokenRefreshView):
    """
    Public token refresh endpoint.
    Exchanges a valid refresh token for a new access token.
    POST /api/accounts/token/refresh/
    """

    permission_classes = [AllowAny]


class AuthenticatedUserView(APIView):
    """
    Returns the profile of the currently authenticated user.
    GET /api/accounts/me/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Fetch and return the current user's username, email, and role."""
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


class ManagerOnlyView(APIView):
    """
    Test endpoint accessible only by users with the 'manager' role.
    GET /api/accounts/manager-only/
    """

    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        """Return a confirmation message for manager access."""
        return success_response({
            "message": "This is a Manager-only endpoint",
            "user": request.user.username,
            "role": "manager",
        })


class QAOnlyView(APIView):
    """
    Test endpoint accessible only by users with the 'qa' role.
    GET /api/accounts/qa-only/
    """

    permission_classes = [IsAuthenticated, IsQA]

    def get(self, request):
        """Return a confirmation message for QA access."""
        return success_response({
            "message": "This is a QA-only endpoint",
            "user": request.user.username,
            "role": "qa",
        })


class ManagerOrQAView(APIView):
    """
    Test endpoint accessible by users with 'manager' or 'qa' role.
    GET /api/accounts/manager-or-qa/
    """

    permission_classes = [IsAuthenticated, IsManagerOrQA]

    def get(self, request):
        """Return a confirmation message along with the user's actual role."""
        profile = UserProfile.objects.get(user=request.user)
        return success_response({
            "message": "This endpoint is accessible to Managers and QAs",
            "user": request.user.username,
            "role": profile.role,
        })