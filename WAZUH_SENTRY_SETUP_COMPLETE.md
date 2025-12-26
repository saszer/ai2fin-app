# 🚀 Wazuh + Sentry Setup Complete!

**Date:** 2025-01-26  
**Status:** ✅ Ready for deployment

---

## 📦 What's Been Set Up

### **1. Wazuh (Self-Hosted SIEM/XDR)**
- ✅ Wazuh server configuration for Fly.io
- ✅ Wazuh client integration in core app
- ✅ Security event tracking middleware
- ✅ Authentication failure tracking
- ✅ JWT verification failure tracking
- ✅ Rate limit violation tracking
- ✅ Credential access tracking

### **2. Sentry (Application Error Tracking)**
- ✅ Sentry initialization in server
- ✅ Error tracking integration
- ✅ Performance monitoring
- ✅ Security event tagging
- ✅ User context tracking

---

## 🚀 Deployment Steps

### **Step 1: Deploy Wazuh Server**

```powershell
# Navigate to wazuh directory
cd D:\embracingearthspace\wazuh

# Run setup script
.\setup-wazuh.ps1
```

**Or manually:**
```powershell
# Create app
fly apps create ai2-wazuh --org embracingearth

# Set secrets (generate secure password)
$wazuhPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
fly secrets set -a ai2-wazuh WAZUH_API_USER="wazuh"
fly secrets set -a ai2-wazuh WAZUH_API_PASSWORD="$wazuhPassword"

# Create volume
fly volumes create wazuh_data --size 10 --app ai2-wazuh --region syd

# Deploy
fly deploy --app ai2-wazuh --config fly.toml
```

**Save the Wazuh password securely!**

---

### **Step 2: Configure Core App**

**Set Wazuh secrets in Fly.io:**
```powershell
# Get Wazuh URL
fly status -a ai2-wazuh

# Set secrets in core app
fly secrets set -a ai2-core-api WAZUH_ENABLED="true"
fly secrets set -a ai2-core-api WAZUH_MANAGER_URL="https://ai2-wazuh.fly.dev"
fly secrets set -a ai2-core-api WAZUH_API_USER="wazuh"
fly secrets set -a ai2-core-api WAZUH_API_PASSWORD="<your-wazuh-password>"
```

**Set Sentry DSN:**
```powershell
# Get DSN from Sentry dashboard (https://sentry.io)
fly secrets set -a ai2-core-api SENTRY_DSN="https://your-dsn@sentry.io/project-id"
```

---

### **Step 3: Install Dependencies**

```powershell
cd D:\embracingearthspace\ai2-core-app
npm install
```

**New dependencies added:**
- `@sentry/node` - Sentry error tracking
- `@sentry/react` - React error tracking
- `@sentry/tracing` - Performance monitoring
- `@sentry/integrations` - Source map support

---

### **Step 4: Deploy Core App**

```powershell
cd D:\embracingearthspace\ai2-core-app
fly deploy --app ai2-core-api
```

---

## 🔍 What Gets Monitored

### **Wazuh Security Events:**
- ✅ Failed authentication attempts
- ✅ JWT verification failures
- ✅ Rate limit violations
- ✅ Suspicious activity
- ✅ Credential access (bank connectors)
- ✅ Brute force attacks
- ✅ Authorization failures

### **Sentry Application Events:**
- ✅ Application errors
- ✅ Performance issues
- ✅ Security events (tagged)
- ✅ User context
- ✅ Stack traces
- ✅ Request context

---

## 📊 Access Dashboards

### **Wazuh Dashboard:**
- **URL:** `https://ai2-wazuh.fly.dev:55000`
- **Username:** `wazuh`
- **Password:** (from setup)

### **Sentry Dashboard:**
- **URL:** `https://sentry.io`
- **Login:** Your Sentry account

---

## 🔧 Configuration Files

### **Wazuh:**
- `wazuh/Dockerfile` - Wazuh server container
- `wazuh/fly.toml` - Fly.io deployment config
- `wazuh/wazuh.conf` - Wazuh manager config
- `wazuh/local_internal_options.conf` - Internal options
- `ai2-core-app/src/lib/wazuh.ts` - Wazuh client
- `ai2-core-app/src/middleware/wazuhSecurity.ts` - Security tracking

### **Sentry:**
- `ai2-core-app/src/lib/sentry.ts` - Sentry integration
- `ai2-core-app/src/server.ts` - Sentry initialization

---

## ✅ Verification

### **Test Wazuh:**
```powershell
# Check Wazuh is running
fly status -a ai2-wazuh

# Test API (replace password)
curl -u wazuh:your-password https://ai2-wazuh.fly.dev:55000/
```

### **Test Sentry:**
```powershell
# Trigger test error (will appear in Sentry)
curl https://api.ai2fin.com/api/test-error
```

### **Check Logs:**
```powershell
# Core app logs
fly logs -a ai2-core-api

# Wazuh logs
fly logs -a ai2-wazuh
```

---

## 🎯 Next Steps

1. **Deploy Wazuh server** (Step 1)
2. **Configure secrets** (Step 2)
3. **Install dependencies** (Step 3)
4. **Deploy core app** (Step 4)
5. **Verify monitoring** (Check dashboards)
6. **Set up alerts** (Wazuh + Sentry)

---

## 📋 Environment Variables

### **Core App (.env or Fly.io secrets):**
```bash
# Wazuh
WAZUH_ENABLED=true
WAZUH_MANAGER_URL=https://ai2-wazuh.fly.dev
WAZUH_API_USER=wazuh
WAZUH_API_PASSWORD=<your-password>
WAZUH_AGENT_ID=000  # Optional

# Sentry
SENTRY_DSN=https://your-dsn@sentry.io/project-id
NODE_ENV=production
APP_VERSION=1.0.0  # Optional
```

---

## 🎉 You're All Set!

Your application now has:
- ✅ **Enterprise security monitoring** (Wazuh)
- ✅ **Application error tracking** (Sentry)
- ✅ **Real-time threat detection**
- ✅ **Compliance-ready logging**

**Both tools are integrated and ready to deploy!** 🚀

