# 🔐 Connectors Service - Environment Variables Reference

**Complete guide to environment variables for connectors service and their equivalents in core app.**

---

## 📋 **Required Environment Variables**

### **1. Authentication & Security**

#### **`JWT_SECRET`** ⚠️ **REQUIRED**
- **Purpose**: Secret key for signing and verifying JWT tokens
- **Connectors Service**: Used to verify JWT tokens from core app
- **Core App Equivalent**: `JWT_SECRET` (same value)
- **Set in Core App**: `fly secrets set JWT_SECRET="your-secret"`
- **Set in Connectors**: `fly secrets set JWT_SECRET="your-secret"` (must match!)
- **Example**: `JWT_SECRET="your-super-secret-jwt-key-here"`

**⚠️ CRITICAL**: Must be **identical** in both services. If they don't match, authentication will fail.

---

#### **`SERVICE_SECRET`** ⚠️ **REQUIRED**
- **Purpose**: Secret for service-to-service authentication (core app → connectors)
- **Connectors Service**: Validates `x-service-secret` header from core app
- **Core App Equivalent**: `SERVICE_SECRET` (same value)
- **Set in Core App**: `fly secrets set SERVICE_SECRET="your-service-secret"`
- **Set in Connectors**: `fly secrets set SERVICE_SECRET="your-service-secret"` (must match!)
- **Example**: `SERVICE_SECRET="your-service-to-service-secret"`

**⚠️ CRITICAL**: Must be **identical** in both services. Used for internal API calls.

---

### **2. Service URLs & Integration**

#### **`CORE_APP_URL`** ⚠️ **REQUIRED**
- **Purpose**: URL of the core app service (for connectors to send transactions)
- **Connectors Service**: Where to send normalized transactions
- **Core App**: Not needed (this is the target)
- **Set in Connectors**: `fly secrets set CORE_APP_URL="https://ai2-core-api.fly.dev"`
- **Example**: `CORE_APP_URL="https://ai2-core-api.fly.dev"`

**Note**: Use HTTPS in production, HTTP only for local development.

---

#### **`FRONTEND_URL`** ⚠️ **REQUIRED**
- **Purpose**: Frontend URL for CORS and OAuth redirects
- **Connectors Service**: Used for CORS and OAuth callback URLs
- **Core App Equivalent**: `FRONTEND_URL` (usually same value)
- **Set in Connectors**: `fly secrets set FRONTEND_URL="https://your-frontend-domain.com"`
- **Set in Core App**: `fly secrets set FRONTEND_URL="https://your-frontend-domain.com"`
- **Example**: `FRONTEND_URL="https://app.embracingearth.space"`

---

### **3. Connector-Specific API Keys**

#### **`BASIQ_API_KEY`** (Optional - if using Basiq)
- **Purpose**: Basiq API key for bank data aggregation
- **Connectors Service**: Used by `BasiqConnector`
- **Core App**: Not needed
- **Set in Connectors**: `fly secrets set BASIQ_API_KEY="your-basiq-api-key"`
- **Get from**: https://api.basiq.io/

---

#### **`BASIQ_WEBHOOK_SECRET`** (Optional - if using Basiq webhooks)
- **Purpose**: Secret for verifying Basiq webhook signatures
- **Connectors Service**: Validates webhook authenticity
- **Core App**: Not needed
- **Set in Connectors**: `fly secrets set BASIQ_WEBHOOK_SECRET="your-basiq-webhook-secret"`
- **Get from**: Basiq dashboard → Webhooks → Secret

---

#### **`APIDECK_API_KEY`** (Optional - if using Apideck)
- **Purpose**: Apideck Unified API key
- **Connectors Service**: Used by `ApideckConnector`
- **Core App**: Not needed
- **Set in Connectors**: `fly secrets set APIDECK_API_KEY="your-apideck-api-key"`
- **Get from**: https://developers.apideck.com/

---

#### **`APIDECK_APP_ID`** (Optional - if using Apideck)
- **Purpose**: Apideck Application ID
- **Connectors Service**: Used by `ApideckConnector`
- **Core App**: Not needed
- **Set in Connectors**: `fly secrets set APIDECK_APP_ID="your-apideck-app-id"`
- **Get from**: Apideck dashboard → Settings → Application ID

---

#### **`APIDECK_WEBHOOK_SECRET`** (Optional - if using Apideck webhooks)
- **Purpose**: Secret for verifying Apideck webhook signatures
- **Connectors Service**: Validates webhook authenticity
- **Core App**: Not needed
- **Set in Connectors**: `fly secrets set APIDECK_WEBHOOK_SECRET="your-apideck-webhook-secret"`
- **Get from**: Apideck dashboard → Webhooks → Secret

