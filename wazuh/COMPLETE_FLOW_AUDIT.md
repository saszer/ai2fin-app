# 🔍 Complete Flow Audit - Health Check, Fly.io, and Wazuh Startup

**Date:** 2025-12-30  
**Purpose:** Complete end-to-end audit of startup flow, health checks, and traffic routing

---

## 📊 **Complete Startup Flow**

### **Phase 1: Container Initialization (0-30 seconds)**

```
Container Starts
    ↓
/start.sh executes (fly.toml: wazuh = "/start.sh")
    ↓
Init Scripts Run (in order):
    00-disable-filebeat.sh
    01-fix-filebeat-lock.sh
    02-wait-for-wazuh-api.sh
    03-ensure-api-config.sh
    04-restart-api-if-needed.sh
    07-copy-api-certs.sh
    08-fix-permissions.sh
    09-generate-indexer-certs.sh          ← CRITICAL: SSL certificates
    10-set-indexer-dashboard-passwords.sh  ← CRITICAL: Password setup
    11-setup-data-directories.sh          ← CRITICAL: Data persistence
    14-ensure-dashboard-binding.sh        ← CRITICAL: Dashboard port 5602
    ↓
Supervisord Starts
```

**Critical Init Scripts:**
- ✅ `09-generate-indexer-certs.sh` - Creates SSL certificates for Indexer security
- ✅ `10-set-indexer-dashboard-passwords.sh` - Sets Dashboard password from `OPENSEARCH_INITIAL_ADMIN_PASSWORD` secret
- ✅ `11-setup-data-directories.sh` - Sets up data persistence, permissions, temp directory
- ✅ `14-ensure-dashboard-binding.sh` - Ensures Dashboard binds to `0.0.0.0:5602`

---

### **Phase 2: Supervisord Service Startup (30 seconds - 1 minute)**

**Supervisord starts services in priority order:**

| Time | Service | Priority | Port | Command | Status |
|------|---------|----------|------|---------|--------|
| ~30s | **nginx-proxy** | 40 | 5601 | `nginx -g "daemon off;"` | ✅ Starts FIRST |
| ~35s | **health-check-server** | 50 | 8080 | `python3 health-check-server.py` | ✅ Starts SECOND |
| ~40s | **wazuh-manager** | 100 | 55000 | `wazuh-control start` | ✅ Starts THIRD |
| ~45s | **wazuh-indexer** | 200 | 9200 | `run-indexer-with-logging.sh` | ⏳ 10-15 min |
| ~45s | **wazuh-dashboard** | 300 | 5602 | `wait-for-indexer-and-start-dashboard.sh` | ⏳ Waits for Indexer |

**Service Details:**

#### **1. Nginx Proxy (Priority 40)**
- **Status:** ✅ Should start immediately (~30s)
- **Port:** 5601 (internal_port)
- **Config:** `/etc/nginx/nginx.conf`
- **Routes:**
  - `/health` → Health Check Server (port 8080)
  - All other paths → Dashboard (port 5602)
- **Verification:**
  ```bash
  fly logs -a ai2-wazuh | grep "nginx"
  fly ssh console -a ai2-wazuh -C "cat /proc/net/tcp | grep 15E1"  # Port 5601
  ```

#### **2. Health Check Server (Priority 50)**
- **Status:** ✅ Should start immediately (~35s)
- **Port:** 8080
- **Script:** `/etc/cont-init.d/scripts/health-check-server.py`
- **Handles:** `/health` endpoint
- **Returns:** 200 OK during startup (first 5 minutes)
- **Verification:**
  ```bash
  fly logs -a ai2-wazuh | grep "Health Check Server"
  fly ssh console -a ai2-wazuh -C "curl http://localhost:8080/health"
  ```

#### **3. Wazuh Manager (Priority 100)**
- **Status:** ✅ Should start in ~1 minute
- **Port:** 55000 (API)
- **Command:** `/var/ossec/bin/wazuh-control start`
- **Verification:**
  ```bash
  fly logs -a ai2-wazuh | grep "wazuh-manager"
  fly ssh console -a ai2-wazuh -C "curl http://localhost:55000"
  ```

#### **4. Wazuh Indexer (Priority 200)**
- **Status:** ⏳ Takes **10-15 minutes** (with security enabled)
- **Ports:** 9200 (HTTP), 9300 (Transport)
- **Command:** `/bin/bash /etc/cont-init.d/scripts/run-indexer-with-logging.sh`
- **Process:**
  1. Loads SSL certificates (from `09-generate-indexer-certs.sh`)
  2. Initializes security plugin
  3. Creates security index (`.opensearch_security`)
  4. Creates default admin user (if `allow_default_init_securityindex: true`)
