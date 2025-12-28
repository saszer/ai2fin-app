# Wazuh Startup Logic Audit

**Date:** 2025-12-28  
**Issue:** Dashboard not listening on `0.0.0.0:5601`, health checks failing

---

## 🔍 Root Cause Analysis

### **Problem 1: Dashboard Wait Logic**
- **Location:** `supervisord.conf` line 37
- **Issue:** Dashboard waits for Indexer using `curl http://localhost:9200/_cluster/health` **without authentication**
- **Impact:** With security enabled, this check **always fails**, so Dashboard waits 120s then starts anyway, but Indexer might not be ready
- **Fix:** Use authenticated curl: `curl -u admin:password http://localhost:9200/_cluster/health`

### **Problem 2: Indexer Startup Time**
- **Location:** Indexer initialization with security enabled
- **Issue:** Indexer takes **10-15 minutes** to start on shared CPU with security enabled (SSL cert loading, security index initialization)
- **Impact:** Dashboard wait timeout (120s) is too short, Dashboard starts before Indexer is ready
- **Fix:** Increase wait timeout to 600s (10 minutes)

### **Problem 3: Password Substitution**
- **Location:** `opensearch_dashboards.yml` line 19
- **Issue:** Dashboard config has `${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}` placeholder
- **Status:** ✅ Script `10-set-indexer-dashboard-passwords.sh` should replace it, but need to verify it works
- **Risk:** If substitution fails, Dashboard tries to connect with literal string `"${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"` as password

### **Problem 4: Indexer Security Configuration**
- **Location:** `opensearch.yml` line 36-37
- **Issue:** `plugins.security.authcz.admin_dn: ["CN=admin"]` requires certificate-based admin auth
- **Status:** ✅ Password auth should still work for regular users, but admin user needs to exist in security index
- **Risk:** If security index isn't initialized, no users exist and Dashboard can't authenticate

---

## ✅ Fixes Applied

1. **Updated Dashboard wait command** in `supervisord.conf`:
   - Uses authenticated curl: `curl -u admin:"$ADMIN_PASS"`
   - Increased timeout to 600s (10 minutes)
   - Better logging of wait progress

2. **Password substitution** in `10-set-indexer-dashboard-passwords.sh`:
   - ✅ Already correct - uses `sed` to replace placeholder
   - Need to verify it runs before Dashboard starts

---

## 🧪 Verification Steps

1. **Check if init scripts run:**
   ```bash
   fly logs -a ai2-wazuh | grep "Running.*script"
   ```

2. **Check if certificates exist:**
   ```bash
   fly ssh console -a ai2-wazuh -C "ls -la /etc/wazuh-indexer/certs/"
   ```

3. **Check if password was substituted:**
   ```bash
   fly ssh console -a ai2-wazuh -C "grep password /etc/wazuh-dashboard/opensearch_dashboards.yml"
   ```

4. **Check Indexer health (with auth):**
   ```bash
   fly ssh console -a ai2-wazuh -C "curl -u admin:admin http://localhost:9200/_cluster/health"
   ```

5. **Check Dashboard logs:**
   ```bash
   fly logs -a ai2-wazuh | grep -i dashboard
   ```

---

## 🚀 Expected Startup Sequence

1. **Container starts** → `/start.sh` runs
2. **Init scripts execute** (in order):
   - `09-generate-indexer-certs.sh` → Creates SSL certificates
   - `10-set-indexer-dashboard-passwords.sh` → Substitutes password in Dashboard config
   - `11-setup-data-directories.sh` → Sets up data persistence
3. **Supervisord starts** → Manages all three services
4. **Wazuh Manager starts** → ~1 minute
5. **Wazuh Indexer starts** → **10-15 minutes** (with security enabled)
   - Loads SSL certificates
   - Initializes security index
   - Creates default admin user (if `allow_default_init_securityindex: true`)
6. **Wazuh Dashboard waits** → Checks Indexer health with auth (up to 10 minutes)
7. **Wazuh Dashboard starts** → Connects to Indexer with admin credentials
8. **Dashboard listens on `0.0.0.0:5601`** → Health checks pass

---

## ⚠️ Known Issues

1. **Long cold start time:** 10-15 minutes due to Indexer initialization
2. **Health check timeout:** Fly.io TCP health check might timeout before services are ready
3. **Password security:** Default `admin/admin` password - **MUST change in production**

---

## 📋 Next Steps

1. Deploy with fixes
2. Monitor logs for 15 minutes
3. Verify Dashboard is listening on port 5601
4. Test health checks
5. Change default password

