from rest_framework import permissions
from .models import UserProfile


class IsQA(permissions.BasePermission):
    """
    Permission للتحقق من أن المستخدم لديه دور QA
    """
    message = "You must be a QA to perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            return user_profile.role == 'qa'
        except UserProfile.DoesNotExist:
            return False


class IsManager(permissions.BasePermission):
    """
    Permission للتحقق من أن المستخدم لديه دور Manager
    """
    message = "You must be a Manager to perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            return user_profile.role == 'manager'
        except UserProfile.DoesNotExist:
            return False


class IsManagerOrQA(permissions.BasePermission):
    """
    Permission للتحقق من أن المستخدم لديه دور Manager أو QA
    """
    message = "You must be a Manager or QA to perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            return user_profile.role in ['manager', 'qa']
        except UserProfile.DoesNotExist:
            return False

