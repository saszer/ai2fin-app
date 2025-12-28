# 🔍 Root Cause Analysis - Wazuh API Not Binding

**Date:** 2025-12-26  
**Status:** Config correct, process running, but port not binding

---

## 📊 Current Evidence

**What We Know:**
- ✅ API config file exists: `/var/ossec/api/configuration/api.yaml`
- ✅ Config has correct binding: `host: ['0.0.0.0', '::']`
- ✅ API process is running: `wazuh-apid` detected
- ❌ Port 55000 NOT listening on 0.0.0.0
- ❌ Site unreachable

**From Logs:**
- Config is verified multiple times (correct)
- API process detected continuously
- Port never shows as LISTENING
- Restart script runs but output cut off

---

## 🔍 Possible Root Causes

### **1. API Reading Different Config File** ⚠️
- API might read config from different location
- Default config might override our file
- Check: `ls -la /var/ossec/api/configuration/*.yaml`

### **2. API Needs Initialization** ⚠️
- First-time API setup may be required
- Default credentials might need to be set
- Check: `/var/ossec/api/configuration/security/`

### **3. API Service Script Override Needed** ⚠️
- s6 service script might hardcode host
- Need to override `/etc/s6-overlay/s6-rc.d/wazuh-api/run`
- Check: What command does API actually run?

### **4. API Binding to Wrong Interface** ⚠️
- API might bind to localhost only
- Network configuration issue
- Check: `netstat -tuln` or `ss -tuln` for ANY 55000 binding

### **5. API Startup Error** ⚠️
- API might be crashing/restarting
- Error in API logs preventing binding
- Check: `/var/ossec/logs/api.log` for errors

---

## 🔧 Diagnostic Commands (Run After SSH)

```bash
# 1. Check ALL config files
find /var/ossec/api -name "*.yaml" -o -name "*.yml" | xargs ls -la

# 2. Check what config API is actually using
ps aux | grep wazuh-apid
# Look for --config or -c argument

# 3. Check if port is listening on ANY interface
netstat -tuln | grep 55000
ss -tuln | grep 55000
lsof -i :55000

# 4. Check API logs for binding errors
tail -100 /var/ossec/logs/api.log | grep -i "bind\|listen\|error\|fail"

# 5. Check API service script
cat /etc/s6-overlay/s6-rc.d/wazuh-api/run
cat /etc/s6/services/wazuh-api/run 2>/dev/null

# 6. Check API process environment
cat /proc/$(pgrep wazuh-apid | head -1)/environ | tr '\0' '\n' | grep -i api

# 7. Check if API needs initialization
ls -la /var/ossec/api/configuration/security/
cat /var/ossec/api/configuration/security/security.yaml 2>/dev/null

# 8. Try manual API start to see errors
/var/ossec/bin/wazuh-control stop wazuh-api
/var/ossec/bin/wazuh-control start wazuh-api
tail -f /var/ossec/logs/api.log
```

---

## ✅ Next Fix Strategy

Based on diagnostics, we'll:

1. **If API reading wrong config:**
   - Override API service script to specify config path
   - Or symlink our config to default location

2. **If API needs initialization:**
   - Run API setup script
   - Create default credentials

3. **If service script hardcodes host:**
   - Override s6 service run script
   - Force host binding in startup command

4. **If API has binding errors:**
   - Fix the error in logs
   - May need different config format

---

## 🚀 Immediate Action

**SSH in and run diagnostics:**
```bash
flyctl ssh console -a ai2-wazuh

# Quick check
netstat -tuln | grep 55000
tail -50 /var/ossec/logs/api.log
ps aux | grep wazuh-apid
```

**Then share results so we can apply the proper fix!**

---

**embracingearth.space**