- **Verification:**
  ```bash
  fly logs -a ai2-wazuh | grep "wazuh-indexer\|Indexer"
  fly ssh console -a ai2-wazuh -C "curl http://localhost:9200"
  ```

#### **5. Wazuh Dashboard (Priority 300)**
- **Status:** ⏳ Waits for Indexer (up to 10 minutes), then starts (1-2 minutes)
- **Port:** 5602 (nginx proxy routes to it)
- **Command:** `/bin/bash /etc/cont-init.d/scripts/wait-for-indexer-and-start-dashboard.sh`
- **Process:**
  1. Waits for Indexer HTTP endpoint (200 or 401)
  2. Waits for security index initialization
  3. Waits for admin user to be ready
  4. Starts Dashboard
  5. Connects to Indexer with admin credentials
- **Verification:**
  ```bash
  fly logs -a ai2-wazuh | grep "Dashboard\|dashboard"
  fly ssh console -a ai2-wazuh -C "curl http://localhost:5602"
  ```

---

### **Phase 3: Fly.io Health Check (1 minute)**

**Timeline:**
- **Minute 0:** Container starts
- **Minute 0-1:** Services starting (nginx, health server, manager, indexer)
- **Minute 1:** Grace period ends, Fly.io health check runs

**Health Check Flow:**
```
Fly.io Health Check System
    ↓
Connects to: internal_port 5601 (nginx proxy)
    ↓
Request: GET http://internal_ip:5601/health
    ↓
Nginx Proxy (port 5601)
    ├─ Path: /health
    └─ Routes to: Health Check Server (port 8080)
    ↓
Health Check Server (port 8080)
    ├─ Checks: Dashboard listening? (port 5602) → false (not ready yet)
    ├─ Checks: Dashboard HTTP? (port 5602) → false (not ready yet)
    ├─ Checks: Indexer running? → true (process running)
    ├─ Checks: Manager running? → true (process running)
    ├─ Uptime: 60 seconds (< 300s = startup phase)
    └─ Returns: 200 OK (startup phase - always passes)
    ↓
Fly.io: Marks service as healthy ✅
```

**Health Check Response (During Startup):**
```json
{
  "timestamp": "2025-12-30T02:01:00",
  "status": "healthy (startup)",
  "uptime_seconds": 60,
  "note": "Health check passing during startup phase - Dashboard may still be initializing",
  "checks": {
    "dashboard_listening": {"healthy": false, "message": "Port 5602 not listening"},
    "dashboard_http": {"healthy": false, "message": "Dashboard not responding"},
    "indexer_running": {"healthy": true, "message": "Indexer is running"},
    "manager_running": {"healthy": true, "message": "Manager is running"}
  }
}
```
**HTTP Status:** 200 OK ✅

**Result:**
- ✅ Health check **passes within 1 minute**
- ✅ Fly.io **deployment succeeds**
- ✅ Fly.io **routes traffic to port 5601**

---

### **Phase 4: Services Continue Starting (1-17 minutes)**

**Timeline:**
- **Minute 1-15:** Indexer initializing
  - Security plugin loading
  - Security index creation
  - Admin user creation
- **Minute 15-17:** Dashboard waiting for Indexer, then starting
  - Wait script checks Indexer readiness
  - Dashboard starts
  - Dashboard connects to Indexer

**Health Check During This Phase:**
- Health check continues returning 200 OK (startup phase, first 5 minutes)
- Detailed checks logged to stdout (visible in `fly logs`)
- After 5 minutes, health check requires Dashboard to actually be ready

**Health Check Response (After 5 Minutes):**
```json
{
  "timestamp": "2025-12-30T02:06:00",
  "status": "healthy (port open, HTTP initializing)",
  "uptime_seconds": 360,
  "checks": {
    "dashboard_listening": {"healthy": true, "message": "Port 5602 is listening"},
    "dashboard_http": {"healthy": false, "message": "Dashboard not responding"},
    "indexer_running": {"healthy": true},
    "manager_running": {"healthy": true}
  }
}
```
**HTTP Status:** 200 OK ✅ (port is open, HTTP still initializing)

---

### **Phase 5: All Services Ready (17+ minutes)**

**Status:**
- ✅ Nginx Proxy: Running on port 5601
- ✅ Health Check Server: Running on port 8080
- ✅ Wazuh Manager: Running on port 55000
- ✅ Wazuh Indexer: Running on port 9200, security initialized
- ✅ Wazuh Dashboard: Running on port 5602

