# 🚀 Deployment Checklist - AI2 Connectors Service

**Release Version:** 1.1.0  
**embracingearth.space**

---

## ✅ Pre-Deployment Checklist

### 1. **Code Status**
- [x] All mocks/placeholders removed
- [x] Plaid webhook verification implemented (JWT)
- [x] Secure credential storage (AES-256-GCM)
- [x] Transaction enrichment service
- [x] Audit logging complete
- [x] No linter errors (except Prisma - will fix on deploy)

### 2. **Database Setup** ⚠️ **REQUIRED BEFORE DEPLOY**

```bash
# Generate Prisma client locally first
cd embracingearthspace/ai2-connectors
npm install
npx prisma generate

# Push schema to production database
npx prisma db push --schema=./prisma/schema.prisma
```

**CRITICAL:** Database must exist and schema must be pushed before deployment!

---

## 🔐 Required Environment Variables

### **CRITICAL - Must Set Before First Deploy:**

```bash
# Authentication (must match core app)
fly secrets set -a ai2-connectors \
  JWT_SECRET="your-jwt-secret" \
  SERVICE_SECRET="your-service-secret"

# Service URLs
fly secrets set -a ai2-connectors \
  CORE_APP_URL="https://ai2-core-api.fly.dev" \
  FRONTEND_URL="https://app.ai2fin.com"

# Database (REQUIRED for secure credential storage)
fly secrets set -a ai2-connectors \
  DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/connectors?sslmode=require" \
  CREDENTIAL_ENCRYPTION_KEY="$(openssl rand -base64 32)"

# Plaid (if using)
fly secrets set -a ai2-connectors \
  PLAID_CLIENT_ID="your-plaid-client-id" \
  PLAID_SECRET="your-plaid-secret" \
  PLAID_ENV="production"

# Basiq (if using)
fly secrets set -a ai2-connectors \
  BASIQ_API_KEY="your-basiq-api-key" \
  BASIQ_WEBHOOK_SECRET="your-basiq-webhook-secret" \
  BASIQ_ENVIRONMENT="production"

# Wise (if using)
fly secrets set -a ai2-connectors \
  WISE_CLIENT_ID="your-wise-client-id" \
  WISE_CLIENT_SECRET="your-wise-client-secret" \
  WISE_ENV="production" \
  WISE_WEBHOOK_SECRET="your-wise-webhook-secret"

# Apideck (if using)
fly secrets set -a ai2-connectors \
  APIDECK_API_KEY="your-apideck-api-key" \
  APIDECK_APP_ID="your-apideck-app-id" \
  APIDECK_WEBHOOK_SECRET="your-apideck-webhook-secret"
```

---

## 📦 Deployment Steps

### **Step 1: Verify Git Status**

```bash
cd embracingearthspace/ai2-connectors
git status
git log --oneline -5  # Verify recent commits
```

### **Step 2: Push to Git (if not already synced)**

```bash
git add .
git commit -m "Release v1.1.0: Secure credential storage, Plaid Enrich, webhook verification"
git push origin main
```

### **Step 3: Deploy to Fly.io**

```bash
# From ai2-connectors directory
fly deploy -a ai2-connectors

# Or with verbose output
fly deploy -a ai2-connectors --verbose
```

### **Step 4: Verify Deployment**

```bash
# Check health endpoint
curl https://ai2-connectors.fly.dev/health

# Check logs
fly logs -a ai2-connectors

# Check for errors
fly logs -a ai2-connectors | grep -i error

# Verify secure storage initialized
fly logs -a ai2-connectors | grep "Secure Credential Storage"
```

---

## 🔍 Post-Deployment Verification

### **1. Health Check**
```bash
curl https://ai2-connectors.fly.dev/health
# Expected: {"status":"ok","service":"connectors","version":"1.1.0"}
```

### **2. Database Connection**
```bash
fly logs -a ai2-connectors | grep "Prisma connected"
# Expected: "✅ Connectors DB: Prisma connected successfully"
```

### **3. Secure Storage**
```bash
fly logs -a ai2-connectors | grep "Secure Credential Storage"
# Expected: "Secure Credential Storage: Enabled (AES-256-GCM)"
```

### **4. Connector Status**
```bash
# Test Plaid status
curl -H "Authorization: Bearer YOUR_JWT" \
  https://ai2-connectors.fly.dev/api/connectors/plaid/status

# Test Basiq status
curl -H "Authorization: Bearer YOUR_JWT" \
  https://ai2-connectors.fly.dev/api/connectors/basiq/status
```

---

## 🚨 Troubleshooting

### **Error: "Prisma Client not generated"**
```bash
# Fix: Prisma client is generated during Docker build
# If it fails, check Dockerfile includes prisma generate
```

### **Error: "DATABASE_URL not set"**
```bash
# Fix: Set database URL
fly secrets set -a ai2-connectors DATABASE_URL="postgresql://..."
```

### **Error: "CREDENTIAL_ENCRYPTION_KEY not set"**
```bash
# Fix: Generate and set encryption key
fly secrets set -a ai2-connectors CREDENTIAL_ENCRYPTION_KEY="$(openssl rand -base64 32)"
```

### **Error: "JWT verification failed"**
```bash
# Fix: Ensure JWT_SECRET matches core app
fly secrets list -a ai2-connectors | grep JWT_SECRET
fly secrets list -a ai2-core-api | grep JWT_SECRET
# Must be identical!
```

### **Error: "Connection refused" from core app**
```bash
# Fix: Ensure CONNECTORS_URL is set in core app
fly secrets set -a ai2-core-api CONNECTORS_URL="https://ai2-connectors.fly.dev"
```

---

## 📊 Monitoring

### **View Real-Time Logs**
```bash
fly logs -a ai2-connectors
```

### **Check App Status**
```bash
fly status -a ai2-connectors
```

### **View Metrics**
Visit: https://fly.io/apps/ai2-connectors/monitoring

---

## ✅ Success Criteria

- [ ] Health endpoint returns 200
- [ ] Database connection successful
- [ ] Secure credential storage enabled
- [ ] All connectors configured (Plaid/Basiq/Wise)
- [ ] Webhook verification working
- [ ] No errors in logs
- [ ] Core app can connect to connectors service

---

**Ready to deploy? Run:**
```bash
cd embracingearthspace/ai2-connectors
fly deploy -a ai2-connectors
```
oo


