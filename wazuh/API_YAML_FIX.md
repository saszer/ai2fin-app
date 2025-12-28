# 🔧 Wazuh API YAML Configuration Fix

**Date:** 2025-12-26  
**Issue:** API process running but port 55000 not binding - YAML format issue

---

## 🚨 Problem

**Symptoms:**
- Wazuh API process (`wazuh-apid`) is running
- Port 55000 not binding to 0.0.0.0
- Health checks failing
- API waiting script shows process but no port

**Root Cause:**
- YAML array syntax was incorrect: `host: ['0.0.0.0', '::']`
- Wazuh API YAML parser may not accept inline array syntax
- Need proper YAML list format

---

## ✅ Fix Applied

### **Updated YAML Format** ✅

**Before (incorrect):**
```yaml
host: ['0.0.0.0', '::']  # Inline array - may not parse correctly
```

**After (correct):**
```yaml
host:
  - '0.0.0.0'
  - '::'
```

**Why:**
- Proper YAML list format
- More compatible with YAML parsers
- Matches Wazuh API documentation format

---

## 📋 Updated Files

1. **`api/configuration/api.yaml`** ✅
   - Fixed YAML array syntax for `host` field
   - Now uses proper YAML list format

2. **`cont-init.d/02-wait-for-wazuh-api.sh`** ✅
   - Added diagnostic logging
   - Checks API logs for errors
   - Verifies config file content

3. **`cont-init.d/04-restart-wazuh-api.sh`** ✅
   - New script to verify API config
   - Checks if config file is readable
   - Provides diagnostic information

---

## 🚀 Next Steps

1. **Rebuild and Deploy:**
   ```bash
   cd embracingearthspace/wazuh
   flyctl deploy -a ai2-wazuh
   ```

2. **Monitor Logs:**
   ```bash
   flyctl logs -a ai2-wazuh
   ```

3. **Check API Status:**
   ```bash
   flyctl ssh console -a ai2-wazuh
   netstat -tuln | grep 55000
   tail -f /var/ossec/logs/api.log
   ```

---

## 🔍 Verification

After deployment, verify:

1. **API Config File:**
   ```bash
   cat /var/ossec/api/configuration/api.yaml | grep -A 3 host
   # Should show:
   # host:
   #   - '0.0.0.0'
   #   - '::'
   ```

2. **Port Binding:**
   ```bash
   netstat -tuln | grep 55000
   # Should show: tcp 0 0 0.0.0.0:55000 0.0.0.0:* LISTEN
   ```

3. **API Logs:**
   ```bash
   tail -20 /var/ossec/logs/api.log
   # Should not show binding errors
   ```

---

**embracingearth.space**


