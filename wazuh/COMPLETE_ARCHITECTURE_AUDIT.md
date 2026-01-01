# 🚨 COMPLETE ARCHITECTURE AUDIT - Wazuh on Fly.io

**Date:** 2026-01-01  
**Status:** CRITICAL ROUTING ISSUE - NOT RESOLVED  
**Public URL:** ❌ INACCESSIBLE (timeout)

---

## 📊 Current Status Summary

### ✅ What's Working
1. **Health Check Server:** Running, returns 200 OK ✅
2. **Dashboard:** Running on port 5602, returns HTTP 302 ✅
3. **Indexer:** Running, responding ✅
4. **Internal Connectivity:** All services communicate internally ✅
5. **Fly.io Health Checks:** PASSING (1/1) ✅
6. **Nginx Configuration:** Correct syntax, `listen 0.0.0.0:5601` ✅
7. **Nginx Process:** Running (PIDs 794, 805) ✅

### ❌ What's NOT Working
1. **Public URL:** `https://ai2-wazuh.fly.dev/` - TIMEOUT ❌
2. **Fly.io Warning:** "The app is not listening on... 0.0.0.0:5601" ❌
3. **External Access:** Cannot reach application from outside ❌

---

## 🔍 Root Cause Analysis

### The Core Issue

**Fly.io's deployment warning clearly states:**
```
WARNING The app is not listening on the expected address and will not be reachable by fly-proxy.
You can fix this by configuring your app to listen on the following addresses:
  - 0.0.0.0:5601
Found these processes inside the machine with open listening sockets:
  PROCESS        | ADDRESSES                              
-----------------*----------------------------------------
  /.fly/hallpass | [fdaa:26:130f:a7b:2d8:bafd:52cb:2]:22  
```

