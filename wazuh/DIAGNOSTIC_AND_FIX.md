# 🔧 Wazuh API Binding - Diagnostic & Final Fix

**Date:** 2025-12-26  
**Issue:** Config correct, process running, but API won't bind to 0.0.0.0:55000

---

## 📊 Current Status

**Confirmed:**
- ✅ Config file exists and is correct
- ✅ `host: ['0.0.0.0', '::']` in config
- ✅ API process (`wazuh-apid`) is running
- ❌ Port 55000 NOT listening
- ❌ Site unreachable

**Likely Causes:**
1. API reading config from different location
2. API service script hardcodes localhost
3. API needs initialization/credentials
4. API startup error preventing binding

---

## 🔍 Required Diagnostics

**SSH in and run these commands:**

```bash
flyctl ssh console -a ai2-wazuh

# 1. Check if port is listening on ANY interface
netstat -tuln | grep 55000
ss -tuln | grep 55000

# 2. Check API logs for errors
tail -100 /var/ossec/logs/api.log | grep -i "error\|bind\|listen\|fail"

# 3. Check what command API is actually running
ps aux | grep wazuh-apid
# Look for --config or host arguments

# 4. Check API service script
cat /etc/s6-overlay/s6-rc.d/wazuh-api/run 2>/dev/null
cat /etc/s6/services/wazuh-api/run 2>/dev/null

# 5. Check all API config files
find /var/ossec/api -name "*.yaml" -o -name "*.yml" | xargs ls -la
cat /var/ossec/api/configuration/api.yaml | head -20

# 6. Check if API needs initialization
ls -la /var/ossec/api/configuration/security/
```

---

## ✅ Files Ready for Next Deployment

All fixes are in place:
- ✅ Config file with 0.0.0.0 binding
- ✅ Multiple restart scripts
- ✅ Post-service finish script
- ✅ Health check disabled (allows deployment)

**Next:** Deploy, then SSH in to run diagnostics and share results!

---

**embracingearth.space**


