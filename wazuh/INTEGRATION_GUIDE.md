# Wazuh Integration Setup & Verification Guide
## embracingearth.space - Security Monitoring

## Current Status

✅ **Wazuh Manager** deployed and running: `https://ai2-wazuh.fly.dev/`
✅ **Dashboard** accessible (needs configuration)
✅ **ai2-core-api** has Wazuh client code integrated
✅ **Environment variables** configured in ai2-core-api

## Issue: Dashboard Configuration Error

**Error**: `Cannot read properties of undefined (reading 'connection')`

**Root Cause**: The Wazuh Dashboard hasn't been configured with the Manager API connection yet.

---

## Quick Fix (5 minutes)

### Step 1: Complete Dashboard Setup (Manual - Browser)

1. **Visit Dashboard**: https://ai2-wazuh.fly.dev/
2. **Login** (if prompted):
   - Username: `admin`
   - Password: (check `fly secrets list -a ai2-wazuh` for `OPENSEARCH_DASHBOARDS_PASSWORD`)
3. **Add API Connection**:
   - **Option A**: Click "Go to Settings" on the error page
   - **Option B**: Navigate to Settings icon (⚙️) on left sidebar
4. **Configure API**:
   ```
   URL: https://localhost
   Port: 55000
   Username: wazuh
   Password: <from WAZUH_API_PASSWORD secret>
   ```
5. **Save** and return to Overview

### Step 2: Verify ai2-core-api is Sending Events

**Check Current Config**:
```bash
fly ssh console -a ai2-core-api -C "printenv | grep WAZUH"
```

**Expected Output**:
```
WAZUH_ENABLED=true
WAZUH_MANAGER_URL=https://ai2-wazuh.internal
WAZUH_API_USER=wazuh
WAZUH_API_PASSWORD=<password>
```

**If `WAZUH_ENABLED=false`**:
```bash
fly secrets set WAZUH_ENABLED=true -a ai2-core-api
```

### Step 3: Send Test Event

**Option A: Via Application** (trigger real events):
```bash
# Make API requests to ai2-core-api
curl https://ai2-core-api.fly.dev/api/health
curl https://ai2-core-api.fly.dev/api/auth/login -X POST -d '{"email":"test@test.com","password":"wrong"}'
```

**Option B: Via Test Script**:
```bash
# From inside ai2-core-api
fly ssh console -a ai2-core-api -C "cd /app && node test-wazuh.js"
```

### Step 4: Verify Events in Dashboard

1. **Go to Dashboard**: https://ai2-wazuh.fly.dev/
2. **Navigate to**:
   - **Overview** → should see recent events count
   - **Security Events** → detailed event list
   - **Agents** → verify "ai2-core-api" agent is active
3. **Look for**:
   - Authentication events (5710, 5711)
   - Rate limit events (5713)
   - Custom financial app events (100xxx)

---

## Event Types Configured

### Standard Security Events
- `authentication_failure` (5710) - Failed logins
- `authentication_success` (5711) - Successful logins
- `authorization_failure` (5712) - Permission denied
- `rate_limit_exceeded` (5713) - Rate limiting triggered
- `jwt_verification_failed` (5714) - Invalid tokens
- `suspicious_activity` (5715) - Anomaly detected
- `sql_injection_attempt` (5717) - SQL injection
- `xss_attempt` (5718) - XSS attacks
- `brute_force_attack` (5719) - Brute force

### Financial App Specific Events
- `high_value_transaction` (100001) - Large transactions
- `credential_abuse` (100002) - Credential misuse
- `connector_anomaly` (100003) - Bank connector issues
- `rapid_auth_failure` (100005) - Multiple failed logins
- `api_abuse` (100006) - API abuse detected
- `user_anomaly` (100007) - User behavior anomaly
- `data_export` (100009) - Data export events
- `payment_processing` (100010) - Payment events

### Lifecycle Events
- `server_start` (100011) - Server startup
- `server_stop` (100012) - Server shutdown

### Compliance Events
- `gdpr_data_request` (100013) - GDPR data request
- `gdpr_data_deletion` (100014) - GDPR deletion
- `consent_change` (100015) - Consent updates

---

## Architecture

### Event Flow
```
ai2-core-api (Application)
    ↓ (winston logger + wazuhClient)
    ↓ Queue events (batched every 3 seconds)
    ↓ HTTP POST to Wazuh Manager API
    ↓
Wazuh Manager (:55000 API, :1514 Agent)
    ↓ Index events
    ↓
Wazuh Indexer (:9200 OpenSearch)
    ↓ Store and analyze
    ↓
Wazuh Dashboard (:5601 Kibana fork)
    ↓ Visualize and alert
    ↓
Security Team (Browser)
```

