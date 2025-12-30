# 🔍 Full Flow Audit - Health Check, Fly.io, and Wazuh Startup

**Date:** 2025-12-30  
**Purpose:** Complete audit of startup flow, health checks, and traffic routing

---

## 📋 **Startup Sequence**

### **Phase 1: Container Initialization (0-30 seconds)**

1. **Container starts** → Fly.io launches Docker container
2. **`/start.sh` executes** (fly.toml: `wazuh = "/start.sh"`)
   - Runs all init scripts in `/etc/cont-init.d/*.sh` (in order)
   - Starts supervisord

**Init Scripts Execution Order:**
```
00-disable-filebeat.sh          # Disable unused services
01-fix-filebeat-lock.sh         # Clean lock files
02-wait-for-wazuh-api.sh        # Wait for API (if needed)
03-ensure-api-config.sh         # Verify API config
04-restart-api-if-needed.sh     # Conditional restart
07-copy-api-certs.sh            # SSL certificate setup
08-fix-permissions.sh           # Fix ownership/permissions
09-generate-indexer-certs.sh    # Generate TLS certificates (CRITICAL)
10-set-indexer-dashboard-passwords.sh  # Set passwords (CRITICAL)
11-setup-data-directories.sh    # Create data dirs (CRITICAL)
12-wait-for-indexer.sh          # Wait for Indexer (if needed)
13-wait-for-dashboard.sh        # Wait for Dashboard (if needed)
14-ensure-dashboard-binding.sh  # Ensure Dashboard binds to 0.0.0.0:5602
```

**Critical Init Scripts:**
- ✅ `09-generate-indexer-certs.sh` - Creates SSL certificates for Indexer security
- ✅ `10-set-indexer-dashboard-passwords.sh` - Sets Dashboard password from secrets
- ✅ `11-setup-data-directories.sh` - Sets up data persistence and permissions
- ✅ `14-ensure-dashboard-binding.sh` - Ensures Dashboard binds to 0.0.0.0:5602

---

### **Phase 2: Supervisord Starts Services (30 seconds - 1 minute)**

**Supervisord starts** → Manages all services in priority order:

| Service | Priority | Start Time | Port | Status |
|---------|----------|------------|------|--------|
| **nginx-proxy** | 40 | ~30s | 5601 | ✅ Starts FIRST |
| **health-check-server** | 50 | ~35s | 8080 | ✅ Starts SECOND |
| **wazuh-manager** | 100 | ~40s | 55000 | ✅ Starts THIRD |
| **wazuh-indexer** | 200 | ~45s | 9200 | ⏳ Takes 10-15 min |
| **wazuh-dashboard** | 300 | ~45s | 5602 | ⏳ Waits for Indexer |

**Service Startup Details:**

#### **1. Nginx Proxy (Priority 40)**
- **Command:** `/usr/sbin/nginx -g "daemon off;"`
- **Config:** `/etc/nginx/nginx.conf` (nginx-health-proxy.conf)
- **Listens on:** Port 5601 (internal_port)
- **Routes:**
  - `/health` → Health Check Server (port 8080)
  - All other paths → Dashboard (port 5602)
- **Start time:** ~30 seconds
- **Status:** ✅ Should start immediately

#### **2. Health Check Server (Priority 50)**
- **Command:** `/usr/bin/python3 /etc/cont-init.d/scripts/health-check-server.py`
- **Listens on:** Port 8080
- **Handles:** `/health` endpoint
- **Start time:** ~35 seconds
- **Status:** ✅ Should start immediately (Python script, no dependencies)

#### **3. Wazuh Manager (Priority 100)**
- **Command:** `/var/ossec/bin/wazuh-control start`
- **Listens on:** Port 55000 (API)
- **Start time:** ~40 seconds
- **Status:** ✅ Should start in ~1 minute

