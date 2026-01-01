# 🚀 Deployment Fix Instructions

**Issue:** Nginx listening on `127.0.0.1:5601` instead of `0.0.0.0:5601`  
**Fix:** Updated Nginx to bind to all interfaces  
**Status:** Ready to deploy

---

## 🔧 Changes Made

### File: `wazuh/scripts/nginx-health-proxy.conf`

**Before:**
```nginx
server {
    listen 5601;           # Defaults to 127.0.0.1:5601
    ...
}
```

**After:**
```nginx
server {
    listen 0.0.0.0:5601;   # Explicitly bind to all interfaces
    ...
}
```

---

## 📋 Deployment Steps

### 1. Deploy Updated Configuration

```powershell
cd D:\embracingearthspace\wazuh
fly deploy -a ai2-wazuh
```

**Expected:** 
- Build new image with updated Nginx config
- Deploy to Fly.io
- Machine will restart

---

### 2. Wait for Services to Start

**Timeline:**
- Deployment: ~3-5 minutes
- Indexer startup: ~10-15 minutes
- Dashboard startup: ~1-2 minutes after Indexer
- **Total wait time: ~15-20 minutes**

**Monitor progress:**
```powershell
# Watch logs
fly logs -a ai2-wazuh

# Check health checks
fly checks list -a ai2-wazuh

# Check machine status
fly status -a ai2-wazuh
```

---

### 3. Verify Health Checks

```powershell
fly checks list -a ai2-wazuh
```

**Expected output:**
```
Health Checks for ai2-wazuh
  NAME                      | STATUS  | MACHINE        | LAST UPDATED
----------------------------*---------*----------------*-------------------
  servicecheck-00-http-5601 | passing | 68303ddbed3918 | [timestamp]
```

---

### 4. Test Public URL

```powershell
# Test from PowerShell
Invoke-WebRequest -Uri "https://ai2-wazuh.fly.dev/" -Method GET -UseBasicParsing

# Or open in browser
Start-Process "https://ai2-wazuh.fly.dev/"
```

**Expected:**
- ✅ HTTP 302 redirect to login page
- ✅ Dashboard login page loads
- ❌ NO MORE 503 errors!

---

### 5. Login to Dashboard

**URL:** `https://ai2-wazuh.fly.dev/`

**Credentials:**
- Username: `admin`
- Password: `SecureAdmin123!` (or whatever you set via `fly secrets`)

---

## 🧪 Verification Commands

### Inside Container (SSH)

```powershell
fly ssh console -a ai2-wazuh

# Check Nginx binding
ss -tulnp | grep :5601
# Expected: tcp   LISTEN 0.0.0.0:5601 (not 127.0.0.1:5601)

# Check health endpoint
curl http://localhost:5601/health
# Expected: {"status": "healthy", ...}

# Check Dashboard via Nginx
curl -I http://localhost:5601/
# Expected: HTTP/1.1 302 Found
```

### From Outside

```powershell
# Test HTTPS
Invoke-WebRequest -Uri "https://ai2-wazuh.fly.dev/" -Method GET

# Test HTTP (should redirect to HTTPS)
Invoke-WebRequest -Uri "http://ai2-wazuh.fly.dev/" -Method GET
```

---

## ⏱️ Estimated Timeline

| Phase                | Duration    | Status           |
|----------------------|-------------|------------------|
| Build & Deploy       | 3-5 min     | Automated        |
| Indexer Startup      | 10-15 min   | Automated        |
| Dashboard Startup    | 1-2 min     | Automated        |
| Health Check Stable  | 1-2 min     | Automated        |
| **Total**            | **15-20 min** | **Wait required** |

---

## 🚨 Troubleshooting

### If health checks fail:

```powershell
# Check logs for errors
fly logs -a ai2-wazuh | Select-String -Pattern "error|ERROR|fail|FAIL"

# Check Nginx status
fly ssh console -a ai2-wazuh -C "supervisorctl status nginx-proxy"

# Check port binding
fly ssh console -a ai2-wazuh -C "ss -tulnp | grep :5601"
```

### If public URL still returns 503:

```powershell
# Verify IP allocation
fly ips list -a ai2-wazuh

# Force routing refresh
fly machine restart -a ai2-wazuh 68303ddbed3918

# Wait 5 minutes and test again
Start-Sleep -Seconds 300
Invoke-WebRequest -Uri "https://ai2-wazuh.fly.dev/" -Method GET
```

---

## ✅ Success Criteria

1. ✅ Nginx listening on `0.0.0.0:5601` (not `127.0.0.1:5601`)
2. ✅ Health checks passing
3. ✅ Public URL returns HTTP 302 (redirect to login)
4. ✅ Dashboard login page loads in browser
5. ✅ Can login with admin credentials

---

**embracingearth.space**
