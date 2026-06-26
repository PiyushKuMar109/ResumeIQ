# JWT Authentication Fix - Comprehensive Guide

## Problem Summary

**Error:** `"detail": "Given token not valid for any token type"`

This error occurred when calling register and login APIs without an Authorization header because:
- `RegisterView` and `LoginView` were missing `authentication_classes = []`
- Django REST Framework defaulted to `JWTAuthentication` from settings
- JWT authentication ran BEFORE permission checks
- JWT authentication failed (no token provided) → error returned immediately
- `AllowAny` permission was never evaluated

## Root Cause

### Authentication vs Permission Classes

```python
# WRONG - Missing authentication_classes
class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]  # Only permission check
    serializer_class = RegisterSerializer
    # Uses default: JWTAuthentication from settings
    # Result: JWT is checked BEFORE AllowAny permission
```

```python
# CORRECT - Explicit authentication_classes
class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # NO authentication required
    serializer_class = RegisterSerializer
    # Result: No JWT check, AllowAny permission passes
```

### Request Processing Order

**Before Fix (Broken):**
```
1. Authentication runs (JWTAuthentication - default)
   └─ Tries to extract bearer token
   └─ No token found → AuthenticationFailed exception
   └─ ERROR RETURNED: "Given token not valid for any token type"
2. Permission check never runs
3. View never executes
```

**After Fix (Working):**
```
1. No authentication (authentication_classes = [])
2. Permission check runs (AllowAny)
   └─ Passes because no authentication required
3. View executes successfully
```

## Changes Made

### 1. `accounts/views.py` - RegisterView & LoginView

**Added `authentication_classes = []`:**

```python
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    authentication_classes = []  # ← FIX: Explicitly disable authentication
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token_data = MyTokenObtainPairSerializer.get_token(user)
        access = str(token_data.access_token)
        refresh = str(token_data)

        return Response({
            'success': True,
            'message': 'User registered successfully',
            'user': UserSerializer(user).data,
            'access': access,
            'refresh': refresh,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # ← FIX: Explicitly disable authentication

    def post(self, request, *args, **kwargs):
        from rest_framework_simplejwt.tokens import RefreshToken
        
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'success': False,
                'message': 'Email and password are required',
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate using email
        from django.contrib.auth import authenticate
        user = authenticate(request, username=email, password=password)
        
        if not user:
            return Response({
                'success': False,
                'message': 'Invalid credentials',
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        
        return Response({
            'success': True,
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'access': access,
            'refresh': str(refresh),
        }, status=status.HTTP_200_OK)
```

### 2. `accounts/urls.py` - PublicTokenRefreshView

**Created custom TokenRefreshView for public access:**

```python
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.permissions import AllowAny
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    ProfileView,
    RevokeTokenView,
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
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/revoke/', RevokeTokenView.as_view(), name='token_revoke'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/update/', ProfileView.as_view(), name='profile_update'),
]
```

**Why custom TokenRefreshView?**
- SimpleJWT's `TokenRefreshView` doesn't explicitly set `authentication_classes`
- It inherits defaults from settings → fails with same JWT error
- Custom wrapper allows refresh without access token

## Configuration Reference

### `config/settings.py` (Already Correct)

```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_AUTHENTICATION_RULE': lambda user: user.is_active,
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}
```

### `accounts/backends.py` (Already Correct)

```python
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q


class EmailBackend(ModelBackend):
    """
    Authentication backend that allows login with email or username.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        User = get_user_model()
        try:
            # Try to get user by email or username
            user = User.objects.get(Q(email=username) | Q(username=username))
        except User.DoesNotExist:
            return None
        else:
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
        return None
```

## API Endpoints Configuration

### Public Endpoints (No JWT Required)

```
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/refresh/
```

**Postman Configuration:**
- Authorization: None (or type: "No Auth")
- No Authorization header needed
- Request body: JSON with credentials

### Protected Endpoints (JWT Required)

```
GET  /api/auth/profile/
PUT  /api/auth/profile/
POST /api/auth/logout/
POST /api/resumes/upload/
GET  /api/resumes/
POST /api/analysis/analyze/
```

**Postman Configuration:**
- Authorization: Bearer Token
- Token: `<access_token_from_login>`
- Header sent: `Authorization: Bearer <access_token>`

## Complete Test Flow

### 1. Register (No JWT)
```bash
POST http://localhost:8000/api/auth/register/
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "role": "USER"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "user": { "id": 1, "email": "john@example.com", ... },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 2. Login (No JWT)
```bash
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepass123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "user": { "id": 1, "email": "john@example.com", ... },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 3. Get Profile (With JWT)
```bash
GET http://localhost:8000/api/auth/profile/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...

Response:
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": { "id": 1, "email": "john@example.com", ... }
}
```

### 4. Refresh Token (No JWT - but uses refresh token)
```bash
POST http://localhost:8000/api/auth/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..." (new access token),
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..." (optionally new refresh token)
}
```

### 5. Logout (With JWT)
```bash
POST http://localhost:8000/api/auth/logout/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGM..."
}

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Best Practices Applied

### 1. **Explicit is Better Than Implicit**
- Always explicitly set `authentication_classes` and `permission_classes`
- Don't rely on defaults unless intentional

### 2. **Public Endpoints Pattern**
```python
class PublicAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # Explicitly disable
```

### 3. **Protected Endpoints Pattern**
```python
class ProtectedAPIView(APIView):
    permission_classes = [IsAuthenticated]
    # Uses default authentication from settings
```

### 4. **Token Generation Best Practice**
```python
from rest_framework_simplejwt.tokens import RefreshToken

refresh = RefreshToken.for_user(user)
access = str(refresh.access_token)

return Response({
    'access': access,
    'refresh': str(refresh),
    'user': UserSerializer(user).data
})
```

### 5. **Email Authentication Backend**
- Allows login with email (common in modern apps)
- Falls back to username
- Supports the `authenticate()` function

## Summary of Changes

| File | Change | Reason |
|------|--------|--------|
| `accounts/views.py` | Added `authentication_classes = []` to `RegisterView` | Disable JWT auth for public register endpoint |
| `accounts/views.py` | Added `authentication_classes = []` to `LoginView` | Disable JWT auth for public login endpoint |
| `accounts/urls.py` | Created `PublicTokenRefreshView` wrapper | Disable JWT auth for refresh endpoint |
| `config/settings.py` | No changes (already correct) | Global JWT config is correct |
| `accounts/backends.py` | No changes (already correct) | Email backend works as expected |

## Troubleshooting

### Still Getting "token_not_valid" Error?

1. **Clear browser cache and Postman** - Old tokens may be cached
2. **Check Authorization header** - Should be `Authorization: Bearer <token>`
3. **Verify endpoints** - Register/Login should have NO Authorization header
4. **Check timestamp** - Tokens expire; use refresh endpoint
5. **Database migration** - Ensure all migrations applied: `python manage.py migrate`

### Token Expired?

Use the refresh endpoint:
```bash
POST /api/auth/refresh/
{
  "refresh": "<old_refresh_token>"
}
```

This returns a new access token without logging in again.

## Next Steps

1. **Test all endpoints** with Postman (see test flow above)
2. **Frontend integration** - Use Bearer token in headers for protected APIs
3. **Token storage** - Store in secure httpOnly cookies or localStorage
4. **Logout flow** - Blacklist refresh token on logout (already implemented)
5. **Monitor token expiry** - Refresh when access token expires

---

**Author's Note:** This configuration follows Django REST Framework + SimpleJWT best practices and is production-ready.
