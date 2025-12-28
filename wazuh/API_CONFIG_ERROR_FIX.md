# ✅ FIXED: Wazuh API Configuration Error

**Date:** 2025-12-26  
**Root Cause Found:** Invalid `auth` and `cache` sections in API config

---

## 🚨 The Problem

**Error from logs:**
```
api.api_exception.APIError: 2000 - Some parameters are not expected in the configuration file (WAZUH_PATH/api/configuration/api.yaml). 
Additional properties are not allowed ('auth' was unexpected).
wazuh-apid: Configuration error. Exiting
```

**Root Cause:**
- API config file had `auth:` section (not valid in Wazuh 4.8.0)
- API config file had `cache:` section (deprecated in 4.8.0)
- API was crashing on startup due to invalid config
- That's why port never bound - API never started successfully!

---

## ✅ Fix Applied

### **Removed Invalid Sections** ✅

**File:** `api/configuration/api.yaml`

**Removed:**
- ❌ `auth:` section (not allowed in 4.8.0)
- ❌ `cache:` section (deprecated, causes warning)

**Kept (Valid Options):**
- ✅ `host:` - Listen on 0.0.0.0
- ✅ `port:` - Port 55000
- ✅ `https:` - HTTPS configuration
- ✅ `cors:` - CORS settings
- ✅ `logs:` - Logging configuration

**New Config:**
```yaml
host:
  - '0.0.0.0'
  - '::'
port: 55000
https:
  enabled: yes
  key: /var/ossec/etc/sslmanager.key
  cert: /var/ossec/etc/sslmanager.cert
  use_ca: no
cors:
  enabled: yes
  source_route: '*'
  expose_headers: '*'
  allow_headers: '*'
  allow_credentials: yes
logs:
  level: info
  format: plain
```

---

## 🚀 Next Steps

**Deploy with fixed config:**
```bash
flyctl deploy -a ai2-wazuh
```

**Expected Result:**
- ✅ API config validates successfully
- ✅ API starts without errors
- ✅ API binds to 0.0.0.0:55000
- ✅ Port shows as LISTENING
- ✅ Site becomes reachable

---

## 📋 Valid Wazuh 4.8.0 API Config Options

According to [Wazuh 4.8 Documentation](https://documentation.wazuh.com/4.8/user-manual/api/configuration.html):

**Valid Options:**
- `host` - Array of host addresses
- `port` - Port number
- `https` - HTTPS configuration
- `cors` - CORS settings
- `logs` - Logging configuration

**NOT Valid:**
- ❌ `auth` - Not a config option (handled elsewhere)
- ❌ `cache` - Deprecated in 4.8.0

---

**This should fix it! The API was crashing due to invalid config, not a binding issue.**

**embracingearth.space**


