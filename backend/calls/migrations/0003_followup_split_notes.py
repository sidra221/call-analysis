from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def _followup_columns(schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'calls_followup'
            """
        )
        return {row[0] for row in cursor.fetchall()}


def migrate_notes_forward(apps, schema_editor):
    FollowUp = apps.get_model('calls', 'FollowUp')
    columns = _followup_columns(schema_editor)

    if 'notes' not in columns:
        return

    for followup in FollowUp.objects.all():
        old_notes = getattr(followup, 'notes', '') or ''
        if followup.status == 'done' and old_notes.strip():
            followup.assignee_notes = old_notes
        else:
            followup.creator_notes = old_notes
        followup.save(update_fields=['creator_notes', 'assignee_notes'])


def apply_followup_schema_forward(apps, schema_editor):
    columns = _followup_columns(schema_editor)

    with schema_editor.connection.cursor() as cursor:
        if 'created_by_id' not in columns:
            cursor.execute(
                """
                ALTER TABLE calls_followup
                ADD COLUMN created_by_id bigint NULL
                REFERENCES auth_user(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED
                """
            )
            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS calls_followup_created_by_id_idx
                ON calls_followup (created_by_id)
                """
            )

        if 'creator_notes' not in columns:
            cursor.execute(
                """
                ALTER TABLE calls_followup
                ADD COLUMN creator_notes text NOT NULL DEFAULT ''
                """
            )

        if 'assignee_notes' not in columns:
            cursor.execute(
                """
                ALTER TABLE calls_followup
                ADD COLUMN assignee_notes text NOT NULL DEFAULT ''
                """
            )

    migrate_notes_forward(apps, schema_editor)

    columns = _followup_columns(schema_editor)
    if 'notes' in columns:
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("ALTER TABLE calls_followup DROP COLUMN notes")


def apply_followup_schema_reverse(apps, schema_editor):
    columns = _followup_columns(schema_editor)

    with schema_editor.connection.cursor() as cursor:
        if 'notes' not in columns:
            cursor.execute(
                """
                ALTER TABLE calls_followup
                ADD COLUMN notes text NOT NULL DEFAULT ''
                """
            )

        if 'created_by_id' in columns:
            cursor.execute(
                "ALTER TABLE calls_followup DROP COLUMN IF EXISTS created_by_id"
            )
        if 'creator_notes' in columns:
            cursor.execute(
                "ALTER TABLE calls_followup DROP COLUMN IF EXISTS creator_notes"
            )
        if 'assignee_notes' in columns:
            cursor.execute(
                "ALTER TABLE calls_followup DROP COLUMN IF EXISTS assignee_notes"
            )


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('calls', '0002_callanalysis_top_issues'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    apply_followup_schema_forward,
                    apply_followup_schema_reverse,
                ),
            ],
            state_operations=[
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
            ],
        ),
    ]
