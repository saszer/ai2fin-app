# ✅ Health Check Routing - How It Works

**Date:** 2025-12-30  
**Question:** "then will it link url to dashboard?"

---

## 🎯 **Answer: YES - URL Will Route to Dashboard**

### **How Fly.io Routing Works:**

1. **Health check port (8080):** Used ONLY for health checks
2. **Traffic port (5601):** Where actual traffic is routed
3. **When health check passes:** Fly.io routes traffic to `internal_port` (5601)

---

## 📊 **Configuration Breakdown**

### **Service Configuration:**

```toml
[[services]]
  internal_port = 5601          # ← Traffic routes HERE (Dashboard)
  
  [[services.ports]]
    port = 443                  # ← Public HTTPS port
    handlers = ["tls", "http"]
  
  [[services.http_checks]]
    protocol = "http"           # ← Health check uses port 8080
    path = "/health"
    # NOTE: Health check hits port 8080, but traffic routes to 5601
```

### **How It Works:**

```
User Request: https://ai2-wazuh.fly.dev
    ↓
Fly.io Proxy (port 443)
    ↓
Routes to: internal_port 5601 (Dashboard) ✅
    ↓
Dashboard responds
```

**Health Check:**
```
Fly.io Health Check System
    ↓
Checks: port 8080 /health (health check server)
    ↓
If 200 OK → Marks service as healthy
    ↓
Allows traffic routing to port 5601 (Dashboard)
```

---

## ✅ **Key Points**

1. **Health check port (8080) ≠ Traffic port (5601)**
   - Health check uses port 8080 (health check server)
   - Traffic routes to port 5601 (Dashboard)

2. **Fly.io routes based on `internal_port`**
   - `internal_port = 5601` → Traffic goes to Dashboard
   - Health check just determines if service is "healthy"

3. **When health check passes:**
   - Fly.io marks service as healthy
   - Fly.io routes traffic to `internal_port` (5601)
   - Users access Dashboard via `https://ai2-wazuh.fly.dev`

---

## 🔍 **Verification**

**After deployment, verify:**

1. **Health check passes:**
   ```bash
   fly checks list -a ai2-wazuh
   # Should show: servicecheck-00-http-5601: passing
   ```

2. **Dashboard accessible:**
   ```bash
   curl -I https://ai2-wazuh.fly.dev
   # Should return: HTTP/2 302 (redirect to /app/login)
   ```

3. **Traffic routes to Dashboard:**
   - Public URL: `https://ai2-wazuh.fly.dev`
   - Routes to: `internal_port 5601` (Dashboard)
   - NOT to: port 8080 (health check server)

---

## ⚠️ **Important Note**

**Health check port vs Traffic port:**
- Health check uses port 8080 (health check server)
- Traffic routes to port 5601 (Dashboard)
- These are **separate** - health check doesn't affect routing destination

**Why this works:**
- Fly.io uses health check to determine if service is "healthy"
- Once healthy, Fly.io routes traffic to `internal_port` (5601)
- Health check port (8080) is just for monitoring, not routing

---

## ✅ **Summary**

**YES - URL will route to Dashboard:**
- ✅ Health check on port 8080 (for monitoring)
- ✅ Traffic routes to port 5601 (Dashboard)
- ✅ Public URL `https://ai2-wazuh.fly.dev` → Dashboard ✅

**The health check server is just for health checks - it doesn't affect where traffic is routed!**

---

**embracingearth.space**

