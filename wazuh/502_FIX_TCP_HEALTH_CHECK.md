# ✅ 502 Error Fix - TCP Health Check Solution

**Date:** 2025-12-27  
**Issue:** 502 error because Fly.io won't route traffic without health checks

---

## 🚨 **The Problem**

**Without Health Checks:**
- Fly.io doesn't know if app is healthy
- Fly.io won't route traffic to unhealthy instances
- Result: `502 Bad Gateway` - "no known healthy instances"

**Error:**
```
could not find a good candidate within 40 attempts at load balancing. 
last error: [PR01] no known healthy instances found for route tcp/443.
```

---

## ✅ **Solution: TCP Health Check**

**Why TCP Check Works:**
- ✅ Just verifies port 55000 is open
- ✅ Doesn't require HTTP/HTTPS
- ✅ Doesn't require authentication
- ✅ Allows Fly.io to route traffic

**Configuration:**
```toml
[[http_service.checks]]
  protocol = "tcp"      # TCP check - just verifies port is open
  port = 55000          # Wazuh API port
  grace_period = "90s"  # Give API time to start
  interval = "30s"
  timeout = "5s"
```

**How it works:**
1. Fly.io tries to connect to port 55000 (TCP)
2. If port is open → Health check passes ✅
3. Fly.io routes traffic to the instance
4. API works (even though it requires auth for HTTP)

---

## 📊 **Comparison**

### **HTTP Health Check** ❌ **DOESN'T WORK**
- Requires authentication
- Returns 401/403
- Fly.io marks as unhealthy
- No traffic routing

### **TCP Health Check** ✅ **WORKS**
- Just checks if port is open
- No authentication needed
- Fly.io marks as healthy
- Traffic routing works

---

## 🎯 **Why This Works**

**TCP Check:**
- Verifies: Port 55000 is open and accepting connections
- Doesn't verify: HTTP responses, authentication, API functionality

**Result:**
- ✅ Fly.io knows port is open → Routes traffic
- ✅ API accepts connections → Works with authentication
- ✅ Users can access API (with auth) → No more 502

---

## 📋 **Limitations**

**TCP Check Limitations:**
- ⚠️ Only verifies port is open
- ⚠️ Doesn't verify API functionality
- ⚠️ Less reliable than HTTP check

**But:**
- ✅ Script 02 already verifies API functionality
- ✅ TCP check is sufficient for routing
- ✅ Better than no health check (502 errors)

---

## ✅ **Result**

**After TCP Health Check:**
- ✅ Fly.io can verify port is open
- ✅ Fly.io routes traffic to instance
- ✅ No more 502 errors
- ✅ API accessible (with authentication)

---

**Fix Applied!** ✅ TCP health check enables traffic routing.

