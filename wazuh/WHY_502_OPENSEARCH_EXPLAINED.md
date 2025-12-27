# 🔍 Why 502 Error & What is OpenSearch?

**Date:** 2025-12-27  
**Issue:** 502 error, Dashboard not loading

---

## 📊 **What is OpenSearch?**

**OpenSearch** is the search engine that powers Wazuh Indexer.

**Wazuh Architecture:**
- **Manager** - Security engine (what you have running)
- **Indexer** - OpenSearch/Elasticsearch (stores events) ← **MISSING**
- **Dashboard** - Kibana-based UI (visualizes data) ← **MISSING**

**OpenSearch = Elasticsearch fork** (open-source search engine)

---

## ❌ **Why 502 Error?**

### **Current Status:**
- ✅ **Manager** - Running (port 55000)
- ❌ **Indexer** - NOT running (not installed)
- ❌ **Dashboard** - NOT running (not installed)

**Problem:**
- You're using **OLD `fly.toml`** (Manager only)
- Dashboard (port 5601) is **not running**
- Fly.io tries to connect to port 5601 → **502 Bad Gateway**

---

## 🔧 **The Fix**

### **You're Using Wrong Configuration!**

**Current (OLD):**
```toml
dockerfile = "Dockerfile"  # ❌ Manager only
internal_port = 55000      # ❌ Manager API port
```

**Should Be (FULL STACK):**
```toml
dockerfile = "Dockerfile.fullstack"  # ✅ Manager + Indexer + Dashboard
internal_port = 5601                 # ✅ Dashboard port
```

---

## 🚀 **Quick Fix**

```powershell
cd D:\embracingearthspace\wazuh

# Switch to full stack configuration
cp fly.toml.fullstack fly.toml

# Deploy full stack
fly deploy -a ai2-wazuh
```

**This will:**
1. Install Manager + Indexer + Dashboard
2. Start all three services
3. Dashboard will be on port 5601
4. **502 error will be fixed!**

---

## 📋 **What Happens After Fix**

**Services Running:**
- ✅ Manager (port 55000) - Internal
- ✅ Indexer/OpenSearch (port 9200) - Internal
- ✅ Dashboard (port 5601) - **EXPOSED** (this fixes 502!)

**Access:**
- Dashboard: `https://ai2-wazuh.fly.dev` ✅
- Manager API: `https://ai2-wazuh.internal:55000` (internal)

---

## ⚠️ **Current Issue**

**From your logs:**
- Only Manager starting (old Dockerfile)
- No Indexer/OpenSearch
- No Dashboard
- Port 5601 not listening → **502 error**

**Solution:** Switch to full stack config and redeploy!

---

**Next Step:** Run the commands above to switch to full stack! 🚀

