# Auto-Deploy Solution for Wazuh

**Problem:** Fly.io native auto-deploy fails because it doesn't support `--detach` flag.

**Solution:** Use GitHub Actions for auto-deploy (supports `--detach` flag).

---

## ❌ **Why Fly.io Native Auto-Deploy Fails**

**Issue:**
- Fly.io native auto-deploy doesn't support `--detach` flag
- It waits for health checks to pass before completing deployment
- Dashboard takes 12-17 minutes to start
- Deployment times out waiting for health checks

**Error:**
```
✖ Unrecoverable error: timeout reached waiting for health checks to pass
```

---

## ✅ **Solution: GitHub Actions Auto-Deploy**

**Why GitHub Actions works:**
- ✅ Supports `--detach` flag (returns immediately)
- ✅ Allows deployment to complete even if health checks haven't passed
- ✅ Health checks still run and pass once Dashboard is ready
- ✅ Full control over deployment process

**Workflow:** `.github/workflows/deploy-wazuh.yml`

---

## 🚀 **How to Use**

### **Option 1: GitHub Actions (Recommended)**

**Just push to `main` branch:**
```bash
git add .
git commit -m "update: wazuh configuration"
git push origin main
```

**What happens:**
1. GitHub Actions detects push
2. Runs workflow automatically
3. Deploys with `--detach` flag (returns immediately)
4. Deployment completes successfully
5. Health checks pass once Dashboard is ready (12-17 min)

### **Option 2: Disable Fly.io Native Auto-Deploy**

If you have Fly.io native auto-deploy enabled:

1. Go to: https://fly.io/apps/ai2-wazuh
2. Click **"Settings"** → **"Source"**
3. **Disable** "Auto Deploy"
4. Use GitHub Actions instead

---

## 📋 **Required Setup**

**GitHub Secret:**
- `FLY_API_TOKEN` - Must be set in GitHub Secrets
- Get token: `flyctl auth token`
- Set in: Settings → Secrets and variables → Actions

---

## ✅ **Benefits of GitHub Actions**

1. **Supports `--detach` flag** ✅
2. **Prevents deployment timeout** ✅
3. **Full control over deployment** ✅
4. **Better logging and monitoring** ✅
5. **Can add additional steps** (tests, notifications, etc.) ✅

---

## 🎯 **Summary**

**For Wazuh:**
- ❌ Fly.io native auto-deploy: Doesn't support `--detach` → Fails
- ✅ GitHub Actions: Supports `--detach` → Works

**Recommendation:** Use GitHub Actions for Wazuh auto-deploy.

---

**embracingearth.space** - GitHub Actions is the solution for Wazuh auto-deploy!

