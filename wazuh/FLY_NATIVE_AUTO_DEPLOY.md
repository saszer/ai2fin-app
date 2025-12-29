# Fly.io Native Auto-Deploy Setup

**Fly.io DOES support auto-deploy from git push!** You can set it up directly in Fly.io without GitHub Actions.

---

## 🔧 **Setup Fly.io Git Integration**

### **Option 1: Via Fly.io Dashboard (Recommended)**

1. Go to: https://fly.io/apps/ai2-wazuh
2. Click **"Settings"** → **"Source"** or **"Deployments"**
3. Click **"Connect GitHub Repository"**
4. Authorize Fly.io to access your repository
5. Select your repository
6. Enable **"Auto Deploy"**
7. Configure:
   - **Branch:** `main`
   - **Build context:** `embracingearthspace/wazuh/`
   - **Dockerfile:** `Dockerfile.fullstack`
   - **Config file:** `fly.toml`

### **Option 2: Via Flyctl Command**

```bash
# Connect GitHub repo (if supported)
flyctl apps connect <your-github-repo>

# Or configure via dashboard settings
```

---

## ⚙️ **Configure Auto-Deploy Settings**

Once connected, Fly.io will:
- ✅ Watch for pushes to `main` branch
- ✅ Auto-deploy when `embracingearthspace/wazuh/**` changes
- ✅ Build from `Dockerfile.fullstack`
- ✅ Use `fly.toml` configuration

**Important:** You may need to configure:
- Build context: `embracingearthspace/wazuh/`
- Dockerfile path: `Dockerfile.fullstack`
- Health check timeout: Use `--detach` in build settings

---

## 🚀 **How It Works**

1. **Push to `main`** → Fly.io detects change
2. **Builds image** from Dockerfile
3. **Deploys automatically** → No manual steps needed
4. **Health checks** run (may need `--detach` flag)

---

## ⚠️ **Health Check Consideration**

Fly.io's native auto-deploy might not include `--detach` flag by default.

**If deployments timeout:**
- Configure build settings to include `--detach`
- Or use GitHub Actions workflow (which we control)

---

## 📋 **Check Current Setup**

```bash
# Check if git integration is connected
flyctl apps show ai2-wazuh

# Check deployment settings
flyctl apps settings show ai2-wazuh
```

---

**embracingearth.space** - Fly.io native auto-deploy is available!

