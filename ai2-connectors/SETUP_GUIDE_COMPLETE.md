# 🔧 Complete Setup Guide - AI2 Connectors Service

**Service:** `ai2-connectors`  
**Domain:** `connectors.ai2fin.com` (to be configured)  
**embracingearth.space**

---

## 📋 Quick Answers to Your Questions

### 1. **Does it need a database? What's it storing?**

**YES - CRITICAL** ❌ Currently missing!

**What it stores:**
- **Bank connection credentials** (encrypted) - API keys, tokens, OAuth tokens
- **Connection metadata** - User ID, connector type, status, last sync time
- **Account information** - Bank accounts linked per connection
- **Sync history** - Last sync timestamps, errors

**Current Problem:** Uses in-memory `Map` - **all data lost on restart!**

**Solution:** Use Neon DB (PostgreSQL) - same as core app

---

### 2. **Core App URL - app.ai2fin.com vs api.ai2fin.com?**

Based on codebase analysis:

- **`app.ai2fin.com`** = Frontend client (React app)
- **`api.ai2fin.com`** = Core app API backend (where connectors send transactions)

**For connectors service, use:**
```powershell
CORE_APP_URL="https://api.ai2fin.com"
```

**NOT** `app.ai2fin.com` (that's the frontend)

---

### 3. **JWT_SECRET and SERVICE_SECRET - Same as core app?**

**YES - MUST MATCH EXACTLY!** ✅

Both services need **identical** values:

```powershell
# In core app (ai2-core-api):
JWT_SECRET="same-secret-value"
SERVICE_SECRET="same-service-secret-value"

# In connectors service (ai2-connectors):
JWT_SECRET="same-secret-value"  # MUST MATCH!
SERVICE_SECRET="same-service-secret-value"  # MUST MATCH!
```

**Why:** Connectors service verifies JWT tokens issued by core app. If secrets don't match, authentication fails.

---

### 4. **What's CREDENTIAL_ENCRYPTION_KEY?**

**Purpose:** Encrypts bank credentials before storing them.

**What it encrypts:**
- Bank API keys
- OAuth tokens
- Access tokens
- Refresh tokens
- Any sensitive connector credentials

**Without it:** Credentials stored in **plain text** (security risk!)

**Generate one:**
```powershell
# Generate a secure 32+ character key
# Option 1: Use OpenSSL
openssl rand -base64 32

# Option 2: Use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Use online generator (32+ characters)
# https://randomkeygen.com/
```

**Set it:**
```powershell
fly secrets set -a ai2-connectors CREDENTIAL_ENCRYPTION_KEY="your-generated-32-char-key-here"
```

---

### 5. **Cloudflare DNS Setup - connectors.ai2fin.com**

**Steps to configure:**

#### Step 1: Add DNS Record in Cloudflare

1. Go to **Cloudflare Dashboard** → Your domain (`ai2fin.com`)
2. **DNS** → **Records** → **Add record**
3. Configure:
   - **Type:** `CNAME`
   - **Name:** `connectors`
   - **Target:** `ai2-connectors.fly.dev`
   - **Proxy status:** ✅ **Proxied** (orange cloud)
   - **TTL:** Auto

4. **Save** - DNS will be: `connectors.ai2fin.com` → `ai2-connectors.fly.dev`

#### Step 2: Configure Fly.io Custom Domain

```powershell
cd "embracingearthspace/ai2-connectors"

# Add custom domain
fly certs add connectors.ai2fin.com -a ai2-connectors
```

#### Step 3: Enable Cloudflare Origin Lock (Optional but Recommended)

**What it does:** Ensures requests come through Cloudflare (prevents direct access to Fly.io)

**Setup:**

1. **In Cloudflare:**
   - Go to **Workers & Pages** → **Workers** → Create worker
   - Or use **Page Rules** → Add header

2. **Add custom header in Cloudflare:**
   - **Header name:** `x-origin-auth`
   - **Header value:** `your-secret-value-here` (generate random string)

3. **Set in Fly.io:**
```powershell
fly secrets set -a ai2-connectors `
  ENFORCE_CF_ORIGIN_LOCK="true" `
  ORIGIN_SHARED_SECRET="your-secret-value-here" `
  ORIGIN_HEADER_NAME="x-origin-auth"
```

**Result:** Only requests coming through Cloudflare will be accepted.

---

### 6. **Slack Setup for Notifications**

**Purpose:** Get alerts for errors, circuit breaker opens, critical issues

#### Step 1: Create Slack Webhook

1. Go to **Slack** → Your workspace
2. **Apps** → Search "**Incoming Webhooks**"
3. **Add to Slack** → Choose channel (e.g., `#alerts` or `#devops`)
4. **Copy webhook URL** (looks like: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`)

#### Step 2: Set in Fly.io

```powershell
fly secrets set -a ai2-connectors SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

#### Step 3: Test

The service will automatically send notifications for:
- Circuit breaker opens (core app down)
- Critical errors
- Webhook processing failures
- Connection errors

---

## 🗄️ Neon DB Setup (CRITICAL)

### Step 1: Create Neon Database

1. Go to **[Neon Console](https://console.neon.tech)**
2. **Sign in** / Create account
3. **Create Project:**
   - Project name: `ai2-connectors`
   - Database name: `neondb` (default)
   - Region: Choose closest (e.g., `us-east-1` or `ap-southeast-2` for Sydney)
4. **Copy connection string** (looks like):
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2: Set DATABASE_URL in Fly.io

```powershell
fly secrets set -a ai2-connectors DATABASE_URL="postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### Step 3: Create Database Schema

**Note:** Currently connectors service uses in-memory storage. You'll need to:

1. **Create Prisma schema** (or SQL migration)
2. **Create tables:**
   - `connections` - Store connection metadata
   - `credentials` - Store encrypted credentials
   - `sync_history` - Track sync operations

**Example schema:**
```sql
CREATE TABLE connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  connector_id TEXT NOT NULL,
  status TEXT NOT NULL,
  accounts JSONB,
  last_sync TIMESTAMP,
  last_error TEXT,
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE credentials (
  connection_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  encrypted_credentials TEXT NOT NULL, -- AES-256-GCM encrypted
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
);

CREATE INDEX idx_connections_user_id ON connections(user_id);
CREATE INDEX idx_connections_status ON connections(status);
```

### Step 4: Update Code to Use Database

**TODO:** Migrate `CredentialManager` from in-memory `Map` to database queries.

**Current code:** `src/core/CredentialManager.ts:32` uses `Map<string, string>`

**Needs:** Database queries using Prisma or raw SQL.

---

## 📝 Complete Setup Checklist

### Required Secrets (Service Won't Start Without)

- [ ] `JWT_SECRET` - Must match core app
- [ ] `SERVICE_SECRET` - Must match core app  
- [ ] `CORE_APP_URL` - Use `https://api.ai2fin.com`

### Recommended Secrets (Production Best Practices)

- [ ] `FRONTEND_URL` - Use `https://app.ai2fin.com`
- [ ] `CREDENTIAL_ENCRYPTION_KEY` - 32+ character key (prevents plaintext storage)
- [ ] `DATABASE_URL` - Neon DB connection string (CRITICAL for persistence)

### Optional Secrets (Feature-Specific)

- [ ] `APIDECK_API_KEY` - If using Apideck connector
- [ ] `APIDECK_APP_ID` - If using Apideck connector
- [ ] `APIDECK_WEBHOOK_SECRET` - If using Apideck webhooks
- [ ] `BASIQ_API_KEY` - If using Basiq connector
- [ ] `BASIQ_WEBHOOK_SECRET` - If using Basiq webhooks
- [ ] `SLACK_WEBHOOK_URL` - For error notifications

### Cloudflare & DNS

- [ ] DNS record: `connectors.ai2fin.com` → `ai2-connectors.fly.dev` (CNAME, proxied)
- [ ] Fly.io cert: `fly certs add connectors.ai2fin.com`
- [ ] Cloudflare Origin Lock (optional): `ENFORCE_CF_ORIGIN_LOCK="true"`

---

## 🚀 Complete Setup Commands

### Step 1: Set Required Secrets

```powershell
cd "embracingearthspace/ai2-connectors"

# Get these values from core app (must match!)
# Check core app secrets:
# fly secrets list -a ai2-core-api

fly secrets set -a ai2-connectors `
  JWT_SECRET="same-as-core-app-jwt-secret" `
  SERVICE_SECRET="same-as-core-app-service-secret" `
  CORE_APP_URL="https://api.ai2fin.com" `
  FRONTEND_URL="https://app.ai2fin.com"
```

### Step 2: Set Neon DB

```powershell
# Get connection string from Neon console
fly secrets set -a ai2-connectors DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"
```

### Step 3: Set Credential Encryption

```powershell
# Generate key first (32+ characters)
# Then set:
fly secrets set -a ai2-connectors CREDENTIAL_ENCRYPTION_KEY="your-32-char-minimum-key"
```

### Step 4: Set Optional (If Using)

```powershell
# Apideck (if using)
fly secrets set -a ai2-connectors `
  APIDECK_API_KEY="your-key" `
  APIDECK_APP_ID="your-app-id" `
  APIDECK_WEBHOOK_SECRET="your-webhook-secret"

# Slack (for notifications)
fly secrets set -a ai2-connectors SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."

# Cloudflare Origin Lock (optional)
fly secrets set -a ai2-connectors `
  ENFORCE_CF_ORIGIN_LOCK="true" `
  ORIGIN_SHARED_SECRET="random-secret-string" `
  ORIGIN_HEADER_NAME="x-origin-auth"
```

### Step 5: Configure DNS

1. **In Cloudflare Dashboard:**
   - Add CNAME: `connectors` → `ai2-connectors.fly.dev` (proxied)

2. **In Fly.io:**
```powershell
fly certs add connectors.ai2fin.com -a ai2-connectors
```

### Step 6: Deploy

```powershell
fly deploy -a ai2-connectors
```

---

## 🔍 Verify Setup

### Check Secrets

```powershell
fly secrets list -a ai2-connectors
```

### Check Health

```powershell
# Should return 200 OK
curl https://connectors.ai2fin.com/health
# or
curl https://ai2-connectors.fly.dev/health
```

### Check Logs

```powershell
fly logs -a ai2-connectors
```

**Look for:**
- ✅ `🔌 Connectors Service running on port 3003`
- ✅ `✅ Registered connectors: ...`
- ❌ No errors about missing `JWT_SECRET` or `DATABASE_URL`

---

## ⚠️ Common Issues

### Issue: "JWT_SECRET not configured"
**Fix:** Set `JWT_SECRET` - must match core app value

### Issue: "Authentication failed"
**Fix:** Ensure `JWT_SECRET` and `SERVICE_SECRET` match core app exactly

### Issue: Connections lost on restart
**Fix:** Set `DATABASE_URL` and migrate code from in-memory to database

### Issue: "CORS error"
**Fix:** Set `FRONTEND_URL="https://app.ai2fin.com"`

### Issue: DNS not working
**Fix:** 
1. Check Cloudflare DNS record (must be proxied)
2. Run `fly certs add connectors.ai2fin.com`
3. Wait 5-10 minutes for DNS propagation

---

## 📚 References

- [Neon DB Setup Guide](../ai2-core-app/NEON_DB_SETUP_GUIDE.md)
- [Environment Variables Reference](./ENV_VARIABLES_CURRENT_NEEDED.md)
- [Deployment Audit](./FLY_DEPLOYMENT_AUDIT.md)
- [Fly.io Custom Domains](https://fly.io/docs/app-guides/custom-domains-with-fly/)

---

**embracingearth.space - Complete connectors service setup guide**

