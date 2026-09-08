import hashlib

from django.db import migrations, models


def _hash_file(path):
    hasher = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(65536), b''):
            hasher.update(chunk)
    return hasher.hexdigest()


def backfill_hashes_and_remove_duplicates(apps, schema_editor):
    Call = apps.get_model('calls', 'Call')
    seen = {}

    for call in Call.objects.order_by('id'):
        file_hash = None
        try:
            if call.audio_file:
                file_hash = _hash_file(call.audio_file.path)
        except Exception:
            file_hash = None

        if file_hash and file_hash in seen:
            try:
                if call.audio_file:
                    call.audio_file.delete(save=False)
            except Exception:
                pass
            call.delete()
            continue

        if file_hash:
            seen[file_hash] = call.id
            Call.objects.filter(pk=call.pk).update(file_hash=file_hash)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('calls', '0006_alter_followup_assigned_to'),
    ]

    operations = [
        migrations.AddField(
            model_name='call',
            name='file_hash',
            field=models.CharField(blank=True, db_index=True, max_length=64, null=True),
        ),
        migrations.RunPython(backfill_hashes_and_remove_duplicates, noop),
    ]
