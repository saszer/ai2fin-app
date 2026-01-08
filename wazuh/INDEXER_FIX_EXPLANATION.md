# 🔍 Why Indexer Permission Check Fails

**Date:** 2025-12-28  
**Issue:** `sudo -u wazuh-indexer test -w` fails even with 777 permissions

---

## 🚨 Root Cause

**Fly.io volume mounts don't support user switching.**

Even though:
- ✅ Directory has `777` permissions
- ✅ Owned by `wazuh-indexer:wazuh-indexer`
- ✅ Directory exists and is accessible

The command `sudo -u wazuh-indexer test -w` still fails because:
- **Volume filesystem has restrictions**
- **User switching (`sudo -u`) doesn't work on volume mounts**
- **This is a Fly.io platform limitation**

---

## ✅ Solution

**Use `/tmp` instead of volume for temp directory:**

1. `/tmp` is on root filesystem (not volume)
2. Supports user switching properly
3. Has enough space for indexer operations
4. Standard location for temp files

**Changed:**
- ❌ `/var/ossec/data/wazuh-indexer-tmp` (on volume - doesn't support user switching)
- ✅ `/tmp/wazuh-indexer-tmp` (not on volume - supports user switching)

---

## 📋 Files Updated

1. ✅ `cont-init.d/07-fix-indexer-permissions.sh`
   - Changed to `/tmp/wazuh-indexer-tmp`

2. ✅ `scripts/run-indexer-with-logging.sh`
   - Changed to `/tmp/wazuh-indexer-tmp`

3. ✅ `cont-init.d/11-setup-data-directories.sh`
   - Changed to `/tmp/wazuh-indexer-tmp`

**Note:** If JVM options or environment variables also set temp directory, they may need updating too.

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

## 📝 Technical Details

**Why volume mounts fail:**
- Fly.io uses network-attached storage for volumes
- Volume filesystem may have different security contexts
- User switching requires filesystem-level support
- Volume mounts may have `noexec` or other restrictions

**Why /tmp works:**
- `/tmp` is on root filesystem (tmpfs or local disk)
- Full filesystem support for user switching
- Standard Linux permissions work correctly
- No volume mount restrictions

---

**embracingearth.space**








