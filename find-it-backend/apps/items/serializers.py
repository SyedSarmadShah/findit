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
    item_title = serializers.CharField(source="item.title", read_only=True)
    item_owner = serializers.IntegerField(source="item.owner_id", read_only=True)
    claimant_email = serializers.EmailField(source="claimant.email", read_only=True)
    finder_email = serializers.EmailField(source="finder.email", read_only=True)
    can_review = serializers.SerializerMethodField()

    class Meta:
        model = ItemClaim
        fields = (
            "id",
            "item",
            "item_title",
            "item_owner",
            "claimant",
            "claimant_email",
            "finder",
            "finder_email",
            "answers",
            "verification_notes",
            "status",
            "created_at",
            "updated_at",
            "can_review",
        )
        read_only_fields = (
            "id",
            "claimant",
            "claimant_email",
            "finder",
            "finder_email",
            "item_title",
            "item_owner",
            "created_at",
            "updated_at",
            "can_review",
        )

    def get_can_review(self, obj):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return False
        return request.user.is_staff or obj.finder_id == request.user.id

    def validate_answers(self, value):
        required_keys = {
            "brand",
            "unique_marks",
            "item_contents",
            "additional_details",
        }
        if not isinstance(value, dict):
            raise serializers.ValidationError("Answers must be a JSON object.")

        missing = [key for key in required_keys if not str(value.get(key, "")).strip()]
        if missing:
            raise serializers.ValidationError({key: "This field is required." for key in missing})
        return value

    def validate_verification_notes(self, value):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return value
        if not request.user.is_staff:
            raise serializers.ValidationError("Only the finder or admin can set verification notes.")
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            data.pop("verification_notes", None)
            return data

        if not (request.user.is_staff or instance.finder_id == request.user.id):
            data.pop("verification_notes", None)
        return data


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
