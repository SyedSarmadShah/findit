from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("items", "0005_item_map_coordinates"),
    ]

    operations = [
        migrations.AddField(
            model_name="itemclaim",
            name="contact_phone",
            field=models.CharField(blank=True, max_length=40),
        ),
        migrations.AddField(
            model_name="itemclaim",
            name="pickup_location",
            field=models.CharField(blank=True, max_length=40),
        ),
    ]
