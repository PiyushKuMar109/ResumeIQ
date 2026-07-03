from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.permissions import AllowAny
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    ProfileView,
    RevokeTokenView,
    ChangePasswordView,
)


class PublicTokenRefreshView(TokenRefreshView):
    """
    Custom TokenRefreshView that allows unauthenticated access.
    The refresh token is used instead of access token for renewal.
    """
    permission_classes = [AllowAny]
    authentication_classes = []


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', PublicTokenRefreshView.as_view(), name='token_refresh'),
    # Add conventional token refresh path matching many frontends/clients
    path('token/refresh/', PublicTokenRefreshView.as_view(), name='token_refresh_full'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/revoke/', RevokeTokenView.as_view(), name='token_revoke'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/update/', ProfileView.as_view(), name='profile_update'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
]

