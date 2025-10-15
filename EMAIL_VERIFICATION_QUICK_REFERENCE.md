# 📧 Email Verification - Quick Reference

## 🎯 TL;DR

**Storage:** `User.emailVerified` (Boolean) in PostgreSQL + Zitadel metadata  
**Default:** `false` on registration, `true` after verification  
**Gate:** Controlled by `SOFT_GATE_EMAIL_VERIFICATION` env var (default: true)

---

## ✅ What Works WITHOUT Email Verification

```
✅ Categories (CREATE/READ/UPDATE/DELETE)
✅ Vehicles
✅ Trips  
✅ Dashboard
✅ All GET requests (viewing pages)
✅ Login/Logout
```

---

## ❌ What's BLOCKED WITHOUT Email Verification

```
❌ Bank operations (/api/bank/*)
❌ Data exports (/api/export/*)
❌ Connectors (/api/connectors/*)
❌ Profile updates (/api/profile/*)
❌ Notifications (/api/notifications/*)
❌ All other non-GET API requests
```

---

## 🔄 Verification Flow (30 seconds)

```
1. User registers
   └→ emailVerified: false

2. User sees yellow banner: "Verify your email"

3. User clicks "Verify Email"
   └→ Email sent with 6-digit code

4. User enters code
   └→ emailVerified: true

5. Full access granted ✅
```

---

## 🛠️ Quick Fixes

### To Manually Verify a User:
```sql
UPDATE "User" SET "emailVerified" = true WHERE email = 'user@example.com';
```

### To Disable Email Verification:
```bash
# .env
SOFT_GATE_EMAIL_VERIFICATION=false
```

### To Add More Free Features:
```typescript
// src/services/accessControl/index.ts (line 106)
const freeFeaturesPrefixes: string[] = [
  '/api/categories',
  '/api/vehicles',
  '/api/trips',
  '/api/your-new-feature'  // Add here
];
```

---

## 🔍 Check Verification Status

### In Database:
```sql
SELECT id, email, "emailVerified" FROM "User" WHERE email = 'user@example.com';
```

### In JWT Token:
```javascript
// Decode token payload
{
  "email_verified": false,  // <-- This field
  "email": "user@example.com",
  "sub": "usr_123456"
}
```

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't delete categories | Categories are now whitelisted (restart server) |
| Email not sending | Check `ZITADEL_MANAGEMENT_TOKEN` in .env |
| Code doesn't work | Code expires in 15min, request new one |
| Status stuck at false | Manual SQL update or resync with Zitadel |

---

## 📍 Key Files

```
Backend:
├─ src/services/accessControl/index.ts   (Access control logic)
├─ src/services/oidcService.ts           (Verification functions)
├─ src/routes/oidc.ts                    (Verification endpoints)
└─ prisma/schema.prisma                  (emailVerified field)

Frontend:
├─ client/src/components/EmailVerificationBanner.tsx
└─ client/src/services/oidc.ts

Database:
└─ PostgreSQL table: User.emailVerified
```

---

## 🎯 API Endpoints

```bash
# Send verification email
POST /api/oidc/verification/init
Body: { "userId": "usr_123" }

# Verify code
POST /api/oidc/verification/confirm  
Body: { "userId": "usr_123", "code": "123456" }

# Resend email
POST /api/oidc/resend-verification
Body: { "userId": "usr_123" }
```

---

**Full docs:** See `EMAIL_VERIFICATION_FLOW_COMPLETE.md`  
**Last updated:** October 8, 2025












