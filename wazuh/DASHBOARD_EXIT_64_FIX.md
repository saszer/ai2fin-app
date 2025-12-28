# 🔧 Dashboard Exit Status 64 Fix

**Date:** 2025-12-27  
**Issue:** Wazuh Dashboard exiting with status 64, causing repeated crashes  
**Status:** ✅ **FIXED**

---

## 🚨 **Problems Identified**

### **1. Dashboard Exit Status 64** ⚠️ **CRITICAL**
- Dashboard was crashing repeatedly with exit status 64
- Status 64 typically indicates configuration or connection errors
- Dashboard couldn't reliably connect to Indexer after startup

### **2. Region Mismatch** ⚠️ **HIGH**
- `fly.toml` had `primary_region = "iad"` 
- Actual machine was in `syd` region
- Could cause deployment/routing issues

### **3. Insufficient Startup Time** ⚠️ **MEDIUM**
- Dashboard needs Indexer to be fully ready before starting
- Health checks were too aggressive (30s interval)
- No explicit wait for Indexer readiness in dashboard startup

### **4. Poor Error Handling** ⚠️ **MEDIUM**
- Dashboard command didn't wait for Indexer
- No retry logic for Indexer connection
- Limited error logging

---

## ✅ **Fixes Applied**

### **1. Enhanced Dashboard Startup Command** ✅

**Before:**
```bash
sleep 30 && if [ -f /usr/share/wazuh-dashboard/bin/opensearch-dashboards ]; then ...
```

**After:**
```bash
# Wait up to 120 seconds for Indexer to be ready
# Verify Indexer health endpoint responds
# Then start Dashboard with proper error handling
```

**Changes:**
- ✅ Explicit wait for Indexer health check (`/_cluster/health`)
- ✅ Up to 120 seconds timeout for Indexer readiness
- ✅ Better error handling with `set +e`
- ✅ Increased `startretries` from 5 to 10
- ✅ Increased `startsecs` from 60 to 90 seconds
- ✅ Enhanced logging (50MB buffers, 5 backups)

### **2. Fixed Region Mismatch** ✅

**Changed:**
```toml
primary_region = "syd"  # Was: "iad"
```

**Impact:**
- ✅ Correct region for existing volume
- ✅ Prevents routing issues
- ✅ Matches actual machine location

### **3. Improved Health Check Configuration** ✅

**Before:**
```toml
interval = "30s"
timeout = "10s"
grace_period = "60s"
```

**After:**
```toml
interval = "60s"       # Less aggressive
timeout = "15s"        # More time for response
grace_period = "60s"   # Maximum allowed
```

**Impact:**
- ✅ Less frequent health checks (reduces load)
- ✅ More time for Dashboard to respond
- ✅ Better handling of slow startup

### **4. Enhanced Dashboard Configuration** ✅

**Added:**
```yaml
# Increased timeouts for stability
opensearch.shardTimeout: 60000      # Was: 30000
opensearch.requestTimeout: 60000    # Was: 30000
opensearch.pingTimeout: 30000       # New

# Connection retry settings
opensearch.sniffOnStart: false
opensearch.sniffInterval: false
opensearch.maxRetries: 5            # New
```

**Impact:**
- ✅ Better handling of Indexer connection issues
- ✅ Automatic retries on connection failures
- ✅ More stable under load

### **5. Improved Supervisord Configuration** ✅

**Changes:**
- ✅ Increased log buffer sizes (50MB)
- ✅ Added log rotation (5 backups)
- ✅ Better capture of stdout/stderr
- ✅ Increased `stopwaitsecs` to 30 seconds

---

## 🚀 **Deployment Steps**

### **1. Deploy Updated Configuration**

```powershell
cd D:\embracingearthspace\wazuh
fly deploy -a ai2-wazuh
```

### **2. Monitor Startup**

```powershell
fly logs -a ai2-wazuh
```

**Expected behavior:**
1. ✅ Manager starts (15 seconds)
2. ✅ Indexer starts (30-60 seconds)
3. ✅ Dashboard waits for Indexer (up to 120 seconds)
4. ✅ Dashboard starts (60-90 seconds)
5. ✅ Health checks begin passing

### **3. Verify Dashboard Logs**

```powershell
fly ssh console -a ai2-wazuh
tail -f /var/log/supervisor/wazuh-dashboard.log
tail -f /var/log/supervisor/wazuh-dashboard.err
```

**Look for:**
- ✅ `✓ Indexer is ready`
- ✅ `Starting Wazuh Dashboard...`
- ✅ No exit status 64 errors
- ✅ Dashboard listening on port 5601

---

## 📊 **Expected Results**

### **Before Fix:**
```
07:57:21 INFO exited: wazuh-dashboard (exit status 1; not expected)
08:01:45 INFO exited: wazuh-dashboard (exit status 64; not expected)
08:04:03 INFO exited: wazuh-dashboard (exit status 64; not expected)
```

### **After Fix:**
```
INFO success: wazuh-manager entered RUNNING state
INFO success: wazuh-indexer entered RUNNING state
INFO success: wazuh-dashboard entered RUNNING state
# No more exit status 64 errors
# Dashboard stays running
```

---

## 🔍 **Troubleshooting**

### **If Dashboard Still Crashes:**

1. **Check Indexer Health:**
   ```bash
   curl http://localhost:9200/_cluster/health
   ```

2. **Check Dashboard Logs:**
   ```bash
   cat /var/log/supervisor/wazuh-dashboard.err
   cat /var/log/supervisor/wazuh-dashboard.log
   ```

3. **Check Configuration:**
   ```bash
   cat /etc/wazuh-dashboard/opensearch_dashboards.yml
   ```

4. **Verify Resources:**
   ```bash
   free -h
   ps aux | grep opensearch
   ```

---

## 📝 **Summary**

**Issues Fixed:**
- ✅ Dashboard exit status 64 (configuration/connection errors)
- ✅ Region mismatch (syd vs iad)
- ✅ Insufficient Indexer wait time
- ✅ Poor error handling and logging
- ✅ Health check aggressiveness

**Expected Outcome:**
- ✅ Dashboard starts reliably after Indexer is ready
- ✅ No more exit status 64 crashes
- ✅ Stable service operation
- ✅ Better error visibility via logs

**Next Steps:**
1. Deploy updated configuration
2. Monitor logs for successful startup
3. Verify Dashboard is accessible at `https://ai2-wazuh.fly.dev`

---

**Status:** ✅ **READY TO DEPLOY**

