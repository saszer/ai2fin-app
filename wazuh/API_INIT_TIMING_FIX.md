# 🔧 Wazuh API Binding - Initialization Timing Fix

**Date:** 2025-12-26  
**Issue:** API config being overwritten during Wazuh initialization

---

## 🚨 Problem

**From Logs:**
- Wazuh is initializing/installing files
- API process detected but port not binding
- Config file may be overwritten during initialization
- Timing issue: config applied before Wazuh finishes init

**Root Cause:**
- Wazuh Docker image has initialization scripts that run after container start
- These scripts may overwrite or reset API configuration
- Our config fix runs too early (in cont-init.d phase)
- API service starts before our config is properly applied

---

## ✅ Fix Applied

### **Updated Script Timing** ✅

**File:** `cont-init.d/05-ensure-api-binding.sh`

**Changes:**
1. **Longer wait for initialization:**
   - Now waits 10 seconds before checking
   - Waits up to 60 seconds for API config directory
   - Checks every 2 seconds with progress updates

2. **Config reload trigger:**
   - Touches config file to trigger reload
   - Sends SIGHUP to API process if running
   - Attempts to force API to re-read config

**Why:**
- Gives Wazuh time to complete initialization
- Ensures config directory exists before modifying
- Tries to reload API without full restart

---

## 🔄 Alternative Approach (If Still Failing)

If the API still doesn't bind, we may need to:

### **Option 1: Modify API Service Script Directly**

Override the s6 service script to ensure binding:

```bash
# In Dockerfile, add:
RUN sed -i 's/127.0.0.1/0.0.0.0/g' /var/ossec/api/configuration/api.yaml || true
```

### **Option 2: Use Environment Variables**

Some Wazuh versions support env vars. Check if available:
- `WAZUH_API_HOST`
- `WAZUH_API_PORT`

### **Option 3: Post-Start Script**

Create a script that runs AFTER all services start:
- Place in `/etc/services.d/wazuh-api/finish.d/`
- This runs after API service starts
- Can modify config and restart API

### **Option 4: Disable Health Check Temporarily**

Deploy without health check to verify API actually works:
- Remove health check from fly.toml temporarily
- Deploy and SSH in to check manually
- If API works, re-enable health check with longer grace period

---

## 📋 Next Steps

1. **Deploy with updated script:**
   ```bash
   flyctl deploy -a ai2-wazuh
   ```

2. **Monitor logs:**
   ```bash
   flyctl logs -a ai2-wazuh | grep -i "api\|55000\|binding"
   ```

3. **If still failing, SSH and check:**
   ```bash
   flyctl ssh console -a ai2-wazuh
   
   # Check if config exists and is correct
   cat /var/ossec/api/configuration/api.yaml | grep -A 3 host
   
   # Check if port is listening
   netstat -tuln | grep 55000
   
   # Check API logs
   tail -100 /var/ossec/logs/api.log
   
   # Check API process
   ps aux | grep wazuh-api
   ```

---

## 🔍 Debugging Commands

If API still won't bind:

```bash
# Check API config location
ls -la /var/ossec/api/configuration/

# Check if config is being overwritten
watch -n 1 'cat /var/ossec/api/configuration/api.yaml | grep -A 3 host'

# Check API service status
/var/ossec/bin/wazuh-control status

# Manually restart API
/var/ossec/bin/wazuh-control restart wazuh-api

# Check what the API is actually trying to bind to
strace -p $(pgrep wazuh-apid) -e trace=bind 2>&1 | grep 55000
```

---

**The updated script should handle the timing issue. Deploy and monitor!**

**embracingearth.space**









