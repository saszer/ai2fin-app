# 🔐 Wazuh API SSL Certificate Location Fix

**Date:** 2025-12-27  
**Issue:** API failing to start - SSL certificates in wrong location

---

## 🚨 **Root Cause**

**Error from logs:**
```
FileNotFoundError: [Errno 2] No such file or directory: '/var/ossec/api/configuration/ssl/sslmanager.key'
```

**Problem:**
- ✅ Wazuh Manager creates SSL certificates in `/var/ossec/etc/sslmanager.key`
- ❌ Wazuh API expects certificates in `/var/ossec/api/configuration/ssl/sslmanager.key`
- ❌ Certificates don't exist in API's expected location
- ❌ API can't start without certificates

---

## ✅ **Fix Applied**

**Updated `Dockerfile` to:**
1. Create the API SSL directory: `/var/ossec/api/configuration/ssl`
2. Add init script that copies certificates from Manager location to API location
3. Script runs after Wazuh Manager initialization (when certificates are generated)

**The script:**
- Waits for Manager to generate certificates
- Copies `sslmanager.key` and `sslmanager.cert` to API location
- Sets correct permissions (wazuh:wazuh, 600 for key, 644 for cert)

---

## 📋 **How It Works**

1. **Wazuh Manager initializes:**
   - Creates certificates in `/var/ossec/etc/sslmanager.*`

2. **Init script runs (07-copy-api-certs.sh):**
   - Checks if Manager certificates exist
   - Copies them to `/var/ossec/api/configuration/ssl/`
   - Sets permissions

3. **Wazuh API starts:**
   - Finds certificates in expected location
   - Starts successfully

---

## 🚀 **Next Steps**

1. **Deploy the fix:**
   ```bash
   cd D:\embracingearthspace\wazuh
   fly deploy -a ai2-wazuh
   ```

2. **Verify certificates are copied:**
   ```bash
   fly ssh console -a ai2-wazuh -C "ls -la /var/ossec/api/configuration/ssl/"
   ```

3. **Check API starts:**
   ```bash
   fly logs -a ai2-wazuh | Select-String -Pattern "wazuh-apid|API|listening|55000"
   ```

---

## 📚 **Reference**

- Wazuh Manager creates certificates: `/var/ossec/etc/sslmanager.*`
- Wazuh API expects certificates: `/var/ossec/api/configuration/ssl/sslmanager.*`
- The init script bridges this gap by copying certificates after Manager initialization

---

**Fix complete!** ✅ The API should now start correctly with certificates in the right location.

