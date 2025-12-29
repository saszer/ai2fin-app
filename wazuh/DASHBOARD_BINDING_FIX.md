# 🔧 Dashboard Binding Fix

**Date:** 2025-12-29  
**Issue:** Dashboard not listening on 0.0.0.0:5601, health check failing

---

## 🚨 The Problem

**Symptoms:**
- ✅ Indexer running successfully
- ✅ Dashboard running successfully (supervisord shows RUNNING)
- ❌ Dashboard not listening on `0.0.0.0:5601`
- ❌ Health check failing: "app not listening on expected address"
- ❌ Deployment timeout waiting for health checks

**Config:**
- ✅ `server.host: 0.0.0.0` in `opensearch_dashboards.yml`
- ✅ `server.port: 5601` in config
- ✅ Config file copied to `/etc/wazuh-dashboard/opensearch_dashboards.yml`

**Possible Causes:**
1. Dashboard starting but crashing before binding
2. Dashboard binding to `127.0.0.1` instead of `0.0.0.0`
3. Dashboard waiting for Indexer but Indexer not ready
4. Config file not being read correctly
5. Dashboard process running but not actually listening

---

## ✅ Fixes Applied

### **1. Fixed OpenSearch Config Error** ✅

**Error:**
```
unknown setting [plugins.security.check_snapshot_restore_privilege]
did you mean [plugins.security.check_snapshot_restore_write_privileges]?
```

**Fixed:**
- Changed `plugins.security.check_snapshot_restore_privilege` → `plugins.security.check_snapshot_restore_write_privileges`

---

### **2. Dashboard Binding Verification** ⚠️

**Current Status:**
- Config file has `server.host: 0.0.0.0` ✅
- Dashboard process is running ✅
- But port 5601 not listening ❌

**Next Steps:**
1. Check Dashboard logs for binding errors
2. Verify config file is being read
3. Check if Dashboard is actually starting or crashing silently

---

## 🔍 Diagnostic Commands

**SSH in and run:**
```bash
flyctl ssh console -a ai2-wazuh

# 1. Check if port 5601 is listening
netstat -tuln | grep 5601
ss -tuln | grep 5601

# 2. Check Dashboard logs
tail -100 /var/log/supervisor/wazuh-dashboard.log
tail -100 /var/log/supervisor/wazuh-dashboard.err

# 3. Check Dashboard process
ps aux | grep opensearch-dashboards

# 4. Check Dashboard config
cat /etc/wazuh-dashboard/opensearch_dashboards.yml | grep -E "server.host|server.port"

# 5. Test Dashboard endpoint
curl -v http://localhost:5601/api/status
```

---

## 🚀 Next Deployment

```bash
flyctl deploy -a ai2-wazuh
```

**Expected:**
- ✅ Indexer starts successfully (config error fixed)
- ✅ Dashboard starts successfully
- ⚠️ May still need to check Dashboard binding

---

**embracingearth.space**


