# 🔧 Wazuh API Configuration Fix

**Date:** 2025-01-26  
**Issue:** API configuration error - `host` must be a string, not a list

---

## 🚨 Problem

**Error:**
```
APIError: 2000 - ['0.0.0.0', '::'] is not of type 'string'.
```

**Root Cause:**
- Wazuh 4.8 API expects `host` to be a **string** (single value)
- Our config had `host` as a **list** (multiple values)
- This prevents the API from starting

---

## ✅ Fix Applied

**Before (WRONG):**
```yaml
host:
  - '0.0.0.0'
  - '::'
port: 55000
```

**After (CORRECT):**
```yaml
host: '0.0.0.0'
port: 55000
```

---

## 📋 Wazuh 4.8 API Configuration

According to [Wazuh 4.8 API Documentation](https://documentation.wazuh.com/4.8/user-manual/api/configuration.html):

- ✅ `host` must be a **string** (single IP address)
- ✅ Use `'0.0.0.0'` to bind to all interfaces
- ✅ IPv6 support is handled separately (not via list)

---

## 🚀 Ready to Deploy

The API configuration is now correct. Redeploy:

```bash
cd D:\embracingearthspace\wazuh
fly deploy -a ai2-wazuh
```

**Expected Result:**
- ✅ API starts successfully
- ✅ API binds to `0.0.0.0:55000`
- ✅ No configuration errors
- ✅ Health checks pass

---

**Fix Complete!** ✅
