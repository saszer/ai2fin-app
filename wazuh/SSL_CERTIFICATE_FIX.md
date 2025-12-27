# 🔐 Wazuh API SSL Certificate Issue

**Date:** 2025-12-27  
**Issue:** Wazuh API not starting - SSL certificates missing

---

## 🚨 **Root Cause**

**Problem:**
- ✅ API configuration is correct (`host: '0.0.0.0'`, `port: 55000`, `https.enabled: yes`)
- ❌ **SSL certificates are missing** (`/var/ossec/etc/sslmanager.key` and `sslmanager.cert`)
- ❌ **Wazuh Manager not starting** (all services show "not running")
- ❌ **API can't start** without SSL certificates when HTTPS is enabled

**Error Chain:**
1. Wazuh Manager initialization creates SSL certificates
2. If Manager doesn't start, certificates aren't created
3. API tries to start but fails due to missing certificates
4. Port never binds

---

## ✅ **Solution Options**

### **Option 1: Let Wazuh Auto-Generate (Recommended)**

The Wazuh Docker image should auto-generate SSL certificates during initialization. The issue might be that:
- Wazuh Manager isn't starting properly
- Initialization is failing before certificates are created

**Check Wazuh Manager logs:**
```bash
fly ssh console -a ai2-wazuh -C "cat /var/ossec/logs/ossec.log | grep -i error | tail -20"
```

### **Option 2: Disable HTTPS Temporarily (Quick Fix)**

If certificates can't be generated, temporarily disable HTTPS to get API running:

**Update `api.yaml`:**
```yaml
https:
  enabled: no  # Temporarily disable to test
```

**Then re-enable HTTPS once certificates are generated.**

### **Option 3: Manually Generate Certificates**

If auto-generation fails, create certificates manually:

```bash
# SSH into container
fly ssh console -a ai2-wazuh

# Generate self-signed certificate
cd /var/ossec/etc
openssl req -x509 -newkey rsa:2048 -keyout sslmanager.key -out sslmanager.cert -days 365 -nodes -subj "/CN=wazuh-manager"

# Set correct permissions
chown wazuh:wazuh sslmanager.key sslmanager.cert
chmod 600 sslmanager.key
chmod 644 sslmanager.cert
```

---

## 🔍 **Diagnosis Steps**

1. **Check if Wazuh Manager is starting:**
   ```bash
   fly ssh console -a ai2-wazuh -C "/var/ossec/bin/wazuh-control start"
   fly ssh console -a ai2-wazuh -C "/var/ossec/bin/wazuh-control status"
   ```

2. **Check Wazuh logs for errors:**
   ```bash
   fly ssh console -a ai2-wazuh -C "tail -100 /var/ossec/logs/ossec.log"
   ```

3. **Check if certificates exist:**
   ```bash
   fly ssh console -a ai2-wazuh -C "ls -la /var/ossec/etc/sslmanager.*"
   ```

4. **Check API logs:**
   ```bash
   fly ssh console -a ai2-wazuh -C "ls -la /var/ossec/logs/api/"
   ```

---

## 🎯 **Most Likely Issue**

**Wazuh Manager initialization is failing**, which means:
- SSL certificates aren't being generated
- Services aren't starting
- API can't start without Manager running

**Check the Wazuh initialization logs** to see why Manager isn't starting.

---

## 📋 **Next Steps**

1. **Check Wazuh Manager startup:**
   - Look for errors in `/var/ossec/logs/ossec.log`
   - Check if initialization completes successfully

2. **If Manager starts but certificates missing:**
   - Manually generate certificates (Option 3)
   - Or disable HTTPS temporarily (Option 2)

3. **If Manager doesn't start:**
   - Fix the underlying issue preventing Manager from starting
   - Check configuration files for errors
   - Verify all required files are present

---

**The SSL certificate issue is a symptom - the root cause is likely Wazuh Manager not starting properly.**

