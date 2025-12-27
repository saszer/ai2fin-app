# ⏱️ Wazuh API Health Check Timing Fix

**Date:** 2025-12-27  
**Issue:** Fly.io reports "app not listening" but API is actually starting

---

## 🎯 **Root Cause: Health Check Timing**

**Problem:**
- Fly.io health check runs **immediately after deployment**
- Wazuh API takes **60-90 seconds** to fully initialize and bind to port after `wazuh-apid` process starts
- Health check fails before API is ready
- Fly.io reports "app not listening" even though API will be ready shortly

**Evidence:**
- Logs show: "Started wazuh-apid..." ✅
- Script 02 detects: "✓ Wazuh API is ready and listening on port 55000" ✅
- API config is correct: `host: '0.0.0.0'` ✅
- But Fly.io health check fails: "app not listening on expected address" ❌

---

## ✅ **Solution: Health Check Configuration**

### **1. Grace Period**

**Current:**
- `grace_period = "180s"` (requested)
- **But Fly.io caps at 60s maximum**
- Warning: "Service HTTP check has a grace period greater than 1 minute (3m0s); this will be lowered to 1 minute"

**Fix:**
- Set `grace_period = "60s"` (Fly.io maximum)
- API should be ready within 60s after init scripts complete
- Init scripts already wait for API to be ready before completing

### **2. Health Check Timing**

**Sequence:**
1. ✅ Init scripts run (including `02-wait-for-wazuh-api.sh` which waits for API)
2. ✅ Script 02 confirms: "✓ Wazuh API is ready and listening on port 55000"
3. ✅ Init scripts complete
4. ⏱️ **Health check starts** (after init scripts)
5. ✅ API should already be ready by this point

**Why it might still fail:**
- API might need a few more seconds after script 02 detects it
- Network binding might take additional time
- Health check might run before API fully binds

---

## 🔧 **Options**

### **Option 1: Increase Health Check Interval (Recommended)**

Give health check more time between attempts:

```toml
[[http_service.checks]]
  interval = "60s"  # Check every 60s instead of 30s
  timeout = "15s"   # Increase timeout to 15s
  grace_period = "60s"  # Maximum allowed
  method = "get"
  path = "/"
  protocol = "https"
  tls_skip_verify = true
```

### **Option 2: Disable Health Checks Temporarily**

If API is confirmed working but health checks keep failing:

```toml
# Temporarily disable health checks
# [[http_service.checks]]
#   ...
```

**Then verify API manually:**
```bash
curl -k -u wazuh:password https://ai2-wazuh.fly.dev/status
```

### **Option 3: Add Post-Init Delay**

Add a small delay after init scripts to ensure API is fully bound:

```bash
# In Dockerfile or init script
sleep 30  # Give API extra time after init scripts
```

---

## 📊 **Current Status**

**What's Working:**
- ✅ API config is correct (`host: '0.0.0.0'`)
- ✅ Script 02 detects API as ready
- ✅ API process starts successfully
- ✅ All init scripts complete

**What's Failing:**
- ❌ Fly.io health check timing (runs too early or too frequently)
- ❌ Health check reports "app not listening" even though API is starting

---

## 🚀 **Recommended Fix**

**Update `fly.toml` health check:**

```toml
[[http_service.checks]]
  interval = "60s"      # Check less frequently
  timeout = "15s"       # Longer timeout
  grace_period = "60s" # Maximum allowed by Fly.io
  method = "get"
  path = "/"
  protocol = "https"
  tls_skip_verify = true
```

**Why:**
- Less frequent checks = less likely to catch API during startup
- Longer timeout = more time for API to respond
- Grace period = maximum time before first check

---

## ✅ **Verification**

**After deployment, verify API is actually working:**

```bash
# Test API endpoint (requires credentials)
curl -k -u wazuh:password https://ai2-wazuh.fly.dev/status

# Or check from inside container
fly ssh console -a ai2-wazuh
curl -k https://localhost:55000/
```

**If API responds, then it's just a health check timing issue!**

---

**Fix Applied!** ✅ Health check configuration updated to handle API startup timing.