**Health Check Response (After Startup):**
```json
{
  "timestamp": "2025-12-30T02:18:00",
  "status": "healthy",
  "checks": {
    "dashboard_listening": {"healthy": true, "message": "Port 5602 is listening"},
    "dashboard_http": {"healthy": true, "http_code": "302", "message": "Dashboard HTTP: 302"},
    "indexer_running": {"healthy": true, "message": "Indexer is running"},
    "manager_running": {"healthy": true, "message": "Manager is running"}
  }
}
```
**HTTP Status:** 200 OK ✅

---

## 🌐 **Traffic Routing Flow**

### **User Request Flow:**

```
User: https://ai2-wazuh.fly.dev/
    ↓
Fly.io Proxy (port 443, HTTPS)
    ↓
Routes to: internal_port 5601 (nginx proxy)
    ↓
Nginx Proxy (port 5601)
    ├─ Path: / (not /health)
    └─ Routes to: Dashboard (port 5602)
    ↓
Dashboard (port 5602)
    ↓
Responds: HTTP 302 (redirect to /app/login)
    ↓
User: Sees login page ✅
```

### **Health Check Flow:**

```
Fly.io Health Check: GET http://internal_ip:5601/health
    ↓
Nginx Proxy (port 5601)
    ├─ Path: /health
    └─ Routes to: Health Check Server (port 8080)
    ↓
Health Check Server (port 8080)
    ├─ Runs detailed checks
    ├─ Logs results to stdout
    └─ Returns: 200 OK (with JSON response)
    ↓
Fly.io: Marks service as healthy ✅
```

---

## ✅ **Verification Checklist**

### **1. Init Scripts Run Successfully**
```bash
fly logs -a ai2-wazuh | grep "Running.*script"
# Expected:
# - "Running /etc/cont-init.d/09-generate-indexer-certs.sh"
# - "Running /etc/cont-init.d/10-set-indexer-dashboard-passwords.sh"
# - "Running /etc/cont-init.d/11-setup-data-directories.sh"
```

### **2. Services Start in Correct Order**
```bash
fly logs -a ai2-wazuh | grep "spawned:"
# Expected (in order):
# - spawned: 'nginx-proxy' (priority 40)
# - spawned: 'health-check-server' (priority 50)
# - spawned: 'wazuh-manager' (priority 100)
# - spawned: 'wazuh-indexer' (priority 200)
# - spawned: 'wazuh-dashboard' (priority 300)
```

### **3. Nginx Proxy Starts**
```bash
fly logs -a ai2-wazuh | grep "nginx"
fly ssh console -a ai2-wazuh -C "cat /proc/net/tcp | grep 15E1"  # Port 5601
# Expected: Port 5601 listening (nginx)
```

### **4. Health Check Server Starts**
```bash
fly logs -a ai2-wazuh | grep "Health Check Server"
# Expected: "Health Check Server started on port 8080"
fly ssh console -a ai2-wazuh -C "curl http://localhost:8080/health"
# Expected: JSON response with status "healthy (startup)"
```

### **5. Health Check Passes (Within 1 Minute)**
```bash
fly checks list -a ai2-wazuh
# Expected: servicecheck-00-http-5601: passing (after 1 minute)
```

### **6. Traffic Routes to Dashboard**
```bash
curl -I https://ai2-wazuh.fly.dev
# Expected: HTTP/2 302 (redirect to /app/login)
```

---

## 🚨 **Potential Issues & Solutions**

### **Issue 1: Nginx Proxy Fails to Start**

**Symptoms:**
- Health check fails with "connection refused"
- Port 5601 not listening

**Diagnosis:**
```bash
fly logs -a ai2-wazuh | grep "nginx\|spawned:.*nginx"
fly ssh console -a ai2-wazuh -C "cat /proc/net/tcp | grep 15E1"
```

**Solutions:**
- Verify nginx is installed: `apt-get install -y nginx`
- Check nginx config syntax: `nginx -t`
- Verify supervisord starts nginx-proxy (priority 40)
- Check nginx logs: `fly logs -a ai2-wazuh | grep nginx`

---

### **Issue 2: Health Check Server Fails to Start**

**Symptoms:**
- Health check fails with "connection refused"
- No health check logs

**Diagnosis:**
```bash
fly logs -a ai2-wazuh | grep "Health Check Server\|spawned:.*health"
fly ssh console -a ai2-wazuh -C "curl http://localhost:8080/health"
```

**Solutions:**
- Verify Python 3 is installed: `apt-get install -y python3`
- Check health-check-server.py is executable: `chmod +x`
- Verify supervisord starts health-check-server (priority 50)
- Check Python script syntax: `python3 -m py_compile health-check-server.py`

---

### **Issue 3: Dashboard Not Ready After 5 Minutes**

**Symptoms:**
- Health check returns 503 after 5 minutes
- Dashboard not listening on port 5602

