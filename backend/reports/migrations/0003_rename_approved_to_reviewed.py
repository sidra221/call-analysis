from django.db import migrations, models


def rename_approved_to_reviewed(apps, schema_editor):
    Report = apps.get_model('reports', 'Report')
    Report.objects.filter(status='approved').update(status='reviewed')


class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0002_report_manager_notes_report_reviewed_at_and_more'),
    ]

    operations = [
        migrations.RunPython(rename_approved_to_reviewed, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='report',
            name='status',
            field=models.CharField(
                choices=[
                    ('draft', 'Draft'),
                    ('published', 'Published'),
                    ('reviewed', 'Reviewed'),
                ],
                default='draft',
                max_length=10,
            ),
        ),
    ]
