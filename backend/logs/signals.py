# logs/signals.py
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from calls.models import Call, CallAnalysis, FollowUp
from .models import ActivityLog
from .utils import create_log


def _user_still_exists(user):
    """Return False when user was cascade-deleted (e.g. during account removal)."""
    if user is None:
        return False
    pk = getattr(user, 'pk', None)
    if pk is None:
        return False
    return User.objects.filter(pk=pk).exists()

# ========================
# USER SIGNALS
# ========================

@receiver(post_save, sender=User)
def log_user_created(sender, instance, created, **kwargs):
    if created:
        create_log(
            user=instance,
            action='user_created',
            description=f"User '{instance.username}' was created"
        )

# ========================
# CALL SIGNALS
# ========================

@receiver(post_save, sender=Call)
def log_call_created(sender, instance, created, **kwargs):
    if created:
        create_log(
            user=instance.uploaded_by,
            action='upload_call',
            description=f"Uploaded call #{instance.id}"
        )

@receiver(post_delete, sender=Call)
def log_call_deleted(sender, instance, **kwargs):
    if not _user_still_exists(instance.uploaded_by):
        return
    create_log(
        user=instance.uploaded_by,
        action='delete_call',
        description=f"Deleted call #{instance.id}"
    )

@receiver(pre_save, sender=Call)
def log_call_status_change(sender, instance, **kwargs):
    if instance.pk:
        previous = Call.objects.get(pk=instance.pk)
        if previous.status != instance.status:
            create_log(
                user=instance.uploaded_by,
                action='call_status_change',
                description=f"Call #{instance.id} status changed from {previous.status} to {instance.status}"
            )

# ========================
# FOLLOWUP SIGNALS
# ========================

@receiver(post_save, sender=FollowUp)
def log_followup_created(sender, instance, created, **kwargs):
    if created:
        create_log(
            user=instance.assigned_to,
            action='create_followup',
            description=f"Created followup for call #{instance.call.id}"
        )

@receiver(post_delete, sender=FollowUp)
def log_followup_deleted(sender, instance, **kwargs):
    if not _user_still_exists(instance.assigned_to):
        return
    create_log(
        user=instance.assigned_to,
        action='delete_followup',
        description=f"Deleted followup for call #{instance.call.id}"
    )

# ========================
# ANALYSIS SIGNALS
# ========================

@receiver(post_save, sender=CallAnalysis)
def log_analysis_completed(sender, instance, created, **kwargs):
    if created:
        create_log(
            user=instance.call.uploaded_by,
            action='review_call',
            description=f"Analysis completed for call #{instance.call.id} - Sentiment: {instance.sentiment}"
        )