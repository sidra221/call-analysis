from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('calls', '0004_backfill_followup_created_by'),
    ]

    operations = [
        migrations.AddField(
            model_name='callanalysis',
            name='followup_reason',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='callanalysis',
            name='summary',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='callanalysis',
            name='meta_intent',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
        migrations.AddField(
            model_name='callanalysis',
            name='meta_intents',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='callanalysis',
            name='llm_refined',
            field=models.BooleanField(default=False),
        ),
    ]
