# 🚨 503 Error - Health Check Passing But Traffic Not Routing

**Date:** 2025-12-30  
**Issue:** Dashboard is ready (302 redirects), health checks passing, but `https://ai2-wazuh.fly.dev/` returns 503

---

## 📊 **Current Status**

### **✅ What's Working:**
- Dashboard responding: `GET / 302` (302 redirects every 10s)
- Health check server: Returns `"status": "healthy"` with Dashboard ready
- Machine: Started and running
- All services: Dashboard, Indexer running

### **❌ What's Not Working:**
- Public URL: `https://ai2-wazuh.fly.dev/` returns 503
- Fly.io routing: Not routing traffic despite health checks passing

---

## 🔍 **Root Cause**

**Issue:** Fly.io's health check status is **stale** (10+ minutes old)

**Evidence:**
- Health check server (current): `"status": "healthy"`, Dashboard ready
- Fly.io health check (cached): `"status": "healthy (startup)"`, Dashboard not ready (old data)

**Why This Happens:**
1. Fly.io caches health check results
2. Health check status might not update immediately
3. Routing system might check health status separately from health check endpoint

---

## ✅ **Solutions**

### **Solution 1: Wait for Health Check to Update**

**Fly.io health checks update every `interval` (10s), but routing might take longer to sync.**

**Wait 2-5 minutes** after Dashboard is ready for routing to activate.

**Check status:**
```powershell
fly checks list -a ai2-wazuh
```

Look for:
- `"status": "healthy"` (not "healthy (startup)")
- `"dashboard_http": {"healthy": true, "http_code": "302"}`

---

### **Solution 2: Force Health Check Refresh (Restart Machine)**

**Restart the machine to force Fly.io to re-evaluate health checks:**

```powershell
fly machine restart 68303ddbed3918 -a ai2-wazuh
```

**Wait 15-20 minutes** for services to start, then check if routing works.

---

### **Solution 3: Verify Health Check Configuration**

**Check if health check is on the correct service:**

```toml
[[services]]
  internal_port = 5601
  processes = ["wazuh"]
  
  [[services.http_checks]]
    path = "/health"
    protocol = "http"
    success_codes = [200]
```

**Status:** ✅ Health check is on the same service as ports 443/80

---

### **Solution 4: Check if Health Check Needs Multiple Consecutive Passes**

**Fly.io might require multiple consecutive health check passes before routing.**

**Current:** Health check passes, but might need 3-5 consecutive passes.

**Wait:** 30-60 seconds for multiple health check cycles.

---

### **Solution 5: Verify Nginx Routing**

**Test if Nginx is routing correctly:**

```bash
# Test health check endpoint
fly ssh console -a ai2-wazuh -C "curl http://localhost:5601/health"

# Test Dashboard endpoint
fly ssh console -a ai2-wazuh -C "curl -I http://localhost:5601/"
```

**Expected:**
- `/health` → Health server (200 OK with JSON)
- `/` → Dashboard (302 redirect)

---

## 🎯 **Recommended Action**

### **Step 1: Wait for Health Check to Update**

**After machine restart, wait 15-20 minutes for:**
1. Services to start
2. Health checks to pass
3. Fly.io routing to sync

### **Step 2: Check Health Check Status**

```powershell
fly checks list -a ai2-wazuh
```

**Look for:**
- `"status": "healthy"` (not "healthy (startup)")
- `"dashboard_http": {"healthy": true}`

### **Step 3: Test Public URL**

```powershell
# Test URL
Invoke-WebRequest -Uri "https://ai2-wazuh.fly.dev" -Method GET
```

**Expected:** HTTP 302 (redirect to login page)

---

## 🔧 **If Still Not Working**

### **Check Fly.io Routing Status**

```powershell
fly status -a ai2-wazuh
```

**Look for:**
- Machine state: `started`
- Checks: `1/1` (all passing)

### **Check Logs for Routing Errors**

```powershell
fly logs -a ai2-wazuh | Select-String -Pattern "503|routing|health"
```

### **Verify Service Configuration**

**Ensure health check and traffic ports are on the same service:**

```toml
[[services]]
  internal_port = 5601  # Health check AND traffic both use this port
  processes = ["wazuh"]
  
  [[services.ports]]
    port = 443  # Public HTTPS port
    handlers = ["tls", "http"]
  
  [[services.http_checks]]
    path = "/health"  # Health check endpoint
    protocol = "http"
```

---

## 📋 **Timeline After Restart**

| Time | Event | Status |
|------|-------|--------|
| 0-1 min | Services starting | Health check: "healthy (startup)" |
| 1-15 min | Indexer initializing | Health check: "healthy (startup)" |
| 15-17 min | Dashboard starting | Health check: "healthy (startup)" |
| 17+ min | All services ready | Health check: "healthy" |
| 17-20 min | Fly.io routing syncs | **URL should work** ✅ |

---

## ✅ **Success Criteria**

1. **Health check status:** `"status": "healthy"` (not "startup")
2. **Dashboard ready:** `"dashboard_http": {"healthy": true, "http_code": "302"}`
3. **Public URL:** `https://ai2-wazuh.fly.dev/` returns 302 (not 503)
4. **Login page:** Accessible in browser

---

**embracingearth.space**

