from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('messaging', '0003_notification_match_alter_notification_kind'),
    ]

    operations = [
        migrations.RenameField(
            model_name='notification',
            old_name='recipient',
            new_name='user',
        ),
        migrations.RenameField(
            model_name='notification',
            old_name='kind',
            new_name='type',
        ),
        migrations.RenameField(
            model_name='notification',
            old_name='body',
            new_name='message',
        ),
        migrations.AlterField(
            model_name='notification',
            name='type',
            field=models.CharField(choices=[('new_match_found', 'New match found'), ('claim_request_received', 'Claim request received'), ('claim_approved', 'Claim approved'), ('claim_rejected', 'Claim rejected'), ('item_returned', 'Item returned'), ('new_comment', 'New comment'), ('admin_announcement', 'Admin announcement')], max_length=40),
        ),
        migrations.AddField(
            model_name='notification',
            name='reference_id',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.RemoveField(
            model_name='notification',
            name='claim',
        ),
        migrations.RemoveField(
            model_name='notification',
            name='match',
        ),
    ]