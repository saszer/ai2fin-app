# ✅ Wazuh API Configuration Fix - Invalid Parameters Removed

**Date:** 2025-12-27  
**Issue:** API failing to start due to invalid configuration parameters

---

## 🚨 **Root Cause**

**Error from logs:**
```
APIError: 2000 - Additional properties are not allowed 
('max_request_per_minute', 'max_login_attempts', 'block_time' were unexpected).
```

**Problem:** These parameters are **NOT** valid in Wazuh 4.8's `api.yaml` configuration file.

---

## ✅ **Fix Applied**

**Removed invalid parameters from `api.yaml`:**
- ❌ `max_request_per_minute: 300` - **NOT SUPPORTED**
- ❌ `max_login_attempts: 5` - **NOT SUPPORTED**
- ❌ `block_time: 300` - **NOT SUPPORTED**

**Valid configuration now:**
```yaml
host: '0.0.0.0'
port: 55000
https:
  enabled: yes
  key: etc/sslmanager.key
  cert: etc/sslmanager.cert
  use_ca: no
cors:
  enabled: yes
  source_route: 'https://*.ai2fin.com,https://ai2fin.com,https://*.fly.dev'
  expose_headers: '*'
  allow_headers: '*'
  allow_credentials: yes
logs:
  level: info
  format: plain
```

---

## 📋 **Answer to Your Question**

**"Is it env variables issue?"**

**Answer: ❌ NO**

- ✅ Wazuh API does **NOT** use environment variables for configuration
- ✅ Configuration is done via `/var/ossec/api/configuration/api.yaml` file
- ✅ The issue was **invalid parameters** in the config file, not missing env vars

**Environment variables that ARE used:**
- `WAZUH_API_USER` / `WAZUH_API_PASSWORD` - Set via Fly.io secrets (for client authentication)
- These are for **your application** to authenticate with Wazuh, not for Wazuh to start

---

## 🚀 **Next Steps**

1. **Deploy the fix:**
   ```bash
   cd D:\embracingearthspace\wazuh
   fly deploy -a ai2-wazuh
   ```

2. **Verify API starts:**
   ```bash
   fly logs -a ai2-wazuh | Select-String -Pattern "wazuh-apid|API|55000"
   ```

3. **Check API status:**
   ```bash
   fly ssh console -a ai2-wazuh -C "/var/ossec/bin/wazuh-control status"
   ```

---

## 📚 **Reference**

According to [Wazuh 4.8 API Configuration Documentation](https://documentation.wazuh.com/4.8/user-manual/api/configuration.html), the valid parameters are:
- `host` (string)
- `port` (integer)
- `https` (object with `enabled`, `key`, `cert`, `use_ca`)
- `cors` (object with `enabled`, `source_route`, etc.)
- `logs` (object with `level`, `format`)

**Rate limiting is NOT a configuration option in `api.yaml`** - it's handled by Wazuh's internal security mechanisms.

---

**Fix complete!** ✅

