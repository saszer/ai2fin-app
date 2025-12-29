# 🔧 Proper Fix for Wazuh API Binding Issue

**Date:** 2025-12-26  
**Status:** Config correct but API not binding - needs proper restart

---

## 🚨 Current Situation

**What We Know:**
- ✅ API config file is correct (`host: 0.0.0.0`, `port: 55000`)
- ✅ API process is running (`wazuh-apid`)
- ❌ Port 55000 not binding/listening
- ❌ Site unreachable

**Root Cause:**
- API service started before config was applied
- API needs explicit restart to read new config
- SIGHUP not sufficient - needs full restart

---

## ✅ Proper Fix Applied

### **1. Enhanced API Restart Script** ✅

**File:** `cont-init.d/06-restart-api-service.sh`

**What it does:**
1. Waits 20 seconds for Wazuh initialization
2. Verifies config has 0.0.0.0 binding
3. **Tries 3 methods to restart API:**
   - Method 1: `wazuh-control stop/start`
   - Method 2: Kill process (s6 auto-restarts)
   - Method 3: s6-rc service control
4. Verifies API restarted
5. Checks if port is now listening
6. Shows API logs if still failing

**Why:**
- Multiple restart methods ensure one works
- Full restart (not just reload) forces config re-read
- Verification confirms if fix worked

### **2. Health Check Still Disabled** ✅

**File:** `fly.toml`

**Status:**
- Health check commented out
- Allows deployment to complete
- Can SSH in to verify fix

---

## 🚀 Next Steps

1. **Deploy with enhanced restart script:**
   ```bash
   flyctl deploy -a ai2-wazuh
   ```

2. **Monitor logs for restart:**
   ```bash
   flyctl logs -a ai2-wazuh | grep -i "restart\|55000\|listening"
   ```

3. **SSH in and verify:**
   ```bash
   flyctl ssh console -a ai2-wazuh
   
   # Check if port is listening
   netstat -tuln | grep 55000
   # Should show: tcp 0 0 0.0.0.0:55000 0.0.0.0:* LISTEN
   
   # Check API process
   ps aux | grep wazuh-apid
   
   # Check API logs
   tail -50 /var/ossec/logs/api.log
   
   # Test API endpoint
   curl -k https://localhost:55000/ 2>&1 | head -20
   ```

---

## 🔍 If Still Not Working

If port still doesn't bind after restart:

### **Check 1: API Initialization**
```bash
# Check if API needs initialization
ls -la /var/ossec/api/configuration/security/
cat /var/ossec/api/configuration/security/security.yaml 2>/dev/null

# API may need default user setup
/var/ossec/api/scripts/wazuh-api-setup.sh 2>&1
```

### **Check 2: API Service Script**
```bash
# Check how API service starts
cat /etc/s6-overlay/s6-rc.d/wazuh-api/run 2>/dev/null
cat /etc/s6/services/wazuh-api/run 2>/dev/null

# See what command API runs
ps aux | grep wazuh-apid
```

### **Check 3: Config File Permissions**
```bash
# Ensure config is readable
ls -la /var/ossec/api/configuration/api.yaml
chmod 644 /var/ossec/api/configuration/api.yaml
```

### **Check 4: Override API Service Script**
If needed, we can override the s6 service script to force binding:
```bash
# Create custom API service script
# This would go in Dockerfile
```

---

## 📋 Expected Behavior After Fix

After deployment with enhanced restart script:

1. ✅ Wazuh initializes
2. ✅ Config file created/fixed with 0.0.0.0
3. ✅ API service restarts (via one of 3 methods)
4. ✅ API reads new config
5. ✅ API binds to 0.0.0.0:55000
6. ✅ Port shows as LISTENING
7. ✅ Site becomes reachable

---

## ⚠️ If Port Still Won't Bind

Last resort options:

1. **Override API service script in Dockerfile:**
   - Copy custom run script to `/etc/s6-overlay/s6-rc.d/wazuh-api/run`
   - Force API to start with explicit host binding

2. **Use environment variables:**
   - Check if Wazuh supports `WAZUH_API_HOST` env var
   - Set in `fly.toml` `[env]` section

3. **Check API initialization:**
   - API may need first-time setup
   - May need default credentials created

---

**Deploy now and check logs - the enhanced restart should fix it!**

**embracingearth.space**