**Translation:**
- Fly.io scanned the machine during deployment
- Found NO process listening on `0.0.0.0:5601`
- Only found `hallpass` (Fly.io's internal SSH proxy) listening on IPv6

**But we verified:**
- Nginx config: `listen 0.0.0.0:5601` ✅
- Nginx running: PIDs 794, 805 ✅
- Config test passes ✅
- Internal health check works ✅

---

## 🧩 The Missing Piece

### Theory: Timing Issue

**Fly.io checks during deployment smoke test:**
1. Machine starts
2. Fly.io waits a few seconds
3. **Fly.io scans for listening sockets** ← This is when the warning appears
4. Services continue starting (supervisord starts Nginx)
5. Nginx starts later (after Fly.io's scan)

**Evidence:**
- The warning appears during "Running smoke checks"
- But later, Nginx IS running (verified via SSH)
- Health checks pass (meaning Nginx is working)

### Theory: Supervisord Startup Order

**Supervisord configuration (`priority` values):**
- Health check server: `priority=50`
- Nginx: `priority=40`
- Wazuh Dashboard: `priority=70` (started by wait script)
- Indexer: `priority=60`

**Higher priority = starts LATER**

So Nginx (priority 40) should start BEFORE health server (priority 50).

But supervisor might have delays in starting processes.

---

## 🎯 Hypothesis: Why Fly.io Can't Route Traffic

### Possibility 1: Nginx Binding Issue

**Nginx might be binding to IPv4 incorrectly:**
- `listen 0.0.0.0:5601` should bind to all IPv4 interfaces
- But Nginx might be binding to something else
- Or binding AFTER Fly.io's initial scan

### Possibility 2: Fly.io Expects Socket Before Deployment Completes

**Fly.io's routing proxy:**
1. Checks during deployment if app is listening
2. If NO socket found → marks as "not reachable"
3. Even if socket appears later, routing might not update
4. **Requires machine restart to re-scan**

### Possibility 3: Missing Port Configuration

**Fly.io might need additional configuration:**
- The `[[services.ports]]` section defines external ports (80, 443)
- The `internal_port = 5601` defines where Fly.io forwards traffic
- But maybe Fly.io needs explicit binding confirmation

---

## 📋 What We've Tried

### Fix 1: Nginx Binding (DONE)
- Changed `listen 5601` → `listen 0.0.0.0:5601`
- **Result:** Config updated ✅, but still not accessible ❌

### Fix 2: Health Check Server Indentation Bug (DONE)
- Fixed Python variable scope error
- **Result:** Health server works ✅, but URL still timeout ❌

### Fix 3: Increased Startup Phase (DONE  
- Changed from 5 min → 20 min startup phase
- **Result:** Health checks pass ✅, but URL still timeout ❌

---

## 🔧 Remaining Solutions to Try

### Solution A: Force Nginx to Start Earlier

**Approach:** Use a wrapper script that starts Nginx BEFORE supervisord

**Implementation:**
1. Create `/start-nginx-first.sh`:
   ```bash
   #!/bin/bash
   # Start Nginx immediately
   nginx
   # Then run normal startup
   exec /start.sh
   ```
2. Update Dockerfile `CMD` to use this script
3. This ensures Nginx is running during Fly.io's smoke test

**Pros:**
- Nginx will be running when Fly.io scans
- Simple change

**Cons:**
- Nginx starts before other init scripts
- Might fail if config not ready

---

### Solution B: Remove Nginx Proxy Layer Entirely

**Approach:** Eliminate the Nginx complexity

**Current Architecture:**
```
Fly.io:5601 → Nginx:5601 → /health → Health Server:8080
                           → /      → Dashboard:5602
```

**New Architecture:**
```
Fly.io:5601 → Dashboard:5601 (directly)
```

**Changes Required:**
1. Configure Dashboard to listen on `5601` instead of `5602`
2. Remove Nginx entirely
3. Update health check to point directly to Dashboard
4. Accept that health checks will fail during startup (15-17 min)

**Pros:**
- Simpler architecture
- No Nginx binding issues
- Dashboard definitely binds to 0.0.0.0

**Cons:**
- Health checks will fail during startup
- Fly.io might mark deployment as failed
- No custom health check server

---

### Solution C: Use Fly.io's Native Health Check Delay

**Approach:** Configure Fly.io to wait longer before checking

**Current:**
```toml
[[services.http_checks]]
  grace_period = "1m"  # Max allowed
```

**Try:**
- Use TCP check instead of HTTP check
- TCP checks are more lenient
- Or remove health checks entirely (rely on process running)

**Changes:**
```toml
[[services]]
  internal_port = 5601
  # Remove http_checks
  # Rely on process health only
```

**Pros:**
- Might allow deployment to complete
- Simpler health check logic

**Cons:**
- No health verification
- Fly.io might still not route traffic

---

### Solution D: Start Nginx as Foreground Process

**Approach:** Don't use supervisord for Nginx

**Current:** Supervisord manages Nginx
**New:** Start Nginx in background, then start supervisord

**Implementation:**
```bash
#!/bin/bash
# Start Nginx in background
nginx &
# Start supervisord (which will manage other services)
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
```

**Pros:**
- Nginx starts immediately
- Independent of supervisord delays

**Cons:**
- Nginx not managed by supervisord
- No auto-restart if Nginx crashes

---

### Solution E: Use Fly.io's  `auto_start_machines` Logic

**Approach:** Let Fly.io handle startup delays

**Current:**
```toml
auto_stop_machines = "off"
auto_start_machines = true
min_machines_running = 0
```

**Try:**
```toml
auto_stop_machines = "off"
auto_start_machines = true
min_machines_running = 1  # Force 1 machine always running
```

**Pros:**
- Ensures machine is always available
- Fly.io won't stop/start frequently

**Cons:**
- Costs more (machine always running)
- Doesn't fix binding issue

---

## 🎬 Recommended Next Steps

### Priority 1: Verify Actual Binding (DIAGNOSTIC)

**Execute inside container:**
```bash
# Check actual socket bindings
cat /proc/net/tcp | grep "15E9"  # Port 5601 in hex
# Should show: 00000000:15E9 (0.0.0.0:5601)
# NOT: 0100007F:15E9 (127.0.0.1:5601)
```

**If shows 127.0.0.1:** Nginx is binding to localhost despite config
**If shows 00000000:** Nginx is binding correctly, but Fly.io can't reach it

---

### Priority 2: Try Solution B (Remove Nginx)

**This is the most direct fix:**
1. Remove Nginx from architecture
2. Configure Dashboard to listen on port 5601
3. Accept health check failures during startup
4. Test if public URL becomes accessible

**If this works:** We know Nginx was the issue
**If this doesn't work:** The problem is deeper (Fly.io routing/firewall)

---

### Priority 3: Contact Fly.io Support

**If removing Nginx doesn't work:**
- The issue might be with Fly.io's platform
- Provide them with:
  - App name: `ai2-wazuh`
  - Machine ID: `68303ddbed3918`
  - Deployment warning log
  - Evidence that service IS listening (health checks pass)
  - Evidence that public URL is not accessible

---

## ✅ Summary

**What We Know:**
1. Nginx config is correct (`listen 0.0.0.0:5601`) ✅
2. Nginx is running ✅
3. Internal connectivity works ✅
4. Health checks pass ✅
5. Fly.io says "not listening on 0.0.0.0:5601" ❌
6. Public URL times out ❌

**Most Likely Cause:**
- Nginx starts AFTER Fly.io's initial socket scan
- Fly.io marks app as "not reachable"
- Routing never activates, even when Nginx is later running

**Best Solution:**
- **Remove Nginx proxy entirely**
- Configure Dashboard to listen directly on port 5601
- Accept longer deployment time (health checks will fail initially)
- Test if direct binding resolves Fly.io routing issue

---

**embracingearth.space**
