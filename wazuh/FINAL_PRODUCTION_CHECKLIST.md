# ✅ Final Production Checklist - Wazuh Full Stack

**Date:** 2025-12-27  
**Status:** ✅ **READY AFTER SECRETS SET**

---

## 🎯 **Production Readiness Status**

### **✅ Infrastructure: READY**
- ✅ Dockerfile.fullstack - Complete
- ✅ fly.toml.fullstack - Configured
- ✅ Supervisord - Service management
- ✅ Volume mounts - Data persistence
- ✅ Health checks - Configured

### **✅ Configuration: READY**
- ✅ Manager config - Indexer enabled
- ✅ Indexer config - Single-node
- ✅ Dashboard config - Connected to Indexer
- ✅ API config - HTTPS enabled

### **✅ Core App: READY**
- ✅ Wazuh client library - Updated
- ✅ URL configuration - Supports internal networking
- ✅ Environment variables - Configured

### **⚠️ Secrets: REQUIRED**
- ⚠️ Wazuh API credentials - Must be set
- ⚠️ Indexer password - Must be set
- ⚠️ Dashboard password - Must be set
- ⚠️ Core app secrets - Must be set

---

## 🗄️ **Database Requirements**

### **✅ NO External Database Needed!**

**Wazuh is Self-Contained:**
- ✅ **Manager:** SQLite database → `/var/ossec/data` (volume)
- ✅ **Indexer:** Elasticsearch data → `/var/ossec/data/wazuh-indexer` (volume)
- ✅ **Dashboard:** Config data → `/var/ossec/data/wazuh-dashboard` (volume)

**No Neon DB, no external database!** Everything stored in Fly.io volumes.

**Volume Configuration:**
- Single volume: `wazuh_data` (mounted to `/var/ossec/data`)
- All data persisted automatically
- No additional setup needed

---

## 🔐 **Required Environment Variables**

### **Wazuh App (ai2-wazuh) Secrets:**

```powershell
# Required: Wazuh API credentials
fly secrets set -a ai2-wazuh WAZUH_API_USER="wazuh"
fly secrets set -a ai2-wazuh WAZUH_API_PASSWORD="your-secure-password"

# Recommended: Indexer and Dashboard passwords
fly secrets set -a ai2-wazuh OPENSEARCH_INITIAL_ADMIN_PASSWORD="your-indexer-password"
fly secrets set -a ai2-wazuh OPENSEARCH_DASHBOARDS_PASSWORD="your-dashboard-password"
```

**Default (if not set):**
- Indexer: `admin` / `admin` ⚠️ **Change after deployment!**
- Dashboard: `admin` / `admin` ⚠️ **Change after deployment!**

---

### **Core App (ai2-core-api) Secrets:**

```powershell
# Enable Wazuh integration
fly secrets set -a ai2-core-api WAZUH_ENABLED="true"

# Manager URL (use internal networking - more secure)
fly secrets set -a ai2-core-api WAZUH_MANAGER_URL="https://ai2-wazuh.internal:55000"

# OR use external URL (if you expose Manager API):
# fly secrets set -a ai2-core-api WAZUH_MANAGER_URL="https://ai2-wazuh.fly.dev"

# API credentials (same as Wazuh app)
fly secrets set -a ai2-core-api WAZUH_API_USER="wazuh"
fly secrets set -a ai2-core-api WAZUH_API_PASSWORD="same-password-as-wazuh-app"

# Optional: Override Manager API URL if needed
# fly secrets set -a ai2-core-api WAZUH_MANAGER_API_URL="https://ai2-wazuh.fly.dev:55000"
```

---

## 🚀 **Deployment Steps**

### **Step 1: Set Wazuh Secrets**

```powershell
# Generate secure passwords
$wazuhPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$indexerPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$dashboardPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Set secrets
fly secrets set -a ai2-wazuh WAZUH_API_USER="wazuh"
fly secrets set -a ai2-wazuh WAZUH_API_PASSWORD="$wazuhPassword"
fly secrets set -a ai2-wazuh OPENSEARCH_INITIAL_ADMIN_PASSWORD="$indexerPassword"
fly secrets set -a ai2-wazuh OPENSEARCH_DASHBOARDS_PASSWORD="$dashboardPassword"

# Save passwords!
Write-Host "Wazuh API Password: $wazuhPassword"
Write-Host "Indexer Password: $indexerPassword"
Write-Host "Dashboard Password: $dashboardPassword"
```

