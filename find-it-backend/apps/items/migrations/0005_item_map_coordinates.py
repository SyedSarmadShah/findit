from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("items", "0004_itemmatch"),
    ]

    operations = [
        migrations.AddField(
            model_name="item",
            name="map_x",
            field=models.DecimalField(blank=True, decimal_places=3, max_digits=6, null=True),
        ),
        migrations.AddField(
            model_name="item",
            name="map_y",
            field=models.DecimalField(blank=True, decimal_places=3, max_digits=6, null=True),
        ),
    ]
