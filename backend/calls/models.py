import uuid
from django.db import models
from django.contrib.auth.models import User


class Call(models.Model):
    """
    Represents an audio call uploaded to the system for analysis.
    Each call goes through a status lifecycle: pending → processing → completed (or failed).
    """

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    # Default Django primary key (BigAutoField) is used automatically

    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)

    audio_file = models.FileField(upload_to='calls/')

    file_path = models.CharField(max_length=500, blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    duration = models.FloatField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        """Return a short string identifying the call by its ID."""
        return f"Call {self.id}"


class CallAnalysis(models.Model):
    """
    Stores the AI-generated analysis results for a single Call.
    Created automatically after the Celery task finishes processing.
    Has a one-to-one relationship with Call.
    """

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    SENTIMENT_CHOICES = [
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
    ]

    call = models.OneToOneField(Call, on_delete=models.CASCADE, related_name='analysis')

    main_issue = models.TextField(null=True, blank=True)

    sentiment = models.CharField(max_length=20, choices=SENTIMENT_CHOICES, null=True, blank=True)

    sentiment_score = models.FloatField(default=0)

    keywords = models.JSONField(default=list, blank=True)

    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='low')

    needs_followup = models.BooleanField(default=False)

    transcript = models.TextField(blank=True, null=True)

    is_reviewed = models.BooleanField(default=False)

    confidence_score = models.FloatField(null=True, blank=True)

    detected_language = models.CharField(max_length=10, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        """Return a short string identifying which call this analysis belongs to."""
        return f"Analysis for Call {self.call.id}"


class FollowUp(models.Model):
    """
    Represents a follow-up task assigned to a user for a specific call.
    Created either automatically when needs_followup is set to True,
    or manually by a Manager or QA.
    """

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    ]

    call = models.ForeignKey(Call, on_delete=models.CASCADE)

    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE)

    notes = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        """Return a short string identifying the follow-up and its call."""
        return f"FollowUp for Call {self.call.id}"
