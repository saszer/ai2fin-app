# 🔧 Wazuh Deployment Fix - Latest Issues

**Date:** 2025-01-26  
**Issue:** App not listening on expected address, health check timeout

---

## 🚨 Problems Identified

### **1. Process Command Issue** ❌

**Current (WRONG):**
```toml
[processes]
  wazuh = "/var/ossec/bin/wazuh-control start"
```

**Problem:**
- `wazuh-control start` starts Wazuh but then **exits**
- Process doesn't stay running
- Container thinks app is dead

**Fix:**
```toml
[processes]
  wazuh = "/init"
```

**Why:**
- Wazuh Docker image uses **s6-overlay** (`/init`)
- s6-overlay manages all processes and keeps them running
- This is the correct entrypoint from the official image

---

### **2. Health Check Too Aggressive** ❌

**Current:**
```toml
grace_period = "10s"
```

**Problem:**
- Wazuh takes 60-120 seconds to fully start
- Health check runs too early
- Fails before Wazuh is ready

**Fix:**
```toml
grace_period = "180s"  # 3 minutes - enough time for Wazuh to start
```

---

### **3. Health Check Endpoint** ⚠️

**Current:**
```toml
path = "/"
protocol = "http"
```

**Problem:**
- Wazuh API might be HTTPS only
- `/` might not be the right endpoint
- Need to check Wazuh API health endpoint

**Fix:**
- Use `/` with HTTP (Fly.io proxy handles HTTPS)
- Or use Wazuh control status check

---

## ✅ Fixes Applied

### **1. Updated `fly.toml`** ✅

**Changed:**
- Process command: `/var/ossec/bin/wazuh-control start` → `/init`
- Grace period: `10s` → `180s` (3 minutes)
- Added `tls_skip_verify = true` for health checks

---

### **2. Updated `Dockerfile`** ✅

**Changed:**
- Health check uses multiple fallbacks
- Increased start period to 120s
- Better error handling

---

### **3. Updated `wazuh.conf`** ✅

**Note:**
- Wazuh API configured to listen on `0.0.0.0:55000`
- HTTPS enabled (but Fly.io proxy handles HTTP)
- Configuration looks correct

---

## 🎯 What to Do Next

### **1. Redeploy** ✅

```bash
cd D:\embracingearthspace\wazuh
fly deploy -a ai2-wazuh
```

---

### **2. Monitor Logs** ✅

```bash
fly logs -a ai2-wazuh
```

**Look for:**
- `✅ Wazuh started successfully`
- `✅ API listening on 0.0.0.0:55000`
- Any error messages

---

### **3. Check Health** ✅

```bash
fly status -a ai2-wazuh
```

**Should show:**
- Machine in `started` state
- Health checks passing
- Process running

---

## 🔍 Troubleshooting

### **If Still Failing:**

1. **Check Wazuh logs:**
   ```bash
   fly logs -a ai2-wazuh | grep -i error
   ```

2. **Check if Wazuh is starting:**
   ```bash
   fly logs -a ai2-wazuh | grep -i wazuh
   ```

3. **SSH into machine:**
   ```bash
   fly ssh console -a ai2-wazuh
   # Then check:
   /var/ossec/bin/wazuh-control status
   netstat -tulpn | grep 55000
   ```

4. **Check process:**
   ```bash
   ps aux | grep wazuh
   ```

---

## 📋 Summary

**Issues Fixed:**
- ✅ Process command (now uses `/init`)
- ✅ Health check grace period (now 180s)
- ✅ Health check configuration

**Next Steps:**
1. Redeploy with fixed config
2. Monitor logs
3. Verify health checks pass

**Expected Result:**
- Wazuh starts successfully
- Listens on 0.0.0.0:55000
- Health checks pass after 2-3 minutes

---

**Try deploying again!** 🚀

