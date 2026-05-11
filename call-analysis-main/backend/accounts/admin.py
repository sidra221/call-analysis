from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """
    Admin configuration for UserProfile.
    Displays role alongside the username, with filtering and search support.
    """

    list_display = ('user', 'role')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email')