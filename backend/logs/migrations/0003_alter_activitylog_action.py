from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('logs', '0002_alter_activitylog_action'),
    ]

    operations = [
        migrations.AlterField(
            model_name='activitylog',
            name='action',
            field=models.CharField(
                choices=[
                    ('upload_call', 'Upload Call'),
                    ('delete_call', 'Delete Call'),
                    ('call_processing', 'Call Processing'),
                    ('call_status_change', 'Call Status Change'),
                    ('review_call', 'Review Call'),
                    ('generate_report', 'Generate Report'),
                    ('publish_report', 'Publish Report'),
                    ('delete_report', 'Delete Report'),
                    ('user_created', 'User Created'),
                    ('user_updated', 'User Updated'),
                    ('user_deleted', 'User Deleted'),
                    ('create_followup', 'Create Followup'),
                    ('delete_followup', 'Delete Followup'),
                    ('update_followup', 'Update Followup'),
                ],
                max_length=50,
            ),
        ),
    ]
