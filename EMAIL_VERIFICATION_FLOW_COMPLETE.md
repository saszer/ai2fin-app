# 📧 Email Verification Flow - Complete Documentation

**Date:** October 8, 2025  
**Purpose:** Complete mapping of email verification system  
**Status:** Active System

---

## 📊 **What's Blocked by Email Verification**

### ✅ **ALLOWED Without Email Verification (Free Features)**
- ✅ Category management (`/api/categories`) - CREATE, READ, UPDATE, DELETE
- ✅ Vehicle management (`/api/vehicles`)
- ✅ Trip management (`/api/trips`)
- ✅ Dashboard access
- ✅ View all pages (GET requests to UI routes)
- ✅ Login and authentication

### ❌ **BLOCKED Without Email Verification (Sensitive Operations)**
When `SOFT_GATE_EMAIL_VERIFICATION !== 'false'` (enabled by default):

1. **Bank Operations** (`/api/bank/*`)
   - CSV imports
   - Transaction creation/modification
   - Bank account connections
   - Statement uploads

2. **Export Operations** (`/api/export/*`)
   - Data exports
   - ATO export
   - Tax reports export

3. **Connector Operations** (`/api/connectors/*`)
   - Gmail integration
   - Bank feed connections
   - Third-party API connections

4. **Profile Changes** (`/api/profile/*`)
   - Update user profile
   - Change settings
   - Modify preferences

5. **Notifications** (`/api/notifications/*`)
   - Notification settings
   - Alert preferences

6. **All Other Non-GET API Requests**
   - Any POST/PUT/DELETE/PATCH to `/api/*` (unless whitelisted)

---

## 🗄️ **Where Verification Status is Stored**

### **1. Database (Prisma Schema)**

**File:** `prisma/schema.prisma`

```prisma
model User {
  id            String  @id @default(cuid())
  email         String  @unique
  emailVerified Boolean @default(false) // <-- Stored here!
  zitadelId     String? @unique         // Linked to Zitadel OIDC
  // ... other fields
}
```

**Location:** PostgreSQL database table `User`  
**Field:** `emailVerified` (Boolean, default: `false`)

### **2. Zitadel OIDC Provider (Enterprise Identity)**

**Metadata Fields:**
- `actualEmailVerified` (metadata) - Custom field for actual verification status
- `email.isEmailVerified` (user profile) - Zitadel's native field
- `emailVerificationPending` (metadata) - Flag for pending verification

**Why Two Places?**
- Local DB: Fast access, works offline, caching
- Zitadel: Single source of truth for enterprise auth, syncs across services

---

## 🔄 **Complete Verification Flow**

### **📍 Step 1: User Registration**

**Endpoints:**
- `POST /api/oidc/register` (OIDC registration)
- `POST /api/enterprise-auth/register` (Enterprise registration)

**What Happens:**
```typescript
1. User submits: { email, password, firstName, lastName }
2. Backend creates user in Zitadel with isEmailVerified: true (ACTIVE state requirement)
3. Backend creates user in local DB with emailVerified: false
4. User receives auto-login token
5. User is logged in but needs to verify email
```

**Files:**
- `src/services/oidcService.ts` - `registerOidcUser()`
- `src/services/enterpriseIdentityService.ts` - `createEnterpriseAuthToken()`

---

### **📍 Step 2: Email Verification Code Sent**

**Endpoint:** `POST /api/oidc/verification/init`

**Request:**
```json
{
  "userId": "usr_123456",
  "urlTemplate": "https://yourapp.com/verify?userId={{.UserID}}&code={{.Code}}"
}
```

**What Happens:**
```typescript
1. Backend calls Zitadel Management API
2. POST /v2/users/{userId}/email/send
3. Zitadel sends verification email to user
4. Email contains 6-digit code or link
5. User receives email with verification code
```

**Files:**
- `src/services/oidcService.ts` - `sendEmailVerificationCode()`
- `src/routes/oidc.ts` - POST `/verification/init`

**Zitadel API:**
```bash
POST https://your-zitadel-instance.com/v2/users/{userId}/email/send
Authorization: Bearer {ZITADEL_MANAGEMENT_TOKEN}
Content-Type: application/json
```

