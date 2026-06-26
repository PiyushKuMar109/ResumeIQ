from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

class AccountsTestCase(APITestCase):
    def setUp(self):
        self.candidate_email = "candidate@test.com"
        self.candidate_password = "Password123!"
        self.candidate = User.objects.create_user(
            email=self.candidate_email,
            password=self.candidate_password,
            role="USER",
            full_name="John Doe"
        )

    def test_user_creation_error_no_email(self):
        """Test user manager raises value error when email is absent."""
        with self.assertRaises(ValueError):
            User.objects.create_user(email="")

    def test_registration_api(self):
        """Test registering a new user via API."""
        url = reverse('register')
        data = {
            "email": "newuser@test.com",
            "password": "SecurePassword123!",
            "full_name": "New User",
            "role": "USER",
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(User.objects.filter(email="newuser@test.com").count(), 1)

    def test_login_jwt(self):
        """Test obtaining JWT tokens upon login."""
        url = reverse('login')
        data = {
            "email": self.candidate_email,
            "password": self.candidate_password
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_profile_retrieve_update(self):
        """Test retrieving and updating authenticated user profile."""
        login_url = reverse('login')
        login_response = self.client.post(login_url, {
            "email": self.candidate_email,
            "password": self.candidate_password
        }, format='json')

        access_token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        profile_url = reverse('profile')
        response = self.client.get(profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.candidate_email)

        update_data = {"full_name": "Johnny Doe"}
        response = self.client.patch(profile_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['full_name'], "Johnny Doe")
