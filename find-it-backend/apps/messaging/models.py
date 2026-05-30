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
    CLAIM_SUBMITTED = "claim_submitted"
    CLAIM_APPROVED = "claim_approved"
    CLAIM_REJECTED = "claim_rejected"
    MATCH_SUGGESTED = "match_suggested"

    KIND_CHOICES = [
        (CLAIM_SUBMITTED, "Claim submitted"),
        (CLAIM_APPROVED, "Claim approved"),
        (CLAIM_REJECTED, "Claim rejected"),
        (MATCH_SUGGESTED, "Match suggested"),
    ]

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    kind = models.CharField(max_length=40, choices=KIND_CHOICES)
    title = models.CharField(max_length=120)
    body = models.TextField()
    claim = models.ForeignKey("items.ItemClaim", on_delete=models.CASCADE, related_name="notifications", null=True, blank=True)
    match = models.ForeignKey("items.ItemMatch", on_delete=models.CASCADE, related_name="notifications", null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
