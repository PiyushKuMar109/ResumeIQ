# JWT Authentication - Setup & Testing Guide

## Quick Start

### 1. Run Migrations
```bash
cd backend
python manage.py migrate
```

### 2. Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

### 3. Start Django Server
```bash
python manage.py runserver
```

Server runs at: `http://localhost:8000`

---

## Testing with Postman

### Step 1: Import Test Collection

1. Open Postman
2. Click **Import** (top-left)
3. Select **File** → Choose `Postman_JWT_Test_Collection.json`
4. Collection imported with all test cases

### Step 2: Set Environment Variables

In Postman, update variables in the collection:
- `base_url`: `http://localhost:8000` (default)
- `access_token`: (Leave empty, will be filled after login)
- `refresh_token`: (Leave empty, will be filled after login)

### Step 3: Run Tests in Order

#### Test 1: Register New User ✅ No Auth Required
```
POST http://localhost:8000/api/auth/register/
```

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "TestPassword123!",
  "role": "USER"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Action:** Copy `access` and `refresh` tokens and save to Postman variables.

---

#### Test 2: Login User ✅ No Auth Required
```
POST http://localhost:8000/api/auth/login/
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "TestPassword123!"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Action:** Update Postman variables with new tokens.

---

#### Test 3: Get Profile ✅ JWT Required
```
GET http://localhost:8000/api/auth/profile/
Authorization: Bearer <access_token>
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

#### Test 4: Refresh Token ✅ No Auth Required (uses refresh token)
```
POST http://localhost:8000/api/auth/refresh/
```

**Request Body:**
```json
{
  "refresh": "<refresh_token>"
}
```

**Expected Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..." (new access token),
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..." (optionally rotated)
}
```

**Action:** Update access_token variable in Postman.

---

#### Test 5: Update Profile ✅ JWT Required
```
PUT http://localhost:8000/api/auth/profile/
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "full_name": "John Updated Doe"
}
```

**Expected Response (200 OK):**
```json
{
  "id": 1,
  "full_name": "John Updated Doe",
  "email": "john@example.com",
  "role": "USER",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

#### Test 6: Logout ✅ JWT Required
```
POST http://localhost:8000/api/auth/logout/
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refresh": "<refresh_token>"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Note:** After logout, the refresh token is blacklisted and cannot be used.

---

### Step 4: Test Error Cases

#### Test 7: Invalid Token ❌
```
GET http://localhost:8000/api/auth/profile/
Authorization: Bearer invalid.token.here
```

**Expected Response (401 Unauthorized):**
```json
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid",
  "messages": [
    {
      "token_class": "AccessToken",
      "token_type": "access",
      "message": "Token is invalid"
    }
  ]
}
```

---

#### Test 8: Missing Token ❌
```
GET http://localhost:8000/api/auth/profile/
(No Authorization header)
```

**Expected Response (401 Unauthorized):**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "TestPassword123!",
    "role": "USER"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "TestPassword123!"
  }'
```

### Get Profile (Replace TOKEN with actual access token)
```bash
curl -X GET http://localhost:8000/api/auth/profile/ \
  -H "Authorization: Bearer TOKEN"
```

### Refresh Token
```bash
curl -X POST http://localhost:8000/api/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "REFRESH_TOKEN"
  }'
```

---

## Testing with Python Requests

```python
import requests

BASE_URL = "http://localhost:8000/api/auth"

# Register
register_data = {
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "TestPassword123!",
    "role": "USER"
}
register_response = requests.post(f"{BASE_URL}/register/", json=register_data)
print("Register:", register_response.json())

# Login
login_data = {
    "email": "john@example.com",
    "password": "TestPassword123!"
}
login_response = requests.post(f"{BASE_URL}/login/", json=login_data)
tokens = login_response.json()
access_token = tokens['access']
refresh_token = tokens['refresh']
print("Login:", login_response.json())

# Get Profile
headers = {"Authorization": f"Bearer {access_token}"}
profile_response = requests.get(f"{BASE_URL}/profile/", headers=headers)
print("Profile:", profile_response.json())

# Refresh Token
refresh_data = {"refresh": refresh_token}
refresh_response = requests.post(f"{BASE_URL}/refresh/", json=refresh_data)
print("Refresh:", refresh_response.json())

# Logout
logout_data = {"refresh": refresh_token}
logout_response = requests.post(f"{BASE_URL}/logout/", headers=headers, json=logout_data)
print("Logout:", logout_response.json())
```

