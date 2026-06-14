from django.db import migrations


def backfill_created_by(apps, schema_editor):
    FollowUp = apps.get_model('calls', 'FollowUp')
    ActivityLog = apps.get_model('logs', 'ActivityLog')

    for followup in FollowUp.objects.filter(created_by_id__isnull=True):
        call_id = followup.call_id
        log = (
            ActivityLog.objects.filter(
                action='create_followup',
                description__icontains=f'call #{call_id}',
            )
            .order_by('-created_at')
            .first()
        )
        if log and log.user_id:
            followup.created_by_id = log.user_id
            followup.save(update_fields=['created_by_id'])


class Migration(migrations.Migration):

    dependencies = [
        ('logs', '0002_alter_activitylog_action'),
        ('calls', '0003_followup_split_notes'),
    ]

    operations = [
        migrations.RunPython(backfill_created_by, migrations.RunPython.noop),
    ]
