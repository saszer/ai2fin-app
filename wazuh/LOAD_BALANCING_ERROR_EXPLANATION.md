# 🔍 Fly.io Load Balancing Error Explanation

**Date:** 2025-12-27  
**Error:** `[PR03] could not find a good candidate within 40 attempts at load balancing`

---

## 🚨 **What This Error Means**

**NOT a performance/heavy load issue!**

The error means:
- ❌ **Fly.io's load balancer can't find any healthy instances**
- ❌ **No instances are listening on the expected port (55000)**
- ❌ **Fly.io thinks your app is "down" or not responding**

**This is a symptom, not the root cause.**

---

## 🔍 **Root Cause**

**The API isn't binding to port 55000**, so:

1. **Fly.io tries to route traffic** → Looks for instances listening on port 55000
2. **Finds no healthy instances** → API process exists but port isn't listening
3. **Load balancer gives up** → After 40 attempts, reports error
4. **Your app appears "down"** → Even though the container is running

---

## 📊 **Why This Happens**

**The API process is detected but port never binds because:**

1. **SSL certificates missing** → API can't start HTTPS without certificates
2. **Database permissions** → API can't write to its database
3. **Configuration errors** → API fails to start due to invalid config
4. **Service startup failure** → API crashes during initialization

**From your logs:**
- ✅ API process detected (process exists)
- ❌ Port 55000 never becomes ready (not listening)
- ❌ Load balancer can't route traffic

---

## ✅ **How to Fix**

**The fixes we applied should resolve this:**

1. **Certificate copy script** → Ensures SSL certs are in the right place
2. **Database permissions** → Allows API to write to its database
3. **Configuration fixes** → Valid API config format

**Once the API starts and binds to port 55000:**
- ✅ Fly.io load balancer will find healthy instances
- ✅ Traffic will route correctly
- ✅ Error will disappear

---

## 🔄 **What Happens During Deployment**

1. **Container starts** → Fly.io starts your machine
2. **Init scripts run** → Copy certificates, fix permissions
3. **Wazuh services start** → Manager, API, etc.
4. **API should bind** → Listens on `0.0.0.0:55000`
5. **Fly.io health check** → Checks if port is listening
6. **Load balancer routes** → If healthy, traffic flows

**Currently stuck at step 4** → API isn't binding, so health check fails

---

## 📋 **Check Current Status**

**After deploying the fixes, check:**

1. **Are certificates copied?**
   ```bash
   fly ssh console -a ai2-wazuh -C "ls -la /var/ossec/api/configuration/ssl/"
   ```

2. **Is API running?**
   ```bash
   fly ssh console -a ai2-wazuh -C "/var/ossec/bin/wazuh-control status | grep apid"
   ```

3. **Is port listening?**
   ```bash
   fly ssh console -a ai2-wazuh -C "netstat -tuln | grep 55000"
   ```

4. **Check API logs:**
   ```bash
   fly ssh console -a ai2-wazuh -C "tail -50 /var/ossec/logs/api/api.log"
   ```

---

## 🎯 **Summary**

**The load balancing error is NOT because:**
- ❌ Your app is too heavy
- ❌ You need more resources
- ❌ Fly.io is overloaded

**The load balancing error IS because:**
- ✅ API isn't starting/binding to port 55000
- ✅ Fly.io can't find any healthy instances
- ✅ Load balancer has nothing to route to

**Once the API starts correctly, the error will disappear automatically.**

---

**The fixes we applied (certificate script + database permissions) should resolve this!** ✅

