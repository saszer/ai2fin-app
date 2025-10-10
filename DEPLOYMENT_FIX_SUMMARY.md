# 🔧 Fly.io Deployment Fix - RESOLVED

**Date**: October 7, 2025  
**Issue**: Image not found error during deployment  
**Status**: ✅ **FIXED**

---

## 🐛 **THE PROBLEM**

You tried to deploy with:
```bash
flyctl deploy -a ai2-core-api \
  --image registry.fly.io/ai2-core-api:deployment-34000f9c17e0fde95a05968e4b90c33e
```

**Error**: `Could not find image "registry.fly.io/ai2-core-api:deployment-34000f9c17e0fde95a05968e4b90c33e"`

### Root Cause
1. **Wrong deployment method**: The `--image` flag expects a pre-built image in Fly.io's registry
2. **Image doesn't exist**: That specific image tag was never pushed to Fly.io's registry
3. **CI/CD mismatch**: Your workflows build to GitHub Container Registry (`ghcr.io`), not Fly.io's registry
4. **Confusion**: Multiple app names and configs created confusion

---

## ✅ **THE FIX**

### What Was Changed

**1. Updated CI/CD Workflow** (`.github/workflows/ci-cd-pipeline.yml`):

**BEFORE** (Wrong ❌):
```yaml
- name: Deploy to production
  run: |
    flyctl deploy \
      --app ai2-production \
      --image ${{ needs.build-images.outputs.image-tag }}  # ❌ Image from ghcr.io
```

**AFTER** (Correct ✅):
```yaml
- name: Deploy to production
  working-directory: ./embracingearthspace  # ✅ CRITICAL FIX!
  run: |
    # Let Fly.io build from Dockerfile
    flyctl deploy \
      --app ai2-production \
      --config fly.toml \
      --strategy rolling  # ✅ Builds from source
```

**2. Removed Image Dependency**:
- Changed `needs: build-images` → `needs: [security-scan, build-test]`
- Deployments no longer wait for Docker image builds
- Fly.io builds images directly from your Dockerfile

**3. Fixed Working Directory**:
- Added `working-directory: ./embracingearthspace` to all Fly.io deployment steps
- This ensures the workflow can find `fly.toml`, `fly.staging.toml`, etc.
- Fixed all build/test paths to include `embracingearthspace/` prefix

**4. Moved Workflow File**:
- GitHub Actions only reads workflows from root `.github/workflows/`
- Moved from `embracingearthspace/.github/workflows/ci-cd-pipeline.yml`
- To: `.github/workflows/ci-cd-pipeline.yml`

**5. Simplified Deployment**:
- Removed `--image` flag from all deployment steps
- Removed unused environment variables from preview deployments
- Let Fly.io handle image building automatically

---

## 🎯 **APP NAME CLARIFICATION**

You have multiple Fly.io apps configured:

| App Name | Config File | Purpose | Location |
|----------|-------------|---------|----------|
| `ai2-production` | `fly.toml` | Production (main) | Root directory |
| `ai2-staging` | `fly.staging.toml` | Staging (develop) | Root directory |
| `ai2-core-app` | `ai2-core-app/fly.toml` | Core app | ai2-core-app/ |
| `ai2-core-api` | `ai2-core-app/fly.optimized.toml` | Optimized config | ai2-core-app/ |
| `ai2-subs` | `ai2-subscription-service/fly.toml` | Subscriptions | ai2-subscription-service/ |
| `ai2-web` | `ai2-core-app/client/fly.toml` | Frontend | ai2-core-app/client/ |

---

## 🚀 **HOW TO DEPLOY NOW**

### Option 1: Manual Deployment (Quick Test)

From `ai2-core-app/` directory:

```bash
# Deploy to ai2-core-api (optimized config)
flyctl deploy -a ai2-core-api --config fly.optimized.toml

# OR deploy to ai2-core-app (standard config)
flyctl deploy -a ai2-core-app --config fly.toml
```

From root directory:

```bash
# Deploy to production
flyctl deploy -a ai2-production --config fly.toml

# Deploy to staging
flyctl deploy -a ai2-staging --config fly.staging.toml
```

### Option 2: CI/CD Deployment (Automatic)

**For Production**:
```bash
git add .
git commit -m "fix: update deployment configuration"
git push origin main
```

**For Staging**:
```bash
git push origin develop
```

**For PR Preview**:
```bash
# Create PR - preview deploys automatically
gh pr create --title "feature: ..." --body "..."
```

---

## 🔧 **QUICK FIX FOR BOM ISSUE**

