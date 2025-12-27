# 🔧 S6 Service Fix - Wazuh API Service

**Date:** 2025-01-26  
**Issue:** s6 service missing `run` script - "unable to exec run: No such file or directory"

---

## 🚨 Problem

**Error:**
```
s6-supervise (child): fatal: unable to exec run: No such file or directory
s6-supervise wazuh-api: warning: unable to spawn ./run - waiting 10 seconds
```

**Root Cause:**
- We were copying `services.d/wazuh-api/` directory with only a `finish` script
- s6-overlay requires a `run` script to start the service
- By copying our incomplete service directory, we were **overriding** the official Wazuh image's service definition
- The official image already has the `wazuh-api` service properly configured

---

## ✅ Fix Applied

**Removed from Dockerfile:**
```dockerfile
# REMOVED - This was overriding the official service
COPY services.d/ /etc/services.d/
RUN chmod +x /etc/services.d/*/finish 2>/dev/null || true
```

**Why:**
- The official `wazuh/wazuh-manager:4.8.0` image already has:
  - `/etc/services.d/wazuh-api/run` - Service startup script
  - Proper s6 service configuration
  - All necessary service management

- Our `services.d/wazuh-api/finish` script was incomplete (no `run` script)
- Copying it was overriding the official service, breaking API startup

---

## 📋 How Wazuh API Service Works

**Official Image Structure:**
```
/etc/services.d/wazuh-api/
  ├── run          # Starts wazuh-apid process (provided by official image)
  └── finish       # Optional cleanup script (we don't need to override)
```

**Our API Config:**
- `/var/ossec/api/configuration/api.yaml` - API configuration (we provide this)
- The official `run` script reads this config automatically

---

## 🚀 Result

**After Fix:**
- ✅ Official `wazuh-api` service runs correctly
- ✅ API reads our `api.yaml` configuration
- ✅ API binds to `0.0.0.0:55000` (from our config)
- ✅ No more "unable to exec run" errors

---

## 📝 Note

If we need to add custom service scripts in the future:
1. **Don't override existing services** - Only add new services
2. **Always include `run` script** - Required for s6-overlay
3. **Test thoroughly** - Service scripts can break container startup

**For now:** Let the official image handle all services - we only provide config files.

---

**Fix Complete!** ✅

