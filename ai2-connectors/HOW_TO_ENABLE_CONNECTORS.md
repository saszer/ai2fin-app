# 🔌 How to Enable Bank Connectors and Other Connectors

**Complete guide to enabling connectors in the connectors service**

---

## 📋 Overview

Connectors are automatically registered when the connectors service starts. To make them **available** to users, you need to:

1. Set the required **environment variables** for each connector
2. (Optional) Enable feature flags if needed
3. Restart the connectors service

---

## 🏦 Bank Connectors

### **1. Basiq Connector** (Australian Banks)

**Required Environment Variables:**
```powershell
# Set in connectors service
fly secrets set -a ai2-connectors BASIQ_API_KEY="your-basiq-api-key"

# Optional: For webhook verification
fly secrets set -a ai2-connectors BASIQ_WEBHOOK_SECRET="your-webhook-secret"
```

**Get API Key:**
- Sign up at https://api.basiq.io/
- Get your API key from the dashboard

**What it enables:**
- Connect to 100+ Australian banks via Basiq
- Automatic transaction sync
- Account balance retrieval

---

### **2. Apideck Unified API Connector** (100+ Accounting Platforms)

**Required Environment Variables:**
```powershell
# Set in connectors service
fly secrets set -a ai2-connectors APIDECK_API_KEY="your-apideck-api-key"
fly secrets set -a ai2-connectors APIDECK_APP_ID="your-apideck-app-id"

# Optional: For webhook verification
fly secrets set -a ai2-connectors APIDECK_WEBHOOK_SECRET="your-webhook-secret"
```

**Get API Key:**
- Sign up at https://developers.apideck.com/
- Create an app and get your API key and App ID

**What it enables:**
- Connect to QuickBooks, Xero, NetSuite, and 100+ accounting platforms
- Single OAuth flow via Apideck Vault
- Unified API for all platforms

**Supported Platforms:**
- QuickBooks (US, UK, CA, AU)
- Xero
- NetSuite
- Sage
- FreshBooks
- Wave
- And 100+ more...

---

### **3. Xero Connector** (Direct Integration)

**Required Environment Variables:**
```powershell
# Set in connectors service
fly secrets set -a ai2-connectors XERO_CLIENT_ID="your-xero-client-id"
fly secrets set -a ai2-connectors XERO_CLIENT_SECRET="your-xero-client-secret"
```

**Note:** Xero is also available via Apideck (recommended for easier OAuth).

---

## 📧 Other Connectors

### **Email Connector**

**Feature Flag:**
```powershell
fly secrets set -a ai2-connectors ENABLE_EMAIL_CONNECTOR="true"
```

**What it enables:**
- Extract transactions from email receipts
- Gmail/Outlook integration
- Automatic email parsing

---

### **SMS UPI Connector** (Indian Banks)

**No environment variables needed** - Works out of the box!

**What it enables:**
- Parse SMS transactions from Indian banks
- UPI transaction extraction
- Works with any SMS provider

---

### **Example Bank API Connector**

**No environment variables needed** - For development/testing

**What it enables:**
- Mock bank API for testing
- Development connector examples

---

## ⚙️ Feature Flags (Optional)

These flags control feature availability in the health endpoint:

```powershell
# Enable bank feed features
fly secrets set -a ai2-connectors ENABLE_BANK_FEED="true"

# Enable email connector features
fly secrets set -a ai2-connectors ENABLE_EMAIL_CONNECTOR="true"

# Enable API connector features
fly secrets set -a ai2-connectors ENABLE_API_CONNECTOR="true"
```

**Note:** Feature flags are informational only. Connectors are enabled based on environment variables, not these flags.

---

## 🔍 How Connector Availability Works

1. **Registration:** All connectors are registered automatically on service startup (see `src/connectors/registerConnectors.ts`)

2. **Availability Check:** The service checks if required environment variables are set:
   - `BASIQ_API_KEY` → Enables Basiq connector
   - `APIDECK_API_KEY` + `APIDECK_APP_ID` → Enables Apideck connector
   - `XERO_CLIENT_ID` + `XERO_CLIENT_SECRET` → Enables Xero connector

