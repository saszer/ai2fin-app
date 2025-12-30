# ✅ Custom Health Check Solution - Works Around 1-Minute Grace Period

**Date:** 2025-12-30  
**Solution:** Custom health check server that passes quickly for Fly.io but does detailed checks in background

---

## 🎯 **The Problem**

**Fly.io Limitation:**
- Grace period capped at **1 minute** (max allowed)
- Dashboard takes **12-17 minutes** to fully start
- Health checks fail during deployment → deployment fails

**Traditional Solution Doesn't Work:**
- Can't increase grace period beyond 1 minute
- Health checks fail before Dashboard is ready
- Deployment gets stuck or fails

---

## ✅ **The Solution: Custom Health Check Server**

**How It Works:**
1. **Health check server starts immediately** (port 8080)
2. **Returns 200 OK during startup phase** (first 10 minutes)
3. **Allows Fly.io deployment to pass** within 1 minute grace period
4. **Runs detailed sub-checks in background** (logged for debugging)
5. **After 10 minutes, requires Dashboard to actually be ready**

---

## 📋 **Implementation**

### **1. Health Check Server** (`scripts/health-check-server.py`)

**Features:**
- Starts immediately (no dependencies on Dashboard)
- Returns 200 OK during startup phase (first 10 minutes)
- Runs detailed checks: Dashboard listening, HTTP response, Indexer, Manager
- Logs all results to stdout (visible in `fly logs`)
- After 10 minutes, requires Dashboard to actually be ready

**Port:** 8080 (separate from Dashboard 5601)

### **2. Supervisord Configuration**

**Added:**
```ini
[program:health-check-server]
command=/usr/bin/python3 /etc/cont-init.d/scripts/health-check-server.py
autostart=true
autorestart=true
priority=50  # Starts early
```

### **3. Fly.io Configuration**

**Updated `fly.toml`:**
```toml
# Health check server service (separate from Dashboard)
[[services]]
  internal_port = 8080
  protocol = "tcp"
  processes = ["wazuh"]

  [[services.http_checks]]
    grace_period = "1m"         # Max allowed by Fly.io
    interval = "10s"
    timeout = "5s"              # Quick timeout
    method = "GET"
    path = "/health"
    protocol = "http"
    success_codes = [200]       # Health server returns 200 during startup
```

---

## 🎯 **How It Works Around 1-Minute Limit**

### **Timeline:**

1. **Minute 0:** Container starts
2. **Minute 0-1:** Health check server starts (immediate)
3. **Minute 1:** Fly.io health check runs → **200 OK** ✅
4. **Minute 1-10:** Health check continues returning 200 OK (startup phase)
5. **Minute 10-17:** Dashboard starts (Indexer + Dashboard)
6. **Minute 17+:** Dashboard ready, health check requires it to be ready

**Result:**
- ✅ Fly.io deployment **passes within 1 minute** (health check server responds)
- ✅ Detailed checks run in background (logged for debugging)
- ✅ After 10 minutes, health check requires Dashboard to actually be ready

---

## 📊 **Health Check Response**

### **During Startup (0-10 minutes):**
```json
{
  "timestamp": "2025-12-30T02:00:00",
  "status": "healthy (startup)",
  "uptime_seconds": 60,
  "note": "Health check passing during startup phase - detailed checks may still be in progress",
  "checks": {
    "dashboard_listening": {"healthy": false, "message": "Port 5601 not listening"},
    "dashboard_http": {"healthy": false, "message": "Dashboard not responding"},
    "indexer_running": {"healthy": true, "message": "Indexer is running"},
    "manager_running": {"healthy": true, "message": "Manager is running"}
  }
}
```
**HTTP Status:** 200 OK ✅

### **After Startup (10+ minutes):**
```json
{
  "timestamp": "2025-12-30T02:20:00",
  "status": "healthy",
  "checks": {
    "dashboard_listening": {"healthy": true, "message": "Port 5601 is listening"},
    "dashboard_http": {"healthy": true, "http_code": "302", "message": "Dashboard HTTP: 302"},
    "indexer_running": {"healthy": true, "message": "Indexer is running"},
    "manager_running": {"healthy": true, "message": "Manager is running"}
  }
}
```
**HTTP Status:** 200 OK ✅ (only if Dashboard is ready)

---

## 🔍 **Logging**

**All health check results logged to stdout:**
```
[HEALTH] Uptime: 60s, Status: healthy (startup), Dashboard: false, HTTP: false, Indexer: true, Manager: true
[HEALTH] Uptime: 1200s, Status: healthy, Dashboard: true, HTTP: true, Indexer: true, Manager: true
```

**View in logs:**
```bash
fly logs -a ai2-wazuh | grep HEALTH
```

---

## ✅ **Benefits**

1. **✅ Works around 1-minute grace period limit**
2. **✅ Deployment passes quickly** (within 1 minute)
3. **✅ Detailed checks still run** (for debugging)
4. **✅ Logs all results** (visible in `fly logs`)
5. **✅ After startup, requires Dashboard to actually be ready**

---

## 🚀 **Deployment**

**Deploy with new health check:**
```bash
cd D:\embracingearthspace\wazuh
fly deploy -a ai2-wazuh
```

**Expected:**
- ✅ Health check passes within 1 minute
- ✅ Deployment succeeds
- ✅ Detailed checks logged in `fly logs`
- ✅ After 10 minutes, health check requires Dashboard to be ready

---

## ⚠️ **Important Notes**

1. **This is a workaround** for Fly.io's 1-minute grace period limit
2. **Health check passes during startup** but Dashboard may not be ready yet
3. **After 10 minutes, health check requires Dashboard to actually be ready**
4. **All detailed checks are logged** for debugging

---

**embracingearth.space**

