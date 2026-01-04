from django.db import models
from django.contrib.auth.models import User


class Report(models.Model):
    REPORT_TYPE_CHOICES = [
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('custom', 'Custom'),
    ]

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    from_date = models.DateField()
    to_date = models.DateField()
    file = models.FileField(upload_to='reports/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.report_type} report ({self.from_date} - {self.to_date})"

