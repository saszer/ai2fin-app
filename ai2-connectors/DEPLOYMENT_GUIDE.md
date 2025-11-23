# 🚀 AI2 Connectors Service - Deployment Guide

**Service:** AI2 Connectors Microservice  
**Repository:** https://github.com/saszer/ai2fin-app/tree/master/ai2-connectors  
**Platform:** Fly.io  
**Port:** 3003

---

## 📋 **Prerequisites**

1. **Fly.io CLI installed**
   ```bash
   # Install Fly.io CLI
   # Windows (PowerShell):
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   
   # macOS/Linux:
   curl -L https://fly.io/install.sh | sh
   ```

2. **Fly.io account and authentication**
   ```bash
   fly auth login
   ```

3. **Docker installed** (for local testing)

---

## 🔧 **Environment Variables**

### **Required Variables**

Set these secrets in Fly.io before deploying:

```bash
# JWT Authentication
fly secrets set JWT_SECRET="your-jwt-secret-here"

# Core App Integration
fly secrets set CORE_APP_URL="https://ai2-core-api.fly.dev"
fly secrets set SERVICE_SECRET="your-service-secret"  # Used for x-service-secret header

# Frontend URL (for CORS)
fly secrets set FRONTEND_URL="https://your-frontend-domain.com"

# Connector-Specific API Keys
fly secrets set BASIQ_API_KEY="your-basiq-api-key"
fly secrets set APIDECK_API_KEY="your-apideck-api-key"
fly secrets set APIDECK_APP_ID="your-apideck-app-id"
```

### **Optional Variables**

```bash
# Slack Notifications (for alerts)
fly secrets set SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."

# Cloudflare Origin Lock (if using Cloudflare)
fly secrets set ENFORCE_CF_ORIGIN_LOCK="true"
fly secrets set ORIGIN_SHARED_SECRET="your-origin-secret"
fly secrets set ORIGIN_HEADER_NAME="x-origin-auth"

# WebSocket Configuration
fly secrets set WEBSOCKET_PATH="/socket.io"
```

---

## 🚀 **Deployment Steps**

### **Step 1: Navigate to Connectors Directory**

```bash
cd "Z:\ai2fin graphigxs\MAIN\embracingearthspace\ai2-connectors"
```

### **Step 2: Create Fly.io App (First Time Only)**

```bash
fly launch --no-deploy
```

This will:
- Create `fly.toml` (already exists, will ask to overwrite - say **NO**)
- Create the app on Fly.io
- Set up the deployment configuration

**OR** if app already exists:

```bash
fly apps create ai2-connectors
```

### **Step 3: Set Environment Variables**

```bash
# Set all required secrets
fly secrets set JWT_SECRET="your-jwt-secret" \
  CORE_APP_URL="https://ai2-core-api.fly.dev" \
  SERVICE_SECRET="your-service-secret" \
  FRONTEND_URL="https://your-frontend-domain.com" \
  BASIQ_API_KEY="your-basiq-key" \
  APIDECK_API_KEY="your-apideck-key" \
  APIDECK_APP_ID="your-apideck-app-id"
```

### **Step 4: Build and Deploy**

```bash
# Deploy to Fly.io
fly deploy
```

**What happens:**
1. Docker builds the image using `Dockerfile`
2. TypeScript compiles to JavaScript
3. Image is pushed to Fly.io registry
4. Service starts on port 3003
5. Health check verifies `/health` endpoint

### **Step 5: Verify Deployment**

```bash
# Check app status
fly status

# View logs
fly logs

# Check health endpoint
fly curl /health
```

---

## 🔍 **Post-Deployment Verification**

### **1. Health Check**

```bash
# Should return 200 OK
curl https://ai2-connectors.fly.dev/health
```

**Expected response:**
```json
{
  "status": "ok",
  "service": "connectors",
  "timestamp": "2025-01-27T..."
}
```

### **2. Test Connector Providers Endpoint**

```bash
# Requires JWT token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://ai2-connectors.fly.dev/api/connectors/providers
```

### **3. Check Logs**

```bash
fly logs
```

Look for:
- ✅ `🔌 Connectors Service running on port 3003`
- ✅ `✅ Registered connectors: ...`
- ❌ No errors about missing environment variables

---

## 🔗 **Integration with Core App**

### **Update Core App Service Discovery**

The core app needs to know the connectors service URL:

