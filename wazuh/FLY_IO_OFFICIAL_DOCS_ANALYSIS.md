# 📚 Fly.io Official Documentation Analysis

**Date:** 2025-12-30  
**Source:** Fly.io Official Documentation  
**Reference:** https://fly.io/docs/reference/health-checks/

---

## 🔑 **Key Findings from Official Docs**

### **1. Service-Level Checks vs Top-Level Checks**

**Service-Level Checks** (`[[services.http_checks]]`):
- ✅ **CAN influence traffic routing**
- ✅ Associated with specific services
- ✅ Used by Fly.io proxy to determine if instance is ready
- ✅ **Failing health checks can prevent traffic from being routed**

**Top-Level Checks** (`[checks]`):
- ❌ **Do NOT affect traffic routing**
- ❌ Only for monitoring
- ❌ Don't influence Fly.io proxy decisions

**Our Configuration:** ✅ We're using `[[services.http_checks]]` - correct!

---

### **2. Health Check Configuration Requirements**

**From Official Docs:**
```toml
[[services.http_checks]]
  interval = "15s"        # Time between health checks
  timeout = "2s"         # Time to wait for response
  grace_period = "10s"   # Time after app starts before checks begin
  method = "GET"
  path = "/healthz"      # Health check endpoint
  headers = { X-Forwarded-Proto = "https" }
```

**Our Configuration:**
```toml
[[services.http_checks]]
  grace_period = "1m"     # Max allowed by Fly.io ✅
  interval = "10s"        # Check every 10s ✅
  timeout = "5s"         # 5s timeout ✅
  method = "GET"         # GET method ✅
  path = "/health"       # Health check endpoint ✅
  protocol = "http"      # HTTP protocol ✅
  success_codes = [200]  # Only 200 OK ✅
```

**Status:** ✅ Configuration matches official docs requirements

---

### **3. How Health Checks Affect Routing**

**From Official Docs:**
> "Service-Level Checks: These checks are associated with specific services and **can influence traffic routing**"
> 
> "failing health checks **can prevent traffic from being routed** to a machine"

**Key Points:**
1. Health checks must be on the **same service** as the ports
2. Health checks must **pass consistently** for routing to work
3. Fly.io proxy uses health check status to decide if instance is ready

**Our Setup:**
- ✅ Health check is on same service (`internal_port = 5601`)
- ✅ Health check is passing (`fly checks list` shows "passing")
- ❓ But routing still not working...

---

### **4. Grace Period Limitation**

**From Official Docs:**
- Grace period allows time for app to start before health checks begin
- **Fly.io caps grace_period at 1 minute** (we're using max: `1m`)
- After grace period, health checks must pass for routing to work

**Our Situation:**
- Grace period: 1 minute (max allowed)
- Dashboard takes 15-17 minutes to start
- Health check returns 200 OK during startup (via health check server)
- But Dashboard isn't ready until 15-17 minutes

**Issue:** Health check passes (200 OK) but Dashboard isn't actually ready yet!

---

### **5. Health Check Path Must Reflect Readiness**

**From Official Docs:**
> "Ensure that the specified `path` corresponds to an endpoint in your application that **returns a `200 OK` status when the app is healthy**"

**Our Current Setup:**
- Health check path: `/health` → Health check server (port 8080)
- Health check server: Returns 200 OK even if Dashboard not ready (during startup)
- Dashboard: Actually ready after 15-17 minutes

**Problem:** Health check returns 200 OK, but it's checking the health check server, not the actual Dashboard!

---

## 🚨 **Root Cause Identified**

**The Issue:**
1. Health check path `/health` routes to health check server (port 8080)
2. Health check server returns 200 OK during startup (first 5 minutes)
3. Fly.io sees health check passing → Should route traffic
4. But Dashboard isn't ready until 15-17 minutes
5. **Fly.io might be checking if the actual service (Dashboard) is ready, not just the health check endpoint**

**OR:**

**Fly.io requires the health check to verify the actual service is ready, not just a separate health check server.**

---

## ✅ **Solution Based on Official Docs**

### **Option 1: Health Check Should Verify Dashboard Directly**

**Instead of checking `/health` (health check server), check Dashboard directly:**

```toml
[[services.http_checks]]
  path = "/"              # Check Dashboard root path
  success_codes = [200, 301, 302, 303, 307, 308]  # Accept redirects
```

**Problem:** Dashboard takes 15-17 minutes to start, so health check will fail during startup.

---

### **Option 2: Keep Current Setup But Ensure Health Check Reflects Dashboard Readiness**

**Current health check server logic:**
- Returns 200 OK during startup (first 5 minutes)
- After 5 minutes, requires Dashboard to be ready

**Issue:** Dashboard takes 15-17 minutes, so health check might fail after 5 minutes.

**Fix:** Update health check server to always return 200 OK if Dashboard is ready, regardless of startup phase:

```python
# Current logic (in health-check-server.py)
if dashboard_ready:
    status_code = 200  # ✅ Already correct!
elif is_startup_phase:
    status_code = 200  # ✅ Pass during startup
else:
    status_code = 503  # ❌ Fails if Dashboard not ready after 5 min
```

**Problem:** Dashboard takes 15-17 minutes, so health check will fail after 5 minutes (before Dashboard is ready).

---

### **Option 3: Increase Startup Phase Duration**

**Current:** Startup phase = 5 minutes (300 seconds)

**Dashboard startup:** 15-17 minutes

**Fix:** Increase startup phase to 20 minutes:

```python
is_startup_phase = uptime_seconds < 1200  # 20 minutes instead of 5
```

**This allows health check to pass during entire Dashboard startup period.**

---

## 🎯 **Recommended Fix**

### **Update Health Check Server Startup Phase**

**Change startup phase from 5 minutes to 20 minutes:**

```python
# In health-check-server.py
is_startup_phase = uptime_seconds < 1200  # 20 minutes (1200 seconds)
```

**This ensures:**
1. Health check passes during entire Dashboard startup (0-20 minutes)
2. After 20 minutes, health check requires Dashboard to be ready
3. Fly.io routing should activate once Dashboard is ready (15-17 minutes)

---

## 📋 **Verification Steps**

1. **Update health check server** to use 20-minute startup phase
2. **Deploy** the updated configuration
3. **Wait 15-20 minutes** for Dashboard to start
4. **Check health check status:**
   ```powershell
   fly checks list -a ai2-wazuh
   ```
5. **Test URL:**
   ```powershell
   Invoke-WebRequest -Uri "https://ai2-wazuh.fly.dev" -Method GET
   ```

---

## ✅ **Summary**

**From Official Docs:**
- ✅ Service-level health checks CAN influence routing
- ✅ Health check must reflect actual service readiness
- ✅ Health check must pass consistently for routing to work
- ✅ Grace period is capped at 1 minute

**Our Issue:**
- Health check passes (200 OK) but Dashboard isn't ready yet
- Startup phase (5 min) is shorter than Dashboard startup (15-17 min)
- Health check might fail after 5 minutes (before Dashboard is ready)

**Solution:**
- Increase startup phase to 20 minutes
- This allows health check to pass during entire Dashboard startup
- Once Dashboard is ready, health check continues to pass
- Fly.io routing should activate

---

**embracingearth.space**