---

## Common Issues & Solutions

### Issue 1: "Given token not valid for any token type"

**Cause:** Missing `authentication_classes = []` (THE BUG - now fixed)

**Solution:** Applied in this fix. Verify:
```python
class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # ← This line is essential
```

---

### Issue 2: "Authentication credentials were not provided."

**Cause:** Protected endpoint called without Authorization header

**Solution:** Add Authorization header:
```
Authorization: Bearer <access_token>
```

---

### Issue 3: Token Expired

**Cause:** Access token lifetime exceeded (default: 60 minutes)

**Solution:** Use refresh endpoint:
```bash
POST /api/auth/refresh/
{
  "refresh": "<refresh_token>"
}
```

---

### Issue 4: Invalid Refresh Token

**Cause:** Refresh token expired (default: 7 days) or blacklisted

**Solution:** Login again to get new tokens

---

### Issue 5: CORS Error

**Cause:** Frontend URL not in CORS_ALLOWED_ORIGINS

**Solution:** Update `settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',  # Vite frontend
    'http://localhost:3000',  # React
    'http://127.0.0.1:5173',
]
```

---

## Protected API Endpoints

These endpoints now properly require JWT:

```
GET    /api/auth/profile/           - Get user profile
PUT    /api/auth/profile/           - Update profile
POST   /api/auth/logout/            - Logout

POST   /api/resumes/upload/         - Upload resume
GET    /api/resumes/                - List resumes

POST   /api/analysis/analyze/       - Analyze resume
```

All should include: `Authorization: Bearer <access_token>`

---

## Token Structure

### Access Token Payload (JWT)
```json
{
  "token_type": "access",
  "exp": 1642255800,           // Expires in 60 minutes
  "iat": 1642252200,
  "jti": "abc123...",
  "user_id": 1,
  "email": "john@example.com",
  "role": "USER",
  "full_name": "John Doe"
}
```

### Refresh Token Payload (JWT)
```json
{
  "token_type": "refresh",
  "exp": 1642860600,           // Expires in 7 days
  "iat": 1642255800,
  "jti": "xyz789..."
}
```

---

## Security Best Practices

1. **Store tokens securely:**
   - Refresh token: HttpOnly cookie (most secure)
   - Access token: Memory or secure storage

2. **Use HTTPS in production**

3. **Set short access token lifetime:**
   ```python
   'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15)  # Short-lived
   ```

4. **Implement token rotation:**
   ```python
   'ROTATE_REFRESH_TOKENS': True
   'BLACKLIST_AFTER_ROTATION': True
   ```

5. **Never expose tokens in logs**

---

## Verification Checklist

- [ ] Register endpoint works WITHOUT auth
- [ ] Login endpoint works WITHOUT auth  
- [ ] Refresh endpoint works WITHOUT auth (using refresh token)
- [ ] Profile endpoint requires valid JWT
- [ ] Update profile requires valid JWT
- [ ] Logout requires valid JWT
- [ ] Invalid token returns 401
- [ ] Missing token returns 401
- [ ] Tokens have correct expiry times
- [ ] Token contains user claims (email, role, full_name)

---

## Summary of Changes

✅ **Fixed:** Added `authentication_classes = []` to public endpoints
✅ **Fixed:** Created `PublicTokenRefreshView` for refresh endpoint
✅ **Verified:** Settings.py has correct JWT configuration
✅ **Verified:** EmailBackend supports email authentication
✅ **Protected:** Resume and analysis endpoints require JWT

Your authentication is now production-ready! 🚀
