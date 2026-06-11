from django.db import models
from django.contrib.auth.models import User


class ActivityLog(models.Model):

    ACTION_CHOICES = [
        # Call actions
        ('upload_call', 'Upload Call'),
        ('delete_call', 'Delete Call'),
        ('call_processing', 'Call Processing'),
        ('call_status_change', 'Call Status Change'),
        ('review_call', 'Review Call'),
        
        # Report actions
        ('generate_report', 'Generate Report'),
        ('publish_report', 'Publish Report'),
        ('delete_report', 'Delete Report'),
        
        # User actions
        ('user_created', 'User Created'),
        ('user_updated', 'User Updated'),
        ('user_deleted', 'User Deleted'),
        
        # Followup actions
        ('create_followup', 'Create Followup'),
        ('delete_followup', 'Delete Followup'),
        ('update_followup', 'Update Followup'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)

    action = models.CharField(max_length=50, choices=ACTION_CHOICES)

    description = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.action}"