---

### **4. Security & Cloudflare (Optional)**

#### **`ENFORCE_CF_ORIGIN_LOCK`** (Optional)
- **Purpose**: Enable Cloudflare Origin Lock (validates requests come via Cloudflare)
- **Connectors Service**: If `true`, validates `x-origin-auth` header
- **Core App**: Not needed
- **Set in Connectors**: `fly secrets set ENFORCE_CF_ORIGIN_LOCK="true"`
- **Default**: `false` (disabled)

---

#### **`ORIGIN_SHARED_SECRET`** (Optional - if using Cloudflare Origin Lock)
- **Purpose**: Secret header value for Cloudflare Origin Lock
- **Connectors Service**: Validates `x-origin-auth` header matches this value
- **Core App**: Not needed (but must match Cloudflare config)
- **Set in Connectors**: `fly secrets set ORIGIN_SHARED_SECRET="your-origin-secret"`
- **Set in Cloudflare**: Worker/Page Rule → Custom Header → `x-origin-auth: your-origin-secret`

---

#### **`ORIGIN_HEADER_NAME`** (Optional)
- **Purpose**: Custom header name for Cloudflare Origin Lock
- **Connectors Service**: Header name to check (default: `x-origin-auth`)
- **Core App**: Not needed
- **Set in Connectors**: `fly secrets set ORIGIN_HEADER_NAME="x-origin-auth"`
- **Default**: `x-origin-auth`

---

### **5. Credential Encryption (Optional - Recommended for Production)**

#### **`CREDENTIAL_ENCRYPTION_KEY`** (Optional - Recommended)
- **Purpose**: Encryption key for storing connector credentials securely
- **Connectors Service**: Encrypts/decrypts stored credentials
- **Core App**: Not needed
- **Set in Connectors**: `fly secrets set CREDENTIAL_ENCRYPTION_KEY="your-32-char-encryption-key"`
- **Example**: `CREDENTIAL_ENCRYPTION_KEY="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"` (32+ characters)
- **⚠️ WARNING**: If not set in production, credentials stored in plain text!

---

### **6. Notifications (Optional)**

#### **`SLACK_WEBHOOK_URL`** (Optional)
- **Purpose**: Slack webhook URL for alerts and notifications
- **Connectors Service**: Sends alerts for critical errors, circuit breaker opens, etc.
- **Core App**: May have its own Slack webhook
- **Set in Connectors**: `fly secrets set SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."`
- **Get from**: Slack → Apps → Incoming Webhooks

---

### **7. Feature Flags (Optional)**

#### **`ENABLE_BANK_FEED`** (Optional)
- **Purpose**: Enable/disable bank feed connector
- **Connectors Service**: Feature flag
- **Core App**: Not needed
- **Set in Connectors**: `fly secrets set ENABLE_BANK_FEED="true"`
- **Default**: `false`

---

#### **`ENABLE_EMAIL_CONNECTOR`** (Optional)
- **Purpose**: Enable/disable email connector
- **Connectors Service**: Feature flag
- **Core App**: Not needed
- **Set in Connectors**: `fly secrets set ENABLE_EMAIL_CONNECTOR="true"`
- **Default**: `false`

---

#### **`ENABLE_API_CONNECTOR`** (Optional)
- **Purpose**: Enable/disable API connector
- **Connectors Service**: Feature flag
- **Core App**: Not needed
- **Set in Connectors**: `fly secrets set ENABLE_API_CONNECTOR="true"`
- **Default**: `false`

---

### **8. Advanced Configuration (Optional)**

#### **`CORE_APP_TIMEOUT`** (Optional)
- **Purpose**: Timeout for core app API calls (milliseconds)
- **Connectors Service**: Default: `10000` (10 seconds)
- **Set in Connectors**: `fly secrets set CORE_APP_TIMEOUT="15000"`
- **Default**: `10000`

---

#### **`CORE_APP_MAX_RETRIES`** (Optional)
- **Purpose**: Maximum retry attempts for core app API calls
- **Connectors Service**: Default: `3`
- **Set in Connectors**: `fly secrets set CORE_APP_MAX_RETRIES="5"`
- **Default**: `3`

---

#### **`CORE_APP_RATE_LIMIT_ENABLED`** (Optional)
- **Purpose**: Enable/disable rate limiting for core app calls
- **Connectors Service**: Default: `true`
- **Set in Connectors**: `fly secrets set CORE_APP_RATE_LIMIT_ENABLED="false"` (to disable)
- **Default**: `true`