3. **Provider List:** Only connectors with required env vars are returned in `/api/connectors/providers`

4. **User Visibility:** Users only see connectors that are available (have env vars set)

---

## ✅ Quick Setup Checklist

### **For Basiq (Australian Banks):**
- [ ] Set `BASIQ_API_KEY` in connectors service
- [ ] (Optional) Set `BASIQ_WEBHOOK_SECRET` for webhooks
- [ ] Restart connectors service
- [ ] Verify: `GET https://connectors.ai2fin.com/api/connectors/providers` shows `basiq`

### **For Apideck (100+ Platforms):**
- [ ] Set `APIDECK_API_KEY` in connectors service
- [ ] Set `APIDECK_APP_ID` in connectors service
- [ ] (Optional) Set `APIDECK_WEBHOOK_SECRET` for webhooks
- [ ] Restart connectors service
- [ ] Verify: `GET https://connectors.ai2fin.com/api/connectors/providers` shows `apideck`

### **For Xero (Direct):**
- [ ] Set `XERO_CLIENT_ID` in connectors service
- [ ] Set `XERO_CLIENT_SECRET` in connectors service
- [ ] Restart connectors service
- [ ] Verify: `GET https://connectors.ai2fin.com/api/connectors/providers` shows `xero`

---

## 🧪 Testing Connector Availability

### **1. Check Health Endpoint:**
```bash
curl https://connectors.ai2fin.com/health
```

Should show:
```json
{
  "status": "healthy",
  "service": "connectors",
  "features": {
    "bankFeed": true,
    "emailConnector": true,
    "apiConnector": true
  }
}
```

### **2. Check Available Providers:**
```bash
curl https://connectors.ai2fin.com/api/connectors/providers
```

Should list only connectors with required env vars set:
```json
{
  "providers": [
    {
      "id": "basiq",
      "name": "Basiq",
      "available": true,
      ...
    },
    {
      "id": "apideck",
      "name": "Apideck Unified API",
      "available": true,
      ...
    }
  ]
}
```

---

## 🔄 After Setting Environment Variables

1. **Restart the connectors service:**
   ```powershell
   fly apps restart ai2-connectors
   ```

2. **Check logs to verify connectors registered:**
   ```powershell
   fly logs -a ai2-connectors
   ```
   
   Look for:
   ```
   ✅ Registered connector: Basiq (basiq)
   ✅ Registered connector: Apideck Unified API (apideck)
   ✅ Registered 5 connector(s)
   ```

3. **Verify in core app:**
   - Core app should automatically discover connectors service
   - Dashboard should show connectors as available
   - Users can see connectors in the UI

---

## 📝 Complete Example Setup

```powershell
# Set all required secrets for connectors service
fly secrets set -a ai2-connectors \
  BASIQ_API_KEY="sk_live_..." \
  APIDECK_API_KEY="pk_live_..." \
  APIDECK_APP_ID="app_..." \
  ENABLE_BANK_FEED="true" \
  ENABLE_EMAIL_CONNECTOR="true"

# Restart service
fly apps restart ai2-connectors

# Verify
curl https://connectors.ai2fin.com/health
curl https://connectors.ai2fin.com/api/connectors/providers
```

---

## 🚨 Troubleshooting

### **Connector not showing up:**
1. Check environment variables are set: `fly secrets list -a ai2-connectors`
2. Check logs for registration: `fly logs -a ai2-connectors | grep "Registered"`
3. Verify env vars don't contain "your_" or "example" (filtered out)
4. Restart service after setting env vars

### **Connector shows as unavailable:**
- Check required env vars are set correctly
- Verify env vars are not empty or placeholder values
- Check connector registration in logs

### **Core app not seeing connectors:**
- Verify `CONNECTORS_URL` is set in core app
- Check service discovery is working: `GET /api/services/status`
- Ensure connectors service health check passes

---

**embracingearth.space - Enterprise connector management guide**




