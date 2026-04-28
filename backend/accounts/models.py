from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    """
    Extends Django's built-in User model with a role field.
    Each user has exactly one profile, created automatically at registration.
    """

    ROLE_CHOICES = [
        ('manager', 'Manager'),
        ('qa', 'Quality Assurance'),
        ('agent', 'Agent'),
    ]

    # One-to-one link to Django's User — deleting the user deletes the profile too
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')

    # Role determines what endpoints and data the user can access
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        """Return a readable string combining username and role."""
        return f"{self.user.username} - {self.role}"