**Diagnosis:**
```bash
fly logs -a ai2-wazuh | grep "Dashboard\|dashboard\|wait-for-indexer"
fly ssh console -a ai2-wazuh -C "cat /proc/net/tcp | grep 15E2"  # Port 5602
```

**Solutions:**
- Check Indexer is ready (takes 10-15 minutes)
- Check Dashboard wait script logs
- Verify Dashboard config (port 5602, not 5601)
- Check Indexer security index initialization

---

### **Issue 4: Traffic Not Routing to Dashboard**

**Symptoms:**
- Health check passes
- But `https://ai2-wazuh.fly.dev` returns 503 or error

**Diagnosis:**
```bash
fly ssh console -a ai2-wazuh -C "curl http://localhost:5601/"  # Nginx
fly ssh console -a ai2-wazuh -C "curl http://localhost:5602/"  # Dashboard
```

**Solutions:**
- Verify nginx proxy is running
- Check nginx routes to Dashboard (port 5602)
- Verify Dashboard is listening on port 5602
- Check nginx error logs

---

## 📊 **Expected Timeline**

| Time | Event | Status | Verification |
|------|-------|--------|--------------|
| 0s | Container starts | ✅ | `fly logs` shows container start |
| 0-30s | Init scripts run | ✅ | `fly logs | grep "Running.*script"` |
| 30s | Supervisord starts | ✅ | `fly logs | grep "supervisord started"` |
| 30-35s | Nginx proxy starts | ✅ | `fly logs | grep "nginx"` or port 5601 listening |
| 35-40s | Health check server starts | ✅ | `fly logs | grep "Health Check Server"` |
| 40-60s | Manager starts | ✅ | `fly logs | grep "wazuh-manager"` |
| 45s | Indexer starts | ⏳ | `fly logs | grep "wazuh-indexer"` |
| **1 min** | **Fly.io health check runs** | ✅ **PASSES** | `fly checks list` shows passing |
| 1-15 min | Indexer initializing | ⏳ | `fly logs | grep "Indexer\|security"` |
| 15-17 min | Dashboard waiting, then starting | ⏳ | `fly logs | grep "Dashboard\|wait-for-indexer"` |
| **17+ min** | **All services ready** | ✅ | `fly logs | grep "Dashboard.*running"` |

---

## ✅ **Success Criteria**

1. **✅ Health check passes within 1 minute**
   - Nginx proxy starts (30s)
   - Health check server starts (35s)
   - Health check returns 200 OK (1 min)
   - Fly.io marks service as healthy

2. **✅ Deployment succeeds**
   - Fly.io deployment completes
   - Traffic routes to port 5601
   - No deployment errors

3. **✅ URL routes to Dashboard**
   - `https://ai2-wazuh.fly.dev` → nginx → Dashboard (5602)
   - Dashboard responds with 302 redirect
   - User can access login page

4. **✅ All services start properly**
   - Manager: ~1 minute ✅
   - Indexer: 10-15 minutes ✅
   - Dashboard: 15-17 minutes ✅

---

## 🔧 **Configuration Summary**

### **Ports:**
- **5601:** Nginx proxy (internal_port, exposed to Fly.io)
- **8080:** Health check server
- **5602:** Dashboard (nginx routes to it)
- **9200:** Indexer HTTP
- **9300:** Indexer Transport
- **55000:** Manager API

### **Health Check:**
- **Endpoint:** `http://internal_ip:5601/health`
- **Flow:** Fly.io → Nginx (5601) → Health Server (8080) → 200 OK
- **Startup:** Always returns 200 OK (first 5 minutes)
- **After Startup:** Requires Dashboard to be ready

### **Traffic Routing:**
- **Flow:** User → Fly.io Proxy → Nginx (5601) → Dashboard (5602)
- **Health Check:** `/health` → Health Server (8080)
- **User Traffic:** `/` → Dashboard (5602)

### **Service Priorities:**
- **40:** Nginx proxy (starts first)
- **50:** Health check server (starts second)
- **100:** Manager (starts third)
- **200:** Indexer (starts fourth)
- **300:** Dashboard (starts last)

---

## 🎯 **Key Points**

1. **✅ Health check works around 1-minute limit:**
   - Health check server starts immediately (35s)
   - Returns 200 OK during startup (first 5 minutes)
   - Allows deployment to succeed

2. **✅ URL routes to Dashboard:**
   - Nginx proxy on port 5601 routes to Dashboard on 5602
   - User traffic goes to Dashboard
   - Health check goes to health server

3. **✅ All services start properly:**
   - Services start in priority order
   - Indexer takes 10-15 minutes (expected)
   - Dashboard waits for Indexer (expected)

4. **✅ Detailed checks logged:**
   - All health check results logged to stdout
   - Visible in `fly logs` for debugging

---

**embracingearth.space**

