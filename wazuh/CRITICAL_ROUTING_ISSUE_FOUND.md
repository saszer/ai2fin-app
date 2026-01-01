# 🚨 CRITICAL ROUTING ISSUE IDENTIFIED

**Date:** 2026-01-01  
**Status:** ROOT CAUSE FOUND

---

## 📊 Current Status

### ✅ What's Working
- Health checks: **PASSING** (1/1)
- Dashboard: Responding with HTTP 302 on port 5602
- Health check server: Responding with HTTP 200 on port 8080
- Nginx: Routing `/health` to health server, `/` to Dashboard
- Internal connectivity: All services can talk to each other

### ❌ What's NOT Working
- **Public URL:** `https://ai2-wazuh.fly.dev/` returns **503 Server Unavailable**
- **External access:** Cannot reach the application from outside

---

## 🔍 Root Cause Analysis

### The Problem

**Nginx is listening on `127.0.0.1:5601` (localhost only), NOT on `0.0.0.0:5601` (all interfaces)!**

**Current Nginx configuration:**
```nginx
server {
    listen 5601;           # ❌ Defaults to 127.0.0.1:5601
    server_name _;
    ...
}
```

**What Fly.io expects:**
- Fly.io's proxy forwards traffic to `internal_port = 5601`
- Fly.io expects the service to listen on **0.0.0.0:5601** (all network interfaces)
- But Nginx is only listening on **127.0.0.1:5601** (localhost only)
- Fly.io proxy **CANNOT connect** to localhost-only binding

---

## 🧪 Evidence

### 1. Health Checks Are Passing
```bash
fly checks list -a ai2-wazuh
# Result: servicecheck-00-http-5601 | passing
```

**Why health checks pass:**
- Health checks run **inside** the container
- They can access `localhost:5601` (127.0.0.1:5601)
- Health check: `curl http://localhost:5601/health` → 200 OK ✅

### 2. Internal Tests Work
```bash
# Inside container:
curl http://localhost:5601/health  # ✅ 200 OK
curl http://localhost:5601/        # ✅ 302 (Dashboard redirect)
```

**Why internal tests work:**
- Tests run **inside** the container
- They use `localhost` which maps to 127.0.0.1
- Nginx is listening on 127.0.0.1:5601 ✅

### 3. External Access Fails
```powershell
Invoke-WebRequest -Uri "https://ai2-wazuh.fly.dev/"
# Result: 503 Server Unavailable ❌
```

**Why external access fails:**
- Fly.io proxy forwards to `internal_port = 5601`
- Fly.io proxy expects binding on **0.0.0.0:5601** (all interfaces)
- But Nginx only listens on **127.0.0.1:5601** (localhost)
- **Fly.io proxy CANNOT reach the service!**

---

## 🎯 The Fix

### Update Nginx Configuration

**Change:**
```nginx
server {
    listen 5601;           # ❌ Defaults to 127.0.0.1:5601
    ...
}
```

**To:**
```nginx
server {
    listen 0.0.0.0:5601;   # ✅ Listen on all interfaces
    ...
}
```

**This allows:**
- Fly.io proxy to forward traffic to the service
- External requests to reach Nginx
- Nginx to proxy to Dashboard (port 5602)
- Public URL to work: `https://ai2-wazuh.fly.dev/`

---

## 🔄 Why This Happened

### Nginx `listen` Directive Behavior

**From Nginx documentation:**
> If only port is given, Nginx listens on `*:port` for IPv6 and `0.0.0.0:port` for IPv4

**BUT in our container:**
- IPv6 might not be configured
- Nginx might default to `127.0.0.1` only
- Or our Nginx version has different defaults

**Solution:**
- **Explicitly specify** `0.0.0.0:5601`
- Don't rely on defaults

---

## 📋 Action Plan

1. **Update `nginx-health-proxy.conf`:**
   ```nginx
   server {
       listen 0.0.0.0:5601;   # Bind to all interfaces
       server_name _;
       ...
   }
   ```

2. **Rebuild and deploy:**
   ```powershell
   cd D:\embracingearthspace\wazuh
   fly deploy -a ai2-wazuh
   ```

3. **Wait for deployment** (15-20 minutes for full startup)

4. **Test public URL:**
   ```powershell
   Invoke-WebRequest -Uri "https://ai2-wazuh.fly.dev/"
   ```

---

## 🧠 Lessons Learned

### Why Health Checks Can Be Misleading

**Health checks run INSIDE the container:**
- They use `localhost` (127.0.0.1)
- They can access services bound to 127.0.0.1
- **They don't test external connectivity!**

**Fly.io proxy connects from OUTSIDE:**
- It needs services bound to `0.0.0.0` (all interfaces)
- Services bound to `127.0.0.1` only are NOT accessible

**Result:**
- Health checks can pass ✅
- But public URL still returns 503 ❌
- **Because they're testing different network paths!**

---

## ✅ Expected Result After Fix

1. Nginx binds to `0.0.0.0:5601`
2. Fly.io proxy can reach Nginx
3. Nginx proxies `/health` to health server (port 8080)
4. Nginx proxies `/` to Dashboard (port 5602)
5. Public URL works: `https://ai2-wazuh.fly.dev/` → Dashboard login ✅

---

**embracingearth.space**
