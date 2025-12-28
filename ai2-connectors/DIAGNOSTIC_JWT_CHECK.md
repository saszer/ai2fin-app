# JWT_SECRET Diagnostic Check

## Quick Diagnosis

The "invalid signature" error means the JWT_SECRET values don't match between services.

## Step-by-Step Fix

### 1. Check Current JWT_SECRET Values

```powershell
# Check core app JWT_SECRET
fly secrets get JWT_SECRET -a ai2-core-api

# Check connectors JWT_SECRET  
fly secrets get JWT_SECRET -a ai2-connectors
```

**They MUST be identical!**

### 2. If Different, Sync Them

```powershell
# Option A: Copy from core app to connectors
$coreSecret = fly secrets get JWT_SECRET -a ai2-core-api
fly secrets set -a ai2-connectors JWT_SECRET="$coreSecret"

# Option B: Set both to a new value (if you want to rotate)
$newSecret = "your-new-secret-value-min-32-chars"
fly secrets set -a ai2-core-api JWT_SECRET="$newSecret"
fly secrets set -a ai2-connectors JWT_SECRET="$newSecret"
```

### 3. Restart Services

```powershell
# Restart connectors service
fly apps restart ai2-connectors

# Restart core app
fly apps restart ai2-core-api
```

### 4. Verify Fix

After restart, check logs:
- ✅ **Success**: `🔌 Connector Access: user@email.com - GET /api/connectors/providers`
- ❌ **Still failing**: Check enhanced error logs for specific error type

## Why This Happens

JWT tokens are **signed** with one secret and **verified** with another:
- Core app **signs** tokens with its JWT_SECRET
- Connectors service **verifies** tokens with its JWT_SECRET
- If secrets don't match → "invalid signature" error

## Important Notes

⚠️ **After changing JWT_SECRET:**
- All existing user tokens become invalid
- Users must log in again
- This is expected behavior for security

⚠️ **Secret Requirements:**
- Minimum 32 characters recommended
- Use a strong random string
- Never commit to git
- Store securely in Fly.io secrets

## Alternative: Use Service-to-Service Auth

If you want to avoid JWT_SECRET sync issues, you could use service-to-service authentication:

```typescript
// In serviceDiscovery.ts, add SERVICE_SECRET header instead
headers['x-service-token'] = process.env.SERVICE_SECRET;
```

But JWT is better for user authentication, so matching JWT_SECRET is the correct solution.






