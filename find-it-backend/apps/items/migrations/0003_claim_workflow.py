# Generated manually to evolve the claim workflow without dropping existing data.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def populate_claim_fields(apps, schema_editor):
    ItemClaim = apps.get_model('items', 'ItemClaim')

    for claim in ItemClaim.objects.select_related('item').all():
        if claim.finder_id is None:
            claim.finder_id = claim.item.owner_id

        if not claim.answers:
            claim.answers = {
                'brand': '',
                'unique_marks': '',
                'item_contents': claim.message or '',
                'additional_details': '',
            }

        claim.save(update_fields=['finder', 'answers'])


def reverse_populate_claim_fields(apps, schema_editor):
    ItemClaim = apps.get_model('items', 'ItemClaim')
    for claim in ItemClaim.objects.select_related('item').all():
        if not claim.message and claim.answers:
            claim.message = claim.answers.get('additional_details', '')
            claim.save(update_fields=['message'])


class Migration(migrations.Migration):

    dependencies = [
        ('items', '0002_itemreport_itemclaim'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='itemclaim',
            name='finder',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='finder_claims', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='itemclaim',
            name='answers',
            field=models.JSONField(default=dict),
        ),
        migrations.AddField(
            model_name='itemclaim',
            name='verification_notes',
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name='itemclaim',
            name='status',
            field=models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('completed', 'Completed')], default='pending', max_length=20),
        ),
        migrations.RunPython(populate_claim_fields, reverse_populate_claim_fields),
        migrations.RemoveField(
            model_name='itemclaim',
            name='message',
        ),
        migrations.AlterField(
            model_name='itemclaim',
            name='finder',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='finder_claims', to=settings.AUTH_USER_MODEL),
        ),
    ]
