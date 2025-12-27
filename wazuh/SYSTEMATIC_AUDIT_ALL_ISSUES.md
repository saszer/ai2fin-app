# 🔍 Systematic Audit - All Main Issues

**Date:** 2025-12-27  
**Status:** Comprehensive audit of all deployment issues

---

## 📊 **Executive Summary**

**Total Issues Found:** 6  
**Critical:** 2  
**Warnings:** 3  
**Info:** 1

---

## 🚨 **CRITICAL ISSUES**

### **Issue #1: API Port Not Binding (CRITICAL)**

**Status:** ⚠️ **PARTIALLY FIXED** - API says "Listening" but port check fails

**Evidence from logs:**
```
2025/12/27 03:10:54 INFO: Listening on 0.0.0.0:55000..
⚠ Port 55000 still not listening
```

**Root Cause Analysis:**
- ✅ API process starts (`Started wazuh-apid...`)
- ✅ API logs say "Listening on 0.0.0.0:55000"
- ❌ Port check fails (netstat/ss don't show port listening)
- ❌ Load balancer can't route traffic

**Possible Causes:**
1. **Timing issue** - API says listening but hasn't fully bound yet
2. **SSL certificate issue** - API starts but fails to bind HTTPS
3. **Permission issue** - API can't bind to port (though unlikely with 0.0.0.0)
4. **Port conflict** - Something else using port 55000 (unlikely)

**Fix Status:**
- ✅ Certificates copied successfully
- ✅ API process running
- ⚠️ Port binding verification failing

**Next Steps:**
- Check if API is actually listening (verify with `ss -tuln | grep 55000`)
- Check API error logs for binding failures
- Verify SSL certificates are valid

---

### **Issue #2: Database Permission Error (CRITICAL)**

**Status:** ⚠️ **PARTIALLY FIXED** - Permissions set but may need runtime fix

**Evidence from logs:**
```
ERROR: (1103): Could not open file 'etc/lists/audit-keys.tmp' due to [(13)-(Permission denied)].
ERROR: Error during the database migration. Restoring the previous database file
ERROR: Error details: (sqlite3.OperationalError) unable to open database file
```

**Root Cause:**
- Wazuh analysisd can't write to `etc/lists/audit-keys.tmp`
- API can't write to its database file
- Permissions not set correctly at runtime

**Fix Applied:**
- ✅ Added `chown -R wazuh:wazuh /var/ossec/api/configuration` in Dockerfile
- ⚠️ May need runtime permission fix for `/var/ossec/etc/lists/`

**Next Steps:**
- Fix permissions on `/var/ossec/etc/lists/` directory
- Ensure API database directory has correct permissions at runtime

---

## ⚠️ **WARNINGS (Non-Critical)**

### **Issue #3: Missing List Files (WARNING)**

**Status:** ⚠️ **MINOR** - Rules will be ignored but system works

**Evidence:**
```
WARNING: (1103): Could not open file 'etc/lists/amazon/aws-eventnames' due to [(2)-(No such file or directory)].
WARNING: (1103): Could not open file 'etc/lists/security-eventchannel' due to [(2)-(No such file or directory)].
WARNING: (7616): List 'etc/lists/amazon/aws-eventnames' could not be loaded. Rule '80202' will be ignored.
```

**Impact:**
- Some AWS-related rules will be ignored
- Not critical for your use case (you're not using AWS integration)
- System continues to work

**Fix:**
- Create empty list files or remove references from `wazuh.conf`
- Or ignore (not needed for your deployment)

---

### **Issue #4: Filebeat Elasticsearch Connection (WARNING)**

**Status:** ⚠️ **EXPECTED** - No Elasticsearch cluster deployed

**Evidence:**
```
ERROR: Failed to connect to backoff(elasticsearch(https://wazuh.indexer:9200)): lookup wazuh.indexer on [fdaa::3]:53: no such host
```

**Impact:**
- Filebeat can't send alerts to Elasticsearch
- **This is expected** - you disabled the indexer in `wazuh.conf`
- Filebeat will keep retrying (harmless)

**Fix:**
- Disable Filebeat or configure it to not use Elasticsearch
- Or ignore (not needed without indexer)

---

### **Issue #5: Audit Keys Permission (WARNING)**

**Status:** ⚠️ **MINOR** - Analysisd can't write temp file

**Evidence:**
```
ERROR: (1103): Could not open file 'etc/lists/audit-keys.tmp' due to [(13)-(Permission denied)].
```

**Impact:**
- Analysisd can't update audit-keys list
- May affect some rule processing
- System continues to work

**Fix:**
- Set correct permissions on `/var/ossec/etc/lists/` directory
- Ensure `wazuh` user can write to this directory

---

## ℹ️ **INFO (Non-Issues)**

### **Issue #6: Missing Multigroups Directory (INFO)**

**Status:** ✅ **EXPECTED** - Not needed for single-node deployment

**Evidence:**
```
find: '/var/ossec/var/multigroups': No such file or directory
The path /var/ossec/var/multigroups is empty, skiped
```

**Impact:**
- None - multigroups only needed for agent grouping
- Single-node deployment doesn't need this

**Fix:**
- None needed - this is expected

---

## 🎯 **Priority Fix List**

### **Priority 1: API Port Binding (CRITICAL)**

**Why:** API must bind to port 55000 for Fly.io load balancer to route traffic

**Actions:**
1. Verify API is actually listening (check with `ss -tuln`)
2. Check API error logs for binding failures
3. Verify SSL certificates are valid and accessible
4. Check if API needs more time to fully bind

**Expected Fix:**
- API should bind within 30-60 seconds after start
- Port should show as LISTEN in netstat/ss

---

### **Priority 2: Database Permissions (CRITICAL)**

**Why:** API can't start without database write access

**Actions:**
1. Fix `/var/ossec/etc/lists/` permissions (wazuh:wazuh, 755)
2. Ensure API database directory has write access
3. Add runtime permission fix in init script

**Expected Fix:**
- No more "Permission denied" errors
- API database migration succeeds

---

### **Priority 3: Missing List Files (WARNING)**

**Why:** Clean up warnings, improve rule processing

**Actions:**
1. Create empty list files or remove from `wazuh.conf`
2. Or create placeholder files

**Expected Fix:**
- No more "file not found" warnings for lists
- All rules load correctly

---

### **Priority 4: Filebeat Elasticsearch (WARNING)**

**Why:** Reduce log noise, stop unnecessary retries

**Actions:**
1. Disable Filebeat Elasticsearch output
2. Or configure Filebeat to not retry

**Expected Fix:**
- No more Elasticsearch connection errors
- Cleaner logs

---

## 📋 **Detailed Issue Breakdown**

### **API Port Binding Issue**

**Symptoms:**
- API logs say "Listening on 0.0.0.0:55000"
- Port check fails (netstat/ss don't show port)
- Load balancer can't route traffic

**Diagnosis Steps:**
1. Check if port is actually listening:
   ```bash
   fly ssh console -a ai2-wazuh -C "ss -tuln | grep 55000"
   ```

2. Check API error logs:
   ```bash
   fly ssh console -a ai2-wazuh -C "grep -i error /var/ossec/logs/api/api.log | tail -20"
   ```

3. Check SSL certificates:
   ```bash
   fly ssh console -a ai2-wazuh -C "ls -la /var/ossec/api/configuration/ssl/"
   ```

4. Check API process:
   ```bash
   fly ssh console -a ai2-wazuh -C "/var/ossec/bin/wazuh-control status | grep apid"
   ```

**Possible Root Causes:**
- API starts but crashes immediately after binding
- SSL certificate issue prevents HTTPS binding
- Port binding happens but process dies
- Timing issue - port check happens too early

---

### **Database Permission Issue**

**Symptoms:**
- `Permission denied` errors for `audit-keys.tmp`
- API database migration fails
- `sqlite3.OperationalError: unable to open database file`

**Diagnosis Steps:**
1. Check directory permissions:
   ```bash
   fly ssh console -a ai2-wazuh -C "ls -ld /var/ossec/etc/lists/"
   fly ssh console -a ai2-wazuh -C "ls -ld /var/ossec/api/configuration/security/"
   ```

2. Check file ownership:
   ```bash
   fly ssh console -a ai2-wazuh -C "ls -la /var/ossec/etc/lists/"
   ```

**Fix:**
- Add permission fix to init script
- Ensure directories are owned by `wazuh:wazuh`
- Set correct permissions (755 for dirs, 644 for files)

---

## 🔧 **Recommended Fixes**

### **Fix 1: Add Runtime Permission Fix**

**File:** `cont-init.d/08-fix-permissions.sh`

```bash
#!/usr/bin/with-contenv sh
# Fix permissions for Wazuh directories
# embracingearth.space

echo "Fixing Wazuh directory permissions..."

# Fix lists directory permissions
mkdir -p /var/ossec/etc/lists
chown -R wazuh:wazuh /var/ossec/etc/lists
chmod 755 /var/ossec/etc/lists

# Fix API configuration permissions
chown -R wazuh:wazuh /var/ossec/api/configuration
chmod 755 /var/ossec/api/configuration
chmod 755 /var/ossec/api/configuration/security 2>/dev/null || true

echo "✓ Permissions fixed"
```

### **Fix 2: Create Missing List Files**

**Option A:** Remove from `wazuh.conf` (if not needed)
**Option B:** Create empty placeholder files

### **Fix 3: Disable Filebeat Elasticsearch (Optional)**

**File:** Update Filebeat config to not use Elasticsearch

---

## 📊 **Issue Priority Matrix**

| Issue | Priority | Impact | Effort | Status |
|-------|----------|--------|--------|--------|
| API Port Binding | 🔴 Critical | High | Medium | ⚠️ In Progress |
| Database Permissions | 🔴 Critical | High | Low | ⚠️ Partially Fixed |
| Missing List Files | 🟡 Warning | Low | Low | ⚠️ Not Fixed |
| Filebeat Elasticsearch | 🟡 Warning | None | Low | ℹ️ Expected |
| Audit Keys Permission | 🟡 Warning | Low | Low | ⚠️ Not Fixed |
| Missing Multigroups | 🟢 Info | None | None | ✅ Expected |

---

## 🎯 **Action Plan**

### **Immediate (Critical):**
1. ✅ Fix API port binding issue
2. ✅ Fix database permissions at runtime

### **Short-term (Warnings):**
3. Fix audit-keys permission
4. Create missing list files (or remove references)

### **Optional (Cleanup):**
5. Disable Filebeat Elasticsearch output
6. Clean up unnecessary init scripts

---

**Audit Complete!** ✅

