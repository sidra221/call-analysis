from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('reports', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='report',
            name='manager_notes',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='report',
            name='reviewed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='report',
            name='reviewed_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='reviewed_reports',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name='report',
            name='status',
            field=models.CharField(
                choices=[
                    ('draft', 'Draft'),
                    ('published', 'Published'),
                    ('approved', 'Approved'),
                ],
                default='draft',
                max_length=10,
            ),
        ),
    ]
