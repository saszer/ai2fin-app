# 🚀 Fix 502 Error - Deploy Full Stack Now!

**Date:** 2025-12-27  
**Status:** ✅ **CONFIGURATION UPDATED - READY TO DEPLOY**

---

## ✅ **What I Just Fixed**

**Updated `fly.toml` to use full stack:**
- ✅ Changed `Dockerfile` → `Dockerfile.fullstack`
- ✅ Changed port `55000` → `5601` (Dashboard)
- ✅ Changed memory `1GB` → `4GB`
- ✅ Changed CPUs `1` → `2`
- ✅ Added health check for Dashboard

---

## 🚀 **Deploy Now!**

```powershell
cd D:\embracingearthspace\wazuh
fly deploy -a ai2-wazuh
```

**This will:**
1. Build full stack (Manager + Indexer + Dashboard)
2. Install OpenSearch (Indexer)
3. Install Dashboard
4. Start all services
5. **Fix 502 error!**

---

## 📊 **What is OpenSearch?**

**OpenSearch** = Search engine (Elasticsearch fork)

**In Wazuh:**
- **Indexer** = OpenSearch (stores security events)
- **Dashboard** = Kibana-based UI (visualizes events)

**After deployment:**
- Indexer/OpenSearch runs on port 9200 (internal)
- Dashboard runs on port 5601 (exposed)
- **Dashboard accessible at:** `https://ai2-wazuh.fly.dev` ✅

---

## ⏱️ **Deployment Time**

**Build:** ~10-15 minutes (installing all components)  
**Startup:** ~2-3 minutes (Indexer is slowest)

**After deployment:**
- Dashboard: `https://ai2-wazuh.fly.dev` ✅
- Login: `admin` / `admin` (change immediately!)

---

## ✅ **Ready to Deploy!**

**Configuration is updated!** Just run:
```powershell
fly deploy -a ai2-wazuh
```

**This will fix the 502 error!** 🚀