#### **4. Wazuh Indexer (Priority 200)**
- **Command:** `/bin/bash /etc/cont-init.d/scripts/run-indexer-with-logging.sh`
- **Listens on:** Port 9200 (HTTP), 9300 (Transport)
- **Start time:** ~45 seconds
- **Status:** ⏳ Takes **10-15 minutes** (with security enabled)
- **Process:**
  1. Loads SSL certificates
  2. Initializes security plugin
  3. Creates security index
  4. Creates default admin user (if `allow_default_init_securityindex: true`)

#### **5. Wazuh Dashboard (Priority 300)**
- **Command:** `/bin/bash /etc/cont-init.d/scripts/wait-for-indexer-and-start-dashboard.sh`
- **Listens on:** Port 5602 (nginx proxy routes to it)
- **Start time:** ~45 seconds (but waits for Indexer)
- **Status:** ⏳ Waits for Indexer (up to 10 minutes), then starts (1-2 minutes)
- **Process:**
  1. Waits for Indexer HTTP endpoint (200 or 401)
  2. Waits for security index initialization
  3. Waits for admin user to be ready
  4. Starts Dashboard
  5. Connects to Indexer with admin credentials

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
    ↓
Routes to: Health Check Server (port 8080)
    ↓
Health Check Server
    ├─ Checks: Dashboard listening? (port 5602)
    ├─ Checks: Dashboard HTTP? (port 5602)
    ├─ Checks: Indexer running?
    ├─ Checks: Manager running?
    └─ Returns: 200 OK (during startup phase, first 5 minutes)
    ↓
