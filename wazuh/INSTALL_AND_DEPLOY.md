# Install Flyctl and Deploy Wazuh

## 🔧 **Step 1: Install Flyctl**

Run in PowerShell (as Administrator if needed):

```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**After installation:**
- Close and reopen PowerShell
- Or refresh PATH: `$env:PATH = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`

**Verify installation:**
```powershell
flyctl version
```

---

## 🚀 **Step 2: Deploy**

### **Option 1: Manual Deploy (After Installing Flyctl)**

```powershell
cd "Z:\ai2fin graphigxs\MAIN\embracingearthspace\wazuh"
flyctl deploy -a ai2-wazuh --config fly.toml --detach
```

### **Option 2: Auto-Deploy on Push (Recommended)**

Just push to `main` branch - GitHub Actions will deploy automatically:

```bash
git add .
git commit -m "deploy: trigger auto-deploy"
git push origin main
```

**Workflow:** `.github/workflows/deploy-wazuh.yml` (already configured)

---

## ✅ **What Happens**

1. **Deployment completes** (with `--detach` flag - returns immediately)
2. **Services start:**
   - Manager: ~1 minute
   - Indexer: 10-15 minutes
   - Dashboard: 1-2 minutes
3. **Health checks pass** once Dashboard is ready (12-17 minutes total)

---

## 📋 **After Deployment**

```powershell
# Check status
flyctl status -a ai2-wazuh

# Check health checks
flyctl checks list -a ai2-wazuh

# View logs
flyctl logs -a ai2-wazuh
```

---

**embracingearth.space** - Install flyctl, then deploy!

