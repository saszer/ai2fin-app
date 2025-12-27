# 🔄 Switch to Full Stack - Fix 502 Error

**Date:** 2025-12-27  
**Issue:** 502 error because Dashboard not running

---

## 🚨 **The Problem**

**Current Setup (OLD):**
- ✅ Manager running (port 55000)
- ❌ Indexer/OpenSearch NOT running
- ❌ Dashboard NOT running
- **Result:** 502 error (nothing on port 5601)

**Full Stack Setup (NEW):**
- ✅ Manager running (port 55000)
- ✅ Indexer/OpenSearch running (port 9200)
- ✅ Dashboard running (port 5601)
- **Result:** Dashboard accessible!

---

## 🔧 **Quick Fix**

```powershell
cd D:\embracingearthspace\wazuh

# Backup current config
cp fly.toml fly.toml.manager-only.backup

# Switch to full stack
cp fly.toml.fullstack fly.toml

# Deploy full stack
fly deploy -a ai2-wazuh
```

**This will:**
1. Install Manager + Indexer + Dashboard
2. Start all three services
3. Dashboard on port 5601
4. **502 error fixed!**

---

## 📊 **What Changes**

**Before (Manager Only):**
- Dockerfile: `Dockerfile` (Manager only)
- Port: 55000 (Manager API)
- Memory: 1GB
- **No Dashboard** → 502 error

**After (Full Stack):**
- Dockerfile: `Dockerfile.fullstack` (all services)
- Port: 5601 (Dashboard)
- Memory: 4GB
- **Dashboard running** → Works!

---

## ⏱️ **Deployment Time**

**Build:** ~10-15 minutes (installing all components)  
**Startup:** ~2-3 minutes (Indexer is slowest)

**After deployment:**
- Dashboard: `https://ai2-wazuh.fly.dev` ✅
- Login: `admin` / `admin` (change immediately!)

---

**Run the commands above to fix the 502 error!** 🚀

