from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class AuthTests(APITestCase):
    def test_signup_and_login(self):
        url = reverse('signup')
        payload = {
            'email': 'alice@example.com',
            'full_name': 'Alice',
            'password': 'strongpassword123',
            'password_confirm': 'strongpassword123',
        }
        resp = self.client.post(url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', resp.data)
        self.assertIn('refresh', resp.data)
        self.assertIn('user', resp.data)

        # Login
        login_url = reverse('login')
        login_resp = self.client.post(login_url, {'email': 'alice@example.com', 'password': 'strongpassword123'}, format='json')
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_resp.data)
        self.assertIn('refresh', login_resp.data)
