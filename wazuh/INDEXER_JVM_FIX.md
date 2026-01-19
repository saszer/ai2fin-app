# 🔧 Indexer JVM Options Fix

**Date:** 2025-12-28  
**Issue:** Indexer still using old temp directory path in JVM options

---

## 🚨 The Problem

**Error:**
```
ERROR: Temporary file directory [/var/ossec/data/wazuh-indexer-tmp] does not exist or is not accessible
```

**Root Cause:**
- Scripts updated to use `/tmp/wazuh-indexer-tmp` ✅
- But JVM options still pointing to `/var/ossec/data/wazuh-indexer-tmp` ❌
- Environment variables still pointing to old path ❌

**Where it's configured:**
1. `indexer/jvm.options` - JVM options file
2. `supervisord.conf` - Environment variables (TMPDIR, OPENSEARCH_JAVA_OPTS)
3. `scripts/run-indexer-with-logging.sh` - Runtime environment

---

## ✅ Solution

**Updated all temp directory references:**

1. ✅ `indexer/jvm.options`
   - Changed `-Djava.io.tmpdir` to `/tmp/wazuh-indexer-tmp`

2. ✅ `supervisord.conf`
   - Changed `TMPDIR` to `/tmp/wazuh-indexer-tmp`
   - Changed `OPENSEARCH_JAVA_OPTS` to use `/tmp/wazuh-indexer-tmp`

3. ✅ `scripts/run-indexer-with-logging.sh`
   - Added explicit `export TMPDIR` and `OPENSEARCH_JAVA_OPTS` before starting indexer

---

## 📋 Files Updated

1. ✅ `indexer/jvm.options` - Line 12
2. ✅ `supervisord.conf` - Line 39
3. ✅ `scripts/run-indexer-with-logging.sh` - Runtime exports

---

## 🚀 Next Deployment

```bash
flyctl deploy -a ai2-wazuh
```

**Expected:**
- ✅ JVM options point to `/tmp/wazuh-indexer-tmp`
- ✅ Environment variables point to `/tmp/wazuh-indexer-tmp`
- ✅ Temp directory exists and is accessible
- ✅ Indexer starts successfully

---

## 📝 Technical Details

**Why JVM options matter:**
- OpenSearch reads `jvm.options` file on startup
- Sets `-Djava.io.tmpdir` which Java uses for temp files
- Must match the directory we create in scripts

**Why environment variables matter:**
- `TMPDIR` is used by some processes
- `OPENSEARCH_JAVA_OPTS` overrides JVM options if set
- Both need to point to same directory

**Order of precedence:**
1. Environment variable `OPENSEARCH_JAVA_OPTS` (highest)
2. JVM options file `-Djava.io.tmpdir`
3. System default `/tmp` (lowest)

---

**embracingearth.space**









