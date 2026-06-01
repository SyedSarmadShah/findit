from django.conf import settings
from django.db import models


class Item(models.Model):
    LOST = "lost"
    FOUND = "found"
    ITEM_TYPES = [(LOST, "Lost"), (FOUND, "Found")]

    OPEN = "open"
    MATCHED = "matched"
    RESOLVED = "resolved"
    STATUS_CHOICES = [
        (OPEN, "Open"),
        (MATCHED, "Matched"),
        (RESOLVED, "Resolved"),
    ]

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="items")
    item_type = models.CharField(max_length=10, choices=ITEM_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    image = models.ImageField(upload_to="items/", blank=True, null=True)
    category = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=255, blank=True)
    map_x = models.DecimalField(max_digits=6, decimal_places=3, blank=True, null=True)
    map_y = models.DecimalField(max_digits=6, decimal_places=3, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=OPEN)
    date = models.DateField()
    is_anonymous = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_item_type_display()}: {self.title}"


class ItemClaim(models.Model):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (APPROVED, "Approved"),
        (REJECTED, "Rejected"),
        (COMPLETED, "Completed"),
    ]

    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="claims")
    claimant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="claims")
    finder = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="finder_claims")
    answers = models.JSONField(default=dict)
    verification_notes = models.TextField(blank=True)
    contact_phone = models.CharField(max_length=40, blank=True)

    PICKUP_ENG = "eng"
    PICKUP_CS = "cs"
    PICKUP_BUSINESS = "business"
    PICKUP_MATH_IS = "math_is"
    PICKUP_LOCATION_CHOICES = [
        (PICKUP_ENG, "Mechanical Engineering, Electrical Engineering, Computer Engineering, Civil Engineering, and Biomedical Engineering"),
        (PICKUP_CS, "Computer Science and Software Engineering"),
        (PICKUP_BUSINESS, "Management Sciences"),
        (PICKUP_MATH_IS, "Mathematics, Islamic Studies, and Sciences & Humanities"),
    ]
    pickup_location = models.CharField(max_length=40, choices=PICKUP_LOCATION_CHOICES, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["item", "claimant"], name="unique_item_claim_per_user"),
        ]


class ItemReport(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="reports")
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="item_reports")
    reason = models.CharField(max_length=120)
    details = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class ItemMatch(models.Model):
    SUGGESTED = "suggested"
    VIEWED = "viewed"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"

    STATUS_CHOICES = [
        (SUGGESTED, "Suggested"),
        (VIEWED, "Viewed"),
        (CONFIRMED, "Confirmed"),
        (REJECTED, "Rejected"),
    ]

    lost_item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="lost_matches")
    found_item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="found_matches")
    score = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=SUGGESTED)
    match_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-score", "-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["lost_item", "found_item"], name="unique_item_match_pair"),
        ]

    def __str__(self):
        return f"Match #{self.pk}: {self.lost_item_id} <-> {self.found_item_id}"
