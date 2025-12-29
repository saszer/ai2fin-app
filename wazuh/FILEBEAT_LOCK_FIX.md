# 🔧 Filebeat Lock Conflict Fix

**Date:** 2025-12-26  
**Issue:** Filebeat data path already locked by another beat

---

## 🚨 Problem

**Error from logs:**
```
2025-12-26T10:46:26.815Z ERROR instance/beat.go:956 Exiting: data path already locked by another beat. 
Please make sure that multiple beats are not sharing the same data path (path.data).
```

**Root Cause:**
- Filebeat starts successfully during container initialization
- s6-overlay service manager attempts to restart Filebeat
- Second instance conflicts with first instance's lock file
- Container fails to start properly

---

## ✅ Solution Applied

### **1. Init Script for Lock Cleanup** ✅

**Created:** `cont-init.d/01-fix-filebeat-lock.sh`

**Purpose:**
- Runs before all services start (s6-overlay init phase)
- Checks for stale Filebeat lock files
- Removes lock file if no Filebeat process is running
- Ensures data directory exists with correct permissions

**How it works:**
1. Checks if lock file exists at `/var/lib/filebeat/.filebeat.lock`
2. Verifies no Filebeat process is actually running
3. Removes stale lock file if safe to do so
4. Creates data directory if missing

### **2. Missing Audit-Keys List** ✅

**Created:** `etc/lists/audit-keys`

**Purpose:**
- Provides audit key patterns for Wazuh rules
- Prevents "List 'etc/lists/audit-keys' could not be loaded" warnings
- Includes common system and application files to monitor

### **3. Updated Dockerfile** ✅

**Changes:**
- Copies init scripts to `/etc/cont-init.d/` (s6-overlay location)
- Makes scripts executable
- Copies audit-keys list to correct location

---

## 📋 Files Changed

1. **`cont-init.d/01-fix-filebeat-lock.sh`** ✅
   - New init script for lock cleanup

2. **`etc/lists/audit-keys`** ✅
   - New audit keys list file

3. **`Dockerfile`** ✅
   - Added init script copying
   - Added audit-keys list copying

---

## ⚠️ Expected Warnings (Non-Critical)

The following warnings are from the base Wazuh image's default ruleset and are **expected**:

1. **Signature ID '80786' not found** - Default rule dependency issue in base image
2. **Empty 'if_sid' value for rule '80788'** - Default rule configuration issue
3. **Group 'audit_watch_write' not found** - Default rule references non-existent group
4. **Unknown module 'wazuh-api'** - False positive; wazuh-api is a wodle, not a module

These warnings do not affect functionality and can be safely ignored. They come from the official Wazuh Docker image's default configuration.

---

## 🚀 Deployment

After these changes, rebuild and deploy:

```bash
cd embracingearthspace/wazuh
fly deploy -a ai2-wazuh
```

The Filebeat lock conflict should be resolved, and the container should start successfully.

---

## 🔍 Verification

After deployment, check logs for:
- ✅ No Filebeat lock errors
- ✅ "Filebeat lock cleanup completed" message in init logs
- ✅ Filebeat starts successfully without conflicts

---

**embracingearth.space**



