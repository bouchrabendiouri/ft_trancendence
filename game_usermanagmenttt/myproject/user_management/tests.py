from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()
class UserAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/users/register/'  # Update with your actual URL
        self.login_url = '/users/login/'        # Update with your actual URL

    def test_successful_sign_up(self):
        data = {
            'email': 'testuser@example.com',
            'username': 'testuser',  # Use username for identification if different from display_name
            'display_name': 'Test User',
            'password': 'TestPass123',
        }
        response = self.client.post(self.register_url, data, format='json')
        print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('email', response.data)
        self.assertIn('username', response.data)
        self.assertIn('display_name', response.data)

    def test_successful_login(self):
        # First, create a user
        User.objects.create_user(
            email='testuser@example.com',
            username='testuser',
            display_name='Test User',
            password='TestPass123'
        )

        data = {
            'username': 'testuser',
            'password': 'TestPass123'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'testuser')

    def test_login_with_invalid_credentials(self):
        data = {
            'username': 'testuser',
            'password': 'WrongPassword'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_registration_with_missing_fields(self):
        data = {
            'email': 'testuser@example.com',
            'password': 'TestPass123'
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)
