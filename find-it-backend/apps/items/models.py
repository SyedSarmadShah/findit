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
