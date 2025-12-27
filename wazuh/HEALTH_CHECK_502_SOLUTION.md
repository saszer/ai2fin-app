# ✅ 502 Error Solution - Health Check for Traffic Routing

**Date:** 2025-12-27  
**Issue:** 502 error because Fly.io won't route traffic without health checks

---

## 🚨 **The Problem**

**Without Health Checks:**
- Fly.io doesn't know if app is healthy
- Fly.io won't route traffic → `502 Bad Gateway`
- Error: "no known healthy instances found for route tcp/443"

**Root Cause:**
- Wazuh API requires authentication (returns 401/403)
- Fly.io HTTP health checks cannot authenticate
- Health check disabled → No traffic routing → 502 errors

---

## ✅ **Solution: TCP Health Check**

**Why TCP Check Works:**
- ✅ Just verifies port 55000 is open (TCP connection)
- ✅ Doesn't require HTTP/HTTPS
- ✅ Doesn't require authentication
- ✅ Allows Fly.io to route traffic

**Configuration:**
```toml
[[http_service.checks]]
  protocol = "tcp"      # TCP check - just verifies port is open
  port = 55000          # Wazuh API port
  grace_period = "90s"  # Give API time to start (60-90s)
  interval = "30s"
  timeout = "5s"
```

**How it works:**
1. Fly.io tries to connect to port 55000 (TCP)
2. If port accepts connection → Health check passes ✅
3. Fly.io marks instance as healthy
4. Fly.io routes traffic → No more 502!

---

## ⚠️ **If TCP Check Syntax is Wrong**

**Alternative: Use HTTP Check with Grace Period**

If Fly.io doesn't support `protocol = "tcp"` in `http_service.checks`, we can:

1. **Use HTTP check but accept it will fail initially:**
   - Health check will return 401 (expected)
   - But Fly.io might still route traffic after grace period
   - Or use a very long grace period

2. **Or create a simple health check service:**
   - Separate service on different port
   - Doesn't require authentication
   - But adds complexity

---

## 🎯 **Recommended: Try TCP Check First**

**Deploy with TCP health check:**
```powershell
cd D:\embracingearthspace\wazuh
fly deploy -a ai2-wazuh
```

**If TCP check doesn't work:**
- Fly.io will show error in deployment
- We can then try alternative approach

---

## 📋 **Expected Results**

**With TCP Health Check:**
- ✅ Port 55000 is open → Health check passes
- ✅ Fly.io routes traffic
- ✅ No more 502 errors
- ✅ API accessible (with authentication)

---

**Solution Applied!** ✅ TCP health check should enable traffic routing.

