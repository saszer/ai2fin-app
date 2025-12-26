# 🔧 Wazuh Deployment Fix

## ✅ Fixed Issues

1. **local_internal_options.conf format** - Removed comments and empty lines (Wazuh doesn't accept them)
2. **Port handlers** - Fixed to use HTTP/TLS instead of raw TCP
3. **Dockerfile** - Fixed package manager detection

## ⚠️ Current Issue: Lease Conflict

The machine has a lease that expires at `2025-12-26T09:09:35Z`. 

### Solution Options:

**Option 1: Wait for lease to expire** (if it's actually valid)
```powershell
# Wait a few minutes, then try again
fly deploy --app ai2-wazuh --config fly.toml
```

**Option 2: Force destroy and recreate** (if lease is stale)
```powershell
# Stop the machine first
fly machine stop d8dd799b725438 -a ai2-wazuh

# Wait 30 seconds, then destroy
fly machine destroy d8dd799b725438 -a ai2-wazuh --force

# Deploy fresh
fly deploy --app ai2-wazuh --config fly.toml
```

**Option 3: Use Fly.io dashboard**
- Go to https://fly.io/apps/ai2-wazuh/machines
- Manually stop/destroy the machine
- Then deploy

## 📋 Fixed Files

- ✅ `local_internal_options.conf` - Removed comments/empty lines
- ✅ `fly.toml` - Fixed port handlers
- ✅ `Dockerfile` - Fixed package installation

## 🚀 Next Steps

Once the lease is cleared, the deployment should work. The config file errors are now fixed!

