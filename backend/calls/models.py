from django.db import models
from django.contrib.auth.models import User


class Call(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('analyzing', 'Analyzing'),
        ('completed', 'Completed'),
    ]

    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_calls'
    )

    audio_file = models.FileField(upload_to='calls/')
    file_path = models.CharField(max_length=500, blank=True, null=True)  # For compatibility with ERD
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    duration = models.IntegerField(null=True, blank=True, help_text='Duration in seconds')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Call #{self.id} - {self.status}"


class CallAnalysis(models.Model):
    SENTIMENT_CHOICES = [
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    call = models.OneToOneField(Call, on_delete=models.CASCADE, related_name='analysis')
    main_issue = models.CharField(max_length=255)
    sentiment_score = models.FloatField()
    keywords = models.JSONField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES)
    needs_followup = models.BooleanField(default=False)
    is_reviewed = models.BooleanField(default=False)
    transcript = models.TextField()
    sentiment = models.CharField(max_length=20, choices=SENTIMENT_CHOICES, null=True, blank=True)  # Keep for backward compatibility
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def __str__(self):
        return f"Analysis for Call #{self.call.id}"


class FollowUp(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('done', 'Done'),
    ]

    call = models.ForeignKey(Call, on_delete=models.CASCADE, related_name='followups')
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_followups'
    )
    notes = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Follow-up for Call #{self.call.id} - {self.status}"


class Report(models.Model):
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_reports')
    title = models.CharField(max_length=255, default='Report')
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    file = models.FileField(upload_to='reports/')
    file_path = models.CharField(max_length=500, blank=True, null=True)  # For compatibility with ERD
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.period_start} - {self.period_end})"

