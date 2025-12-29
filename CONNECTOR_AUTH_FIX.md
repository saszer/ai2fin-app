# Connector Authentication Fix - Complete Guide

## Issues Identified

1. **404 Error**: `/api/bank/connections` path was incorrect - should be `/api/connectors/bank/connections`
2. **401/403 Errors**: JWT token authentication failing with "invalid signature"
3. **Missing Authorization Headers**: Service calls not passing auth tokens
4. **Cloudflare Origin Lock**: 403 errors if origin header not passed

## Fixes Applied

### 1. Fixed All Connector Service Paths ✅

Updated all `callService` calls in `bankFeed.ts` to use correct paths:
- ✅ `GET /api/connectors/bank/connections`
- ✅ `POST /api/connectors/bank/connections`
- ✅ `POST /api/connectors/bank/connections/:id/sync`
- ✅ `DELETE /api/connectors/bank/connections/:id`
- ✅ `GET /api/connectors/bank/connections/:id/accounts/:accountId/transactions`
- ✅ `GET /api/connectors/bank/connections/:id/accounts/:accountId/balance`

### 2. Added Authorization Headers ✅

All service calls now pass the `Authorization` header:
```typescript
await serviceDiscovery.callService('connectors', '/api/connectors/...', 'GET', undefined, {
  'Authorization': req.headers.authorization || ''
});
```

### 3. Added Cloudflare Origin Lock Support ✅

Service discovery now automatically passes the origin header for connectors service:
```typescript
// Automatically adds x-origin-auth header if ORIGIN_SHARED_SECRET is set
if (serviceName === 'connectors' && process.env.ORIGIN_SHARED_SECRET) {
  finalHeaders[originHeaderName] = process.env.ORIGIN_SHARED_SECRET;
}
```

### 4. Enhanced Error Logging ✅

Connectors service now provides detailed JWT error information for debugging.

## Action Required: JWT_SECRET Configuration

**CRITICAL**: The `JWT_SECRET` environment variable must be **identical** in both services.

**Error**: `Connector auth failed: invalid signature`

**Root Cause**: JWT tokens are signed with one secret but verified with a different secret.

**Fix**:
```powershell
# Step 1: Check current values (they should match)
fly secrets get JWT_SECRET -a ai2-core-api
fly secrets get JWT_SECRET -a ai2-connectors

# Step 2: If different, set them to match
# Get the value from core app first
$coreSecret = fly secrets get JWT_SECRET -a ai2-core-api

# Set connectors to match
fly secrets set -a ai2-connectors JWT_SECRET="$coreSecret"

# Or set both to a new value
fly secrets set -a ai2-core-api JWT_SECRET="your-new-secret-value"
fly secrets set -a ai2-connectors JWT_SECRET="your-new-secret-value"
```

**Important**: After changing JWT_SECRET, all existing tokens will be invalid. Users will need to log in again.

## Cloudflare Origin Lock Configuration

If you're using Cloudflare Origin Lock, ensure both services have the same secret:

```powershell
# Set in both services (must match)
fly secrets set -a ai2-core-api ORIGIN_SHARED_SECRET="your-origin-secret"
fly secrets set -a ai2-connectors ORIGIN_SHARED_SECRET="your-origin-secret"

# Enable in connectors service (optional)
fly secrets set -a ai2-connectors ENFORCE_CF_ORIGIN_LOCK="true"
```

**Note**: Origin Lock is automatically handled by service discovery - no code changes needed.

## Verification Steps

### 1. Check JWT_SECRET matches:
```powershell
# Both should show the same value
fly secrets get JWT_SECRET -a ai2-core-api
fly secrets get JWT_SECRET -a ai2-connectors
```

### 2. Test authentication:
```bash
# Get a token from core app
curl -X POST https://your-core-app.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"..."}'

# Use token to call connectors
curl -X GET https://connectors.ai2fin.com/api/connectors/providers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Check logs:
- **Success**: Connectors service should show: `🔌 Connector Access: user@email.com - GET /api/connectors/providers`
- **Failure**: Enhanced error logs will show specific JWT error type (format invalid, expired, secret mismatch, etc.)

### 4. Verify paths:
- Check that all calls use `/api/connectors/...` paths
- No more 404 errors on `/api/bank/connections`

## Troubleshooting

### "invalid signature" error persists:
1. ✅ Verify JWT_SECRET matches in both services
2. ✅ Restart both services after changing JWT_SECRET
3. ✅ Check that tokens are being passed in Authorization header
4. ✅ Verify token format: `Bearer <token>` (not just `<token>`)

### 403 errors persist:
1. ✅ Check if Cloudflare Origin Lock is enabled
2. ✅ Verify ORIGIN_SHARED_SECRET matches in both services
3. ✅ Check ORIGIN_HEADER_NAME matches (default: `x-origin-auth`)
4. ✅ Verify service discovery is passing the origin header

### 404 errors persist:
1. ✅ Verify all paths use `/api/connectors/...` prefix
2. ✅ Check that connectors service routes are registered
3. ✅ Verify service discovery is finding the connectors service

## Summary

✅ **Fixed**: All connector service paths
✅ **Fixed**: Authorization headers being passed
✅ **Fixed**: Cloudflare Origin Lock header support
✅ **Fixed**: Enhanced error logging for debugging
⚠️ **Action Required**: Ensure `JWT_SECRET` matches in both services
⚠️ **Optional**: Configure Cloudflare Origin Lock if using it

**Next Steps**:
1. Set matching JWT_SECRET in both services
2. Restart both services
3. Test authentication
4. Monitor logs for success messages








