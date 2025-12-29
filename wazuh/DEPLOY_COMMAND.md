# Wazuh Deployment Command Reference

**CRITICAL:** Always include `--no-health-checks` flag to prevent deployment timeout!

---

## 🚀 **Correct Deployment Commands**

### **Option 1: Build from Dockerfile (Recommended)**
```bash
flyctl deploy -a ai2-wazuh --config fly.toml --no-health-checks
```

### **Option 2: Use Pre-built Image**
```bash
flyctl deploy -a ai2-wazuh \
  --image registry.fly.io/ai2-wazuh:deployment-XXXXX \
  --depot-scope=app \
  --config fly.toml \
  --no-health-checks
```

### **Option 3: Use PowerShell Script**
```powershell
cd embracingearthspace\wazuh
.\deploy.ps1
```

---

## ❌ **WRONG - Missing `--no-health-checks`**

```bash
# This will FAIL with timeout error:
flyctl deploy -a ai2-wazuh --image registry.fly.io/ai2-wazuh:deployment-XXXXX --depot-scope=app --config fly.toml
```

**Error you'll see:**
```
✖ Unrecoverable error: timeout reached waiting for health checks to pass
```

---

## ✅ **Why `--no-health-checks` is Required**

1. **Dashboard takes 12-17 minutes to start:**
   - Indexer: 10-15 minutes
   - Dashboard: 1-2 minutes

2. **Health checks fail during startup:**
   - This is expected and normal
   - Health checks will pass once Dashboard is ready

3. **Without `--no-health-checks`:**
   - Deployment times out waiting for health checks
   - Deployment fails even though Dashboard is starting correctly

4. **With `--no-health-checks`:**
   - Deployment completes successfully
   - Health checks still run in background
   - Health checks pass once Dashboard is ready (12-17 min)

---

## 📋 **Auto-Deploy (GitHub Actions)**

The workflow (`.github/workflows/deploy-wazuh.yml`) automatically includes `--no-health-checks`:

```yaml
flyctl deploy \
  --app ai2-wazuh \
  --config fly.toml \
  --no-health-checks \  # ✅ Always included
  --remote-only \
  --strategy rolling
```

**No manual intervention needed** - just push to `main` branch!

---

## 🔍 **Verification**

After deployment (even with `--no-health-checks`):

```bash
# Check machine status
flyctl status -a ai2-wazuh

# Check health checks (will pass after 12-17 min)
flyctl checks list -a ai2-wazuh

# View logs
flyctl logs -a ai2-wazuh
```

---

## ⚠️ **Remember**

**ALWAYS include `--no-health-checks` when deploying manually!**

This flag:
- ✅ Prevents deployment timeout
- ✅ Allows deployment to complete
- ✅ Health checks still run and pass once Dashboard is ready

**embracingearth.space** - Always use `--no-health-checks`!