---

### **📍 Step 3: User Verifies Email**

**Endpoint:** `POST /api/oidc/verification/confirm`

**Request:**
```json
{
  "userId": "usr_123456",
  "code": "123456"
}
```

**What Happens:**
```typescript
1. User enters verification code
2. Backend calls Zitadel API to verify code
3. Zitadel validates the code
4. Backend updates metadata: actualEmailVerified = 'true'
5. Backend removes emailVerificationPending flag
6. Backend updates local DB: emailVerified = true
7. User gets access to all features
```

**Files:**
- `src/services/oidcService.ts` - `verifyEmailWithCode()`
- `src/routes/oidc.ts` - POST `/verification/confirm`

**Zitadel API Calls:**
```bash
# 1. Set verification metadata
PUT /management/v1/users/{userId}/metadata/actualEmailVerified
Body: { "value": "true" }

# 2. Remove pending flag
DELETE /management/v1/users/{userId}/metadata/emailVerificationPending

# 3. Update local database
UPDATE "User" SET "emailVerified" = true WHERE id = userId
```

---

### **📍 Step 4: Resend Verification Email**

**Endpoint:** `POST /api/oidc/resend-verification`

**Request:**
```json
{
  "userId": "usr_123456"
}
```

**What Happens:**
```typescript
1. User clicks "Resend Email"
2. Backend calls Zitadel resend API
3. New verification code is sent
4. 60-second cooldown applied (frontend)
```

**Files:**
- `src/routes/oidc.ts` - POST `/resend-verification`
- `client/src/services/oidc.ts` - `resendEmailVerification()`

---

## 🔐 **Access Control Integration**

### **Where It's Checked**

**File:** `src/services/accessControl/index.ts`

**Method:** `canAccess(user, resource, method)`

**Logic Flow:**
```typescript
// Line 100-123
async canAccess(user, resource, method) {
  // 1. Check if soft gate is enabled
  const softGate = process.env.SOFT_GATE_EMAIL_VERIFICATION !== 'false';
  
  // 2. Define sensitive operations
  const sensitivePrefixes = [
    '/api/export', 
    '/api/bank', 
    '/api/connectors', 
    '/api/profile', 
    '/api/notifications'
  ];
  
  // 3. Define free features (bypass verification)
  const freeFeaturesPrefixes = [
    '/api/categories', 
    '/api/vehicles', 
    '/api/trips'
  ];
  
  // 4. Check if free feature
  const isFreeFeature = freeFeaturesPrefixes.some(p => resource.startsWith(p));
  
  // 5. Block if email not verified (unless free feature)
  if (softGate && user?.emailVerified === false && !isFreeFeature) {
    const isSensitive = sensitivePrefixes.some(p => resource.startsWith(p)) 
      || (method !== 'GET' && resource.startsWith('/api'));
    
    if (isSensitive) {
      return { allowed: false, reason: 'Email not verified' };
    }
  }
  
  // 6. Continue with other checks (subscription, roles, etc.)
  // ...
}
```

**How User Data Flows:**

```
1. User makes request → /api/categories (DELETE)
2. Middleware extracts JWT token
3. Token decoded → user object created
4. user.emailVerified comes from JWT claim or DB lookup
5. AccessControl.canAccess(user, '/api/categories', 'DELETE')
6. Checks: isFreeFeature? YES → Allow
7. Request proceeds to route handler
```

---

## 🎯 **JWT Token Integration**

### **Email Verified in JWT Claims**

**File:** `src/lib/oidcVerifier.ts`

When user logs in, JWT token contains:
```json
{
  "sub": "usr_123456",
  "email": "user@example.com",
  "email_verified": false,  // <-- From Zitadel
  "exp": 1234567890
}
```

**Access Control reads this:**
```typescript
// Line 384
user = {
  id: oidcUser.sub,
  email: oidcUser.email,
  emailVerified: oidcUser.email_verified,  // <-- Injected here
  roles: []
};
```

---

## 🌐 **Frontend UI Components**

### **1. Email Verification Banner**

