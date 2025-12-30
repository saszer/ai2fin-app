# 🔍 Routing Sync Issue - Health Check vs Traffic Routing

**Date:** 2025-12-30  
**Issue:** Dashboard is ready, health checks passing, but Fly.io routing not syncing

---

## 🚨 **The Problem**

**Current Situation:**
- ✅ Dashboard is ready (302 redirects every 10s)
- ✅ Health check server reports "healthy" with Dashboard ready
- ❌ Fly.io routing still returns 503
- ❌ Restarting resets everything (15-20 min wait)

**Why Restarting Doesn't Help:**
1. Restart resets all services
2. Dashboard takes 15-17 minutes to start again
3. We're back to the same waiting period
4. Doesn't fix the routing sync issue

---

## 🔍 **Root Cause**

**Fly.io Routing System:**
- Health checks run every `interval` (10s)
- Routing system might check health status separately
- There might be a delay between health check passing and routing activation
- Routing might require multiple consecutive health check passes

**Current Health Check:**
- Health check server: Returns 200 OK with "healthy" status
- Fly.io health check: Shows "passing" but might be cached
- Routing system: Not synced with health check status

---

## ✅ **Solutions (Without Restart)**

### **Solution 1: Wait for Natural Sync**

**Fly.io routing should sync automatically, but it might take time.**

**Wait 5-10 minutes** after Dashboard is ready for routing to activate.

**Check if it syncs:**
```powershell
# Monitor health check status
fly checks list -a ai2-wazuh

# Test URL periodically
Invoke-WebRequest -Uri "https://ai2-wazuh.fly.dev" -Method GET
```

---

### **Solution 2: Verify Health Check is Actually Being Used**

**Check if health check is properly configured for routing:**

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
    success_codes = [200]
```

**Status:** ✅ Health check is on the same service as ports 443/80

---

### **Solution 3: Check if Health Check Needs to Pass Multiple Times**

**Fly.io might require 3-5 consecutive health check passes before routing.**

**Current:** Health check passes, but might need more consecutive passes.

**Wait:** 30-60 seconds for multiple health check cycles (3-6 cycles at 10s interval).

---

### **Solution 4: Verify Health Check Response Format**

**Fly.io might expect a specific health check response format.**

**Current Health Check Response:**
```json
{
  "status": "healthy",
  "checks": {
    "dashboard_http": {"healthy": true, "http_code": "302"}
  }
}
```

**HTTP Status:** 200 OK ✅

**This should be sufficient for Fly.io.**

---

### **Solution 5: Check Fly.io Routing Status Directly**

**Verify if Fly.io recognizes the instance as healthy for routing:**

```powershell
# Check machine status
fly status -a ai2-wazuh

# Check health checks
fly checks list -a ai2-wazuh

# Check if there are any routing errors
fly logs -a ai2-wazuh | Select-String -Pattern "routing|503|healthy"
```

---

## 🎯 **Recommended Approach**

### **Step 1: Don't Restart (Dashboard is Already Ready)**

**Dashboard is responding with 302 redirects - it's ready!**

**Just wait 5-10 minutes for Fly.io routing to sync.**

---

### **Step 2: Monitor Health Check Status**

```powershell
# Check health check status every minute
fly checks list -a ai2-wazuh
```

**Look for:**
- Status: `passing`
- Last updated: Recent (within last minute)
- Output: `"status": "healthy"` (not "startup")

---

### **Step 3: Test URL Periodically**

```powershell
# Test every 2-3 minutes
Invoke-WebRequest -Uri "https://ai2-wazuh.fly.dev" -Method GET
```

**Expected:** HTTP 302 (redirect to login page)

**If still 503 after 10 minutes:** Then we investigate further.

---

## 🔧 **If Still Not Working After 10 Minutes**

### **Check 1: Verify Health Check is Actually Passing**

```powershell
# Check current health check status
fly checks list -a ai2-wazuh

# Should show:
# - Status: passing
# - Last updated: Recent
# - Output: "status": "healthy"
```

---

### **Check 2: Verify Service Configuration**

**Ensure health check and traffic are on the same service:**

```toml
[[services]]
  internal_port = 5601  # Health check AND traffic both use this
  processes = ["wazuh"]
  
  [[services.ports]]
    port = 443  # Public HTTPS port
  
  [[services.http_checks]]
    path = "/health"  # Health check endpoint
```

**Status:** ✅ Configuration is correct

---

### **Check 3: Check for Fly.io Platform Issues**

**Sometimes Fly.io has routing delays or issues.**

**Check Fly.io status:**
- https://status.fly.io/
- Or check Fly.io community/forums

---

## 📋 **Timeline (Without Restart)**

| Time | Action | Status |
|------|--------|--------|
| Now | Dashboard ready, health check passing | Wait for sync |
| +5 min | Check if routing activated | Test URL |
| +10 min | If still 503, investigate | Check health check status |

---

## ✅ **Success Criteria**

1. **Health check:** `"status": "healthy"` (not "startup")
2. **Dashboard ready:** `"dashboard_http": {"healthy": true, "http_code": "302"}`
3. **Public URL:** `https://ai2-wazuh.fly.dev/` returns 302 (not 503)
4. **Login page:** Accessible in browser

---

**Key Point:** Don't restart - Dashboard is already ready! Just wait for Fly.io routing to sync (5-10 minutes).

**embracingearth.space**

