# 🚀 Deploy Wazuh Full Stack on Fly.io

**Date:** 2025-12-27  
**Status:** ✅ **READY TO DEPLOY**

---

## 📋 **What's Included**

**Single Fly.io App with:**
- ✅ Wazuh Manager (API on port 55000)
- ✅ Wazuh Indexer (Elasticsearch on port 9200)
- ✅ Wazuh Dashboard (Web UI on port 5601)

**Cost:** ~$28/month (with auto-stop enabled)

---

## 🚀 **Deployment Steps**

### **Step 1: Backup Current Configuration**

```powershell
cd D:\embracingearthspace\wazuh
# Backup current fly.toml
cp fly.toml fly.toml.backup
```

---

### **Step 2: Switch to Full Stack Configuration**

```powershell
# Use full stack files
cp fly.toml.fullstack fly.toml
```

---

### **Step 3: Update Volume Size (if needed)**

**Full stack needs more storage:**
```powershell
# Check current volume
fly volumes list -a ai2-wazuh

# If needed, create larger volume or extend existing
fly volumes extend wazuh_data -a ai2-wazuh --size 20
```

---

### **Step 4: Deploy Full Stack**

```powershell
cd D:\embracingearthspace\wazuh
fly deploy -a ai2-wazuh --config fly.toml
```

**Expected build time:** 10-15 minutes (installing all components)

---

### **Step 5: Set Secrets (if not already set)**

```powershell
# Wazuh API credentials
fly secrets set -a ai2-wazuh WAZUH_API_USER="wazuh"
fly secrets set -a ai2-wazuh WAZUH_API_PASSWORD="your-secure-password"
```

---

### **Step 6: Verify Services**

```powershell
# Check logs
fly logs -a ai2-wazuh

# SSH into container
fly ssh console -a ai2-wazuh

# Inside container, check services:
supervisorctl status
```

**Expected output:**
```
wazuh-manager    RUNNING
wazuh-indexer    RUNNING
wazuh-dashboard  RUNNING
```

---

## 🌐 **Access Dashboard**

**URL:** `https://ai2-wazuh.fly.dev`

**Default Credentials:**
- Username: `admin`
- Password: `admin`

**⚠️ Change default password immediately after first login!**

---

## 📊 **Service Ports**

| Service | Port | Access |
|---------|------|--------|
| Dashboard | 5601 | Public (via Fly.io) |
| Manager API | 55000 | Internal (localhost) |
| Indexer | 9200 | Internal (localhost) |

---

## 🔧 **Configuration Files**

**Manager:**
- `wazuh.conf` - Main configuration (Indexer enabled)
- `api/configuration/api.yaml` - API configuration

**Indexer:**
- `indexer/opensearch.yml` - Elasticsearch configuration

**Dashboard:**
- `dashboard/opensearch_dashboards.yml` - Dashboard configuration

**Service Management:**
- `supervisord.conf` - Manages all three services

---

## ⚠️ **Important Notes**

### **1. Startup Time**

**Full stack takes 2-3 minutes to start:**
- Manager: ~30 seconds
- Indexer: ~60-90 seconds (slowest)
- Dashboard: ~30-60 seconds

**Health check grace period:** 180 seconds (configured)

---

### **2. Resource Usage**

**Memory:** 4GB RAM required
- Manager: ~1GB
- Indexer: ~2GB
- Dashboard: ~1GB

**CPU:** 2 CPUs recommended

---

### **3. Certificates**

**Indexer certificates are auto-generated** on first startup via `09-generate-indexer-certs.sh`

**Location:** `/etc/wazuh-indexer/certs/`

---

## 🧪 **Testing**

### **Test Dashboard:**
```powershell
# Open in browser
https://ai2-wazuh.fly.dev
```

### **Test Manager API:**
```powershell
# From your machine
$cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("wazuh:YOUR_PASSWORD"))
$headers = @{ Authorization = "Basic $cred" }
Invoke-RestMethod -Uri "https://ai2-wazuh.fly.dev:55000/status" -Headers $headers -SkipCertificateCheck
```

**Note:** Manager API is internal only - access via SSH or internal networking.

---

## 🔄 **Rollback (if needed)**

**If deployment fails:**
```powershell
# Restore previous configuration
cp fly.toml.backup fly.toml
fly deploy -a ai2-wazuh --config fly.toml
```

---

## ✅ **Success Indicators**

**Check logs for:**
- ✅ `wazuh-manager: Started`
- ✅ `wazuh-indexer: started`
- ✅ `wazuh-dashboard: Server running`

**Check Dashboard:**
- ✅ Accessible at `https://ai2-wazuh.fly.dev`
- ✅ Login works
- ✅ Can see Wazuh interface

---

## 📋 **Troubleshooting**

### **Issue: Services not starting**

**Check logs:**
```powershell
fly logs -a ai2-wazuh
```

**Check supervisor status:**
```powershell
fly ssh console -a ai2-wazuh -C "supervisorctl status"
```

### **Issue: Dashboard not accessible**

**Check health:**
```powershell
fly ssh console -a ai2-wazuh -C "curl http://localhost:5601/api/status"
```

**Check port binding:**
```powershell
fly ssh console -a ai2-wazuh -C "netstat -tuln | grep 5601"
```

---

**Ready to deploy!** 🚀

