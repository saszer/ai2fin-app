# 🔄 Container Restart Loop Analysis

**Date:** 2025-12-27  
**Issue:** Container restarts immediately after `[services.d] done.`

---

## 🚨 **The Loop Pattern**

**Timeline:**
1. **04:41:47** - `[cont-init.d] done.` ✅
2. **04:41:47** - `[services.d] starting services` ✅
3. **04:41:47** - `[services.d] done.` ✅
4. **04:41:47** - `cannot open '/var/ossec/logs/ossec.log' for reading: No such file or directory` ⚠️
5. **04:41:48** - `[s6-init] making user provided files available...` 🔄 **RESTART!**

**Pattern:** Container completes initialization, then immediately restarts.

---

## 🔍 **Root Cause Analysis**

### **Possible Causes:**

1. **Missing Log File** ⚠️ **MOST LIKELY**
   - Error: `cannot open '/var/ossec/logs/ossec.log' for reading`
   - A `tail` command is trying to tail this file
   - When it fails, the service exits
   - s6-overlay might restart the container if a critical service exits

2. **Service Exiting Immediately** ⚠️
   - A service starts but exits right away
   - s6-overlay restarts the container

3. **Filebeat Still Trying to Start** ⚠️
   - Even though we disabled it, it might still be trying
   - If it crashes, it could cause a restart

---

## ✅ **Fix: Create Missing Log File**

**Problem:**
- Wazuh log file doesn't exist yet when `tail` tries to read it
- Service exits, causing container restart

**Solution:**
- Create the log file before services start
- Or fix the tail command to handle missing files

---

## 🔧 **Immediate Fix**

**Add to init script (before services start):**

```bash
# Create Wazuh log file if it doesn't exist
mkdir -p /var/ossec/logs
touch /var/ossec/logs/ossec.log
chown wazuh:wazuh /var/ossec/logs/ossec.log
```

---

**Analysis Complete!** The missing log file is likely causing the restart loop.

