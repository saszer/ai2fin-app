# 🔍 Wazuh API Endpoint Issue - Nothing at Root URL

**Date:** 2025-12-27  
**Issue:** `https://ai2-wazuh.fly.dev/` shows nothing

---

## 🚨 **Root Cause Analysis**

**Problem:**
- User accessing `https://ai2-wazuh.fly.dev/` (root path)
- Nothing is returned
- API says "Listening on 0.0.0.0:55000" but port check fails

**Possible Causes:**

1. **API Not Actually Listening**
   - API process exists but crashes after saying "listening"
   - Port binding fails silently
   - SSL certificate issue prevents HTTPS binding

2. **Wrong Endpoint**
   - Wazuh API might not respond on root path `/`
   - May need specific endpoint like `/api` or `/status`
   - API might require authentication even for root

3. **Port Check Timing**
   - Port check happens too early
   - API needs more time to fully bind
   - Network stack not ready yet

---

## 🔍 **Diagnosis Steps**

### **Step 1: Verify API is Actually Running**

```bash
fly ssh console -a ai2-wazuh -C "pgrep -a wazuh-apid"
```

**Expected:** Should show API process with PID

### **Step 2: Check if Port is Actually Listening**

```bash
fly ssh console -a ai2-wazuh -C "netstat -tuln | grep 55000"
# Or if netstat not available:
fly ssh console -a ai2-wazuh -C "lsof -i :55000"
```

**Expected:** Should show `LISTEN` on `0.0.0.0:55000`

### **Step 3: Test API Directly (from inside container)**

```bash
fly ssh console -a ai2-wazuh -C "curl -k https://localhost:55000/"
```

**Expected:** Should return API response (may require auth)

### **Step 4: Check API Error Logs**

```bash
fly ssh console -a ai2-wazuh -C "tail -100 /var/ossec/logs/api/api.log"
```

**Look for:**
- Binding errors
- SSL certificate errors
- Permission errors
- Crash/exit messages

---

## 📋 **Wazuh API Endpoints**

**Common Wazuh API Endpoints:**
- `/` - Root (may require auth or return 404)
- `/status` - API status
- `/agents` - List agents
- `/manager/status` - Manager status
- `/security/user/authenticate` - Authentication

**Default Behavior:**
- Wazuh API root path (`/`) may return 404 or require authentication
- Try `/status` or `/manager/status` instead

---

## ✅ **Quick Test**

**Try these URLs:**
1. `https://ai2-wazuh.fly.dev/status`
2. `https://ai2-wazuh.fly.dev/manager/status`
3. `https://ai2-wazuh.fly.dev/agents`

**Or with authentication:**
```bash
curl -k -u wazuh:YOUR_PASSWORD https://ai2-wazuh.fly.dev/status
```

---

## 🎯 **Most Likely Issue**

**The API is saying "Listening" but crashing immediately after**, or **the port check is happening before the API fully binds**.

**Check API logs for the actual error** - that will tell us why it's not binding.

---

**Next step: Check API error logs to see why port binding fails!**