**File:** `client/src/components/EmailVerificationBanner.tsx`

**What it does:**
- Shows yellow warning banner if `user.emailVerified === false`
- Provides "Verify Email" button
- Has "Resend Email" button with cooldown
- Can be dismissed (stores in localStorage)

**Where it's used:**
- Dashboard
- Main layout
- Category pages
- Any protected page

**Props:**
```typescript
interface EmailVerificationBannerProps {
  onVerificationComplete?: () => void;
}
```

---

### **2. Verification Page**

**Route:** `/#/verify-email?userId={userId}&code={code}`

**What it does:**
- Displays code input form
- Validates 6-digit code
- Calls `/api/oidc/verification/confirm`
- Shows success/error messages
- Redirects after successful verification

---

## ⚙️ **Environment Variables**

### **Required for Email Verification:**

```bash
# Enable/disable email verification gate
SOFT_GATE_EMAIL_VERIFICATION=true  # Default: true

# Zitadel configuration
OIDC_ISSUER=https://your-zitadel.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
ZITADEL_MANAGEMENT_TOKEN=your-management-token

# JWT configuration
JWT_SECRET=your-jwt-secret

# Database
DATABASE_URL=postgresql://...
```

**To Disable Email Verification:**
```bash
SOFT_GATE_EMAIL_VERIFICATION=false
```

---

## 🧪 **Testing Email Verification**

### **Manual Test Flow:**

```bash
# 1. Register new user
POST http://localhost:3001/api/oidc/register
Body: {
  "email": "test@example.com",
  "password": "TestPass123!",
  "firstName": "Test",
  "lastName": "User"
}

# 2. Check user in database
SELECT id, email, "emailVerified" FROM "User" WHERE email = 'test@example.com';
# Result: emailVerified = false

# 3. Try to delete category (should fail)
DELETE http://localhost:3001/api/categories/{id}
Authorization: Bearer {token}
# Response: 403 Forbidden (if categories weren't whitelisted)

# 4. Send verification email
POST http://localhost:3001/api/oidc/verification/init
Body: { "userId": "usr_123456" }

# 5. Verify email (get code from email)
POST http://localhost:3001/api/oidc/verification/confirm
Body: { "userId": "usr_123456", "code": "123456" }

# 6. Check database again
SELECT "emailVerified" FROM "User" WHERE id = 'usr_123456';
# Result: emailVerified = true

# 7. Try protected operation (should work)
POST http://localhost:3001/api/bank/transactions
# Response: 200 OK
```

---

## 📋 **Database Queries**

### **Check User Verification Status:**
```sql
SELECT 
  id,
  email,
  "emailVerified",
  "createdAt",
  "lastLoginAt"
FROM "User"
WHERE email = 'user@example.com';
```

### **Count Verified vs Unverified Users:**
```sql
SELECT 
  "emailVerified",
  COUNT(*) as count
FROM "User"
GROUP BY "emailVerified";
```

### **Manually Verify a User (for testing):**
```sql
UPDATE "User"
SET "emailVerified" = true
WHERE email = 'user@example.com';
```

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: User can't delete categories**
**Cause:** Email not verified + categories not whitelisted  
**Solution:** Whitelist `/api/categories` in free features (DONE ✅)

### **Issue 2: Email verification emails not sending**
**Cause:** 
- Missing `ZITADEL_MANAGEMENT_TOKEN`
- Wrong `OIDC_ISSUER` URL
- Zitadel SMTP not configured

**Solution:** 
```bash
# Check token
echo $ZITADEL_MANAGEMENT_TOKEN

# Check Zitadel SMTP settings
# Login to Zitadel admin → Settings → SMTP
```

### **Issue 3: Verification code doesn't work**
**Cause:**
- Code expired (usually 15 min)
- Wrong userId
- Code already used

**Solution:** Request new code with resend endpoint

### **Issue 4: emailVerified stuck at false**
**Cause:**
- Zitadel and local DB out of sync
- Metadata update failed

**Solution:**
```sql
-- Manually sync
UPDATE "User" 
SET "emailVerified" = true 
WHERE "zitadelId" = 'zitadel-user-id';
```

