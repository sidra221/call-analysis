from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def migrate_notes_forward(apps, schema_editor):
    FollowUp = apps.get_model('calls', 'FollowUp')
    for followup in FollowUp.objects.all():
        old_notes = getattr(followup, 'notes', '') or ''
        if followup.status == 'done' and old_notes.strip():
            followup.assignee_notes = old_notes
        else:
            followup.creator_notes = old_notes
        followup.save(update_fields=['creator_notes', 'assignee_notes'])


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('calls', '0002_callanalysis_top_issues'),
    ]

    operations = [
        migrations.AddField(
            model_name='followup',
            name='created_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='created_followups',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='followup',
            name='creator_notes',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='followup',
            name='assignee_notes',
            field=models.TextField(blank=True),
        ),
        migrations.RunPython(migrate_notes_forward, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name='followup',
            name='notes',
        ),
    ]
