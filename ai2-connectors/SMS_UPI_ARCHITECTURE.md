# 📱 SMS UPI Connector - Architecture & Permissions

**How SMS UPI connector works and what gives AI2Fin permission to read SMS**

---

## ⚠️ Current Status

**This is an EXAMPLE/TEMPLATE connector** - Not a production implementation. It demonstrates the architecture but requires additional setup for real-world use.

---

## 🔍 How It Works

The SMS UPI connector does **NOT directly access the user's phone**. Instead, it works through **SMS forwarding services** or **user-initiated sharing**. Here are the different approaches:

---

## 📊 Architecture Options

### Option 1: SMS Gateway/Forwarding Service (Recommended)

**How it works:**
```
User's Phone → SMS Gateway Service → Webhook → AI2Fin
```

**Flow:**
1. User configures SMS forwarding on their phone (via app or carrier)
2. SMS messages are forwarded to an SMS gateway service (Twilio, AWS SNS, etc.)
3. SMS gateway sends webhook to AI2Fin
4. AI2Fin parses SMS and extracts transaction data

**Permission Model:**
- ✅ **User explicitly enables SMS forwarding** (opt-in)
- ✅ **User controls which SMS are forwarded** (can filter)
- ✅ **No direct phone access** by AI2Fin
- ✅ **User can disable anytime**

**Services Used:**
- **Twilio** - SMS gateway with webhook support
- **AWS SNS** - SMS forwarding service
- **Custom SMS Gateway** - User's own gateway
- **IFTTT/Zapier** - Automation services that can forward SMS

**Setup Required:**
1. User installs SMS forwarding app (e.g., "SMS Forwarder" apps)
2. User configures forwarding to SMS gateway
3. User provides webhook URL to AI2Fin
4. SMS gateway forwards SMS to AI2Fin webhook

---

### Option 2: Mobile App with SMS Permissions

**How it works:**
```
User's Phone → AI2Fin Mobile App (with SMS permission) → API → AI2Fin Backend
```

**Flow:**
1. User installs AI2Fin mobile app
2. User grants SMS read permission (Android) or uses SMS extension (iOS)
3. App reads SMS from inbox
4. App filters for UPI transaction SMS
5. App sends parsed data to AI2Fin backend

**Permission Model:**
- ✅ **User explicitly grants SMS permission** in app settings
- ✅ **Permission is device-level** (not network-level)
- ✅ **User can revoke permission anytime**
- ✅ **App only reads SMS, doesn't send**

**Platform Differences:**

**Android:**
- Requires `READ_SMS` permission
- User must grant in app settings
- Can read SMS from inbox
- Can filter by sender/number

**iOS:**
- No direct SMS access (Apple restriction)
- Would need SMS extension or forwarding
- Alternative: Use Shortcuts app to forward SMS

**Privacy:**
- App only reads SMS matching UPI patterns
- Only transaction-related SMS are processed
- User can see what SMS are being read
- Data encrypted in transit

---

### Option 3: Network Provider Integration (Not Recommended)

**How it works:**
```
User's Phone → Carrier Network → SMS Gateway → AI2Fin
```

**Why Not Recommended:**
- ❌ Requires carrier partnership
- ❌ Complex regulatory compliance
- ❌ User privacy concerns
- ❌ Not scalable
- ❌ Expensive to implement

**This approach is NOT used** in the current implementation.

---

### Option 4: User Manual Forwarding

**How it works:**
```
User's Phone → User manually forwards SMS → Email/App → AI2Fin
```

**Flow:**
1. User receives UPI transaction SMS
2. User manually forwards SMS to AI2Fin (via email, app, etc.)
3. AI2Fin parses forwarded SMS

**Use Case:**
- Simple, no permissions needed
- User has full control
- Good for testing or low-volume use

---

## 🔐 Permission & Privacy Model

### What AI2Fin Does NOT Have Access To:

- ❌ **Direct phone access** - Cannot read SMS directly
- ❌ **Network provider access** - No carrier integration
- ❌ **Phone contacts** - No contact list access
- ❌ **Other SMS** - Only processes forwarded/selected SMS
- ❌ **Phone calls** - No call access
- ❌ **Location** - No GPS access

### What AI2Fin DOES Have Access To:

- ✅ **Only SMS forwarded by user** - User controls what's shared
- ✅ **Only UPI transaction SMS** - Filtered by pattern matching
- ✅ **Parsed transaction data** - Amount, merchant, date, reference
- ✅ **No personal SMS content** - Only transaction-related data

---

## 🏗️ Current Implementation (Example)

The current `SMSUPIConnector` is a **template** that shows:

1. **SMS Parsing Logic** - How to extract transaction data from SMS text
2. **Webhook Handler** - How to receive SMS via webhook
3. **Transaction Normalization** - How to convert SMS data to `StandardTransaction`

**What's Missing for Production:**
- ❌ SMS forwarding setup
- ❌ Webhook endpoint implementation
- ❌ SMS gateway integration
- ❌ Mobile app with SMS permissions
- ❌ User onboarding flow

---

## 📱 Real-World Implementation Examples

### Example 1: Twilio SMS Gateway

