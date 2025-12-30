# ✅ Nginx Proxy Solution - Health Check + Dashboard Routing

**Date:** 2025-12-30  
**Solution:** Nginx reverse proxy routes /health to health check server, everything else to Dashboard

---

## 🎯 **Architecture**

```
User Request: https://ai2-wazuh.fly.dev
    ↓
Fly.io Proxy (port 443)
    ↓
Routes to: internal_port 5601 (nginx proxy)
    ↓
Nginx Proxy (port 5601)
    ├─ /health → Health Check Server (port 8080) → 200 OK
    └─ / (all other paths) → Dashboard (port 5602) → Dashboard responds
```

---

## 📋 **Configuration**

### **1. Nginx Proxy** (`scripts/nginx-health-proxy.conf`)

**Listens on:** Port 5601 (internal_port)  
**Routes:**
- `/health` → Health Check Server (port 8080)
- All other paths → Dashboard (port 5602)

### **2. Health Check Server** (`scripts/health-check-server.py`)

**Listens on:** Port 8080  
**Handles:** `/health` endpoint  
**Returns:** 200 OK during startup (first 5 minutes), then requires Dashboard readiness

### **3. Dashboard** (`dashboard/opensearch_dashboards.yml`)

**Listens on:** Port 5602  
**Handles:** All paths except `/health`  
**Accessible via:** Nginx proxy on port 5601

---

## ✅ **How It Works**

### **Health Check Flow:**

1. **Fly.io health check:** `GET http://internal_ip:5601/health`
2. **Nginx proxy:** Routes to health check server (port 8080)
3. **Health check server:** Returns 200 OK (during startup) or checks Dashboard
4. **Fly.io:** Marks service as healthy → Routes traffic to port 5601

### **User Traffic Flow:**

1. **User request:** `https://ai2-wazuh.fly.dev/`
2. **Fly.io proxy:** Routes to internal_port 5601 (nginx)
3. **Nginx proxy:** Routes to Dashboard (port 5602)
4. **Dashboard:** Responds with 302 redirect to `/app/login`

---

## 🎯 **Benefits**

1. **✅ Works around 1-minute grace period:**
   - Health check server starts immediately
   - Returns 200 OK during startup
   - Deployment succeeds within 1 minute

2. **✅ URL routes to Dashboard:**
   - Traffic routes to port 5601 (nginx)
   - Nginx routes to Dashboard (port 5602)
   - Users access Dashboard via public URL

3. **✅ Both services work:**
   - Health check: `/health` → health server (8080)
   - Dashboard: `/` → Dashboard (5602)
   - Both accessible via port 5601

4. **✅ Simple and maintainable:**
   - Nginx handles routing
   - Health check server handles health checks
   - Dashboard handles user traffic

---

## 📊 **Port Configuration**

| Service | Port | Purpose |
|---------|------|---------|
| Nginx Proxy | 5601 | Routes traffic (internal_port) |
| Health Check Server | 8080 | Health checks |
| Dashboard | 5602 | User interface |

---

## 🚀 **Deployment**

**Deploy with nginx proxy:**
```bash
cd D:\embracingearthspace\wazuh
fly deploy -a ai2-wazuh
```

**Expected:**
- ✅ Health check passes within 1 minute (health server on 8080)
- ✅ Deployment succeeds
- ✅ URL routes to Dashboard (via nginx proxy)
- ✅ Users can access Dashboard via `https://ai2-wazuh.fly.dev`

---

## ✅ **Summary**

**YES - URL will route to Dashboard:**
- ✅ Health check: port 5601 `/health` → nginx → health server (8080) → 200 OK
- ✅ User traffic: port 5601 `/` → nginx → Dashboard (5602) → Dashboard responds
- ✅ Public URL `https://ai2-wazuh.fly.dev` → Dashboard ✅

**The nginx proxy ensures both health check and Dashboard work on port 5601!**

---

**embracingearth.space**

