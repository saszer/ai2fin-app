# ✅ Wazuh API SSL Certificate Path Fix

**Date:** 2025-12-27  
**Issue:** API failing to start - SSL certificate path format invalid

---

## 🚨 **Root Cause**

**Error from logs:**
```
APIError: 2000 - 'etc/sslmanager.key' does not match '^[\\w\\-.]+$'.
```

**Problem:**
- ❌ SSL certificate paths used `etc/sslmanager.key` (relative path with directory)
- ✅ Wazuh 4.8 expects **just the filename** (no directory prefix)
- ✅ Regex validation: `^[\\w\\-.]+$` only allows word characters, hyphens, and dots (no slashes)

---

## ✅ **Fix Applied**

**Changed in `api.yaml`:**

**Before (❌ Invalid):**
```yaml
https:
  enabled: yes
  key: etc/sslmanager.key      # ❌ Contains slash - invalid
  cert: etc/sslmanager.cert    # ❌ Contains slash - invalid
  use_ca: no
```

**After (✅ Valid):**
```yaml
https:
  enabled: yes
  key: sslmanager.key           # ✅ Just filename - valid
  cert: sslmanager.cert         # ✅ Just filename - valid
  use_ca: no
```

---

## 📋 **How Wazuh Resolves Certificate Paths**

According to [Wazuh 4.8 API Configuration Documentation](https://documentation.wazuh.com/4.8/user-manual/api/configuration.html):

- Certificate paths are **relative to `/var/ossec/etc/`**
- You specify **just the filename** (e.g., `sslmanager.key`)
- Wazuh automatically resolves to `/var/ossec/etc/sslmanager.key`

**Example:**
- Config: `key: sslmanager.key`
- Actual path: `/var/ossec/etc/sslmanager.key`

---

## 🚀 **Next Steps**

1. **Deploy the fix:**
   ```bash
   cd D:\embracingearthspace\wazuh
   fly deploy -a ai2-wazuh
   ```

2. **Verify API starts:**
   ```bash
   fly logs -a ai2-wazuh | Select-String -Pattern "wazuh-apid|API|55000|listening"
   ```

3. **Check API status:**
   ```bash
   fly ssh console -a ai2-wazuh -C "/var/ossec/bin/wazuh-control status"
   ```

---

## 📚 **Reference**

- [Wazuh 4.8 API Configuration](https://documentation.wazuh.com/4.8/user-manual/api/configuration.html)
- Certificate paths must match regex: `^[\\w\\-.]+$` (filename only, no slashes)

---

**Fix complete!** ✅ The API should now start correctly.

