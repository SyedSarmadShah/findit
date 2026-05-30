from django.conf import settings
from django.db import models


class Conversation(models.Model):
    item = models.ForeignKey("items.Item", on_delete=models.CASCADE, related_name="conversations", null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_conversations")
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="conversations")
    last_message_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Conversation #{self.pk}"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="messages_sent")
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class Notification(models.Model):
    NEW_MATCH_FOUND = "new_match_found"
    CLAIM_REQUEST_RECEIVED = "claim_request_received"
    CLAIM_APPROVED = "claim_approved"
    CLAIM_REJECTED = "claim_rejected"
    ITEM_RETURNED = "item_returned"
    NEW_COMMENT = "new_comment"
    ADMIN_ANNOUNCEMENT = "admin_announcement"

    TYPE_CHOICES = [
        (NEW_MATCH_FOUND, "New match found"),
        (CLAIM_REQUEST_RECEIVED, "Claim request received"),
        (CLAIM_APPROVED, "Claim approved"),
        (CLAIM_REJECTED, "Claim rejected"),
        (ITEM_RETURNED, "Item returned"),
        (NEW_COMMENT, "New comment"),
        (ADMIN_ANNOUNCEMENT, "Admin announcement"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=120)
    message = models.TextField()
    type = models.CharField(max_length=40, choices=TYPE_CHOICES)
    reference_id = models.PositiveIntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notification #{self.pk}: {self.title}"
