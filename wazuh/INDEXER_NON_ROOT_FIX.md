# 🔧 Indexer Non-Root Fix (Final Solution)

**Date:** 2025-12-29  
**Issue:** OpenSearch refuses to run as root + Fly.io volume mount restrictions

---

## 🚨 The Problem

**Error:**
```
java.lang.RuntimeException: can not run opensearch as root
```

**Root Cause:**
1. **OpenSearch security feature** - Explicitly prevents running as root
2. **Fly.io volume mounts** - Don't support user switching (`sudo -u` fails)
3. **Catch-22:** Can't run as root, but can't access volume as wazuh-indexer

---

## ✅ Solution

**Use non-volume location for data directory:**

- **Data directory:** `/var/lib/wazuh-indexer/data` (not on volume)
- **Temp directory:** `/tmp/wazuh-indexer-tmp` (not on volume)
- **Run as:** `wazuh-indexer` user (required by OpenSearch)

**Trade-off:**
- ✅ Indexer can start and run
- ✅ No permission issues
- ❌ Data NOT persistent (lost on container restart)

**For production persistence:**
- Use external backup/restore
- Use snapshot/restore API
- Consider different storage solution

---

## 📋 Files Updated

1. ✅ `scripts/run-indexer-with-logging.sh`
   - Changed to use `/var/lib/wazuh-indexer/data`
   - Updates `opensearch.yml` at runtime if needed

2. ✅ `indexer/opensearch.yml`
   - Changed `path.data` to `/var/lib/wazuh-indexer/data`

---

## 🚀 Next Deployment

```bash
flyctl deploy -a ai2-wazuh
```

**Expected:**
- ✅ Indexer runs as wazuh-indexer user
- ✅ Can access data directory (not on volume)
- ✅ Indexer starts successfully
- ⚠️ Data not persistent (will be lost on restart)

---

## 📝 Technical Details

**Why this works:**
- `/var/lib/wazuh-indexer/data` is on root filesystem (not volume)
- Supports user switching properly
- wazuh-indexer user can access it
- OpenSearch can run as wazuh-indexer

**Why volume doesn't work:**
- Fly.io volumes use network-attached storage
- Volume filesystem has restrictions
- User switching (`sudo -u`) doesn't work on volumes
- Even with 777 permissions, access fails

**Data persistence options:**
1. **Snapshot/Restore API** - Use OpenSearch snapshot API to backup/restore
2. **External backup** - Periodic backups to external storage
3. **Different storage** - Use Fly.io volumes differently or external storage

---

**embracingearth.space**

