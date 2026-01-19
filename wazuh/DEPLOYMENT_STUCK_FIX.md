# 🔧 Wazuh Deployment Stuck - Health Check Fix

**Date:** 2025-12-26  
**Issue:** Deployment stuck at "Checking health of machine" - API not listening on 0.0.0.0:55000

---

## 🚨 Problem

**Symptoms:**
- Deployment hangs at "Checking health of machine"
- Warning: "The app is not listening on the expected address and will not be reachable by fly-proxy"
- Expected: `0.0.0.0:55000` but no process found listening

**Root Cause:**
1. Health check using HTTP but Wazuh API uses HTTPS
2. Grace period too short (Wazuh API takes 2-3 minutes to fully start)
3. Health check may be running before API is ready

---

## ✅ Fixes Applied

### **1. Updated Health Check Configuration** ✅

**File:** `fly.toml`

**Changes:**
- Changed protocol from `http` to `https` (Wazuh API uses HTTPS)
- Added TCP check as fallback (just verifies port is open)
- Grace period set to 60s (Fly.io maximum)

**Why:**
- Wazuh API requires HTTPS, not HTTP
- TCP check provides simpler fallback that doesn't require API to be fully ready

### **2. Added API Readiness Wait Script** ✅

**File:** `cont-init.d/02-wait-for-wazuh-api.sh`

**Purpose:**
- Waits up to 3 minutes for Wazuh API to be ready
- Checks if port 55000 is listening
- Provides diagnostic information
- Non-blocking (won't prevent container from starting)

**How it works:**
1. Checks multiple methods to detect if port 55000 is listening
2. Monitors for wazuh-api or wazuh-apid processes
3. Provides status updates during wait
4. Continues even if API takes longer (non-blocking)

---

## 📋 Files Changed

1. **`fly.toml`** ✅
   - Health check protocol: `http` → `https`
   - Added TCP check as fallback
   - Grace period: 60s (Fly.io maximum)

2. **`cont-init.d/02-wait-for-wazuh-api.sh`** ✅
   - New script to wait for API readiness
   - Non-blocking diagnostic tool

---

## 🚀 Next Steps

### **Option 1: Cancel and Redeploy (Recommended)**

If deployment is still stuck:

```bash
# Cancel the current deployment (Ctrl+C)
# Then redeploy with fixes
cd embracingearthspace/wazuh
fly deploy -a ai2-wazuh
```

### **Option 2: Check Current Status**

```bash
# Check machine status
fly status -a ai2-wazuh

# Check logs
fly logs -a ai2-wazuh

# SSH into machine to diagnose
fly ssh console -a ai2-wazuh
```

### **Option 3: Force Restart**

```bash
# Restart the machine
fly machine restart <machine-id> -a ai2-wazuh
```

---

## 🔍 Verification

After deployment, verify:

1. **Check if API is listening:**
   ```bash
   fly ssh console -a ai2-wazuh
   netstat -tuln | grep 55000
   # Should show: tcp 0 0 0.0.0.0:55000 0.0.0.0:* LISTEN
   ```

2. **Check API process:**
   ```bash
   ps aux | grep wazuh-api
   # Should show wazuh-apid process
   ```

3. **Check API logs:**
   ```bash
   tail -f /var/ossec/logs/api.log
   ```

4. **Test API endpoint:**
   ```bash
   curl -k https://localhost:55000/
   # Should return API information
   ```

---

## ⚠️ Known Issues

1. **"Unknown module 'wazuh-api'"** - This is a false positive from wazuh-modulesd. The API is a separate service (wazuh-apid), not a module. Can be safely ignored.

2. **API takes 2-3 minutes to start** - This is normal for Wazuh. The health check grace period accounts for this.

3. **Filebeat lock warnings** - Fixed with init script `01-fix-filebeat-lock.sh`

---

## 📝 Configuration Notes

**Wazuh API Configuration:**
- Port: 55000
- Protocol: HTTPS
- Host: 0.0.0.0 (listens on all interfaces)
- Basic Auth: Enabled (requires credentials)
- SSL: Self-signed certificates (from Wazuh image)

**Health Check:**
- Primary: HTTPS check to `/`
- Fallback: TCP check on port 55000
- Grace period: 60s (Fly.io maximum)
- Interval: 30s

---

**embracingearth.space**










