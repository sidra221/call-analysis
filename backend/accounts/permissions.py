from rest_framework import permissions
from .models import UserProfile


class IsQA(permissions.BasePermission):
    """
    Grants access only to users whose profile role is 'qa'.
    Used to restrict report creation and call review actions.
    """

    message = "You must be a QA to perform this action."

    def has_permission(self, request, view):
        """Return True only if the authenticated user has the 'qa' role."""
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            profile = UserProfile.objects.get(user=request.user)
            return profile.role.lower() == 'qa'
        except UserProfile.DoesNotExist:
            return False


class IsManager(permissions.BasePermission):
    """
    Grants access only to users whose profile role is 'manager'.
    Used for manager-only dashboard views and actions.
    """

    message = "You must be a Manager to perform this action."

    def has_permission(self, request, view):
        """Return True only if the authenticated user has the 'manager' role."""
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            profile = UserProfile.objects.get(user=request.user)
            return profile.role.lower() == 'manager'
        except UserProfile.DoesNotExist:
            return False


class IsManagerOrQA(permissions.BasePermission):
    """
    Grants access to users whose profile role is either 'manager' or 'qa'.
    Used for most call and dashboard endpoints.
    """

    message = "You must be a Manager or QA to perform this action."

    def has_permission(self, request, view):
        """Return True if the authenticated user has the 'manager' or 'qa' role."""
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            profile = UserProfile.objects.get(user=request.user)
            return profile.role.lower() in ['manager', 'qa']
        except UserProfile.DoesNotExist:
            return False