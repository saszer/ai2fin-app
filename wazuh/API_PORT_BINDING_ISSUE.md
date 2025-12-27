# 🚨 Critical Issue: Wazuh API Not Binding to Port 55000

**Date:** 2025-12-27  
**Status:** 🔴 **CRITICAL** - API says "Listening" but port not bound

---

## 📊 **Current Situation**

**What's Working:**
- ✅ API process is running (`wazuh-apid is running...`)
- ✅ API says "Listening on 0.0.0.0:55000" in logs
- ✅ SSL certificates are in place (`/var/ossec/api/configuration/ssl/sslmanager.*`)
- ✅ API configuration looks correct (`host: '0.0.0.0'`, `port: 55000`)

**What's NOT Working:**
- ❌ Port 55000 is **NOT actually bound** (port check fails)
- ❌ API log file doesn't exist (suggests API crashes before logging)
- ❌ Fly.io load balancer can't find healthy instances

---

## 🔍 **Root Cause Analysis**

**The Problem:**
The API logs show `INFO: Listening on 0.0.0.0:55000..` but the port check fails. This suggests:

1. **API crashes immediately after saying "listening"**
   - API starts, says it's listening, but then crashes
   - No log file created = API crashes before it can write logs

2. **SSL certificate issue preventing actual bind**
   - API tries to bind with HTTPS
   - SSL certificate read fails silently
   - API says "listening" but bind never completes

3. **Permission issue**
   - API can't actually bind to port 55000
   - Process lacks permission to bind to privileged port
   - But this is unlikely since it's running as `wazuh` user

4. **API waiting for Manager initialization**
   - API starts but waits for Manager to be fully ready
   - During this wait, port isn't actually bound
   - But logs say "listening" which suggests bind attempt

---

## ✅ **Potential Solutions**

### **Solution 1: Check API Logs for Actual Errors**

The API log file doesn't exist, which is suspicious. We need to:
1. Check if API is actually writing to logs
2. Look for errors in ossec.log related to API
3. Check if API process is staying alive

### **Solution 2: Test API Directly from Container**

Test if API is actually accessible from inside the container:
```bash
fly ssh console -a ai2-wazuh
curl -k https://localhost:55000/status
```

If this fails, the API isn't actually listening.

### **Solution 3: Check SSL Certificate Paths**

The API config uses:
```yaml
https:
  key: sslmanager.key
  cert: sslmanager.cert
```

These are relative paths. The API might be looking for them in the wrong location. According to Wazuh 4.8 docs, these paths should be relative to `/var/ossec/api/configuration/ssl/`, which is correct.

But we should verify the API can actually read these files.

### **Solution 4: Disable HTTPS Temporarily**

To test if SSL is the issue, temporarily disable HTTPS:
```yaml
https:
  enabled: no
```

If the API binds with HTTP, then SSL is the problem.

### **Solution 5: Check API Database**

The API uses an internal SQLite database. If this database has issues, the API might fail to start properly. We already fixed permissions, but there might be other issues.

---

## 🎯 **Next Steps**

1. **Test API from inside container** - See if it's actually accessible
2. **Check for API errors in ossec.log** - Look for any error messages
3. **Verify API process is stable** - Check if it's crashing and restarting
4. **Test with HTTP** - Temporarily disable HTTPS to isolate SSL issues
5. **Check API database** - Verify the internal database is working

---

## 📋 **Diagnosis Commands**

```bash
# Test API from inside container
fly ssh console -a ai2-wazuh
curl -k https://localhost:55000/status

# Check API process
/var/ossec/bin/wazuh-control status | grep apid

# Check for API errors
grep -i "apid\|api\|55000" /var/ossec/logs/ossec.log | tail -50

# Check if port is actually listening
netstat -tuln | grep 55000
# Or
ss -tuln | grep 55000
```

---

**Status:** 🔴 **INVESTIGATING** - API says listening but port not bound. Need to determine if API is crashing or if there's an SSL/permission issue preventing the actual bind.

