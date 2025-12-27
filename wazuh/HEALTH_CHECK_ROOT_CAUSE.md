# 🔍 Health Check Root Cause Analysis

**Date:** 2025-12-27  
**Issue:** Fly.io health check stuck at "checking health" - API says "Listening" but port check fails

---

## 🚨 **The Contradiction**

**What the Logs Show:**
- ✅ API logs: `INFO: Listening on 0.0.0.0:55000..`
- ✅ Script 02: `✓ Wazuh API is ready and listening on port 55000`
- ❌ Script 06: `⚠ Port 55000 still not listening`
- ❌ Fly.io: `The app is not listening on the expected address`

**This is a contradiction!** The API says it's listening, but port checks fail.

---

## 🔍 **Root Cause Analysis**

### **Possible Causes:**

#### **1. API Binding But Not Accepting Connections** ⚠️ **MOST LIKELY**

**Problem:**
- API binds to port 55000 (says "Listening")
- But doesn't actually accept connections yet
- API might be waiting for:
  - SSL certificate validation
  - Database initialization
  - Manager connection
  - Configuration validation

**Evidence:**
- API logs say "Listening" but port checks fail
- Script 06's port check fails even after restart
- Fly.io proxy can't connect

**Solution:**
- Wait longer after "Listening" message
- Check if API actually accepts connections (not just binds)
- Verify SSL certificates are loaded correctly

#### **2. Port Check Methods Not Working** ⚠️

**Problem:**
- Script 06 uses `netstat`/`ss` to check port
- These tools might not be available or work correctly in container
- Port might be listening but tools can't detect it

**Evidence:**
- Script 06 says "Port 55000 still not listening"
- But API logs say "Listening"
- Different detection methods give different results

**Solution:**
- Use `curl` to test actual connection (not just port binding)
- Test if API responds to HTTP requests
- Don't rely on `netstat`/`ss` alone

#### **3. API Crashes After Binding** ⚠️

**Problem:**
- API binds to port
- Logs "Listening"
- Then crashes immediately
- Port check runs after crash

**Evidence:**
- Script 06 runs after API restart
- Port check fails
- But API might have crashed between "Listening" and port check

**Solution:**
- Check API process is still running when port check runs
- Check API logs for errors after "Listening" message
- Verify API stays alive

#### **4. Health Check Requires Authentication** ⚠️

**Problem:**
- Fly.io health check tries to connect
- API requires authentication
- Health check fails (401/403)
- Fly.io thinks API isn't listening

**Evidence:**
- API might be working but rejecting unauthenticated requests
- Health check path `/` might require auth
- Fly.io reports "not listening" but API is actually working

**Solution:**
- Use a health check endpoint that doesn't require auth
- Or configure API to allow unauthenticated health checks
- Or disable auth for health check path

---

## ✅ **Diagnostic Steps**

### **1. Verify API Actually Accepts Connections**

**Test from inside container:**
```bash
fly ssh console -a ai2-wazuh

# Test if API responds (even with 401/404)
curl -k -v https://localhost:55000/ 2>&1
# Should get HTTP response (even if 401/404) - means API is accepting connections

# Check if port is actually listening
lsof -i :55000 2>/dev/null || echo "lsof not available"
cat /proc/net/tcp | grep :D6A8 || echo "checking /proc/net/tcp"
```

**If curl gets HTTP response (even 401/404):**
- ✅ API is accepting connections
- ✅ Problem is health check configuration (auth or endpoint)

**If curl times out or connection refused:**
- ❌ API is not accepting connections
- ❌ Problem is API binding/startup

### **2. Check API Process Status**

```bash
# Check if API process is running
ps aux | grep wazuh-apid | grep -v grep

# Check API logs for errors after "Listening"
tail -50 /var/ossec/logs/api.log | grep -i "error\|fail\|crash"
```

### **3. Test Health Check Endpoint**

```bash
# Test health check path
curl -k https://localhost:55000/ 2>&1
# If this works, health check should work too
```

---

## 🔧 **Fixes to Try**

### **Fix 1: Improve Port Detection in Script 06**

**Current:** Uses `netstat`/`ss` (might not work)

**Better:** Use `curl` to test actual connection:

```bash
# In script 06, replace port check with:
if curl -k -s -o /dev/null -w "%{http_code}" https://localhost:55000/ 2>/dev/null | grep -q "[0-9]"; then
    echo "✓ API is accepting connections on port 55000"
    PORT_READY=true
else
    echo "⚠ API not accepting connections yet"
    PORT_READY=false
fi
```

### **Fix 2: Add Health Check Endpoint**

**Problem:** Health check might require authentication

**Solution:** Use `/status` endpoint or configure API to allow unauthenticated health checks

**Update `fly.toml`:**
```toml
[[http_service.checks]]
  path = "/status"  # Try status endpoint (might not require auth)
  # Or use "/" but ensure it doesn't require auth
```

### **Fix 3: Wait Longer After "Listening"**

**Problem:** API says "Listening" but needs more time to accept connections

**Solution:** Add delay after detecting "Listening" message:

```bash
# In script 02, after detecting "Listening":
echo "API says listening, waiting for it to accept connections..."
sleep 10  # Give API time to fully initialize
# Then test with curl
```

### **Fix 4: Disable Health Check Temporarily**

**If API is confirmed working but health check keeps failing:**

```toml
# Comment out health check
# [[http_service.checks]]
#   ...
```

**Then verify API manually and fix health check later.**

---

## 🎯 **Most Likely Root Cause**

Based on the logs, **most likely cause is #1: API binding but not accepting connections yet.**

**Why:**
- API logs say "Listening" (binding successful)
- But port checks fail (not accepting connections)
- Script 06 runs after restart but still fails
- Suggests API needs more time after binding to accept connections

**Solution:**
1. Improve script 02 to wait for API to actually accept connections (not just bind)
2. Use `curl` to test connection (not just port binding)
3. Add delay after "Listening" message
4. Update health check to use connection test instead of port check

---

## 🚀 **Next Steps**

1. **SSH into container and test API:**
   ```bash
   fly ssh console -a ai2-wazuh
   curl -k -v https://localhost:55000/
   ```

2. **If API responds (even 401/404):**
   - API is working ✅
   - Fix health check configuration (auth/endpoint)

3. **If API doesn't respond:**
   - API not accepting connections ❌
   - Fix API startup/binding issue

---

**Root Cause Analysis Complete!** 🔍

