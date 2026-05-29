from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..authentication.models import User
from ..items.models import Item
from .models import Conversation, Message


class MessagingTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(email='owner@example.com', password='pass123456')
        self.finder = User.objects.create_user(email='finder@example.com', password='pass123456')
        self.item = Item.objects.create(owner=self.owner, item_type='found', title='Phone', description='Black phone', date='2026-05-01')

    def test_create_conversation_and_send_message(self):
        # finder starts a conversation about the item and includes owner as participant
        self.client.force_authenticate(user=self.finder)
        url = reverse('conversation-list')
        resp = self.client.post(url, {'item': self.item.id, 'participants': [self.owner.id]}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        conv_id = resp.data['id']
        conv = Conversation.objects.get(pk=conv_id)
        self.assertIn(self.finder, conv.participants.all())
        self.assertIn(self.owner, conv.participants.all())

        # finder sends a message
        msg_url = reverse('message-list')
        msg_resp = self.client.post(msg_url, {'conversation': conv_id, 'body': 'Is this still available?'}, format='json')
        self.assertEqual(msg_resp.status_code, status.HTTP_201_CREATED)
        msg = Message.objects.get(pk=msg_resp.data['id'])
        self.assertEqual(msg.sender, self.finder)
        self.assertEqual(msg.body, 'Is this still available?')