---

### **Step 2: Deploy Wazuh Full Stack**

```powershell
cd D:\embracingearthspace\wazuh

# Switch to full stack config
cp fly.toml.fullstack fly.toml

# Deploy
fly deploy -a ai2-wazuh
```

**Build time:** ~10-15 minutes  
**Startup time:** ~2-3 minutes (Indexer is slowest)

---

### **Step 3: Set Core App Secrets**

```powershell
# Use same password as Wazuh app
fly secrets set -a ai2-core-api WAZUH_ENABLED="true"
fly secrets set -a ai2-core-api WAZUH_MANAGER_URL="https://ai2-wazuh.internal:55000"
fly secrets set -a ai2-core-api WAZUH_API_USER="wazuh"
fly secrets set -a ai2-core-api WAZUH_API_PASSWORD="$wazuhPassword"  # Same as Wazuh app
```

---

### **Step 4: Verify Deployment**

```powershell
# Check Wazuh status
fly status -a ai2-wazuh

# Check logs
fly logs -a ai2-wazuh

# Test Dashboard
# Open: https://ai2-wazuh.fly.dev
# Login: admin / (your-dashboard-password)

# Test Manager API (from SSH)
fly ssh console -a ai2-wazuh -C "curl -k -u wazuh:password https://localhost:55000/status"
```

---

## ✅ **What Gets Created Automatically**

### **On First Deployment:**

1. **Manager Database:**
   - SQLite database created in `/var/ossec/data`
   - Agent data, alerts, events stored here
   - **No setup needed** - auto-created

2. **Indexer Data:**
   - Elasticsearch indices created in `/var/ossec/data/wazuh-indexer`
   - Security events indexed here
   - **No setup needed** - auto-created

3. **Dashboard Data:**
   - Dashboard configuration in `/var/ossec/data/wazuh-dashboard`
   - User preferences, saved searches
   - **No setup needed** - auto-created

4. **Certificates:**
   - SSL certificates auto-generated
   - Indexer certificates created by init script
   - **No setup needed** - auto-generated

---

## 🔒 **Security Checklist**

### **After Deployment:**

- [ ] ✅ Change Dashboard default password (first login)
- [ ] ✅ Change Indexer default password (if using security)
- [ ] ✅ Verify Manager API requires authentication
- [ ] ✅ Test core app connectivity
- [ ] ✅ Review security events in Dashboard

---

## 📊 **Access URLs**

### **Dashboard (Public):**
```
https://ai2-wazuh.fly.dev
```
**Login:** `admin` / (your-dashboard-password)

### **Manager API (Internal):**
```
https://ai2-wazuh.internal:55000
```
**Access:** From other Fly.io apps in same org  
**Authentication:** Basic Auth (wazuh / password)

### **Manager API (External - if exposed):**
```
https://ai2-wazuh.fly.dev:55000
```
**Note:** Not exposed by default (use internal networking)

---

## ✅ **Production Ready Checklist**

- [x] ✅ Dockerfile complete
- [x] ✅ fly.toml configured
- [x] ✅ Volume mounts configured
- [x] ✅ Core app integration fixed
- [x] ✅ Health checks configured
- [ ] ⚠️ **Set Fly.io secrets** (REQUIRED)
- [ ] ⚠️ **Deploy to Fly.io**
- [ ] ⚠️ **Change default passwords**
- [ ] ⚠️ **Test connectivity**

---

## 🎯 **Final Status**

**✅ Code: PRODUCTION READY**  
**⚠️ Deployment: REQUIRES SECRETS**

**After setting secrets and deploying:**
- ✅ Full stack will be operational
- ✅ Dashboard accessible
- ✅ Manager API accessible (internal)
- ✅ Core app can connect
- ✅ All data persisted

**Ready to deploy!** Just set the secrets first! 🚀

