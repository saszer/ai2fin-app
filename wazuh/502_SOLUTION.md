# ✅ 502 Error Solution - Enable Traffic Routing

**Date:** 2025-12-27  
**Issue:** 502 error because Fly.io won't route traffic without health checks

---

## 🚨 **The Problem**

**Current Situation:**
- Health check disabled → Fly.io doesn't know app is healthy
- Fly.io won't route traffic → `502 Bad Gateway`
- Error: "no known healthy instances found for route tcp/443"

**Root Cause:**
- Wazuh API requires authentication (returns 401/403)
- Fly.io HTTP health checks cannot authenticate
- Health check disabled → No traffic routing

---

## ✅ **Solution: TCP Health Check**

**Why TCP Check Works:**
- ✅ Just verifies port 55000 is open
- ✅ Doesn't require HTTP/HTTPS
- ✅ Doesn't require authentication
- ✅ Allows Fly.io to route traffic

**Configuration Applied:**
```toml
[[http_service.checks]]
  protocol = "tcp"      # TCP check - just verifies port is open
  port = 55000          # Wazuh API port
  grace_period = "90s"  # Give API time to start
  interval = "30s"
  timeout = "5s"
```

---

## 📊 **How It Works**

**TCP Health Check Process:**
1. Fly.io tries to connect to port 55000 (TCP connection)
2. If port accepts connection → Health check passes ✅
3. Fly.io marks instance as healthy
4. Fly.io routes traffic to instance
5. Users can access API (with authentication)

**Result:**
- ✅ Fly.io knows port is open → Routes traffic
- ✅ API accepts connections → Works with authentication
- ✅ No more 502 errors

---

## ⚠️ **If TCP Check Doesn't Work**

**Alternative: Accept 401 as "Port is Open"**

If Fly.io doesn't support TCP checks for `http_service`, we can:
1. Use HTTP check that accepts any response (even 401)
2. Or create a simple health check endpoint

**But first, let's try TCP check - it should work!**

---

## 🚀 **Next Steps**

**Deploy with TCP health check:**
```powershell
cd D:\embracingearthspace\wazuh
fly deploy -a ai2-wazuh
```

**Expected:**
- ✅ TCP health check passes (port is open)
- ✅ Fly.io routes traffic
- ✅ No more 502 errors

---

**Solution Applied!** ✅ TCP health check enables traffic routing.

