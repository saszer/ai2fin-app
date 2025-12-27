# 🔍 Wazuh API Startup Issue Analysis

**Date:** 2025-12-27  
**Issue:** API process detected but port 55000 never becomes ready

---

## ❌ **NOT an Environment Variable Issue**

**Key Finding:** Wazuh API does **NOT** use environment variables for configuration.

According to [Wazuh 4.8 API Documentation](https://documentation.wazuh.com/4.8/user-manual/api/configuration.html):
- ✅ API configuration is done via `/var/ossec/api/configuration/api.yaml`
- ❌ Environment variables are **NOT** supported for API configuration
- ✅ API credentials (`WAZUH_API_USER`, `WAZUH_API_PASSWORD`) are for **client authentication**, not API startup

---

## 🔍 **Actual Issue**

From logs:
1. ✅ API configuration file exists and is correct (`host: '0.0.0.0'`, `port: 55000`)
2. ✅ API process is detected (s6 service is trying to start it)
3. ❌ Port 55000 never becomes ready (API not binding)
4. ⚠️ Warning: "wazuh-apid binary not found in PATH" (from our check script, not actual error)

**Root Cause:** API service is failing to start, likely due to:
- SSL certificate issues
- API initialization failure
- Service startup error

---

## ✅ **Solution: Check Wazuh Logs**

The API startup errors will be in:
- `/var/ossec/logs/ossec.log` - Main Wazuh logs
- `/var/ossec/logs/api.log` - API-specific logs (if exists)

**Check for:**
- SSL certificate errors
- API initialization failures
- Port binding errors
- Permission issues

---

## 🔧 **Next Steps**

1. **Check Wazuh service status:**
   ```bash
   fly ssh console -a ai2-wazuh -C "/var/ossec/bin/wazuh-control status"
   ```

2. **Check API logs:**
   ```bash
   fly ssh console -a ai2-wazuh -C "grep -i api /var/ossec/logs/ossec.log | tail -50"
   ```

3. **Verify SSL certificates exist:**
   ```bash
   fly ssh console -a ai2-wazuh -C "ls -la /var/ossec/etc/sslmanager.*"
   ```

4. **Check if API process is actually running:**
   ```bash
   fly ssh console -a ai2-wazuh -C "pgrep -a wazuh"
   ```

---

## 📋 **Environment Variables (For Reference)**

**NOT needed for API startup:**
- ❌ `WAZUH_API_HOST` - Not supported
- ❌ `WAZUH_API_PORT` - Not supported
- ❌ `WAZUH_API_SSL` - Not supported

**Used for client authentication (set via Fly.io secrets):**
- ✅ `WAZUH_API_USER` - API username (for your app to authenticate)
- ✅ `WAZUH_API_PASSWORD` - API password (for your app to authenticate)

**These are for YOUR application to connect to Wazuh, not for Wazuh API to start.**

---

## 🎯 **Conclusion**

**The issue is NOT environment variables.** The API configuration is correct, but the API service is failing to start. Check the Wazuh logs (`/var/ossec/logs/ossec.log`) for the actual error.

