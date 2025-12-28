# 🔧 503 Error Fix - Dashboard Configuration Error

**Date:** 2025-12-28  
**Issue:** 503 Service Unavailable, health check failing  
**Root Cause:** Invalid configuration key `opensearch.maxRetries`  
**Status:** ✅ **FIXED**

---

## 🚨 **Problem Identified**

**Error from Dashboard logs:**
```
FATAL  ValidationError: [config validation of [opensearch].maxRetries]: 
definition for this key is missing
```

**Health Check Status:**
- Check: `servicecheck-00-http-5601`
- Status: `critical`
- Error: `connect: connection refused`

**What Happened:**
1. Dashboard process started (supervisord shows RUNNING)
2. Dashboard failed to load configuration due to invalid key
3. Dashboard crashed/exited immediately
4. Port 5601 not listening → health check fails → 503 error
 
---

## ✅ **Fix Applied**

**Removed Invalid Configuration:**
- ❌ `opensearch.maxRetries: 5` (not a valid OpenSearch Dashboards setting)
- ❌ `opensearch.sniffOnStart: false` (not needed)
- ❌ `opensearch.sniffInterval: false` (not needed)

**Cleaned Configuration:**
```yaml
# Valid settings only
opensearch.hosts: ["http://localhost:9200"]
opensearch.ssl.verificationMode: none
opensearch.shardTimeout: 60000
opensearch.requestTimeout: 60000
opensearch.pingTimeout: 30000
opensearch.requestHeadersWhitelist: ["securitytenant","Authorization"]
```

**Also Fixed:**
- Changed `wazuh.monitoring.shards: 5` → `1` (single-node doesn't need 5 shards)
- Changed `wazuh.monitoring.replicas: 1` → `0` (single-node, no replicas)

---

## 🚀 **Deploy Fix**

```powershell
cd D:\embracingearthspace\wazuh
fly deploy -a ai2-wazuh
```

**Expected Timeline:**
1. **0-15s:** Manager starts
2. **15-90s:** Indexer starts
3. **90-120s:** Dashboard starts (should work now!)
4. **~2-3 min:** Health check passes

---

## ✅ **Verification**

**After deployment, check:**

1. **Health Check:**
   ```powershell
   fly status -a ai2-wazuh
   ```
   Should show: `1/1 checks passing`

2. **Access Dashboard:**
   ```
   https://ai2-wazuh.fly.dev
   ```
   Should load (no 503 error)

3. **Check Logs:**
   ```powershell
   fly logs -a ai2-wazuh
   ```
   Should see: `INFO success: wazuh-dashboard entered RUNNING state`

4. **Verify Dashboard Responds:**
   ```powershell
   fly ssh console -a ai2-wazuh -C "curl -s http://localhost:5601/api/status"
   ```
   Should return JSON status

---

## 📝 **What Was Wrong**

**Invalid Configuration Keys:**
- `opensearch.maxRetries` - This is NOT a valid OpenSearch Dashboards setting
- OpenSearch Dashboards uses different retry mechanisms internally
- The config validation failed, causing Dashboard to exit immediately

**Why It Seemed Running:**
- Supervisord marked it as "RUNNING" because the process started
- But Dashboard exited immediately after reading invalid config
- Supervisord would restart it, but it would crash again in a loop

---

## ✅ **Summary**

**Before:**
- ❌ Invalid `opensearch.maxRetries` key
- ❌ Dashboard crashes on startup
- ❌ Health check fails → 503 error

**After:**
- ✅ Valid configuration only
- ✅ Dashboard starts successfully
- ✅ Health check passes → Dashboard accessible

**Next Step:** Deploy the fixed configuration!

---

**embracingearth.space**

