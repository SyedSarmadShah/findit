from rest_framework import serializers

from .models import Item, ItemClaim, ItemReport


class ItemSerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(source="owner.email", read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = (
            "id",
            "owner",
            "owner_email",
            "item_type",
            "title",
            "description",
            "image",
            "image_url",
            "category",
            "location",
            "status",
            "date",
            "is_anonymous",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "owner", "owner_email", "image_url", "created_at", "updated_at")

    def get_image_url(self, obj):
        if not obj.image:
            return None

        image_url = obj.image.url
        request = self.context.get("request")
        if request is not None:
            return request.build_absolute_uri(image_url)
        return image_url

    def create(self, validated_data):
        owner = validated_data.pop("owner")
        return Item.objects.create(owner=owner, **validated_data)


class ItemClaimSerializer(serializers.ModelSerializer):
    claimant_email = serializers.EmailField(source="claimant.email", read_only=True)

    class Meta:
        model = ItemClaim
        fields = (
            "id",
            "item",
            "claimant",
            "claimant_email",
            "message",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "claimant", "claimant_email", "created_at", "updated_at")


class ItemReportSerializer(serializers.ModelSerializer):
    reporter_email = serializers.EmailField(source="reporter.email", read_only=True)

    class Meta:
        model = ItemReport
        fields = (
            "id",
            "item",
            "reporter",
            "reporter_email",
            "reason",
            "details",
            "created_at",
        )
        read_only_fields = ("id", "reporter", "reporter_email", "created_at")
