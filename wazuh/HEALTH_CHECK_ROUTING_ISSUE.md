# 🚨 Health Check Passing But Traffic Not Routing

**Date:** 2025-12-30  
**Issue:** Health checks passing (200 OK) but Fly.io still shows "no known healthy instances" for route tcp/443

---

## 📊 **Current Status**

### **✅ What's Working:**
- Health checks passing: `[HEALTH] Status: healthy, Dashboard: True, HTTP: True`
- Dashboard responding: `GET / 302 2ms` (302 redirect)
- Health check endpoint: `GET /health HTTP/1.0" 200`
- All services running: Dashboard, Indexer, Manager

### **❌ What's Not Working:**
- Fly.io routing: `[PR03] could not find a good candidate within 40 attempts at load balancing`
- Error: `[PR01] no known healthy instances found for route tcp/443`
- Public URL: `https://ai2-wazuh.fly.dev/` returns 503

---

## 🔍 **Root Cause Analysis**

### **Issue: Health Check vs Traffic Routing Mismatch**

**Current Configuration:**
- Health check: `GET http://internal_ip:5601/health` → Nginx → Health Server (8080) → 200 OK
- Traffic routing: `https://ai2-wazuh.fly.dev/` → Fly.io Proxy → `internal_port 5601` → Nginx → Dashboard (5602)

**Problem:**
- Health check is passing (200 OK)
- But Fly.io's routing system might be checking if the **actual service** (Dashboard on 5602) is ready
- OR there's a delay/sync issue between health check status and routing

---

## ✅ **Potential Solutions**

### **Solution 1: Verify Health Check is on Correct Service**

**Check:** Health check should be on the same service as ports 443/80

**Current fly.toml:**
```toml
[[services]]
  internal_port = 5601
  processes = ["wazuh"]
  
  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
  
  [[services.http_checks]]
    path = "/health"
    protocol = "http"
```

**Status:** ✅ Health check is on the same service as ports 443/80

---

### **Solution 2: Health Check Should Verify Dashboard is Ready**

**Issue:** Health check server returns 200 OK even if Dashboard isn't ready (during startup)

**Current Behavior:**
- Health check server returns 200 OK during startup (first 5 minutes)
- But Dashboard might not be ready yet
- Fly.io might be checking if Dashboard is actually ready before routing

**Fix:** Health check should verify Dashboard is ready (not just health server)

**Current Health Check Logic:**
```python
# During startup (0-5 min): Always returns 200 OK
if is_startup_phase:
    status_code = 200
else:
    # After startup: Requires Dashboard to be ready
    if dashboard_check['healthy'] and dashboard_http['healthy']:
        status_code = 200
    else:
        status_code = 503
```

**Issue:** After 5 minutes, health check requires Dashboard to be ready, but Fly.io might have already marked it as unhealthy during startup.

---

### **Solution 3: Fly.io Routing Delay**

**Issue:** Health check status might not sync immediately with routing system

**Possible Causes:**
- Fly.io routing system checks health status separately
- There might be a delay between health check passing and routing activation
- Machine might need to be restarted to sync routing

**Fix:** Wait a few minutes or restart the machine

---

### **Solution 4: Health Check Should Always Pass if Dashboard is Ready**

**Current Issue:** Health check might be failing after startup phase if Dashboard isn't ready

**Fix:** Ensure health check always passes if Dashboard is ready, even during startup

**Updated Logic:**
```python
# Always check if Dashboard is ready
if dashboard_check['healthy'] and dashboard_http['healthy']:
    # Dashboard is ready - always pass
    status_code = 200
elif is_startup_phase:
    # During startup, pass even if Dashboard not ready
    status_code = 200
else:
    # After startup, fail if Dashboard not ready
    status_code = 503
```

---

## 🎯 **Recommended Fix**

### **Option 1: Update Health Check Logic**

**Change:** Health check should prioritize Dashboard readiness over startup phase

**Logic:**
1. If Dashboard is ready → Always return 200 OK (even during startup)
2. If Dashboard not ready AND in startup phase → Return 200 OK
3. If Dashboard not ready AND after startup → Return 503

**Implementation:**
```python
# Check Dashboard first
dashboard_ready = dashboard_check['healthy'] and dashboard_http['healthy']

if dashboard_ready:
    # Dashboard is ready - always pass
    status_code = 200
    checks['status'] = 'healthy'
elif is_startup_phase:
    # During startup, pass even if Dashboard not ready
    status_code = 200
    checks['status'] = 'healthy (startup)'
else:
    # After startup, fail if Dashboard not ready
    status_code = 503
    checks['status'] = 'unhealthy'
```

---

### **Option 2: Verify Nginx is Routing Correctly**

**Check:** Nginx should route `/health` to health server and `/` to Dashboard

**Test:**
```bash
fly ssh console -a ai2-wazuh -C "curl http://localhost:5601/health"
fly ssh console -a ai2-wazuh -C "curl http://localhost:5601/"
```

**Expected:**
- `/health` → Health server (200 OK with JSON)
- `/` → Dashboard (302 redirect)

---

### **Option 3: Restart Machine to Sync Routing**

**If health checks are passing but routing isn't working:**
```bash
fly machine restart 68303ddbed3918 -a ai2-wazuh
```

**This will:**
- Restart the machine
- Re-run health checks
- Sync routing with health check status

---

## 📋 **Verification Steps**

1. **Check health check status:**
   ```bash
   fly checks list -a ai2-wazuh
   ```

2. **Check machine status:**
   ```bash
   fly status -a ai2-wazuh
   ```

3. **Test health check endpoint:**
   ```bash
   fly ssh console -a ai2-wazuh -C "curl http://localhost:5601/health"
   ```

4. **Test Dashboard endpoint:**
   ```bash
   fly ssh console -a ai2-wazuh -C "curl -I http://localhost:5601/"
   ```

5. **Test public URL:**
   ```bash
   curl -I https://ai2-wazuh.fly.dev
   ```

---

## 🔧 **Next Steps**

1. **Update health check logic** to prioritize Dashboard readiness
2. **Verify Nginx routing** is working correctly
3. **Restart machine** if needed to sync routing
4. **Monitor logs** to see if routing activates after health checks pass

---

**embracingearth.space**

