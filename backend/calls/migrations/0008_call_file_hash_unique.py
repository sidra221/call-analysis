from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('calls', '0007_call_file_hash'),
    ]

    operations = [
        migrations.AlterField(
            model_name='call',
            name='file_hash',
            field=models.CharField(
                blank=True,
                db_index=True,
                max_length=64,
                null=True,
                unique=True,
            ),
        ),
    ]
