# 🔍 Comprehensive Wazuh Deployment Audit

**Date:** 2025-12-27  
**Analysis:** Complete audit of deployment logs for loops, crashes, unnecessary restarts

---

## 🚨 **CRITICAL ISSUES IDENTIFIED**

### **1. Container Restart Loop** ⚠️ **CRITICAL**

**Evidence:**
```
04:26:36 [s6-init] making user provided files available...
04:26:36 [cont-init.d] executing container initialization scripts...
```

**Problem:**
- Container is restarting (s6-init runs multiple times)
- Init scripts execute repeatedly
- This suggests the container is crashing or being restarted by Fly.io

**Root Cause:**
- Script 07 uses `wazuh-control restart` which may cause issues
- Filebeat lock error might be causing container to exit
- Or Fly.io is restarting due to health check failures

---

### **2. Unnecessary Service Restarts** ⚠️ **HIGH**

**Problem:**
- Script 06 restarts ALL Wazuh services (not just API)
- Script 07 restarts ALL Wazuh services again
- Script 2-manager starts services again
- **Result:** Services restart 3+ times during init

**Timeline:**
1. **04:25:28** - Script 06: `wazuh-control stop` → Stops ALL services
2. **04:25:34** - Script 06: `Starting Wazuh v4.8.0...` → Starts ALL services
3. **04:26:18** - Script 07: `wazuh-control stop` → Stops ALL services AGAIN
4. **04:26:20** - Script 07: `Starting Wazuh v4.8.0...` → Starts ALL services AGAIN
5. **04:26:33** - Script 2-manager: `Starting Wazuh v4.8.0...` → Starts ALL services AGAIN

**Impact:**
- Wastes resources
- Causes service instability
- Delays API readiness
- Creates unnecessary log noise

**Fix Needed:**
- Script 06 should only restart API, not all services
- Script 07 should only restart API, not all services
- Remove redundant restarts

---

### **3. Filebeat Lock Conflict** ⚠️ **MEDIUM**

**Error:**
```
Exiting: data path already locked by another beat. Please make sure that multiple beats are not sharing the same data path (path.data).
Filebeat exited. code=1
```

**Problem:**
- Script 01 tries to fix this but it's still happening
- Filebeat fails to start
- This is harmless (we don't use Elasticsearch) but creates error noise

**Root Cause:**
- Multiple Filebeat instances trying to use same data path
- Lock file not properly cleaned up
- Script 01 runs too early (before Filebeat starts)

**Fix Needed:**
- Improve script 01 to be more aggressive about lock cleanup
- Or disable Filebeat entirely (we don't use it)

---

### **4. Script 07 Restarting All Services** ⚠️ **HIGH**

**Current Behavior:**
```bash
# Script 07 uses wazuh-control restart which stops ALL services
/var/ossec/bin/wazuh-control restart wazuh-apid
# This actually restarts ALL Wazuh services, not just API!
```

**Problem:**
- `wazuh-control restart` without service name restarts everything
- Should only restart API service
- Causes unnecessary downtime

**Fix Needed:**
- Script 07 should use a method that only restarts API
- Or use s6 service control to restart just API

---

### **5. Multiple API Restart Attempts** ⚠️ **MEDIUM**

**Timeline:**
1. Script 06: Restarts API (Method 1: wazuh-control, Method 2: kill process)
2. Script 07: Restarts API again (wazuh-control restart)
3. Script 05: Sends SIGHUP to API

**Problem:**
- API is restarted 3+ times during init
- Each restart takes time
- Causes delays in API readiness

**Fix Needed:**
- Consolidate restart logic
- Only restart once if needed
- Check if restart is actually necessary

---

## 📊 **Application Logic Issues**

### **1. Script Execution Order**

**Current Order:**
1. 01-fix-filebeat-lock
2. 02-wait-for-wazuh-api (waits for API)
3. 03-check-wazuh-api-config
4. 04-restart-wazuh-api (restarts API)
5. 05-ensure-api-binding (fixes config, sends SIGHUP)
6. 06-restart-api-service (restarts ALL services)
7. 07-copy-api-certs (restarts ALL services again)
8. 08-fix-permissions
9. 2-manager (starts services again)

**Problem:**
- Script 02 waits for API, but then scripts 06 and 07 restart everything
- Script 07 runs after script 06, but both restart services
- Redundant operations

**Better Order:**
1. Fix filebeat lock
2. Copy API certs (before API starts)
3. Fix permissions (before API starts)
4. Ensure API binding config
5. Wait for API
6. Check API config
7. Restart API if needed (ONCE, only if config changed)

---

### **2. Redundant Config Checks**

**Problem:**
- Script 03 checks config
- Script 04 checks config
- Script 05 checks and fixes config
- Script 06 checks config
- Script 07 doesn't check config but restarts anyway

**Fix:**
- Consolidate config checks
- Only fix/restart if config actually changed

---

## 🔄 **Restart Loop Analysis**

### **Is There a Restart Loop?**

**Evidence:**
- Container shows `[s6-init]` multiple times
- Init scripts run multiple times
- But timestamps show this is during a single deployment, not a loop

**Conclusion:**
- **NOT a restart loop** - this is normal container initialization
- Container restarts once (expected during deployment)
- Init scripts run once per container start
- The "restart" is Fly.io updating the machine

---

## ✅ **What's Working Correctly**

1. ✅ **API Detection:** Script 02 correctly detects API is ready
2. ✅ **Config Format:** API config is correct (`host: '0.0.0.0'`)
3. ✅ **SSL Certificates:** Certificates are copied correctly
4. ✅ **Permissions:** Permissions are fixed correctly
5. ✅ **API Accepts Connections:** Script 06 confirms "✓ API is accepting connections"

---

## 🔧 **Recommended Fixes**

### **Fix 1: Optimize Script 06** ⚠️ **HIGH PRIORITY**

**Current:**
- Uses `wazuh-control stop/start` which stops ALL services

**Fix:**
- Only restart API service, not all services
- Use s6 service control or kill API process only

### **Fix 2: Optimize Script 07** ⚠️ **HIGH PRIORITY**

**Current:**
- Uses `wazuh-control restart` which restarts ALL services

**Fix:**
- Only restart API service
- Or remove restart entirely (API should pick up certs automatically)

### **Fix 3: Reorder Scripts** ⚠️ **MEDIUM PRIORITY**

**Better Order:**
1. 01-fix-filebeat-lock
2. 07-copy-api-certs (before API starts)
3. 08-fix-permissions (before API starts)
4. 05-ensure-api-binding (fix config before API starts)
5. 02-wait-for-wazuh-api
6. 03-check-wazuh-api-config
7. 06-restart-api-service (only if needed, only API)

### **Fix 4: Improve Filebeat Lock Cleanup** ⚠️ **LOW PRIORITY**

**Current:**
- Script 01 tries to clean lock but it still fails

**Fix:**
- More aggressive lock cleanup
- Or disable Filebeat entirely (we don't use Elasticsearch)

---

## 📋 **Summary**

**Critical Issues:**
- ⚠️ Unnecessary service restarts (3+ times)
- ⚠️ Script 06 and 07 restart ALL services, not just API
- ⚠️ Redundant restart operations

**Not Issues:**
- ✅ No restart loop (normal container initialization)
- ✅ No crashes (services start successfully)
- ✅ API is working (accepts connections)

**Action Items:**
1. Fix script 06 to only restart API
2. Fix script 07 to only restart API
3. Reorder scripts for better efficiency
4. Remove redundant restarts

---

**Audit Complete!** ✅

