# 🚨 Disk Space Crisis - Emergency Fix

**Date:** 2026-01-19  
**Status:** 🔴 **CRITICAL** - Root filesystem 100% full, OpenSearch in read-only mode

---

## 🚨 The Problem

**Error:**
```
index [.kibana_1] blocked by: [TOO_MANY_REQUESTS/12/disk usage exceeded flood-stage watermark, index has read-only-allow-delete block]
```

**Root Cause:**
- Root filesystem (`/`) is **100% full** (7.8G used of 7.8G)
- OpenSearch automatically blocks writes when disk usage exceeds flood-stage watermark (typically 95%)
- This prevents all writes to OpenSearch indices, including Dashboard configuration

**Disk Usage:**
```
Filesystem      Size  Used Avail Use% Mounted on
none            7.8G  7.8G     0 100% /
/dev/vdb        7.8G  7.8G     0 100% /.fly-upper-layer
/dev/vdc        974M   64K  908M   1% /var/ossec/data  ← Volume has space!
```

**Issue:** OpenSearch is storing data on root filesystem instead of the volume.

---

## ✅ Immediate Fix (Run Now)

### Step 1: Remove Read-Only Blocks

```bash
fly ssh console -a ai2-wazuh

# Remove read-only blocks
OPENSEARCH_PASSWORD=$OPENSEARCH_INITIAL_ADMIN_PASSWORD
curl -X PUT -k -u "admin:$OPENSEARCH_PASSWORD" \
  "https://localhost:9200/_settings" \
  -H "Content-Type: application/json" \
  -d '{"index":{"blocks.read_only_allow_delete":null}}'

# Also remove from .kibana_1 specifically
curl -X PUT -k -u "admin:$OPENSEARCH_PASSWORD" \
  "https://localhost:9200/.kibana_1/_settings" \
  -H "Content-Type: application/json" \
  -d '{"index":{"blocks.read_only_allow_delete":null}}'
```

### Step 2: Clean Up Disk Space

```bash
# Clean old logs (keep last 3 days)
find /var/ossec/logs -name "*.log.*" -type f -mtime +3 -delete
find /var/log/supervisor -name "*.log" -type f -mtime +3 -delete
find /var/log/supervisor -name "*.err" -type f -mtime +3 -delete
find /var/log/filebeat -name "*.log" -type f -mtime +3 -delete

# Clean temporary files
rm -rf /tmp/*
rm -rf /var/tmp/*

# Check disk usage
df -h /
```

### Step 3: Delete Old Indices (Optional - if still needed)

```bash
# List old indices
curl -k -u "admin:$OPENSEARCH_PASSWORD" \
  "https://localhost:9200/_cat/indices/wazuh-alerts-*?h=index"

# Delete indices older than 7 days (be careful!)
# Replace YYYY.MM.DD with actual old date
curl -X DELETE -k -u "admin:$OPENSEARCH_PASSWORD" \
  "https://localhost:9200/wazuh-alerts-YYYY.MM.DD"
```

---

## 🔧 Permanent Fixes Applied

### 1. ✅ Increased Disk Size
**File:** `fly.toml`
- Added `disk_gb = 20` to VM configuration
- Increases root filesystem from ~8GB to 20GB
- Prevents future disk space issues

### 2. ✅ Automatic Disk Cleanup
**File:** `cont-init.d/16-disk-cleanup.sh`
- Runs on every container startup
- Automatically cleans old logs (3+ days)
- Removes temporary files
- Prevents disk from filling up

### 3. ✅ Emergency Fix Script
**File:** `scripts/fix-disk-space-crisis.sh`
- Can be run manually to fix disk issues
- Removes read-only blocks
- Cleans up disk space
- Deletes old indices
- Force merges to reduce disk usage

---

## 📋 Deployment

After applying fixes:

```bash
cd embracingearthspace/wazuh
fly deploy -a ai2-wazuh
```

**Note:** The disk size increase requires a machine restart. Fly.io will handle this automatically during deployment.

---

## 🔍 Verification

After deployment and cleanup:

1. **Check disk usage:**
   ```bash
   fly ssh console -a ai2-wazuh -C "df -h"
   ```
   Should show root filesystem < 80% used

2. **Check OpenSearch status:**
   ```bash
   fly ssh console -a ai2-wazuh -C "curl -k -u admin:\$OPENSEARCH_INITIAL_ADMIN_PASSWORD https://localhost:9200/_cluster/health"
   ```
   Should show `"status":"green"` or `"status":"yellow"` (not blocked)

3. **Test Dashboard:**
   - Visit: `https://ai2-wazuh.fly.dev/app/wz-home#/health-check`
   - Should load without 429 errors

---

## ⚠️ Prevention

### Log Rotation
Consider implementing log rotation for:
- `/var/ossec/logs/*.log`
- `/var/log/supervisor/*.log`
- `/var/log/filebeat/*.log`

### Index Lifecycle Management
Configure OpenSearch ILM to:
- Delete indices older than 30 days
- Force merge indices weekly
- Reduce replica count if not needed

### Monitoring
Set up alerts for:
- Disk usage > 80%
- OpenSearch cluster status = red
- Read-only blocks detected

---

## 🎯 Root Cause Analysis

**Why root filesystem filled up:**
1. OpenSearch stores indices on root filesystem (not volume)
2. Logs accumulate over time
3. No automatic cleanup configured
4. Small default disk size (8GB)

**Why volume has space:**
- Volume (`/var/ossec/data`) is separate from root filesystem
- Only 1% used (64K of 974M)
- But OpenSearch isn't using it for indices

**Solution:**
- Increase root filesystem size (20GB)
- Implement automatic cleanup
- Consider moving OpenSearch data to volume (requires config changes)

---

**embracingearth.space - Enterprise Security Monitoring**

