from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .serializers import RegisterSerializer
from .permissions import IsQA, IsManager, IsManagerOrQA


class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User registered successfully"}, status=201)
        return Response(serializer.errors, status=400)


# Custom JWT Views مع AllowAny permission
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login endpoint - Public (لا يحتاج authentication)
    """
    permission_classes = [AllowAny]


class CustomTokenRefreshView(TokenRefreshView):
    """
    Token refresh endpoint - Public (لا يحتاج authentication)
    """
    permission_classes = [AllowAny]


# أمثلة على Views محمية بالصلاحيات

class ManagerOnlyView(APIView):
    """
    View محمية - فقط Managers يمكنهم الوصول
    """
    permission_classes = [IsAuthenticated, IsManager]
    
    def get(self, request):
        return Response({
            "message": "This is a Manager-only endpoint",
            "user": request.user.username,
            "role": "manager"
        }, status=status.HTTP_200_OK)


class QAOnlyView(APIView):
    """
    View محمية - فقط QAs يمكنهم الوصول
    """
    permission_classes = [IsAuthenticated, IsQA]
    
    def get(self, request):
        return Response({
            "message": "This is a QA-only endpoint",
            "user": request.user.username,
            "role": "qa"
        }, status=status.HTTP_200_OK)


class ManagerOrQAView(APIView):
    """
    View محمية - Managers و QAs يمكنهم الوصول
    """
    permission_classes = [IsAuthenticated, IsManagerOrQA]
    
    def get(self, request):
        from .models import UserProfile
        user_profile = UserProfile.objects.get(user=request.user)
        return Response({
            "message": "This endpoint is accessible to Managers and QAs",
            "user": request.user.username,
            "role": user_profile.role
        }, status=status.HTTP_200_OK)


class AuthenticatedUserView(APIView):
    """
    View محمية - أي مستخدم مصادق عليه يمكنه الوصول
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from .models import UserProfile
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            role = user_profile.role
        except UserProfile.DoesNotExist:
            role = None
        
        return Response({
            "message": "This endpoint requires authentication",
            "user": request.user.username,
            "email": request.user.email,
            "role": role
        }, status=status.HTTP_200_OK)
