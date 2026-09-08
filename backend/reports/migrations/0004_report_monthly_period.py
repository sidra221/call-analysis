from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0003_rename_approved_to_reviewed'),
    ]

    operations = [
        migrations.AlterField(
            model_name='report',
            name='period',
            field=models.CharField(
                choices=[
                    ('daily', 'Daily'),
                    ('weekly', 'Weekly'),
                    ('monthly', 'Monthly'),
                ],
                max_length=10,
            ),
        ),
    ]