Fly.io: Marks service as healthy ✅
```

**Health Check Response (During Startup):**
```json
{
  "status": "healthy (startup)",
  "uptime_seconds": 60,
  "note": "Health check passing during startup phase - Dashboard may still be initializing",
  "checks": {
    "dashboard_listening": {"healthy": false},
    "dashboard_http": {"healthy": false},
    "indexer_running": {"healthy": true},
    "manager_running": {"healthy": true}
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
- **Minute 1-15:** Indexer initializing (security plugin, security index, admin user)
- **Minute 15-17:** Dashboard waiting for Indexer, then starting
- **Minute 17+:** All services ready

**Health Check During This Phase:**
- Health check continues returning 200 OK (startup phase)
- Detailed checks logged to stdout (visible in `fly logs`)
- After 5 minutes, health check requires Dashboard to actually be ready

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
Fly.io Proxy (port 443)
    ↓
Routes to: internal_port 5601 (nginx proxy)
    ↓
Nginx Proxy (port 5601)
    ↓
Routes to: Dashboard (port 5602)
    ↓
Dashboard
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
    ↓
Routes /health to: Health Check Server (port 8080)
    ↓
Health Check Server
    ↓
Returns: 200 OK (with detailed checks in JSON)
    ↓
Fly.io: Marks service as healthy ✅
```

---

## ✅ **Verification Checklist**

### **1. Init Scripts Run Successfully**
```bash
fly logs -a ai2-wazuh | grep "Running.*script"
# Should see: "Running /etc/cont-init.d/09-generate-indexer-certs.sh"
# Should see: "Running /etc/cont-init.d/10-set-indexer-dashboard-passwords.sh"
# Should see: "Running /etc/cont-init.d/11-setup-data-directories.sh"
```

### **2. Services Start in Correct Order**
```bash
fly logs -a ai2-wazuh | grep "spawned:"
# Should see (in order):
# - spawned: 'nginx-proxy'
# - spawned: 'health-check-server'
# - spawned: 'wazuh-manager'
# - spawned: 'wazuh-indexer'
# - spawned: 'wazuh-dashboard'
```

### **3. Health Check Server Starts**
```bash
fly logs -a ai2-wazuh | grep "Health Check Server"
# Should see: "Health Check Server started on port 8080"
```

### **4. Nginx Proxy Starts**
```bash
fly logs -a ai2-wazuh | grep "nginx"
# Should see nginx starting (or check if port 5601 is listening)
```

### **5. Health Check Passes**
```bash
fly checks list -a ai2-wazuh
# Should show: servicecheck-00-http-5601: passing (after 1 minute)
```

### **6. Dashboard Accessible**
```bash
curl -I https://ai2-wazuh.fly.dev
# Should return: HTTP/2 302 (redirect to /app/login)
```

---

## 🚨 **Potential Issues & Solutions**

### **Issue 1: Nginx Proxy Fails to Start**

**Symptoms:**
- Health check fails with "connection refused"
- Port 5601 not listening

**Check:**
```bash
fly logs -a ai2-wazuh | grep "nginx"
fly ssh console -a ai2-wazuh -C "cat /proc/net/tcp | grep 15E1"
```

**Solution:**
- Verify nginx is installed in Dockerfile
- Check nginx config syntax
- Verify supervisord starts nginx-proxy

---

### **Issue 2: Health Check Server Fails to Start**

**Symptoms:**
- Health check fails with "connection refused"
- No health check logs

**Check:**
```bash
fly logs -a ai2-wazuh | grep "Health Check Server"
fly ssh console -a ai2-wazuh -C "curl http://localhost:8080/health"
```

**Solution:**
- Verify Python 3 is installed
- Check health-check-server.py is executable
- Verify supervisord starts health-check-server

---

### **Issue 3: Dashboard Not Ready After 5 Minutes**

**Symptoms:**
- Health check returns 503 after 5 minutes
- Dashboard not listening on port 5602

**Check:**
```bash
fly logs -a ai2-wazuh | grep "Dashboard\|dashboard"
fly ssh console -a ai2-wazuh -C "cat /proc/net/tcp | grep 15E2"  # Port 5602
```

**Solution:**
- Check Indexer is ready (takes 10-15 minutes)
- Check Dashboard wait script logs
- Verify Dashboard config (port 5602)

---

### **Issue 4: Traffic Not Routing to Dashboard**

**Symptoms:**
- Health check passes
- But `https://ai2-wazuh.fly.dev` returns 503 or error

**Check:**
```bash
fly ssh console -a ai2-wazuh -C "curl http://localhost:5601/"
fly ssh console -a ai2-wazuh -C "curl http://localhost:5602/"
```

**Solution:**
- Verify nginx proxy is running
- Check nginx routes to Dashboard (port 5602)
- Verify Dashboard is listening on port 5602

---

## 📊 **Expected Timeline**

| Time | Event | Status |
|------|-------|--------|
| 0s | Container starts | ✅ |
| 0-30s | Init scripts run | ✅ |
| 30s | Supervisord starts | ✅ |
| 30-35s | Nginx proxy starts | ✅ |
| 35-40s | Health check server starts | ✅ |
| 40-60s | Manager starts | ✅ |
| 45s | Indexer starts | ⏳ |
| **1 min** | **Fly.io health check runs** | ✅ **PASSES** |
| 1-15 min | Indexer initializing | ⏳ |
| 15-17 min | Dashboard waiting, then starting | ⏳ |
| **17+ min** | **All services ready** | ✅ |

---

## ✅ **Success Criteria**

1. **✅ Health check passes within 1 minute**
   - Nginx proxy starts (30s)
   - Health check server starts (35s)
   - Health check returns 200 OK (1 min)

2. **✅ Deployment succeeds**
   - Fly.io marks service as healthy
   - Traffic routes to port 5601

3. **✅ URL routes to Dashboard**
   - `https://ai2-wazuh.fly.dev` → nginx → Dashboard (5602)
   - Dashboard responds with 302 redirect

4. **✅ All services start properly**
   - Manager: ~1 minute
   - Indexer: 10-15 minutes
   - Dashboard: 15-17 minutes

---

## 🔧 **Configuration Summary**

### **Ports:**
- **5601:** Nginx proxy (internal_port, exposed to Fly.io)
- **8080:** Health check server
- **5602:** Dashboard (nginx routes to it)
- **9200:** Indexer HTTP
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

---

**embracingearth.space**