**In `ai2-core-app`:**
```bash
# Set connectors service URL
fly secrets set CONNECTORS_URL="https://ai2-connectors.fly.dev"
fly secrets set CONNECTORS_PORT="443"
```

**OR** update `ai2-core-app/src/lib/serviceDiscovery.ts`:
```typescript
const connectorsUrl = process.env.CONNECTORS_URL || 'https://ai2-connectors.fly.dev';
const connectorsPort = parsePort(process.env.CONNECTORS_PORT, 443);
```

---

## 📊 **Monitoring & Scaling**

### **View Metrics**

```bash
# App metrics
fly metrics

# Machine status
fly status

# Scale up/down
fly scale count 2  # Run 2 instances
fly scale vm shared-cpu-2x  # Upgrade to 2 CPUs
```

### **Auto-Scaling Configuration**

The `fly.toml` includes:
- **Auto-start:** Machines start automatically when requests arrive
- **Auto-stop:** Machines stop after 30 minutes of inactivity (cost savings)
- **Concurrency:** 150 soft limit, 200 hard limit per machine

### **Manual Scaling**

```bash
# Scale to 2 machines for high load
fly scale count 2

# Scale to larger VM
fly scale vm shared-cpu-2x --memory 1024
```

---

## 🔄 **Updating/Re-deploying**

### **Standard Update**

```bash
cd "Z:\ai2fin graphigxs\MAIN\embracingearthspace\ai2-connectors"
fly deploy
```

### **Rollback (if needed)**

```bash
# List releases
fly releases

# Rollback to previous version
fly releases rollback
```

---

## 🐛 **Troubleshooting**

### **Issue: Build Fails**

**Check:**
1. Docker is running
2. `package.json` has all dependencies
3. TypeScript compiles without errors

**Fix:**
```bash
# Test build locally
docker build -t ai2-connectors-test .
docker run -p 3003:3003 ai2-connectors-test
```

### **Issue: Service Won't Start**

**Check logs:**
```bash
fly logs
```

**Common causes:**
- Missing `JWT_SECRET` → Set it: `fly secrets set JWT_SECRET="..."`
- Missing `CORE_APP_URL` → Set it: `fly secrets set CORE_APP_URL="..."`
- Port conflict → Check `fly.toml` internal_port matches Dockerfile EXPOSE

### **Issue: Health Check Fails**

**Verify health endpoint:**
```bash
# SSH into machine
fly ssh console

# Test health endpoint
curl http://localhost:3003/health
```

**Check:**
- Server is listening on port 3003
- `/health` route is registered
- No errors in logs

### **Issue: Connectors Not Available**

**Check:**
1. Environment variables for connectors are set (BASIQ_API_KEY, APIDECK_API_KEY, etc.)
2. Connectors are registered on startup (check logs for "Registered connectors")
3. Core app can reach connectors service

---

## 🔐 **Security Checklist**

Before deploying to production:

- [ ] `JWT_SECRET` is set and secure
- [ ] `SERVICE_SECRET` matches core app's service secret
- [ ] `FRONTEND_URL` is set correctly (CORS)
- [ ] All API keys are set (BASIQ, APIDECK, etc.)
- [ ] Cloudflare origin lock enabled (if using Cloudflare)
- [ ] Health checks are working
- [ ] Logs don't expose sensitive data

---

## 📝 **Quick Reference**

### **Common Commands**

```bash
# Deploy
fly deploy

# View logs
fly logs

# Check status
fly status

# Set secret
fly secrets set KEY="value"

# List secrets
fly secrets list

# SSH into machine
fly ssh console

# Scale
fly scale count 2

# Restart
fly apps restart ai2-connectors
```

### **Service URLs**

- **Production:** `https://ai2-connectors.fly.dev`
- **Health:** `https://ai2-connectors.fly.dev/health`
- **API Base:** `https://ai2-connectors.fly.dev/api/connectors`

---

## 🎯 **Next Steps After Deployment**

1. **Update Core App Configuration**
   - Set `CONNECTORS_URL` in core app
   - Verify service discovery works

2. **Test Integration**
   - Test connector providers endpoint
   - Test connection creation
   - Test transaction sync

3. **Monitor**
   - Set up alerts for health check failures
   - Monitor logs for errors
   - Track API usage

---

**embracingearth.space - Enterprise connectors deployment guide**

