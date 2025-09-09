# 🔍 OpenAI API Key Diagnostic & Fix

## Problem Identified
The logs show **OpenAI API authentication errors** in production:
```
🚨 AuthenticationError: 401 Incorrect API key provided: sk-proj-***8oA"
```

## Root Cause Analysis

### 1. **API Key is Being Loaded**
- ✅ App starts successfully (would crash if `OPENAI_API_KEY` was missing)
- ✅ Config validation passes (`validateRequiredEnvVars()` includes `OPENAI_API_KEY`)
- ✅ UnifiedIntelligenceService initializes with "OpenAI configured" message

### 2. **But API Key is Invalid**
- ❌ OpenAI returns 401 "Incorrect API key provided"
- ❌ Key appears truncated or corrupted: `sk-proj-***8oA"`
- ❌ This suggests the key in Fly.io secrets might be wrong

## Diagnostic Steps

### Step 1: Check Current Fly.io Secrets
```bash
cd ai2-core-app
fly secrets list
```

### Step 2: Verify OpenAI API Key Format
A valid OpenAI API key should look like:
- **Old format**: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (51 chars)
- **New format**: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (56+ chars)

### Step 3: Test API Key Locally
```bash
# Test the API key directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY_HERE"
```

## Likely Issues & Solutions

### Issue 1: **Truncated API Key**
**Problem**: Key got cut off when setting in Fly.io secrets
**Solution**: 
```bash
fly secrets set OPENAI_API_KEY="sk-proj-your-full-api-key-here" -a ai2-core-api
```

### Issue 2: **Wrong API Key**
**Problem**: Using an old, revoked, or incorrect key
**Solution**: 
1. Go to https://platform.openai.com/account/api-keys
2. Generate a new API key
3. Set it in Fly.io:
```bash
fly secrets set OPENAI_API_KEY="sk-proj-new-key-here" -a ai2-core-api
```

### Issue 3: **Encoding Issues**
**Problem**: Special characters in key got mangled
**Solution**: 
```bash
# Use quotes to preserve exact key
fly secrets set OPENAI_API_KEY='sk-proj-exact-key-with-special-chars' -a ai2-core-api
```

### Issue 4: **Environment Variable Name Mismatch**
**Problem**: Key set with wrong name in Fly.io
**Solution**: 
```bash
# Make sure it's exactly OPENAI_API_KEY (not OPENAI_KEY, etc.)
fly secrets set OPENAI_API_KEY="your-key" -a ai2-core-api
```

## Quick Fix Commands

### 1. **Check Current Secrets**
```bash
cd ai2-core-app
fly secrets list -a ai2-core-api
```

### 2. **Set New API Key** (Replace with your actual key)
```bash
fly secrets set OPENAI_API_KEY="sk-proj-your-actual-openai-api-key-here" -a ai2-core-api
```

### 3. **Restart App** (To pick up new secret)
```bash
fly restart -a ai2-core-api
```

### 4. **Verify Fix**
Check logs for:
- ✅ `🧠 UnifiedIntelligenceService: OpenAI configured with enterprise settings`
- ✅ No more "401 Incorrect API key" errors
- ✅ AI categorization works without authentication errors

## Prevention

1. **Always use quotes** when setting API keys in Fly.io secrets
2. **Test API keys** before deploying to production
3. **Monitor API key usage** in OpenAI dashboard
4. **Rotate keys regularly** for security

## Verification

After fixing, the AI categorization should work without 401 errors, and you should see successful OpenAI API calls in the logs.
