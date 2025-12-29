# Secure Credential Storage - Deployment Guide

**Version:** 1.1.0  
**embracingearth.space**

---

## Overview

This update implements **enterprise-grade secure credential storage** for all bank connector integrations (Plaid, Basiq, Wise, etc.).

### Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  - NEVER receives access tokens                                │
│  - Only receives connectionId                                   │
│  - All sensitive operations via connectionId                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONNECTORS SERVICE                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              SecureCredentialManager                     │   │
│  │  - AES-256-GCM encryption for all credentials           │   │
│  │  - Database persistence (not in-memory)                 │   │
│  │  - Per-user isolation                                   │   │
│  │  - Full audit trail                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  PostgreSQL (Neon)                       │   │
│  │  - Encryption at rest (cloud provider)                  │   │
│  │  - connector_connections (encrypted credentials)        │   │
│  │  - connector_audit_logs (compliance)                    │   │
│  │  - connector_sync_history                               │   │
│  │  - connector_webhook_events                             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deployment Steps

### 1. Set Required Environment Variables

```bash
# On Fly.io
fly secrets set -a ai2-connectors \
  DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/connectors?sslmode=require" \
  CREDENTIAL_ENCRYPTION_KEY="$(openssl rand -base64 32)"
```

**CRITICAL:** 
- `CREDENTIAL_ENCRYPTION_KEY` must be at least 32 characters
- Store this key securely - losing it means losing access to all encrypted credentials
- Must match across all instances of the service

### 2. Run Database Migrations

```bash
cd embracingearthspace/ai2-connectors

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or use migrations for production
npm run db:migrate
```

### 3. Deploy Updated Service

```bash
fly deploy -a ai2-connectors
```

### 4. Verify Deployment

```bash
# Check health
curl https://connectors.ai2fin.com/health

# Check secure storage status (in logs)
fly logs -a ai2-connectors | grep "Secure Credential Storage"
```

---

## New API Flow (Plaid Example)

### Before (INSECURE ❌)
```
1. Client calls /exchange-token
2. Server returns accessToken to client
3. Client passes accessToken in query params for every request
4. Tokens exposed in URLs, logs, browser
```

### After (SECURE ✅)
```
1. Client calls /exchange-token
2. Server encrypts accessToken → stores in DB
3. Server returns connectionId to client (no token!)
4. Client uses connectionId for all future requests
5. Server retrieves + decrypts token internally
6. All operations audit logged
```

---

## API Changes

### Exchange Token Response

**Before:**
```json
{
  "success": true,
  "accessToken": "access-sandbox-xxx",  // ❌ EXPOSED
  "itemId": "xxx"
}
```

**After:**
```json
{
  "success": true,
  "connectionId": "clxyz123...",  // ✅ Safe reference
  "accounts": [...],
  "institution": {...}
}
```

### Fetching Accounts

**Before:**
```
GET /api/connectors/plaid/accounts?accessToken=xxx  // ❌ Token in URL
```

**After:**
```
GET /api/connectors/plaid/connections/{connectionId}/accounts  // ✅ No token
```

### Fetching Transactions

**Before:**
```
GET /api/connectors/plaid/transactions?accessToken=xxx  // ❌ Token in URL
```

**After:**
```
GET /api/connectors/plaid/connections/{connectionId}/transactions  // ✅ No token
```

---

## Audit Logging

All sensitive operations are logged:

| Action | Description |
|--------|-------------|
| `connect` | New connection created |
| `disconnect` | Connection deleted |
| `token_exchange` | OAuth token exchanged |
| `token_refresh` | Token refreshed |
| `credential_store` | Credentials stored/updated |
| `credential_access` | Credentials accessed |
| `credential_delete` | Credentials deleted |
| `account_list` | Accounts fetched |
| `transaction_fetch` | Transactions fetched |
| `sync` | Sync initiated |
| `security_alert` | Security issue detected |

### Viewing Audit Logs

```sql
-- Recent audit logs for a user
SELECT * FROM connector_audit_logs 
WHERE user_id = 'xxx' 
ORDER BY timestamp DESC 
LIMIT 100;

-- Security alerts
SELECT * FROM connector_audit_logs 
WHERE action = 'security_alert' 
ORDER BY timestamp DESC;
```

---

## Database Schema

### connector_connections
- `id` - Connection ID (returned to client)
- `user_id` - User who owns connection
- `connector_id` - 'plaid', 'basiq', etc.
- `encrypted_credentials` - AES-256-GCM encrypted JSON
- `accounts` - JSON array of linked accounts
- `status` - connected, syncing, error, expired
- `last_sync` - Last successful sync
- `settings` - User preferences

### connector_audit_logs
- Full audit trail of all operations
- Sanitized (no credentials logged)
- Request context (IP, user agent)
- Timing for performance analysis

---

## Security Compliance

This implementation supports:

- ✅ **SOC 2 Type II** - Audit logging, access controls
- ✅ **GDPR** - Data minimization, right to erasure
- ✅ **PCI DSS** - Encrypted credential storage
- ✅ **Plaid Security Requirements** - Secure token storage

---

## Troubleshooting

### "Credentials not found for connection"
- Connection may have been deleted
- Check if connectionId is valid

### "Encryption key required"
- `CREDENTIAL_ENCRYPTION_KEY` not set in production
- Must be at least 32 characters

### "Database connection failed"
- Check `DATABASE_URL` is set correctly
- Verify Neon database is accessible

---

## Frontend Updates Required

Update frontend to use `connectionId` pattern:

```typescript
// Store connectionId from exchange response
const { connectionId } = await api.post('/api/connectors/plaid/exchange-token', { 
  publicToken, 
  metadata 
});

// Use connectionId for all requests
const accounts = await api.get(`/api/connectors/plaid/connections/${connectionId}/accounts`);
const transactions = await api.get(`/api/connectors/plaid/connections/${connectionId}/transactions`);
```

---

**Document Location:** `embracingearthspace/ai2-connectors/SECURE_CREDENTIAL_STORAGE_GUIDE.md`




