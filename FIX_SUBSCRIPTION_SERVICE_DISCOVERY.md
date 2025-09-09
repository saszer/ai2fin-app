# 🔧 Fix Subscription Service Discovery on Fly.io

## Problem Identified
Your core app (`ai2-core-api`) can't detect the subscription service (`ai2-subs`) because:

1. ❌ **Missing Environment Variable**: `SUBSCRIPTION_SERVICE_URL` not set in production
2. ❌ **Default to localhost**: Falls back to `http://localhost:3010` (doesn't exist on Fly.io)
3. ❌ **Service Discovery Fails**: Can't reach subscription service for feature checks

## Solution

### Step 1: Set Production Environment Variable
```bash
# Set the subscription service URL in your core app
fly secrets set SUBSCRIPTION_SERVICE_URL=https://ai2-subs.fly.dev -a ai2-core-api
```

### Step 2: Verify Subscription Service is Running
```bash
# Check if subscription service is deployed and running
fly status -a ai2-subs

# If not running, deploy it:
cd ai2-subscription-service
fly deploy
```

### Step 3: Test Connectivity
```bash
# Test if core app can reach subscription service
curl https://ai2-subs.fly.dev/health
```

### Step 4: Restart Core App
```bash
# Restart core app to pick up new environment variable
fly restart -a ai2-core-api
```

## Expected Result
After this fix:
- ✅ Service discovery will detect subscription service as "online"
- ✅ Smart categorization will work (subscription checks will pass)
- ✅ Premium features will be properly gated

## Alternative: Disable Premium Gating (Temporary)
If you want to bypass subscription checks entirely:
```bash
fly secrets set ENABLE_PREMIUM_GATING=false -a ai2-core-api
```

## Verification
Check service discovery status:
```
GET https://api.ai2fin.com/api/services/status
```

Should show subscription service as "online" instead of "offline".
