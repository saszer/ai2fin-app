# 🔍 Comprehensive Startup Audit & Fixes

**Date:** 2025-12-27  
**Goal:** Fix all startup issues and optimize process

---

## 🚨 **Critical Issues Identified**

### **1. Container Restart Loop** ⚠️ **CRITICAL**

**Evidence:**
```
04:44:38 [services.d] done.
04:44:38 [s6-init] making user provided files available...  ← RESTART!
```

**Root Cause:**
- `s6-supervise ossec-logs: warning: unable to write status file`
- The `ossec-logs` service is failing
- s6-overlay restarts container when service fails

**Fix:** Disable or fix `ossec-logs` service

---

### **2. Redundant Script Execution** ⚠️ **HIGH**

**Current Scripts:**
- `02-wait-for-wazuh-api.sh` - Waits for API
- `03-check-wazuh-api-config.sh` - Checks config
- `04-restart-wazuh-api.sh` - Checks config again
- `05-ensure-api-binding.sh` - Checks and fixes config
- `06-restart-api-service.sh` - Restarts API

**Problem:**
- Scripts 03, 04, 05 all check the same config
- Script 06 restarts API unnecessarily
- Wastes time and resources

**Fix:** Consolidate into fewer, more efficient scripts

---

### **3. s6-supervise ossec-logs Warnings** ⚠️ **MEDIUM**

**Error:**
```
s6-supervise ossec-logs: warning: unable to write status file: No such file or directory
s6-supervise ossec-logs: warning: unable to read supervise/death_tally: No such file or directory
```

**Root Cause:**
- `ossec-logs` service directory missing or misconfigured
- Service tries to start but fails
- Causes container restart

**Fix:** Disable `ossec-logs` service or fix its configuration

---

### **4. Unnecessary Waits** ⚠️ **LOW**

**Current:**
- Script 05: `sleep 10`
- Script 06: `sleep 20`
- Script 06: Multiple `sleep 5`

**Problem:**
- Total wait time: ~40+ seconds
- Most waits are unnecessary
- API is already ready from script 02

**Fix:** Remove redundant waits

---

## ✅ **Fixes to Apply**

### **Fix 1: Disable ossec-logs Service** ✅

**Problem:** Service is failing and causing restarts

**Solution:** Disable it (we don't need it - we have log file already)

### **Fix 2: Consolidate Scripts** ✅

**New Structure:**
- `02-wait-for-wazuh-api.sh` - Wait for API (keep)
- `03-ensure-api-config.sh` - Check and fix config (merge 03, 04, 05)
- `04-restart-api-if-needed.sh` - Only restart if config changed (merge 06)

**Result:** 3 scripts instead of 5, more efficient

### **Fix 3: Remove Redundant Waits** ✅

**Remove:**
- Script 05: `sleep 10` (unnecessary)
- Script 06: `sleep 20` (unnecessary)
- Script 06: Multiple `sleep 5` (reduce to 2-3 seconds)

**Result:** ~30 seconds faster startup

---

## 📋 **Optimized Script Order**

**New Order:**
1. `00-disable-filebeat.sh` - Disable Filebeat
2. `01-fix-filebeat-lock.sh` - Cleanup
3. `02-wait-for-wazuh-api.sh` - Wait for API
4. `03-ensure-api-config.sh` - Check and fix config (NEW - merged)
5. `04-restart-api-if-needed.sh` - Restart only if needed (NEW - optimized)
6. `07-copy-api-certs.sh` - Copy certificates
7. `08-fix-permissions.sh` - Fix permissions

**Result:** Faster, more efficient startup

---

**Audit Complete!** Ready to apply fixes.

