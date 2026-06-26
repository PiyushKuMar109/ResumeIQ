# JWT Authentication Fix - Quick Reference

## Problem
```
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid"
}
```

This error occurred on register/login because `authentication_classes = []` was missing.

---

## Solution Applied

### 1. RegisterView (accounts/views.py)
```python
# BEFORE: Missing authentication_classes
class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    # ❌ Uses default JWT auth from settings

# AFTER: Explicitly disable authentication
class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # ✅ Disables JWT auth
```

### 2. LoginView (accounts/views.py)
```python
# BEFORE: Missing authentication_classes
class LoginView(APIView):
    permission_classes = [AllowAny]
    # ❌ Uses default JWT auth from settings

# AFTER: Explicitly disable authentication
class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # ✅ Disables JWT auth
```

### 3. TokenRefreshView (accounts/urls.py)
```python
# BEFORE: Used SimpleJWT's default (has same JWT auth issue)
urlpatterns = [
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# AFTER: Custom wrapper to allow refresh without auth
class PublicTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]
    authentication_classes = []  # ✅ Disables JWT auth

urlpatterns = [
    path('refresh/', PublicTokenRefreshView.as_view(), name='token_refresh'),
]
```

---

## Endpoint Summary

| Endpoint | Method | Auth Required? | Permission Class | Auth Classes |
|----------|--------|----------------|------------------|--------------|
| `/api/auth/register/` | POST | ❌ No | AllowAny | [] |
| `/api/auth/login/` | POST | ❌ No | AllowAny | [] |
| `/api/auth/refresh/` | POST | ❌ No | AllowAny | [] |
| `/api/auth/profile/` | GET | ✅ Yes | IsAuthenticated | (default JWT) |
| `/api/auth/profile/` | PUT | ✅ Yes | IsAuthenticated | (default JWT) |
| `/api/auth/logout/` | POST | ✅ Yes | IsAuthenticated | (default JWT) |
| `/api/auth/profile/revoke/` | POST | ✅ Yes | IsAuthenticated | (default JWT) |

---

## Postman Setup

### Step 1: Import Collection
File → Import → Select `Postman_JWT_Test_Collection.json`

### Step 2: Test Public Endpoints
```
Authorization: None (or type "No Auth")
```
- Register
- Login
- Refresh

### Step 3: Test Protected Endpoints
```
Authorization: Bearer <access_token>
```
- Profile
- Logout

---

## Key Concepts

### Authentication vs Permission

```python
# Authentication: WHO are you? (How to verify identity)
authentication_classes = [
    'rest_framework_simplejwt.authentication.JWTAuthentication',
]

# Permission: WHAT can you do? (What actions are allowed)
permission_classes = [
    'rest_framework.permissions.IsAuthenticated',
    'rest_framework.permissions.AllowAny',
]
```

### Request Processing

```
1. Authentication runs (extracts credentials)
   ↓
2. Permission check runs (validates credentials)
   ↓
3. View executes (if both pass)
```

**Critical:** If authentication fails, permission check never runs!

---

## Test Checklist

### Public Endpoints (No JWT)
- [ ] Register - 201 Created ✅
- [ ] Login - 200 OK ✅
- [ ] Refresh - 200 OK ✅

### Protected Endpoints (JWT Required)
- [ ] Profile - 200 OK (with token) ✅
- [ ] Profile - 401 Unauthorized (without token) ✅
- [ ] Logout - 200 OK (with token) ✅
- [ ] Logout - 401 Unauthorized (without token) ✅

### Error Cases
- [ ] Invalid token - 401 ❌
- [ ] Expired token - 401 ❌
- [ ] Malformed token - 401 ❌

---

## Files Modified

| File | Change | Status |
|------|--------|--------|
| `accounts/views.py` | Added `authentication_classes = []` to RegisterView | ✅ |
| `accounts/views.py` | Added `authentication_classes = []` to LoginView | ✅ |
| `accounts/urls.py` | Created PublicTokenRefreshView | ✅ |
| `config/settings.py` | No changes needed | ✅ |
| `accounts/backends.py` | No changes needed | ✅ |

---

## Token Response Example

### Login Response
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "USER"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Using Access Token
```
GET /api/auth/profile/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Refresh Token
```
POST /api/auth/refresh/
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
→ Returns new "access" token
```

---

## Troubleshooting

### Still Getting Token Error?

1. **Clear all old variables:**
   - Postman Variables → Reset access_token
   - Browser DevTools → Clear Storage

2. **Verify authentication_classes in code:**
   ```python
   # Must have this line
   authentication_classes = []
   ```

3. **Check request header:**
   - Register/Login: NO Authorization header
   - Profile: `Authorization: Bearer <token>`

4. **Restart Django:**
   ```bash
   python manage.py runserver
   ```

5. **Check migrations:**
   ```bash
   python manage.py migrate
   ```

---

## Settings Reference

### Current JWT Configuration (Correct)
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
}
```

---

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 on register | Missing `authentication_classes = []` | Add it to RegisterView |
| 401 on login | Missing `authentication_classes = []` | Add it to LoginView |
| 401 on refresh | Missing in PublicTokenRefreshView | Use custom wrapper |
| 403 on profile | No token in header | Add `Authorization: Bearer <token>` |
| Token expired | Access token lifetime exceeded | Call refresh endpoint |
| 422 on register | Invalid request body | Check required fields |

---

## Next Steps

1. ✅ Apply the fixes (done)
2. ⏭️ Run migrations: `python manage.py migrate`
3. ⏭️ Start server: `python manage.py runserver`
4. ⏭️ Test with Postman collection
5. ⏭️ Integrate with frontend

---

## Resources

- Full guide: `JWT_AUTHENTICATION_FIX.md`
- Setup & testing: `SETUP_AND_TEST_GUIDE.md`
- Postman collection: `Postman_JWT_Test_Collection.json`

---

**Status:** ✅ Fixed and Ready for Testing
