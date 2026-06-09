from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_userprofile_avatar'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='avatar_style',
            field=models.CharField(
                choices=[('initial', 'Initial Letter'), ('dicebear', 'Generated Avatar')],
                default='dicebear',
                max_length=20,
            ),
        ),
    ]
