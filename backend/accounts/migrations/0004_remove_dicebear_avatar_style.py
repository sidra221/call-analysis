from django.db import migrations, models


def migrate_dicebear_to_initial(apps, schema_editor):
    UserProfile = apps.get_model('accounts', 'UserProfile')
    UserProfile.objects.filter(avatar_style='dicebear').update(avatar_style='initial')


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_userprofile_avatar_style'),
    ]

    operations = [
        migrations.RunPython(migrate_dicebear_to_initial, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='userprofile',
            name='avatar_style',
            field=models.CharField(
                choices=[('initial', 'Initial Letter')],
                default='initial',
                max_length=20,
            ),
        ),
    ]
