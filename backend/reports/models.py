from django.db import models
from django.contrib.auth.models import User

class Report(models.Model):
    PERIOD_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
    ]

    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    period = models.CharField(max_length=10, choices=PERIOD_CHOICES)
    
    summary = models.TextField()
    recommendations = models.TextField()

    # بيانات محسوبة (system generated)
    top_issues = models.JSONField(default=list)
    sentiment_stats = models.JSONField(default=dict)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.period} report by {self.created_by}"