---

#### **`MAX_WEBSOCKET_CONNECTIONS_PER_USER`** (Optional)
- **Purpose**: Maximum WebSocket connections per user (security)
- **Connectors Service**: Default: `10`
- **Set in Connectors**: `fly secrets set MAX_WEBSOCKET_CONNECTIONS_PER_USER="20"`
- **Default**: `10`

---

#### **`CONNECTORS_PORT`** (Optional)
- **Purpose**: Port for connectors service to listen on
- **Connectors Service**: Default: `3003`
- **Set in Connectors**: `fly secrets set CONNECTORS_PORT="3003"` (usually not needed)
- **Default**: `3003`

---

## 🔗 **Core App Environment Variables (For Reference)**

### **Core App → Connectors Communication**

The core app needs to know where the connectors service is:

#### **`CONNECTORS_URL`** (Set in Core App)
- **Purpose**: URL of connectors service
- **Core App**: Used to call connectors API
- **Set in Core App**: `fly secrets set CONNECTORS_URL="https://ai2-connectors.fly.dev"`
- **Example**: `CONNECTORS_URL="https://ai2-connectors.fly.dev"`

---

#### **`CONNECTORS_PORT`** (Set in Core App - Optional)
- **Purpose**: Port for connectors service (if different from default)
- **Core App**: Used to construct full URL
- **Set in Core App**: `fly secrets set CONNECTORS_PORT="443"` (HTTPS) or `"3003"` (HTTP)
- **Default**: `443` (HTTPS) or `3003` (HTTP)

---

## 📝 **Quick Setup Commands**

### **For Connectors Service:**

```powershell
# Required secrets
fly secrets set -a ai2-connectors JWT_SECRET="your-jwt-secret"
fly secrets set -a ai2-connectors SERVICE_SECRET="your-service-secret"
fly secrets set -a ai2-connectors CORE_APP_URL="https://ai2-core-api.fly.dev"
fly secrets set -a ai2-connectors FRONTEND_URL="https://your-frontend-domain.com"

# Optional: Connector API keys
fly secrets set -a ai2-connectors BASIQ_API_KEY="your-basiq-key"
fly secrets set -a ai2-connectors APIDECK_API_KEY="your-apideck-key"
fly secrets set -a ai2-connectors APIDECK_APP_ID="your-apideck-app-id"

# Optional: Security
fly secrets set -a ai2-connectors CREDENTIAL_ENCRYPTION_KEY="your-32-char-key"
fly secrets set -a ai2-connectors SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
```

### **For Core App (to connect to connectors):**

```powershell
# Required: Connectors service URL
fly secrets set -a ai2-core-api CONNECTORS_URL="https://ai2-connectors.fly.dev"
fly secrets set -a ai2-core-api CONNECTORS_PORT="443"

# Must match connectors service:
fly secrets set -a ai2-core-api JWT_SECRET="your-jwt-secret"  # Same as connectors!
fly secrets set -a ai2-core-api SERVICE_SECRET="your-service-secret"  # Same as connectors!
```

---

## ✅ **Verification Checklist**

After setting secrets, verify:

- [ ] `JWT_SECRET` is set in both services and **matches**
- [ ] `SERVICE_SECRET` is set in both services and **matches**
- [ ] `CORE_APP_URL` is set in connectors service (points to core app)
- [ ] `CONNECTORS_URL` is set in core app (points to connectors service)
- [ ] `FRONTEND_URL` is set in connectors service (for CORS/OAuth)
- [ ] Connector API keys are set (if using Basiq/Apideck)
- [ ] `CREDENTIAL_ENCRYPTION_KEY` is set (recommended for production)

---

## 🔍 **Troubleshooting**

### **Error: "JWT_SECRET not configured"**
- **Fix**: Set `JWT_SECRET` in connectors service
- **Command**: `fly secrets set -a ai2-connectors JWT_SECRET="your-secret"`

### **Error: "Authentication failed"**
- **Fix**: Ensure `JWT_SECRET` matches in both services
- **Check**: `fly secrets list -a ai2-connectors` and `fly secrets list -a ai2-core-api`

### **Error: "Service secret mismatch"**
- **Fix**: Ensure `SERVICE_SECRET` matches in both services
- **Check**: Both services must have identical `SERVICE_SECRET` value

### **Error: "CORS error" or "Origin not allowed"**
- **Fix**: Set `FRONTEND_URL` in connectors service
- **Command**: `fly secrets set -a ai2-connectors FRONTEND_URL="https://your-frontend.com"`

---

**embracingearth.space - Enterprise connectors environment variables guide**

