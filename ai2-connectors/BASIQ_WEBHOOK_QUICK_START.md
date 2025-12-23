# 🚀 Basiq Webhook Quick Start

**Fast setup guide - create webhook in 3 steps**

---

## 📋 Prerequisites

- Basiq API key
- Webhook endpoint URL: `https://connectors.ai2fin.com/api/connectors/basiq/webhook`

---

## ⚡ Quick Setup (3 Steps)

### **Step 1: Get Access Token**

```bash
curl -X POST https://au-api.basiq.io/token \
  -H "Authorization: Basic $(echo -n 'YOUR_API_KEY:' | base64)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "basiq-version: 3.0" \
  -d "scope=SERVER_ACCESS"
```

**Copy the `access_token` from response**

---

### **Step 2: Create Webhook**

```bash
curl -X POST https://au-api.basiq.io/notifications/webhooks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "accept: application/json" \
  -H "basiq-version: 3.0" \
  -d '{
    "name": "AI2 Connectors Webhook",
    "url": "https://connectors.ai2fin.com/api/connectors/basiq/webhook",
    "subscribedEvents": [
      "transactions.updated",
      "connection.created",
      "connection.deleted"
    ]
  }'
```

**Copy the `secret` from response (format: `whsec_...`)**

---

### **Step 3: Set Webhook Secret**

```powershell
fly secrets set -a ai2-connectors BASIQ_WEBHOOK_SECRET="whsec_YOUR_SECRET_HERE"
```

---

## ✅ Done!

Your webhook is now configured. Basiq will send real-time transaction updates to your endpoint.

---

## 📝 Request Body Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Webhook name (for your reference) |
| `description` | string | No | Webhook description (for your reference) |
| `url` | string | **Yes** | Your webhook endpoint URL |
| `subscribedEvents` | array | **Yes** | Event types to subscribe to |

---

## 📡 Common Events

**Recommended:**
- `transactions.updated` - Transaction updates (note: plural, no `.created` event)
- `connection.created` - New connection
- `connection.deleted` - Connection deleted

**Other Available:**
- `connection.invalidated` - Connection invalidated
- `connection.activated` - Connection activated
- `account.updated` - Account updated
- `user.created` - User created
- `user.updated` - User updated
- `consent.created` - Consent granted
- `consent.revoked` - Consent revoked

---

## 🔗 Full Documentation

See `BASIQ_WEBHOOK_SETUP_COMPLETE.md` for:
- Detailed instructions
- Security information
- Testing methods
- Troubleshooting
- Update/Delete webhooks

---

**embracingearth.space - Quick webhook setup**





