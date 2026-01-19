# 🔧 Wazuh Indexer Temp Directory Fix

**Date:** 2025-12-28  
**Root Cause:** Fly.io volume mounts don't support user switching (`sudo -u`)

---

## 🚨 The Problem

**Why it fails:**
- Directory has `777` permissions ✅
- Owned by `wazuh-indexer:wazuh-indexer` ✅
- But `sudo -u wazuh-indexer test -w` still fails ❌

**Root Cause:**
- **Fly.io volume mounts don't support user switching**
- Volume filesystem restrictions prevent `sudo -u` from working
- Even with correct permissions, user switching fails on volumes

---

## ✅ Solution

**Use `/tmp` instead of volume for temp directory:**
- `/tmp` is on root filesystem (not volume)
- Supports user switching properly
- Has enough space for indexer operations
- Standard location for temp files

**Changed:**
- `INDEXER_TMP="/var/ossec/data/wazuh-indexer-tmp"` ❌ (on volume)
- `INDEXER_TMP="/tmp/wazuh-indexer-tmp"` ✅ (not on volume)

---

## 📋 Files Updated

1. ✅ `cont-init.d/07-fix-indexer-permissions.sh`
   - Changed temp directory to `/tmp/wazuh-indexer-tmp`
   - Should now support user switching

**Note:** If indexer service script also sets temp directory, it may need updating too.

---

## 🚀 Next Deployment

```bash
flyctl deploy -a ai2-wazuh
```

**Expected:**
- ✅ Temp directory created in `/tmp`
- ✅ `sudo -u wazuh-indexer test -w` succeeds
- ✅ Indexer can write to temp directory
- ✅ Indexer starts successfully

---

## ⚠️ If Still Failing

If indexer service script also configures temp directory, we may need to:

1. **Update service script** to use `/tmp`
2. **Set environment variable** `TMPDIR=/tmp/wazuh-indexer-tmp`
3. **Update JVM options** if they specify temp directory

---

**embracingearth.space**









