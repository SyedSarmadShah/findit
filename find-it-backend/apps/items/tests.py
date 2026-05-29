from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..authentication.models import User
from .models import Item


class ItemTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(email='owner@example.com', password='pass123456')
        self.user2 = User.objects.create_user(email='other@example.com', password='pass123456')

    def test_create_item_sets_owner(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse('item-list')
        payload = {
            'item_type': 'found',
            'title': 'Wallet',
            'description': 'Black wallet',
            'status': 'open',
            'date': '2026-05-01',
        }
        resp = self.client.post(url, payload, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        item = Item.objects.get(pk=resp.data['id'])
        self.assertEqual(item.owner, self.user1)

    def test_non_owner_cannot_update(self):
        item = Item.objects.create(owner=self.user1, item_type='found', title='Keys', description='Keychain', date='2026-05-01')
        self.client.force_authenticate(user=self.user2)
        url = reverse('item-detail', args=[item.id])
        resp = self.client.patch(url, {'title': 'New'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
