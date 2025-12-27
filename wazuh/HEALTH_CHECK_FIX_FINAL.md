# 🔧 Health Check Fix - Final Solution

**Date:** 2025-12-27  
**Issue:** `[PR04] could not find a good candidate within 40 attempts at load balancing`  
**Root Cause:** Health check failing because Wazuh API requires authentication (401 response)

---

## 🚨 **The Problem**

**Current Situation:**
- Health check configured in `fly.toml` 
- Wazuh API requires authentication for all endpoints
- Health check returns 401 (Unauthorized)
- Fly.io treats 401 as unhealthy
- Fly.io won't route traffic → `[PR04]` error → 502 errors

**Error Messages:**
```
[PR04] could not find a good candidate within 40 attempts at load balancing
Health check 'servicecheck-00-http-55000' on port 55000 is in a 'warning' state
```

---

## ✅ **Solution Options**

### **Option 1: Remove Health Check (Simplest)**

**Pros:**
- ✅ No configuration needed
- ✅ Fly.io may route traffic based on port availability
- ✅ Our init scripts already verify API readiness

**Cons:**
- ⚠️ Fly.io might not route traffic without health checks
- ⚠️ Less visibility into instance health

**Status:** ✅ Applied - Health check removed from `fly.toml`

---

### **Option 2: Create Health Check Service (If Option 1 Fails)**

If removing the health check doesn't work, we can create a simple health check service:

**Implementation:**
1. Create a simple HTTP server on port 8080 (or different port)
2. Responds with 200 OK without authentication
3. Checks if Wazuh API port 55000 is open
4. Configure Fly.io to health check this endpoint

**Pros:**
- ✅ Health check can pass
- ✅ Fly.io will route traffic
- ✅ Still verifies API is running

**Cons:**
- ⚠️ Adds complexity
- ⚠️ Requires additional service

---

### **Option 3: Accept Warning State (Current)**

**Current Behavior:**
- Health check returns 401 (expected)
- Health check in "warning" state
- Fly.io might still route traffic after grace period

**Status:** ⚠️ Not working - Fly.io not routing traffic

---

## 🎯 **Recommended: Try Option 1 First**

**Deploy without health check:**
```powershell
cd D:\embracingearthspace\wazuh
fly deploy -a ai2-wazuh
```

**Test if API is accessible:**
```powershell
# Test with authentication
fly ssh console -a ai2-wazuh -C "curl -k -u admin:password https://localhost:55000/agents"
```

**If Option 1 doesn't work:**
- We'll implement Option 2 (health check service)
- Or configure Fly.io differently

---

## 📋 **Expected Results**

**With Health Check Removed:**
- ✅ No health check failures
- ✅ Fly.io may route traffic based on port availability
- ✅ API accessible (with authentication)
- ⚠️ Less visibility into health status

**If Still Not Working:**
- Implement Option 2 (health check service)
- Or use Fly.io's TCP service instead of HTTP service

---

## 🔍 **Why This Happens**

**Wazuh API Security:**
- All endpoints require authentication
- No public/unauthenticated endpoints
- Returns 401/403 for unauthenticated requests

**Fly.io Health Checks:**
- Require 2xx HTTP responses to pass
- Cannot provide authentication credentials
- Treat 401/403 as unhealthy

**Incompatibility:**
- Wazuh's security model conflicts with Fly.io's health check model
- Need workaround (remove check or create health service)

---

**Next Steps:** Deploy without health check and test if traffic routes correctly.