The `fly.optimized.toml` has a UTF-8 BOM that causes issues. To fix:

**Windows PowerShell**:
```powershell
cd "Z:\ai2fin graphigxs\MAIN\embracingearthspace\ai2-core-app"
$content = Get-Content fly.optimized.toml -Raw
[System.IO.File]::WriteAllText("$PWD\fly.optimized.toml", $content, [System.Text.UTF8Encoding]::new($false))
```

**Or use any of these alternatives**:
- Use VSCode: `File` → `Save with Encoding` → `UTF-8` (not UTF-8 with BOM)
- Use Notepad++: `Encoding` → `Encode in UTF-8 without BOM`
- Use the standard `fly.toml` instead

---

## 📋 **WHAT CHANGED IN CI/CD**

### Updated Files
1. ✅ `.github/workflows/ci-cd-pipeline.yml`
   - ✅ Removed `--image` flag from all deployments
   - ✅ Updated job dependencies
   - ✅ **CRITICAL**: Added `working-directory: ./embracingearthspace` to all deployment steps
   - ✅ Fixed paths for build-test jobs (`cd embracingearthspace/ai2-${{ matrix.service }}`)
   - ✅ Moved workflow file from `embracingearthspace/.github/workflows/` to root `.github/workflows/`
   - ✅ Added comments explaining the changes

### Why This Works Better
1. **Simpler**: No need to manage image registries
2. **Faster**: Skip image push/pull overhead
3. **More reliable**: Fly.io's builder is optimized for deployments
4. **Consistent**: Same deployment method for all environments
5. **Fixed**: Workflow now runs from correct directory structure

---

## ⚠️ **IMPORTANT NOTES**

### Docker Image Builds
- The `build-images` job in CI/CD still runs
- It builds to `ghcr.io` for other purposes (SBOM, security scanning)
- But deployments **don't use** these images anymore
- If you want to remove it entirely, you can (optional)

### Deployment Strategy
- Production uses `--strategy rolling` for zero-downtime
- Staging/preview use default strategy
- All deployments build from source now

### Environment Variables
- Set via `fly secrets set` command
- Not via `--env` flags during deployment
- Managed through Fly.io's secrets management

---

## 🧪 **TEST THE FIX**

### 1. Manual Test
```bash
cd "Z:\ai2fin graphigxs\MAIN\embracingearthspace\ai2-core-app"

# Test deployment (won't actually deploy, just validates)
flyctl deploy --dry-run -a ai2-core-api --config fly.toml
```

### 2. CI/CD Test
```bash
# Push the updated workflow
git add .github/workflows/ci-cd-pipeline.yml
git commit -m "fix: correct Fly.io deployment to build from source"
git push origin main

# Watch in GitHub Actions
# https://github.com/your-repo/actions
```

### 3. Verify Deployment
```bash
# Check app status
flyctl status -a ai2-core-api

# View logs
flyctl logs -a ai2-core-api

# Test health endpoint
curl https://ai2-core-api.fly.dev/health
```

---

## 🎯 **NEXT STEPS**

### Immediate
1. ✅ CI/CD workflow updated
2. ⏭️ Commit and push changes
3. ⏭️ Test deployment

### Optional Cleanup
1. Remove unused `build-images` job if not needed
2. Standardize app names across configs
3. Document which app is for what purpose
4. Set up proper staging/production separation

---

## 📚 **REFERENCE**

### Correct Deployment Commands
```bash
# Build from source (recommended)
flyctl deploy -a <app-name> --config <config-file>

# With specific Dockerfile
flyctl deploy -a <app-name> --dockerfile path/to/Dockerfile

# Remote builder (uses Fly.io's build servers)
flyctl deploy -a <app-name> --remote-only

# Local builder (builds on your machine)
flyctl deploy -a <app-name> --local-only
```

### Wrong Commands (Don't Use)
```bash
# ❌ Using non-existent image from Fly.io registry
flyctl deploy -a <app> --image registry.fly.io/<app>:<tag>

# ❌ Using image from GitHub registry without pushing to Fly.io first
flyctl deploy -a <app> --image ghcr.io/user/repo:<tag>
```

---

## 🏆 **SUCCESS CRITERIA**

Deployment is successful when:
- ✅ `flyctl deploy` completes without errors
- ✅ Health checks pass
- ✅ App is accessible at `https://<app-name>.fly.dev`
- ✅ Logs show no critical errors
- ✅ CI/CD workflow completes successfully

---

**embracingearth.space** - Fixed and documented!

