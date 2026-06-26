# JWT Authentication Fix - Code Changes

## File 1: `accounts/views.py`

### Change 1: RegisterView
```python
# BEFORE
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        # ...

# AFTER
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    authentication_classes = []  # ← ADDED THIS LINE
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        # ...
```

### Change 2: LoginView
```python
# BEFORE
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        # ...

# AFTER
class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # ← ADDED THIS LINE

    def post(self, request, *args, **kwargs):
        # ...
```

### Unchanged Views
```python
# These are CORRECT and require no changes
# (They need JWT authentication)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    # ✅ No authentication_classes = [] (uses default JWT auth)
    # ✅ Correctly requires JWT token


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    # ✅ No authentication_classes = [] (uses default JWT auth)
    # ✅ Correctly requires JWT token


class RevokeTokenView(APIView):
    permission_classes = [IsAuthenticated]
    # ✅ No authentication_classes = [] (uses default JWT auth)
    # ✅ Correctly requires JWT token
```

---

## File 2: `accounts/urls.py`

### Complete Updated File
```python
# BEFORE
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    ProfileView,
    RevokeTokenView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # ← PROBLEM: Uses default JWT auth
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/revoke/', RevokeTokenView.as_view(), name='token_revoke'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/update/', ProfileView.as_view(), name='profile_update'),
]

# AFTER
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.permissions import AllowAny  # ← ADDED IMPORT
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    ProfileView,
    RevokeTokenView,
)


# ← ADDED NEW CLASS
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
    path('refresh/', PublicTokenRefreshView.as_view(), name='token_refresh'),  # ← FIXED: Uses custom class
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/revoke/', RevokeTokenView.as_view(), name='token_revoke'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/update/', ProfileView.as_view(), name='profile_update'),
]
```

---

## File 3: `config/settings.py`

### NO CHANGES NEEDED ✅

Your JWT configuration is already correct:

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
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

---

## File 4: `accounts/backends.py`

### NO CHANGES NEEDED ✅

Your email authentication backend is already correct:

```python
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q


class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        User = get_user_model()
        try:
            # Try to get user by email (username field in our case)
            user = User.objects.get(Q(email=username) | Q(username=username))
        except User.DoesNotExist:
            return None
        else:
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
        return None
```

---

## File 5: `accounts/serializers.py`

### NO CHANGES NEEDED ✅

Your serializers are already correct:

```python
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'role', 'created_at', 'updated_at']
        read_only_fields = ['id', 'email', 'created_at', 'updated_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    department = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ['full_name', 'email', 'password', 'role', 'first_name', 'last_name', 'phone_number', 'department']

    def create(self, validated_data):
        password = validated_data.pop('password')
        first_name = (validated_data.pop('first_name', '') or '').strip()
        last_name = (validated_data.pop('last_name', '') or '').strip()
        full_name = (validated_data.get('full_name') or '').strip()

        if not full_name:
            full_name = f"{first_name} {last_name}".strip()

        validated_data.pop('department', None)

        user = User.objects.create_user(
            full_name=full_name,
            password=password,
            **validated_data,
        )
        return user


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.full_name
        return token


class LoginResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    user = UserSerializer()
    access = serializers.CharField()
    refresh = serializers.CharField()
```

---

## Summary of Changes

| File | Changes | Critical? |
|------|---------|-----------|
| `accounts/views.py` | Line 20: Add `authentication_classes = []` to RegisterView | ✅ YES |
| `accounts/views.py` | Line 43: Add `authentication_classes = []` to LoginView | ✅ YES |
| `accounts/urls.py` | Add `PublicTokenRefreshView` class (lines 8-16) | ✅ YES |
| `accounts/urls.py` | Update refresh path to use `PublicTokenRefreshView` | ✅ YES |
| `config/settings.py` | No changes | ✅ Already OK |
| `accounts/backends.py` | No changes | ✅ Already OK |
| `accounts/serializers.py` | No changes | ✅ Already OK |

---

## Verification

### Check RegisterView
```bash
grep -A 3 "class RegisterView" backend/accounts/views.py
```

Should show:
```
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    authentication_classes = []  # ← MUST BE HERE
```

### Check LoginView
```bash
grep -A 2 "class LoginView" backend/accounts/views.py
```

Should show:
```
class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # ← MUST BE HERE
```

### Check URLs
```bash
grep -A 1 "PublicTokenRefreshView" backend/accounts/urls.py
```

Should show:
```
class PublicTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]
    authentication_classes = []
```

---

## Testing After Changes

### 1. Register (should work - NO JWT required)
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"full_name":"John","email":"john@example.com","password":"Test123!"}'
```

**Expected:** 201 Created ✅

### 2. Login (should work - NO JWT required)
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Test123!"}'
```

**Expected:** 200 OK ✅

### 3. Profile without JWT (should fail)
```bash
curl -X GET http://localhost:8000/api/auth/profile/
```

**Expected:** 401 Unauthorized ✅

### 4. Profile with JWT (should work)
```bash
curl -X GET http://localhost:8000/api/auth/profile/ \
  -H "Authorization: Bearer <access_token>"
```

**Expected:** 200 OK ✅

---

## Applied Changes Confirmation

✅ `RegisterView` - Added `authentication_classes = []`
✅ `LoginView` - Added `authentication_classes = []`
✅ `urls.py` - Added `PublicTokenRefreshView` class
✅ Settings - Already correct
✅ Backend - Already correct
✅ Serializers - Already correct

**All changes have been successfully applied!** 🚀
