# 🔧 Dashboard Authentication Fix

**Date:** 2025-12-29  
**Issue:** Dashboard authentication failures preventing binding to 0.0.0.0:5601

---

## 🚨 The Problem

**Symptoms:**
- ✅ Indexer running successfully
- ✅ Dashboard process running (supervisord shows RUNNING)
- ❌ Repeated authentication failures: "Authentication finally failed for admin"
- ❌ Dashboard not listening on `0.0.0.0:5601`
- ❌ 503 error on https://ai2-wazuh.fly.dev/

**Root Cause:**
- Dashboard config has password placeholder `${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}`
- Password substitution script may not be running or failing
- Dashboard tries to connect with literal placeholder string as password
- Authentication fails → Dashboard can't connect to Indexer → Dashboard doesn't fully start → Port not bound

---

## ✅ Fixes Applied

### **1. Fixed Password Substitution** ✅

**File:** `cont-init.d/10-set-indexer-dashboard-passwords.sh`

**Changes:**
- Enhanced password replacement logic
- Handles multiple placeholder formats
- Forces replacement if placeholder still found
- Adds verification logging

**Before:**
```bash
sed -i "s/\${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}/$DASHBOARD_PASSWORD/g" "$DASHBOARD_CONFIG"
```

**After:**
```bash
# Multiple replacement strategies
sed -i "s|\${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}|$DASHBOARD_PASSWORD|g" "$DASHBOARD_CONFIG"
sed -i "s|OPENSEARCH_INITIAL_ADMIN_PASSWORD|$DASHBOARD_PASSWORD|g" "$DASHBOARD_CONFIG"
# Force replace entire password line if placeholder still found
sed -i "s|opensearch.password:.*|opensearch.password: \"$DASHBOARD_PASSWORD\"|" "$DASHBOARD_CONFIG"
```

---

### **2. Simplified Dashboard Config** ✅

**File:** `dashboard/opensearch_dashboards.yml`

**Changed:**
- Removed complex placeholder syntax
- Use simple default password `"admin"`
- Script will replace it during init

**Before:**
```yaml
opensearch.password: "${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"
```

**After:**
```yaml
opensearch.password: "admin"
# Script will replace this with actual password
```

---

### **3. Added Dashboard Binding Script** ✅

**File:** `cont-init.d/14-ensure-dashboard-binding.sh`

**What it does:**
- Ensures `server.host: 0.0.0.0` is set
- Ensures `server.port: 5601` is set
- Verifies config before Dashboard starts

---

### **4. Fixed OpenSearch Config Error** ✅

**File:** `indexer/opensearch.yml`

**Changed:**
- `plugins.security.check_snapshot_restore_privilege` → `plugins.security.check_snapshot_restore_write_privileges`

---

## 🚀 Next Deployment

```bash
flyctl deploy -a ai2-wazuh
```

**Expected:**
- ✅ Password substitution works correctly
- ✅ Dashboard can authenticate to Indexer
- ✅ Dashboard binds to `0.0.0.0:5601`
- ✅ Health check passes
- ✅ https://ai2-wazuh.fly.dev/ accessible

---

## 🔍 Verification

**After deployment, check:**

1. **Password substitution:**
   ```bash
   fly ssh console -a ai2-wazuh -C "grep 'opensearch.password' /etc/wazuh-dashboard/opensearch_dashboards.yml"
   ```
   Should show: `opensearch.password: "admin"` (or your custom password)

2. **Dashboard binding:**
   ```bash
   fly ssh console -a ai2-wazuh -C "netstat -tuln | grep 5601"
   ```
   Should show: `0.0.0.0:5601` listening

3. **Dashboard logs:**
   ```bash
   fly logs -a ai2-wazuh | grep -i dashboard
   ```
   Should NOT show authentication failures

---

**embracingearth.space**

