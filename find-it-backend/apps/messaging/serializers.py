from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.EmailField(source="sender.email", read_only=True)

    class Meta:
        model = Message
        fields = ("id", "conversation", "sender", "sender_email", "body", "is_read", "created_at")
        read_only_fields = ("id", "sender", "sender_email", "created_at")

    def create(self, validated_data):
        request = self.context["request"]
        return Message.objects.create(sender=request.user, **validated_data)


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ("id", "item", "created_by", "participants", "last_message_at", "created_at", "messages")
        read_only_fields = ("id", "created_by", "last_message_at", "created_at", "messages")

    def create(self, validated_data):
        request = self.context["request"]
        participants = validated_data.pop("participants", [])
        conversation = Conversation.objects.create(created_by=request.user, **validated_data)
        conversation.participants.add(request.user, *participants)
        return conversation
