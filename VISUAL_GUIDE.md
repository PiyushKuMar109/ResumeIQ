# JWT Authentication - Visual Guide

## 🔄 Request Flow Comparison

### BEFORE (Broken) ❌
```
┌─────────────────────────────────────┐
│  POST /api/auth/register/           │
│  (No Authorization header)          │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ DRF Request Processing              │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ STEP 1: Authentication (forced)     │
│ Using default from settings:        │
│ JWTAuthentication                   │
└────────────┬────────────────────────┘
             │
             ▼
    ┌────────────────────────┐
    │ Try to extract bearer  │
    │ token from header      │
    │ Header: (empty)        │
    └────────────┬───────────┘
                 │
                 ▼
    ┌────────────────────────┐
    │ ❌ Authentication      │
    │    Failed              │
    └────────────┬───────────┘
                 │
                 ▼
         ┌───────────────┐
         │ ERROR: 401    │
         │ "Given token  │
         │ not valid..." │
         └───────────────┘

PERMISSION CHECK NEVER RUNS! ⚠️
```

### AFTER (Fixed) ✅
```
┌─────────────────────────────────────┐
│  POST /api/auth/register/           │
│  (No Authorization header)          │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ DRF Request Processing              │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ STEP 1: Authentication              │
│ authentication_classes = []         │
│ (Explicitly disabled)               │
└────────────┬────────────────────────┘
             │
             ▼
    ┌────────────────────────┐
    │ ✅ No authentication   │
    │    runs!               │
    └────────────┬───────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ STEP 2: Permission Check            │
│ permission_classes = [AllowAny]     │
└────────────┬────────────────────────┘
             │
             ▼
    ┌────────────────────────┐
    │ ✅ AllowAny allows     │
    │    the request         │
    └────────────┬───────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ STEP 3: View Executes               │
│ Return user data + tokens           │
└────────────┬────────────────────────┘
             │
             ▼
         ┌───────────────┐
         │ SUCCESS: 201  │
         │ User created  │
         │ Tokens issued │
         └───────────────┘

ALL STEPS EXECUTED! 🎉
```

---

## 🔐 Authentication vs Permission

```
┌────────────────────────────────────────────────────────────┐
│          Django REST Framework Request Processing          │
└────────────────────────────────────────────────────────────┘

STEP 1: AUTHENTICATION
┌────────────────────────────────────────────────────────────┐
│  authentication_classes = [JWTAuthentication]              │
│                                                            │
│  Q: WHO are you? (Verify identity)                         │
│                                                            │
│  Does the request have valid credentials?                  │
│  ├─ Bearer token?                                          │
│  ├─ Valid signature?                                       │
│  ├─ Not expired?                                           │
│  └─ Active user?                                           │
│                                                            │
│  Result:                                                   │
│  ├─ ✅ Pass → Continue to Permission Check                 │
│  └─ ❌ Fail → Return 401 Unauthorized (STOPS HERE)         │
└────────────────────────────────────────────────────────────┘

STEP 2: PERMISSION CHECK (only if auth passed)
┌────────────────────────────────────────────────────────────┐
│  permission_classes = [IsAuthenticated]                    │
│                                                            │
│  Q: WHAT can you do? (Check authorization)                 │
│                                                            │
│  Is this user allowed to perform this action?              │
│  ├─ Is user authenticated?                                 │
│  ├─ Has required role?                                     │
│  ├─ Is object owner?                                       │
│  └─ Passes custom rules?                                   │
│                                                            │
│  Result:                                                   │
│  ├─ ✅ Pass → Continue to View Execution                   │
│  └─ ❌ Fail → Return 403 Forbidden (STOPS HERE)            │
└────────────────────────────────────────────────────────────┘

STEP 3: VIEW EXECUTION (only if both passed)
┌────────────────────────────────────────────────────────────┐
│  Execute the view method                                   │
│  ├─ Process request data                                   │
│  ├─ Perform business logic                                 │
│  ├─ Return response                                        │
│  └─ Status: 200, 201, 202, etc. (success)                  │
└────────────────────────────────────────────────────────────┘
```

---

## 📊 Endpoint Classification Matrix

```
                    Authentication          Permission          Public?
                    ──────────────────────────────────────────────────────

Register            authentication_classes  permission_classes  ✅ YES
                    = []                    = [AllowAny]
                    (Disabled)              (Allow all)

Login               authentication_classes  permission_classes  ✅ YES
                    = []                    = [AllowAny]
                    (Disabled)              (Allow all)

Refresh             authentication_classes  permission_classes  ✅ YES
                    = []                    = [AllowAny]
                    (Disabled)              (Allow all)

Profile (GET)       (uses default)          permission_classes  ❌ NO
                    JWTAuthentication       = [IsAuthenticated]
                    (Enabled)               (Only auth users)

Profile (PUT)       (uses default)          permission_classes  ❌ NO
                    JWTAuthentication       = [IsAuthenticated]
                    (Enabled)               (Only auth users)

Logout              (uses default)          permission_classes  ❌ NO
                    JWTAuthentication       = [IsAuthenticated]
                    (Enabled)               (Only auth users)

Upload Resume       (uses default)          permission_classes  ❌ NO
                    JWTAuthentication       = [IsAuthenticated]
                    (Enabled)               (Only auth users)

Analyze Resume      (uses default)          permission_classes  ❌ NO
                    JWTAuthentication       = [IsAuthenticated]
                    (Enabled)               (Only auth users)
```