```typescript
// User sets up SMS forwarding to Twilio number
// Twilio forwards SMS to webhook

POST /api/connectors/sms-upi/webhook
{
  "from": "+911234567890",  // User's phone
  "to": "+91XXXXXXXXXX",    // Twilio number
  "body": "Rs.500.00 debited from A/c **1234...",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Setup Steps:**
1. User gets Twilio phone number
2. User configures SMS forwarding to Twilio number
3. Twilio webhook configured to call AI2Fin endpoint
4. AI2Fin receives and parses SMS

---

### Example 2: Android App with SMS Permission

```typescript
// Android app with READ_SMS permission
// App reads SMS from inbox
// Filters for UPI transaction SMS
// Sends to AI2Fin API

POST /api/connectors/sms-upi/transactions
{
  "phoneNumber": "+911234567890",
  "sms": {
    "body": "Rs.500.00 debited...",
    "timestamp": "2025-01-15T10:30:00Z",
    "sender": "VK-PAYTM"
  }
}
```

**Setup Steps:**
1. User installs AI2Fin Android app
2. App requests SMS read permission
3. User grants permission
4. App filters SMS for UPI patterns
5. App sends parsed transactions to backend

---

### Example 3: IFTTT/Zapier Automation

```typescript
// User sets up IFTTT: "If SMS received, then webhook"
// IFTTT forwards SMS to AI2Fin webhook

POST /api/connectors/sms-upi/webhook
{
  "sms": "Rs.500.00 debited...",
  "phoneNumber": "+911234567890"
}
```

**Setup Steps:**
1. User creates IFTTT account
2. User sets up SMS trigger
3. User configures webhook action to AI2Fin
4. IFTTT forwards SMS automatically

---

## 🔒 Security & Privacy

### Data Protection:

1. **Encryption in Transit**
   - All SMS data encrypted via HTTPS
   - Webhook endpoints use TLS

2. **Data Minimization**
   - Only transaction-related SMS processed
   - Personal SMS ignored
   - Only extracts: amount, merchant, date, reference

3. **User Control**
   - User can disable anytime
   - User can filter which SMS are forwarded
   - User can delete connection

4. **No Storage of Full SMS**
   - Only parsed transaction data stored
   - Original SMS content not stored (unless user opts in)

5. **Compliance**
   - GDPR compliant (user consent required)
   - User data isolation
   - Right to deletion

---

## 📋 Implementation Checklist

### For Production SMS UPI Connector:

- [ ] **SMS Gateway Integration**
  - [ ] Twilio integration
  - [ ] AWS SNS integration
  - [ ] Custom gateway support

- [ ] **Webhook Endpoint**
  - [ ] Secure webhook endpoint
  - [ ] Signature verification
  - [ ] Rate limiting

- [ ] **Mobile App (Optional)**
  - [ ] Android app with SMS permission
  - [ ] iOS SMS extension (if possible)
  - [ ] Permission request flow

- [ ] **User Onboarding**
  - [ ] Setup instructions
  - [ ] SMS forwarding guide
  - [ ] Privacy policy

- [ ] **SMS Parsing**
  - [ ] Pattern matching for all UPI providers
  - [ ] Error handling
  - [ ] Deduplication

- [ ] **Security**
  - [ ] Webhook signature verification
  - [ ] Rate limiting
  - [ ] Data encryption

---

## 🎯 Summary

### How It Works:

1. **User enables SMS forwarding** (via app, gateway, or manual)
2. **SMS forwarded to AI2Fin** (via webhook or API)
3. **AI2Fin parses SMS** to extract transaction data
4. **Transaction stored** in AI2Fin database

### Permission Model:

- ✅ **User-initiated** - User must enable forwarding
- ✅ **Opt-in** - User explicitly grants permission
- ✅ **User-controlled** - User can disable anytime
- ✅ **No direct access** - AI2Fin doesn't access phone directly

### What Gives Permission:

- **NOT network provider** - No carrier integration
- **NOT direct phone access** - No direct SMS reading
- **User's explicit action** - User sets up forwarding
- **SMS gateway service** - Third-party service forwards SMS
- **Mobile app permission** - If using mobile app (Android)

---

## 🚀 Recommended Approach

**For Production:**

1. **Use SMS Gateway Service** (Twilio, AWS SNS)
   - Most secure
   - User controls forwarding
   - Scalable
   - No app required

2. **Provide Mobile App** (Optional)
   - Better user experience
   - Direct SMS access (with permission)
   - Real-time sync

3. **Support Manual Forwarding** (Fallback)
   - For users who don't want automation
   - Simple email/app forwarding

---

## 📚 Resources

- [Twilio SMS API](https://www.twilio.com/docs/sms)
- [AWS SNS SMS](https://docs.aws.amazon.com/sns/latest/dg/sms_publish-to-phone.html)
- [Android SMS Permissions](https://developer.android.com/reference/android/Manifest.permission#READ_SMS)
- [IFTTT SMS Triggers](https://ifttt.com/explore/sms)

---

**Built with ❤️ for [embracingearth.space](https://embracingearth.space)**

*Privacy-first • User-controlled • Secure SMS processing*

