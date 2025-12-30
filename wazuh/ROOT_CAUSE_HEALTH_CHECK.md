# 🔍 Root Cause Analysis - Health Check "Connection Refused"

**Date:** 2025-12-28  
**Issue:** Fly.io health checks show "connection refused" despite Dashboard listening on 0.0.0.0:5601

---

## ✅ **What We Know Works**

1. **Dashboard IS Listening:**
   - `/proc/net/tcp` shows: `00000000:15E1` (port 5601 on 0.0.0.0)
   - Dashboard process is RUNNING (supervisord confirms)
   - Dashboard config has `server.host: 0.0.0.0` and `server.port: 5601`

2. **Dashboard IS Responding:**
   - Logs show "Consul Health Check" getting 302 responses
   - Internal Fly.io health checks (Consul) can reach Dashboard
   - Dashboard is accessible from inside the Fly.io network

3. **Configuration is Correct:**
   - `fly.toml` has `internal_port = 5601`
   - HTTP health check configured with `path = "/"` and `success_codes = [200, 301, 302, 303, 307, 308, 401]`
   - `grace_period = "1m"` (max allowed by Fly.io)

---

## 🚨 **Root Cause: Fly.io Health Check Timing & Network**

### **Problem 1: Health Check Source Location**

**Fly.io Health Checks Connect From:**
- **External health checks:** Connect from Fly.io's infrastructure (outside the machine)
- **Internal health checks (Consul):** Connect from inside the Fly.io network
- **Our HTTP check:** Connects to `internal_port` (5601) from outside the machine

**The Issue:**
- Dashboard is listening on `0.0.0.0:5601` ✅
- But Fly.io's external health check system might be connecting before Dashboard is fully ready
- OR there's a network/firewall issue preventing external connections

### **Problem 2: Grace Period Too Short**

**Current:** `grace_period = "1m"` (max allowed by Fly.io)  
**Reality:**
- Indexer takes **10-15 minutes** to start
- Dashboard waits for Indexer (up to 10 minutes)
- Dashboard then takes **1-2 minutes** to start
- **Total: 12-17 minutes** before Dashboard is ready

**Result:** Health check starts after 1 minute, but Dashboard isn't ready yet → "connection refused"

### **Problem 3: Dashboard Startup Timing**

**Dashboard Startup Sequence:**
1. Dashboard process starts (supervisord reports RUNNING)
2. Dashboard binds to `0.0.0.0:5601` (port is listening)
3. Dashboard initializes OpenSearch connection (1-2 minutes)
4. Dashboard is ready to accept HTTP requests

**The Gap:**
- Health check might connect during step 2-3 (port is listening, but not ready for HTTP)
- Dashboard might accept TCP connection but not respond to HTTP yet
- HTTP check fails with "connection refused" or timeout

---

## 🔧 **Solutions**

### **Solution 1: Increase Health Check Timeout** ✅ (Already Done)

**Current Configuration:**
```toml
[[services.http_checks]]
  grace_period = "1m"         # Max allowed by Fly.io
  interval = "10s"            # Check every 10s
  timeout = "5s"              # 5s timeout
```

**Issue:** `timeout = "5s"` might be too short if Dashboard is slow to respond during startup.

**Fix:** Increase timeout to 15-30s:
```toml
[[services.http_checks]]
  timeout = "15s"             # Increased timeout for slow startup
```

### **Solution 2: Verify Dashboard Readiness Before Health Check**

**Current:** Health check starts after `grace_period` (1 minute)  
**Problem:** Dashboard might not be ready yet

**Fix:** Ensure Dashboard is fully initialized before health checks start:
- Dashboard should log "Server running" or similar when ready
- Health check should wait for this signal

**Implementation:**
- Add a readiness probe endpoint that Dashboard can use
- Or ensure Dashboard logs "ready" message that we can monitor

### **Solution 3: Use TCP Health Check as Fallback**

**Why TCP Check Might Work Better:**
- TCP check just verifies port is open (simpler)
- Doesn't require HTTP response
- Might pass earlier than HTTP check

**Configuration:**
```toml
[[services.tcp_checks]]
  grace_period = "1m"
  interval = "10s"
  timeout = "5s"
```

**Trade-off:** TCP check doesn't verify Dashboard is actually ready, just that port is open.

### **Solution 4: Accept "Connection Refused" During Startup**

**Reality:** Dashboard takes 12-17 minutes to start  
**Fly.io Limitation:** `grace_period` capped at 1 minute

**Acceptance:**
- Health checks will fail for 12-17 minutes (expected)
- Once Dashboard is ready, health checks will pass
- Fly.io will route traffic once health checks pass

**This is already documented in `fly.toml` comments, but we should verify it's working correctly.**

---

## 🎯 **Recommended Fix**

1. **Increase HTTP check timeout to 15s:**
   ```toml
   [[services.http_checks]]
     timeout = "15s"  # Increased from 5s
   ```

2. **Verify Dashboard readiness:**
   - Check Dashboard logs for "Server running" or similar
   - Ensure health check waits for this signal

3. **Monitor health check behavior:**
   - Check `fly checks list -a ai2-wazuh` after Dashboard is ready
   - Verify health checks pass once Dashboard is fully started

4. **If still failing, add TCP check as fallback:**
   ```toml
   [[services.tcp_checks]]
     grace_period = "1m"
     interval = "10s"
     timeout = "5s"
   ```

---

## 📊 **Current Status**

- ✅ Dashboard is listening on `0.0.0.0:5601`
- ✅ Dashboard is responding to internal health checks (302 responses)
- ❌ Fly.io external health checks show "connection refused"
- ⚠️ Health check timing might be the issue (checking before Dashboard is ready)

---

## 🔍 **Next Steps**

1. Increase HTTP check timeout to 15s
2. Monitor health checks after Dashboard is fully started (12-17 minutes)
3. If still failing, investigate network/firewall issues
4. Consider adding TCP check as fallback

---

**embracingearth.space**