---

## 🎯 Token Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    JWT TOKEN LIFECYCLE                      │
└─────────────────────────────────────────────────────────────┘

1️⃣  USER REGISTERS
    POST /api/auth/register/
    ├─ No token needed ✅
    └─ Response:
       ├─ access: "eyJ0eXAi..." (expires in 60 min)
       └─ refresh: "eyJ0eXAi..." (expires in 7 days)

2️⃣  USER LOGS IN
    POST /api/auth/login/
    ├─ No token needed ✅
    └─ Response:
       ├─ access: "eyJ0eXAi..." (new, expires in 60 min)
       └─ refresh: "eyJ0eXAi..." (new, expires in 7 days)

3️⃣  USE ACCESS TOKEN
    GET /api/auth/profile/
    ├─ Authorization: Bearer <access_token> ✅
    ├─ Token checked: Valid? Expired? Blacklisted?
    └─ Response: 200 OK (user data)

4️⃣  ACCESS TOKEN EXPIRES (after 60 minutes)
    GET /api/auth/profile/
    ├─ Authorization: Bearer <expired_token> ❌
    └─ Response: 401 Unauthorized
       ("Token is invalid or expired")

5️⃣  REFRESH TOKEN TO GET NEW ACCESS TOKEN
    POST /api/auth/refresh/
    ├─ refresh: "<refresh_token>" ✅
    ├─ No Authorization header needed
    └─ Response:
       ├─ access: "eyJ0eXAi..." (new, expires in 60 min)
       └─ refresh: "eyJ0eXAi..." (new, expires in 7 days)

6️⃣  USE NEW ACCESS TOKEN
    GET /api/auth/profile/
    ├─ Authorization: Bearer <new_access_token> ✅
    └─ Response: 200 OK (user data)

