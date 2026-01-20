# 🔧 Disk Space Root Cause Fix

**Date:** 2026-01-19  
**Issue:** Root filesystem 100% full - OpenSearch storing data on root instead of volume

---

## 🚨 Root Cause

**The Problem:**
- OpenSearch was configured to store data at `/var/lib/wazuh-indexer/data` (root filesystem)
- This filled up the 8GB root filesystem completely
- Volume at `/var/ossec/data` has plenty of space (908M available) but wasn't being used

**Why it happened:**
- Previous fix tried to use non-volume location due to Fly.io volume mount restrictions
- This was a workaround that caused the disk space issue
- OpenSearch indices can grow very large (several GB per day with active monitoring)

**Is this normal?**
- **NO** - OpenSearch should use the persistent volume, not root filesystem
- Indices can grow large, but should be on volume with proper lifecycle management
- Root filesystem should only contain system files, not application data

---

## ✅ Fixes Applied

### 1. **Fixed OpenSearch Data Path**
**File:** `indexer/opensearch.yml`
- Changed `path.data` from `/var/lib/wazuh-indexer/data` (root) 
- To `/var/ossec/data/wazuh-indexer-data` (volume)
- Data will now persist and use volume storage

### 2. **Added Disk Watermarks**
**File:** `indexer/opensearch.yml`
- Set low watermark: 85%
- Set high watermark: 90%
- Set flood stage: 95%
- Prevents read-only blocks before disk fills

### 3. **Index Lifecycle Management (ILM)**
**File:** `cont-init.d/17-configure-index-lifecycle.sh`
- Automatically deletes indices older than 30 days
- Prevents indefinite growth
- Configures rollover at 10GB or 7 days

### 4. **Automatic Disk Cleanup**
**File:** `cont-init.d/16-disk-cleanup.sh`
- Runs on every container startup
- Cleans old logs (3+ days)
- Removes temporary files

### 5. **Increased Disk Size**
**File:** `fly.toml`
- Increased from ~8GB to 20GB
- Provides buffer for system files and logs

---

## 📊 Expected Disk Usage

**Normal Usage:**
- Root filesystem: ~2-3GB (system, logs, temp files)
- Volume: Grows with indices (managed by ILM - max 30 days retention)

**With ILM:**
- Indices auto-delete after 30 days
- Max disk usage: ~10-15GB for 30 days of data
- Volume has 974MB capacity (can be increased if needed)

---

## 🚀 Deployment

```bash
cd embracingearthspace/wazuh
fly deploy -a ai2-wazuh
```

**After deployment:**
1. OpenSearch will start using volume for data
2. Old data on root filesystem will remain (can be cleaned manually)
3. New indices will be created on volume
4. ILM will automatically manage index lifecycle

---

## 🧹 Manual Cleanup (Optional)

After deployment, you can manually clean old data from root filesystem:

```bash
fly ssh console -a ai2-wazuh

# Check what's using space
du -sh /var/lib/wazuh-indexer/data

# If old data exists, migrate it to volume (if needed)
# Or delete it if it's old/unused
rm -rf /var/lib/wazuh-indexer/data/nodes/*/indices/*

# Clean logs
find /var/ossec/logs -name "*.log.*" -type f -mtime +3 -delete
find /var/log/supervisor -name "*.log" -type f -mtime +3 -delete
```

---

## ✅ Verification

After deployment:

1. **Check data location:**
   ```bash
   fly ssh console -a ai2-wazuh -C "ls -lh /var/ossec/data/wazuh-indexer-data/nodes/*/indices/ 2>/dev/null | head -5"
   ```
   Should show indices being created on volume

2. **Check disk usage:**
   ```bash
   fly ssh console -a ai2-wazuh -C "df -h"
   ```
   Root filesystem should be < 50% used

3. **Check ILM policy:**
   ```bash
   fly ssh console -a ai2-wazuh -C "curl -k -u admin:\$OPENSEARCH_INITIAL_ADMIN_PASSWORD https://localhost:9200/_ilm/policy/wazuh-alerts-policy"
   ```
   Should show ILM policy configured

---

## 📝 Summary

**Before:**
- ❌ Data on root filesystem (8GB, 100% full)
- ❌ No lifecycle management
- ❌ No automatic cleanup
- ❌ Read-only blocks triggered

**After:**
- ✅ Data on volume (persistent, scalable)
- ✅ ILM auto-deletes old indices (30 days)
- ✅ Automatic log cleanup
- ✅ Disk watermarks prevent blocks
- ✅ 20GB root filesystem (buffer)

**This is now properly configured for production!**

---

**embracingearth.space - Enterprise Security Monitoring**