### Internal Networking (Fly.io)
- **ai2-core-api** → `ai2-wazuh.internal:55000` (Manager API)
- **Public** → `https://ai2-wazuh.fly.dev/` (Dashboard HTTPS)

### Performance Optimizations
- **Event batching**: 3-second intervals (critical events flush immediately)
- **Circuit breaker**: Stops sending after 10 failures (auto-reset after 1 min)
- **Queue size limit**: 500 events max (prevents memory issues)
- **Error suppression**: Log once per minute per error type
- **Parallel batch send**: 10 events at a time

---

## Troubleshooting

### Dashboard Shows Connection Error
**Symptom**: `Cannot read properties of undefined (reading 'connection')`  
**Fix**: Complete "Step 1: Complete Dashboard Setup" above

### No Events Appearing
1. **Check WAZUH_ENABLED**:
   ```bash
   fly ssh console -a ai2-core-api -C "printenv | grep WAZUH_ENABLED"
   ```
   Should be `true`

2. **Check logs for errors**:
   ```bash
   fly logs -a ai2-core-api | grep -i wazuh
   ```

3. **Verify Manager API is accessible**:
   ```bash
   fly ssh console -a ai2-core-api -C "curl -k https://ai2-wazuh.internal:55000 -m 5"
   ```

### "Invalid credentials" Error
**Symptom**: API returns 401 Unauthorized  
**Fix**: Verify password matches:
```bash
# Get the correct password
fly secrets list -a ai2-wazuh | grep WAZUH_API_PASSWORD

# Update in ai2-core-api if different
fly secrets set WAZUH_API_PASSWORD=<correct-password> -a ai2-core-api
```

### Circuit Breaker Opened
**Symptom**: Logs show "circuit breaker opened"  
**Cause**: Too many consecutive API failures (10+)  
**Fix**: Resolves automatically after 1 minute if Manager is healthy

### High Memory Usage
**Symptom**: Wazuh VM running out of memory  
**Fix**: Increase VM size or tune Indexer heap:
```bash
fly scale vm dedicated-cpu-2x --vm-memory 4096 -a ai2-wazuh
```

---

## Security Best Practices

### 1. Rotate API Credentials
```bash
# Generate strong password
NEW_PW=$(openssl rand -base64 32)

# Update Wazuh Manager
fly ssh console -a ai2-wazuh -C "/var/ossec/bin/wazuh-authd -u wazuh -p '$NEW_PW'"

# Update secrets
fly secrets set WAZUH_API_PASSWORD=$NEW_PW -a ai2-wazuh
fly secrets set WAZUH_API_PASSWORD=$NEW_PW -a ai2-core-api
```

### 2. Enable TLS Verification (Production)
In `ai2-core-app/src/lib/wazuh.ts`:
```typescript
// Change from:
validateStatus: () => true

// To:
httpsAgent: new https.Agent({
  rejectUnauthorized: true, // Enforce TLS cert validation
  ca: fs.readFileSync('/path/to/wazuh-ca.pem')
})
```

### 3. Set Up Alerts
Configure Wazuh to send alerts for:
- Multiple failed logins (brute force)
- High-value transactions
- Unusual API usage patterns
- Data export events
- GDPR requests

### 4. Regular Monitoring
- **Daily**: Review Dashboard → Overview for anomalies
- **Weekly**: Check Security Events for patterns
- **Monthly**: Audit event volume and adjust batching if needed

---

## Next Steps

1. ✅ Complete Dashboard setup (see Step 1)
2. ✅ Verify `WAZUH_ENABLED=true` in ai2-core-api
3. ✅ Generate test events (see Step 3)
4. ✅ Confirm events appear in Dashboard (see Step 4)
5. 🔲 Set up custom alerts for your use cases
6. 🔲 Configure retention policies for compliance
7. 🔲 Integrate with incident response workflows

---

## Resources

- **Wazuh Docs**: https://documentation.wazuh.com/current/
- **OpenSearch Docs**: https://opensearch.org/docs/latest/
- **Fly.io Internal Networking**: https://fly.io/docs/reference/private-networking/

---

## Support

For issues or questions, check:
1. **Wazuh Logs**: `fly logs -a ai2-wazuh`
2. **Core App Logs**: `fly logs -a ai2-core-api | grep -i wazuh`
3. **Dashboard UI**: Settings → Troubleshooting
4. **This Guide**: Review troubleshooting section above

---

**Built for embracingearth.space** - Enterprise-grade security monitoring for financial applications.
