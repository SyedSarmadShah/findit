from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..authentication.models import User
from ..items.models import Item
from .models import Conversation, Message, Notification


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='user@example.com', password='pass123456')
        self.other_user = User.objects.create_user(email='other@example.com', password='pass123456')
        self.notification = Notification.objects.create(
            user=self.user,
            type=Notification.ADMIN_ANNOUNCEMENT,
            title='Welcome',
            message='Hello from the campus desk.',
            reference_id=1,
        )

    def test_list_only_returns_authenticated_users_notifications(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get(reverse('notification-list'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_mark_read_and_mark_all_read(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.post(reverse('notification-mark-read', args=[self.notification.id]))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

        Notification.objects.create(
            user=self.user,
            type=Notification.ADMIN_ANNOUNCEMENT,
            title='Second',
            message='Another message.',
        )

        resp = self.client.post(reverse('notification-mark-all-read'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['updated'], 1)
        self.assertFalse(Notification.objects.filter(user=self.user, is_read=False).exists())

    def test_delete_requires_owner_scope(self):
        self.client.force_authenticate(user=self.other_user)
        resp = self.client.delete(reverse('notification-detail', args=[self.notification.id]))
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


class MessagingTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(email='owner@example.com', password='pass123456')
        self.finder = User.objects.create_user(email='finder@example.com', password='pass123456')
        self.item = Item.objects.create(owner=self.owner, item_type='found', title='Phone', description='Black phone', date='2026-05-01')

    def test_create_conversation_and_send_message(self):
        self.client.force_authenticate(user=self.finder)
        url = reverse('conversation-list')
        resp = self.client.post(url, {'item': self.item.id, 'participants': [self.owner.id]}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        conv_id = resp.data['id']
        conv = Conversation.objects.get(pk=conv_id)
        self.assertIn(self.finder, conv.participants.all())
        self.assertIn(self.owner, conv.participants.all())

        msg_url = reverse('message-list')
        msg_resp = self.client.post(msg_url, {'conversation': conv_id, 'body': 'Is this still available?'}, format='json')
        self.assertEqual(msg_resp.status_code, status.HTTP_201_CREATED)
        msg = Message.objects.get(pk=msg_resp.data['id'])
        self.assertEqual(msg.sender, self.finder)
        self.assertEqual(msg.body, 'Is this still available?')
