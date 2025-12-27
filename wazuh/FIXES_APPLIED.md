# ✅ Production Fixes Applied

**Date:** 2025-12-27  
**Status:** ✅ **FIXES APPLIED**

---

## 🔧 **Fixes Applied**

### **1. Manager API Exposure** ✅

**Issue:** Core app couldn't access Manager API (port 55000 internal only)

**Fix:** Added TCP service in `fly.toml.fullstack` to expose Manager API

**Result:**
- Manager API accessible on port 55000
- Core app can connect via `https://ai2-wazuh.fly.dev:55000`
- OR use internal networking: `https://ai2-wazuh.internal:55000`

---

### **2. Volume Mounts** ✅

**Issue:** Indexer and Dashboard data not persisted

**Fix:** 
- Updated Dockerfile to create data directories in volume
- Indexer data: `/var/ossec/data/wazuh-indexer`
- Dashboard data: `/var/ossec/data/wazuh-dashboard`
- All data in single volume (cost-efficient)

---

### **3. Core App Configuration** ✅

**Issue:** Core app hardcoded `:55000` URL

**Fix:** Updated `ai2-core-app/src/lib/wazuh.ts` to support:
- Direct Manager API URL
- Internal networking
- Environment variable override

**New Environment Variable:**
- `WAZUH_MANAGER_API_URL` - Override Manager API URL if needed

---

### **4. Password Configuration** ✅

**Issue:** Default passwords (security risk)

**Fix:** Created `10-set-indexer-dashboard-passwords.sh` script

**Environment Variables:**
- `OPENSEARCH_INITIAL_ADMIN_PASSWORD` - Indexer admin password
- `OPENSEARCH_DASHBOARDS_PASSWORD` - Dashboard admin password

**⚠️ Still need to set these via Fly.io secrets!**

---

## 📋 **Pre-Deployment Checklist**

### **Before Deploying:**

- [x] ✅ Manager API exposure configured
- [x] ✅ Volume mounts updated
- [x] ✅ Core app configuration fixed
- [x] ✅ Password script created
- [ ] ⚠️ **Set Fly.io secrets** (see below)
- [ ] ⚠️ **Update core app secrets** (see below)
- [ ] ⚠️ **Test connectivity** (after deployment)

---

## 🔐 **Required Secrets**

### **Wazuh App Secrets:**

```powershell
# Wazuh API credentials
fly secrets set -a ai2-wazuh WAZUH_API_USER="wazuh"
fly secrets set -a ai2-wazuh WAZUH_API_PASSWORD="your-secure-password"

# Indexer and Dashboard passwords (IMPORTANT!)
fly secrets set -a ai2-wazuh OPENSEARCH_INITIAL_ADMIN_PASSWORD="your-secure-indexer-password"
fly secrets set -a ai2-wazuh OPENSEARCH_DASHBOARDS_PASSWORD="your-secure-dashboard-password"
```

---

### **Core App Secrets:**

```powershell
# Enable Wazuh integration
fly secrets set -a ai2-core-api WAZUH_ENABLED="true"

# Manager URL (use internal networking for security)
fly secrets set -a ai2-core-api WAZUH_MANAGER_URL="https://ai2-wazuh.internal:55000"
# OR external (if Manager API exposed):
# fly secrets set -a ai2-core-api WAZUH_MANAGER_URL="https://ai2-wazuh.fly.dev"

# API credentials (same as Wazuh app)
fly secrets set -a ai2-core-api WAZUH_API_USER="wazuh"
fly secrets set -a ai2-core-api WAZUH_API_PASSWORD="same-password-as-wazuh-app"

# Optional: Override Manager API URL if needed
# fly secrets set -a ai2-core-api WAZUH_MANAGER_API_URL="https://ai2-wazuh.fly.dev:55000"
```

---

## 🗄️ **Database Requirements**

### **✅ NO External Database Needed!**

**Wazuh Storage (All in Fly.io Volumes):**
- ✅ **Manager:** SQLite in `/var/ossec/data`
- ✅ **Indexer:** Elasticsearch in `/var/ossec/data/wazuh-indexer`
- ✅ **Dashboard:** Config in `/var/ossec/data/wazuh-dashboard`

**No Neon DB required!** Everything is self-contained.

---

## 🚀 **Deployment Steps**

### **Step 1: Set Secrets**

```powershell
# Wazuh app
fly secrets set -a ai2-wazuh WAZUH_API_USER="wazuh"
fly secrets set -a ai2-wazuh WAZUH_API_PASSWORD="your-password"
fly secrets set -a ai2-wazuh OPENSEARCH_INITIAL_ADMIN_PASSWORD="your-indexer-password"
fly secrets set -a ai2-wazuh OPENSEARCH_DASHBOARDS_PASSWORD="your-dashboard-password"
```

### **Step 2: Deploy Wazuh**

```powershell
cd D:\embracingearthspace\wazuh
cp fly.toml.fullstack fly.toml
fly deploy -a ai2-wazuh
```

### **Step 3: Set Core App Secrets**

```powershell
# Core app
fly secrets set -a ai2-core-api WAZUH_ENABLED="true"
fly secrets set -a ai2-core-api WAZUH_MANAGER_URL="https://ai2-wazuh.internal:55000"
fly secrets set -a ai2-core-api WAZUH_API_USER="wazuh"
fly secrets set -a ai2-core-api WAZUH_API_PASSWORD="same-password"
```

### **Step 4: Test**

```powershell
# Test Dashboard
# Open: https://ai2-wazuh.fly.dev
# Login: admin / (your-dashboard-password)

# Test Manager API (from core app or SSH)
fly ssh console -a ai2-wazuh -C "curl -k -u wazuh:password https://localhost:55000/status"
```

---

## ✅ **Status After Fixes**

- ✅ Manager API exposed (port 55000)
- ✅ Volume mounts configured (all data persisted)
- ✅ Core app configuration fixed
- ✅ Password script created
- ⚠️ **Secrets need to be set** (before deployment)
- ⚠️ **Core app secrets need to be set** (after Wazuh deployment)

---

## 🎯 **Production Ready?**

**Almost!** Just need to:
1. Set Fly.io secrets (passwords)
2. Deploy
3. Test connectivity
4. Change default Dashboard password (first login)

**Then it's production ready!** ✅
