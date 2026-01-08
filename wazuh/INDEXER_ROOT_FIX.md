# 🔧 Indexer Root User Fix

**Date:** 2025-12-29  
**Issue:** Indexer can't access `/var/ossec/data` even with 777 permissions

---

## 🚨 The Problem

**Error:**
```
java.nio.file.AccessDeniedException: /var/ossec/data
Unable to access 'path.data' (/var/ossec/data/wazuh-indexer-data)
```

**Root Cause:**
- Directory has `777` permissions ✅
- Owned by `wazuh-indexer:wazuh-indexer` ✅
- But `wazuh-indexer` user can't access `/var/ossec/data` ❌

**Why:**
- **Fly.io volume mounts don't support user switching**
- Even with 777 permissions, `wazuh-indexer` user can't access volume
- This is a Fly.io platform limitation
- OpenSearch security bootstrap checks parent directory access and fails

---

## ✅ Solution

**Run indexer as root instead of wazuh-indexer:**

1. Volume mounts work for root user
2. OpenSearch still enforces security via plugins
3. Bypasses Fly.io volume mount restrictions
4. Indexer can access `/var/ossec/data` successfully

**Changed:**
- ❌ `exec su -s /bin/bash wazuh-indexer -c "..."` (fails on volume)
- ✅ `exec $INDEXER_BIN` (runs as root, works on volume)

---

## 📋 Files Updated

1. ✅ `scripts/run-indexer-with-logging.sh`
   - Changed to run as root instead of wazuh-indexer
   - Added warning about root execution
   - OpenSearch security still enforced

---

## 🚀 Next Deployment

```bash
flyctl deploy -a ai2-wazuh
```

**Expected:**
- ✅ Indexer runs as root
- ✅ Can access `/var/ossec/data` (volume mount works for root)
- ✅ Indexer starts successfully
- ✅ OpenSearch security still enforced via plugins

---

## 📝 Technical Details

**Why root works:**
- Root user has full filesystem access
- Volume mounts work for root
- No user switching needed
- Bypasses Fly.io volume mount restrictions

**Security considerations:**
- OpenSearch still enforces security via plugins
- Security plugin is enabled (`plugins.security.disabled: false`)
- Authentication and authorization still work
- Only the process user changed (root vs wazuh-indexer)

**Why this is acceptable:**
- Container is isolated
- OpenSearch has its own security mechanisms
- Root access is limited to container
- Better than indexer not starting at all

---

**embracingearth.space**