---

## 🔧 **Customization & Configuration**

### **Add More Free Features (No Verification Required):**

**File:** `src/services/accessControl/index.ts` (Line 106)

```typescript
const freeFeaturesPrefixes: string[] = [
  '/api/categories',
  '/api/vehicles',
  '/api/trips',
  // Add more here:
  '/api/expenses',      // Allow expense creation
  '/api/bills',         // Allow bill management
  '/api/custom-rules'   // Allow custom rules
];
```

### **Add More Sensitive Operations (Always Require Verification):**

**File:** `src/services/accessControl/index.ts` (Line 103)

```typescript
const sensitivePrefixes: string[] = [
  '/api/export',
  '/api/bank',
  '/api/connectors',
  '/api/profile',
  '/api/notifications',
  // Add more here:
  '/api/ai',           // AI operations
  '/api/payments',     // Payment operations
  '/api/admin'         // Admin operations
];
```

### **Disable Email Verification Entirely:**

**Option 1 - Environment Variable:**
```bash
SOFT_GATE_EMAIL_VERIFICATION=false
```

**Option 2 - Code (not recommended):**
```typescript
// File: src/services/accessControl/index.ts (Line 102)
const softGate = false; // Always disabled
```

---

## 📊 **System Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                        USER FLOW                            │
└─────────────────────────────────────────────────────────────┘

1. USER REGISTERS
   └→ POST /api/oidc/register
      └→ oidcService.registerOidcUser()
         ├→ Create user in Zitadel (emailVerified: true*)
         ├→ Create user in local DB (emailVerified: false)
         └→ Return JWT token

2. USER LOGGED IN (emailVerified: false)
   └→ JWT contains: { email_verified: false }
      └→ EmailVerificationBanner shown in UI

3. USER CLICKS "VERIFY EMAIL"
   └→ Navigate to /verify-email
      └→ POST /api/oidc/verification/init
         └→ Zitadel sends verification email
            └→ User receives email with 6-digit code

4. USER ENTERS CODE
   └→ POST /api/oidc/verification/confirm
      └→ verifyEmailWithCode()
         ├→ Update Zitadel metadata
         ├→ UPDATE "User" SET emailVerified = true
         └→ Return success

5. USER MAKES PROTECTED REQUEST
   └→ DELETE /api/categories/{id}
      └→ AccessControl.canAccess()
         ├→ Extract user from JWT
         ├→ Check emailVerified === true ✅
         ├→ Check if free feature === true ✅
         └→ ALLOW REQUEST

┌─────────────────────────────────────────────────────────────┐
│                  DATA STORAGE FLOW                          │
└─────────────────────────────────────────────────────────────┘

Zitadel (OIDC Provider)
├─ User Profile
│  └─ email.isEmailVerified: true  (Always true for ACTIVE)
├─ Custom Metadata
│  ├─ actualEmailVerified: 'true'  (After verification)
│  └─ emailVerificationPending: (deleted after verification)
└─ JWT Claims
   └─ email_verified: false → true (After verification)

Local Database (PostgreSQL)
└─ User Table
   ├─ id: "usr_123456"
   ├─ email: "user@example.com"
   ├─ emailVerified: false → true  (Updated after verification)
   └─ zitadelId: "zitadel-123"  (Links to Zitadel)
```

---

## 🎯 **Summary**

### **Verification Flow:**
1. User registers → `emailVerified: false` in DB
2. User receives verification email from Zitadel
3. User enters code → `emailVerified: true` in DB
4. User gains access to all features

### **Access Control:**
- **Free features bypass** verification (categories, vehicles, trips)
- **Sensitive operations require** verification (bank, export, connectors)
- **Configuration:** `SOFT_GATE_EMAIL_VERIFICATION` env var

### **Storage:**
- **Database:** `User.emailVerified` (Boolean)
- **Zitadel:** `actualEmailVerified` metadata + JWT claims
- **JWT Token:** `email_verified` claim

---

**Documentation maintained by:** embracingearth.space  
**Last updated:** October 8, 2025  
**Version:** 2.0












