from django.contrib import admin

from .models import Conversation, Message, Notification


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "created_by", "created_at", "last_message_at")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("conversation", "sender", "is_read", "created_at")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("recipient", "kind", "is_read", "created_at")
    list_filter = ("kind", "is_read", "created_at")
