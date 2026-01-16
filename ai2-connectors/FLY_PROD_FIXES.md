# Fly.io Production Fixes - ai2-connectors

**Date:** 2026-01-11  
**Service:** ai2-connectors  
**Issues Fixed:** Critical app crashes causing restart loops

## 🔴 Critical Issues Identified

### Issue 1: Unhandled Wazuh Syslog Transport Errors
**Symptom:** App crashes with `Error: getaddrinfo ENOTFOUND ai2-wazuh.internal`  
**Root Cause:** Winston syslog transport emits unhandled error events when Wazuh host is unreachable, causing Node.js to crash  
**Impact:** App restarts continuously, reaching max restart count (10)

**Fix Applied:**
- Added error handler to syslog transport: `syslogTransport.on('error', ...)`
- Added logger-level error handler: `wazuhLogger.on('error', ...)`
- Added exception and rejection handlers to Winston logger config
- App now gracefully degrades to console logging when Wazuh is unavailable

**Files Modified:**
- `src/utils/wazuh-logger.ts`

### Issue 2: Missing Database Table
**Symptom:** `The table 'public.connector_connections' does not exist in the current database`  
**Root Cause:** Prisma schema exists but migrations haven't been run in production  
**Impact:** 500 errors on `/api/connectors/bank/connections` endpoint

**Fix Applied:**
- Added startup schema validation function `validateDatabaseSchema()`
- Checks for required tables before server starts
- Provides clear error messages with migration instructions
- In production, exits with error code if schema is missing
- In development, warns but continues (for faster iteration)

**Files Modified:**
- `src/server.ts`

### Issue 3: Server Binding
**Fix Applied:**
- Explicitly bind server to `0.0.0.0` (all interfaces) for Fly.io compatibility
- Ensures app listens on correct interface for Fly proxy

**Files Modified:**
- `src/server.ts`

## 📋 Required Actions

### 1. Run Database Migrations
```bash
cd ai2-connectors
npx prisma migrate deploy
# OR for development:
npm run db:push
```

### 2. Verify Wazuh Configuration (Optional)
If Wazuh service is not available, you can disable it:
```bash
fly secrets set WAZUH_HOST=disabled -a ai2-connectors
```

Or ensure Wazuh service is running and reachable:
```bash
# Check if Wazuh app exists and is running
fly status -a ai2-wazuh
```

### 3. Deploy Fixed Code
```bash
cd ai2-connectors
fly deploy -a ai2-connectors
```

## ✅ Verification

After deployment, check logs:
```bash
fly logs -a ai2-connectors
```

Expected output:
- ✅ `Database schema validated - connector_connections table exists`
- ✅ `[Wazuh] Syslog transport configured` (or graceful error if unavailable)
- ✅ `Connectors Service running on port 3003`
- ❌ No more `ENOTFOUND ai2-wazuh.internal` crashes
- ❌ No more `table does not exist` errors

## 🏗️ Architecture Notes

**Error Handling Philosophy:**
- Non-critical services (like Wazuh logging) should never crash the app
- All external dependencies must have graceful degradation
- Startup validation prevents runtime errors
- Clear error messages guide operators to solutions

**Resilience Pattern:**
1. Try to connect to optional services (Wazuh)
2. If connection fails, log warning and continue
3. Never throw unhandled errors from transport layers
4. Always provide fallback (console logging)

embracingearth.space - Enterprise-grade error handling
