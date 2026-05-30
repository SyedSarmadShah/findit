from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..authentication.models import User
from ..messaging.models import Notification
from .models import Item, ItemClaim, ItemMatch


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

    def test_claim_flow_creates_notification_and_history(self):
        item = Item.objects.create(
            owner=self.user1,
            item_type='found',
            title='Wallet',
            description='Black wallet',
            date='2026-05-01',
        )

        self.client.force_authenticate(user=self.user2)
        create_url = reverse('item-claim-list')
        payload = {
            'item': item.id,
            'answers': {
                'brand': 'Fossil',
                'unique_marks': 'Blue sticker near the zipper',
                'item_contents': 'Transit card and earbuds',
                'additional_details': 'My initials are inside the front pocket.',
            },
        }

        create_resp = self.client.post(create_url, payload, format='json')
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ItemClaim.objects.count(), 1)
        claim = ItemClaim.objects.get()
        self.assertEqual(claim.finder, self.user1)
        self.assertEqual(claim.answers['brand'], 'Fossil')
        self.assertTrue(Notification.objects.filter(user=self.user1, reference_id=claim.id, type='claim_request_received').exists())

        history_url = reverse('item-claim-history')
        history_resp = self.client.get(history_url)
        self.assertEqual(history_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(history_resp.data), 1)

    def test_duplicate_claim_is_blocked(self):
        item = Item.objects.create(owner=self.user1, item_type='found', title='Wallet', description='Black wallet', date='2026-05-01')
        ItemClaim.objects.create(
            item=item,
            claimant=self.user2,
            finder=self.user1,
            answers={
                'brand': 'Fossil',
                'unique_marks': 'Blue sticker',
                'item_contents': 'Transit card',
                'additional_details': 'Inside pocket note.',
            },
        )

        self.client.force_authenticate(user=self.user2)
        resp = self.client.post(
            reverse('item-claim-list'),
            {
                'item': item.id,
                'answers': {
                    'brand': 'Fossil',
                    'unique_marks': 'Blue sticker',
                    'item_contents': 'Transit card',
                    'additional_details': 'Inside pocket note.',
                },
            },
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_finder_can_approve_claim(self):
        item = Item.objects.create(owner=self.user1, item_type='found', title='Wallet', description='Black wallet', date='2026-05-01')
        claim = ItemClaim.objects.create(
            item=item,
            claimant=self.user2,
            finder=self.user1,
            answers={
                'brand': 'Fossil',
                'unique_marks': 'Blue sticker',
                'item_contents': 'Transit card',
                'additional_details': 'Inside pocket note.',
            },
        )

        self.client.force_authenticate(user=self.user1)
        resp = self.client.post(
            reverse('item-claim-approve', args=[claim.id]),
            {'verification_notes': 'Matched the initials and card contents.'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        claim.refresh_from_db()
        item.refresh_from_db()
        self.assertEqual(claim.status, ItemClaim.APPROVED)
        self.assertEqual(claim.verification_notes, 'Matched the initials and card contents.')
        self.assertEqual(item.status, Item.RESOLVED)
        self.assertTrue(Notification.objects.filter(user=self.user2, reference_id=claim.id, type='claim_approved').exists())

    def test_finder_can_mark_claim_returned(self):
        item = Item.objects.create(owner=self.user1, item_type='found', title='Wallet', description='Black wallet', date='2026-05-01')
        claim = ItemClaim.objects.create(
            item=item,
            claimant=self.user2,
            finder=self.user1,
            status=ItemClaim.APPROVED,
            answers={
                'brand': 'Fossil',
                'unique_marks': 'Blue sticker',
                'item_contents': 'Transit card',
                'additional_details': 'Inside pocket note.',
            },
        )

        self.client.force_authenticate(user=self.user1)
        resp = self.client.post(reverse('item-claim-mark-returned', args=[claim.id]), {}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        claim.refresh_from_db()
        item.refresh_from_db()
        self.assertEqual(claim.status, ItemClaim.COMPLETED)
        self.assertEqual(item.status, Item.RESOLVED)
        self.assertTrue(Notification.objects.filter(user=self.user2, reference_id=item.id, type='item_returned').exists())

    def test_matching_engine_creates_suggested_match_and_notifications(self):
        lost_item = Item.objects.create(
            owner=self.user1,
            item_type='lost',
            title='Black leather wallet',
            description='Small Fossil wallet with blue sticker and transit card inside',
            category='Wallets',
            location='Main Library Lobby',
            date='2026-05-01',
        )

        self.client.force_authenticate(user=self.user2)
        create_resp = self.client.post(
            reverse('item-list'),
            {
                'item_type': 'found',
                'title': 'Leather wallet found near library',
                'description': 'Black Fossil wallet with blue sticker and transit card inside',
                'category': 'Wallets',
                'location': 'Main Library',
                'status': 'open',
                'date': '2026-05-02',
            },
            format='multipart',
        )

        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ItemMatch.objects.count(), 1)

        match = ItemMatch.objects.get()
        self.assertEqual(match.lost_item, lost_item)
        self.assertEqual(match.found_item.item_type, Item.FOUND)
        self.assertGreater(match.score, 70)
        self.assertEqual(match.status, ItemMatch.SUGGESTED)
        self.assertTrue(Notification.objects.filter(user=self.user1, reference_id=match.id, type='new_match_found').exists())
        self.assertTrue(Notification.objects.filter(user=self.user2, reference_id=match.id, type='new_match_found').exists())
        lost_item.refresh_from_db()
        self.assertEqual(lost_item.status, Item.MATCHED)

    def test_match_confirmation_endpoint(self):
        lost_item = Item.objects.create(
            owner=self.user1,
            item_type='lost',
            title='Black leather wallet',
            description='Small Fossil wallet with blue sticker and transit card inside',
            category='Wallets',
            location='Main Library Lobby',
            date='2026-05-01',
        )
        found_item = Item.objects.create(
            owner=self.user2,
            item_type='found',
            title='Leather wallet found near library',
            description='Black Fossil wallet with blue sticker and transit card inside',
            category='Wallets',
            location='Main Library',
            date='2026-05-02',
        )

        match = ItemMatch.objects.create(
            lost_item=lost_item,
            found_item=found_item,
            score=92,
            status=ItemMatch.SUGGESTED,
            match_reason='High overlap',
        )

        self.client.force_authenticate(user=self.user1)
        resp = self.client.post(reverse('item-match-confirm', args=[match.id]), {}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        match.refresh_from_db()
        self.assertEqual(match.status, ItemMatch.CONFIRMED)

    def test_dashboard_analytics_summary_and_charts(self):
        Item.objects.create(
            owner=self.user1,
            item_type='lost',
            title='Laptop',
            description='Lost near lab',
            category='Electronics',
            status=Item.OPEN,
            date='2026-05-01',
        )
        found_item = Item.objects.create(
            owner=self.user2,
            item_type='found',
            title='Laptop found',
            description='Found in library',
            category='Electronics',
            status=Item.RESOLVED,
            date='2026-05-02',
        )

        ItemClaim.objects.create(
            item=found_item,
            claimant=self.user1,
            finder=self.user2,
            status=ItemClaim.COMPLETED,
            answers={
                'brand': 'Lenovo',
                'unique_marks': 'Sticker on lid',
                'item_contents': 'Charger',
                'additional_details': 'Serial number available',
            },
        )

        ItemMatch.objects.create(
            lost_item=Item.objects.filter(item_type='lost').first(),
            found_item=found_item,
            score=88,
            status=ItemMatch.SUGGESTED,
            match_reason='High confidence',
        )

        self.client.force_authenticate(user=self.user1)
        resp = self.client.get(reverse('item-dashboard-analytics'))

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('summary', resp.data)
        self.assertIn('charts', resp.data)
        self.assertEqual(resp.data['summary']['total_lost_items'], 1)
        self.assertEqual(resp.data['summary']['total_found_items'], 1)
        self.assertEqual(resp.data['summary']['items_successfully_returned'], 1)
        self.assertEqual(resp.data['summary']['matches_generated'], 1)
        self.assertEqual(resp.data['summary']['recovery_success_rate'], 100.0)
        self.assertEqual(len(resp.data['charts']['lost_vs_found_items']), 2)