7️⃣  LOGOUT
    POST /api/auth/logout/
    ├─ Authorization: Bearer <access_token> ✅
    ├─ refresh: "<refresh_token>"
    └─ Response: 200 OK
       └─ Refresh token blacklisted (can't reuse)

8️⃣  TRY TO USE BLACKLISTED TOKEN
    POST /api/auth/refresh/
    ├─ refresh: "<blacklisted_token>" ❌
    └─ Response: 401 Unauthorized
       ("Token is blacklisted")

9️⃣  LOGIN AGAIN
    POST /api/auth/login/
    └─ Back to step 2️⃣
```

---

## 🔒 Public vs Protected Endpoints

```
PUBLIC ENDPOINTS (authentication_classes = [])
┌──────────────────────────────────────────────────┐
│  POST /api/auth/register/                        │
│  Authorization: ❌ None (or type: "No Auth")    │
│  Expected: 201 Created (user + tokens)          │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  POST /api/auth/login/                           │
│  Authorization: ❌ None (or type: "No Auth")    │
│  Expected: 200 OK (user + tokens)               │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  POST /api/auth/refresh/                         │
│  Authorization: ❌ None (or type: "No Auth")    │
│  Body: { refresh: "..." }                        │
│  Expected: 200 OK (new access token)            │
└──────────────────────────────────────────────────┘


PROTECTED ENDPOINTS (permission_classes = [IsAuthenticated])
┌──────────────────────────────────────────────────┐
│  GET /api/auth/profile/                          │
│  Authorization: ✅ Bearer <access_token>        │
│  Expected: 200 OK (user profile)                │
│  Without token: 401 Unauthorized                │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  PUT /api/auth/profile/                          │
│  Authorization: ✅ Bearer <access_token>        │
│  Expected: 200 OK (updated profile)             │
│  Without token: 401 Unauthorized                │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  POST /api/auth/logout/                          │
│  Authorization: ✅ Bearer <access_token>        │
│  Body: { refresh: "..." }                        │
│  Expected: 200 OK (logout success)              │
│  Without token: 401 Unauthorized                │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  POST /api/resumes/upload/                       │
│  Authorization: ✅ Bearer <access_token>        │
│  Expected: 201 Created (resume uploaded)        │
│  Without token: 401 Unauthorized                │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  GET /api/resumes/                               │
│  Authorization: ✅ Bearer <access_token>        │
│  Expected: 200 OK (resume list)                 │
│  Without token: 401 Unauthorized                │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  POST /api/analysis/analyze/                     │
│  Authorization: ✅ Bearer <access_token>        │
│  Expected: 201 Created (analysis result)        │
│  Without token: 401 Unauthorized                │
└──────────────────────────────────────────────────┘
```

---

## 🧪 Postman Setup Visual

```
POSTMAN COLLECTION SETUP
┌─────────────────────────────────────────────────────────┐
│  Variables                                              │
├─────────────────────────────────────────────────────────┤
│  base_url        = "http://localhost:8000"              │
│  access_token    = ""  (auto-fill after login)         │
│  refresh_token   = ""  (auto-fill after login)         │
└─────────────────────────────────────────────────────────┘

REQUEST SEQUENCE
┌──────────────────────────────────────────────────────────┐
│  1. Register New User                                    │
│     POST {{base_url}}/api/auth/register/               │
│     No Authorization                                     │
│     → Stores access_token and refresh_token            │
│                                                          │
│  2. Login User                                           │
│     POST {{base_url}}/api/auth/login/                  │
│     No Authorization                                     │
│     → Updates access_token and refresh_token           │
│                                                          │
│  3. Get Profile                                          │
│     GET {{base_url}}/api/auth/profile/                 │
│     Authorization: Bearer {{access_token}}             │
│     → Returns 200 OK                                    │
│                                                          │
│  4. Refresh Token                                        │
│     POST {{base_url}}/api/auth/refresh/                │
│     No Authorization                                     │
│     Body: { "refresh": "{{refresh_token}}" }           │
│     → Returns new access_token                         │
│                                                          │
│  5. Update Profile                                       │
│     PUT {{base_url}}/api/auth/profile/                 │
│     Authorization: Bearer {{access_token}}             │
│     → Returns 200 OK with updated data                 │
│                                                          │
│  6. Logout                                               │
│     POST {{base_url}}/api/auth/logout/                 │
│     Authorization: Bearer {{access_token}}             │
│     Body: { "refresh": "{{refresh_token}}" }           │
│     → Returns 200 OK (blacklists refresh token)        │
│                                                          │
│  7. Test Invalid Token                                   │
│     GET {{base_url}}/api/auth/profile/                 │
│     Authorization: Bearer "invalid.token.here"         │
│     → Returns 401 Unauthorized                         │
│                                                          │
│  8. Test Missing Token                                   │
│     GET {{base_url}}/api/auth/profile/                 │
│     No Authorization                                     │
│     → Returns 401 Unauthorized                         │
└──────────────────────────────────────────────────────────┘
```

---

## 📈 Error Response Codes

```
SUCCESS RESPONSES
┌─────────────────────────────────────────────────────────┐
│  200 OK              Profile fetch/update successful    │
│  201 Created         Register/Login/Upload successful   │
│  204 No Content      Logout successful                  │
└─────────────────────────────────────────────────────────┘

CLIENT ERROR RESPONSES
┌─────────────────────────────────────────────────────────┐
│  400 Bad Request     Invalid request body/parameters    │
│  401 Unauthorized    Missing or invalid token           │
│  403 Forbidden       Insufficient permissions           │
│  404 Not Found       Resource not found                 │
└─────────────────────────────────────────────────────────┘

SERVER ERROR RESPONSES
┌─────────────────────────────────────────────────────────┐
│  500 Internal Error  Server error occurred              │
│  503 Service Down    Server maintenance                 │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Implementation Checklist

```
CODE CHANGES
☑ RegisterView: Added authentication_classes = []
☑ LoginView: Added authentication_classes = []
☑ urls.py: Added PublicTokenRefreshView class
☑ settings.py: Verified JWT config correct
☑ backends.py: Verified email auth working
☑ serializers.py: Verified all correct

TESTING
☑ Register works without token
☑ Login works without token
☑ Refresh works without token
☑ Profile requires valid token
☑ Invalid token returns 401
☑ Missing token returns 401
☑ Logout works with token
☑ Token expires after 60 minutes

DOCUMENTATION
☑ Created 5 comprehensive guides
☑ Created Postman test collection
☑ Created troubleshooting guide
☑ Created quick reference card
☑ Saved to repository memory

STATUS: ✅ COMPLETE AND READY FOR DEPLOYMENT
```

---

## 🎓 Key Takeaways

1. **Always explicitly set authentication_classes**
   - Default inheritance can cause unexpected behavior
   - Public endpoints need `authentication_classes = []`

2. **Authentication runs BEFORE permission check**
   - If auth fails → error returned immediately
   - Permission check never executed

3. **SimpleJWT applies to all endpoints by default**
   - Must explicitly disable for public endpoints
   - Protected endpoints inherit automatically

4. **Token management is critical**
   - Short-lived access tokens (60 min)
   - Longer-lived refresh tokens (7 days)
   - Implement token rotation and blacklisting

5. **Test comprehensively**
   - Test success paths
   - Test error paths
   - Test edge cases (expired tokens, blacklisted tokens)

---

This visual guide should help you understand the JWT authentication flow!
