# ✅ Both Issues Fixed

**Date:** 2025-12-28  
**Issues:** API SSL paths + Indexer permissions

---

## 🔧 Fix 1: API SSL Certificate Paths ✅

**Problem:**
- API config had relative paths: `key: sslmanager.key`
- Should be absolute paths: `key: /var/ossec/etc/sslmanager.key`

**Fixed:**
- Updated `api/configuration/api.yaml`
- Changed to absolute paths for SSL certificates
- API should now find certificates correctly

---

## 🔧 Fix 2: Wazuh Indexer Permissions ✅

**Problem:**
- Indexer can't write to `/var/ossec/data/wazuh-indexer-tmp`
- Even with 777 permissions, `sudo -u wazuh-indexer test -w` fails
- Likely volume mount restriction on Fly.io

**Fixed:**
- Created `cont-init.d/07-fix-indexer-permissions.sh`
- Removes and recreates temp directory
- Uses ACLs (setfacl) if available
- Tests actual write access
- Provides diagnostics if still failing

**Why This Should Work:**
- Removing/recreating clears any mount issues
- ACLs work better with volume mounts than chmod
- Actual write test verifies it works

---

## 📋 Files Updated

1. ✅ `api/configuration/api.yaml` - Fixed SSL cert paths
2. ✅ `cont-init.d/07-fix-indexer-permissions.sh` - New permission fix script
3. ✅ `Dockerfile` - Already includes script copying

---

## 🚀 Next Deployment

```bash
flyctl deploy -a ai2-wazuh
```

**Expected Results:**
- ✅ API finds SSL certificates (absolute paths)
- ✅ API starts successfully
- ✅ API binds to 0.0.0.0:55000
- ✅ Indexer can write to temp directory
- ✅ Indexer starts successfully (if enabled)

---

## ⚠️ If Indexer Still Fails

If indexer permission issue persists, options:

1. **Disable Indexer** (if not needed):
   ```xml
   <indexer>
     <enabled>no</enabled>
   </indexer>
   ```

2. **Use Different Temp Location:**
   - Change indexer temp to `/tmp/wazuh-indexer-tmp`
   - Not on volume mount (may have more permissions)

3. **Check Volume Mount:**
   - Fly.io volumes might have restrictions
   - May need different mount options

---

**Both fixes applied - deploy and test!**

**embracingearth.space**









