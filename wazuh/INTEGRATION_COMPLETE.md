# 🔒 Wazuh SIEM Integration - Complete Setup Guide
## embracingearth.space

---

## ✅ Integration Status

| App | Status | Agent ID | Integration Type |
|-----|--------|----------|------------------|
| ai2-core-api | ✅ Full | 001 | API + Middleware |
| ai2-subs | ✅ Ready | 002 | API Helper |
| ai2-connectors | ✅ Ready | 003 | API Helper |
| ai2-wazuh | ✅ Manager | - | SIEM Platform |

---

## 🔑 Required Secrets (Set Once)

Run these commands to enable Wazuh across all apps:

```bash
# Set Wazuh API credentials for all apps
fly secrets set WAZUH_API_USER=wazuh WAZUH_API_PASSWORD=wazuh -a ai2-core-api
fly secrets set WAZUH_API_USER=wazuh WAZUH_API_PASSWORD=wazuh -a ai2-subs
fly secrets set WAZUH_API_USER=wazuh WAZUH_API_PASSWORD=wazuh -a ai2-connectors
```

**Note:** Replace `wazuh` with your actual Wazuh API password if you changed it.

---

## 📦 What's Integrated

### ai2-core-api (Full Integration)

**Files:**
- `src/lib/wazuh.ts` - Full Wazuh API client with batching & circuit breaker
- `src/middleware/wazuhSecurity.ts` - Security middleware for threat detection
- `src/middleware/databaseSecurity.ts` - SQL/NoSQL injection tracking
- `src/services/securityAlertService.ts` - Slack integration

**Features:**
- ✅ Server start/stop tracking
- ✅ Authentication success/failure
- ✅ Rate limit violations
- ✅ Brute force detection
- ✅ SQL injection attempts
- ✅ XSS attempts
- ✅ Path traversal detection
- ✅ Scanner detection (Nikto, SQLmap, etc.)
- ✅ High-value transaction logging
- ✅ API abuse detection
- ✅ Request pattern analysis

### ai2-subs (Subscription Service)

**Files:**
- `src/lib/wazuhHelper.ts` - Lightweight Wazuh helper

**Features:**
- ✅ Subscription lifecycle events
- ✅ Payment success/failure
- ✅ Webhook tracking (Stripe, RevenueCat)

### ai2-connectors

**Files:**
- `src/lib/wazuhHelper.ts` - Connector-specific Wazuh helper

**Features:**
- ✅ Connector connect/disconnect
- ✅ Sync events
- ✅ High-value transaction detection
- ✅ Credential access logging

---

## 🚀 Deploy Commands

```bash
# Deploy all apps with Wazuh integration
fly deploy -a ai2-core-api
fly deploy -a ai2-subs
fly deploy -a ai2-connectors
```

---

## 📊 View Security Events

### Wazuh Dashboard
1. Open: https://ai2-wazuh.fly.dev/
2. Login: `admin` / `admin`
3. Go to: **Security Events** → **Events**
4. Filter by: `rule.groups: financial_app`

### Event Types

| Rule ID | Event Type | Description |
|---------|------------|-------------|
| 5710 | authentication_failure | Login failed |
| 5711 | authentication_success | Login succeeded |
| 5712 | authorization_failure | Access denied |
| 5713 | rate_limit_exceeded | Rate limit hit |
| 5717 | sql_injection_attempt | SQL injection detected |
| 5718 | xss_attempt | XSS detected |
| 5719 | brute_force_attack | Brute force detected |
| 100001 | high_value_transaction | Transaction > $10k |
| 100003 | connector_anomaly | Banking connector issue |
| 100010 | payment_processing | Payment event |
| 100011 | server_start | Server started |
| 100012 | server_stop | Server shutting down |

---

## 🔧 Using Wazuh in Code

### ai2-core-api

```typescript
import { wazuhClient } from './lib/wazuh';
import { trackAuthSuccess, trackAuthFailure } from './middleware/wazuhSecurity';

// Track auth success
trackAuthSuccess(req);

// Track auth failure
trackAuthFailure(req, 'Invalid password');

// Send custom event
wazuhClient.sendSecurityEvent({
  type: 'high_value_transaction',
  severity: 'low',
  message: 'User processed $50,000 transaction',
  userId: user.id,
  ip: req.ip,
  metadata: { amount: 50000, currency: 'AUD' }
});
```

### ai2-subs

```typescript
import { trackSubscriptionEvent, trackPaymentEvent } from './lib/wazuhHelper';

// Track subscription upgrade
trackSubscriptionEvent('upgraded', userId, { 
  from: 'FREE', 
  to: 'ELITE' 
});

// Track payment failure
trackPaymentEvent('failed', userId, 99.00, {
  reason: 'Card declined',
  provider: 'stripe'
});
```

### ai2-connectors

```typescript
import { sendWazuhEvent } from './lib/wazuhHelper';

// Track connector sync
sendWazuhEvent({
  type: 'connector_sync',
  severity: 'low',
  message: 'Bank account synced',
  userId: user.id,
  metadata: { 
    bank: 'CBA', 
    transactions: 50 
  }
});
```

---

## 🛡️ Security Features

### Automatic Detection
- SQL Injection (UNION SELECT, DROP TABLE, etc.)
- XSS (<script>, javascript:, etc.)
- Path Traversal (../)
- Security Scanners (Nikto, SQLmap, Nmap, etc.)

### Financial-Specific
- High-value transactions (> $10,000)
- Connector anomalies
- Multiple connection attempts
- Payment processing events

### Compliance
- GDPR data export tracking
- Consent changes
- Data deletion requests
- Audit trail

---

## 📈 Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Wazuh Manager (ai2-wazuh.fly.dev)              │
│   Dashboard: 443 | API: 55000 | Agents: 1514 | Syslog: 514  │
└─────────────────────┬───────────────────────────────────────┘
                      │ API Events (Port 55000)
         ┌────────────┼────────────┬────────────┐
         │            │            │            │
    ┌────▼────┐  ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
    │ Core    │  │  Subs   │  │Connectors│ │ Future │
    │  API    │  │ Service │  │ Service  │ │  Apps  │
    │ (001)   │  │  (002)  │  │  (003)   │ │ (004+) │
    └─────────┘  └─────────┘  └──────────┘ └────────┘
```

---

## ✅ Verification Checklist

- [ ] Run `fly secrets set` commands for all apps
- [ ] Deploy all apps with updated configs
- [ ] Check Wazuh Dashboard for events
- [ ] Verify server_start event appears on deploy
- [ ] Test auth failure tracking
- [ ] Verify no performance impact

---

## 🆘 Troubleshooting

**Events not appearing?**
```bash
# Check if secrets are set
fly secrets list -a ai2-core-api

# Check logs for Wazuh errors
fly logs -a ai2-core-api | grep -i wazuh
```

**Circuit breaker opened?**
- Too many API failures triggered circuit breaker
- Check Wazuh Manager is running
- Check API credentials are correct
- Wait 1 minute for automatic reset

**Performance concerns?**
- All events are batched and sent async
- Circuit breaker prevents retry storms
- Fire-and-forget pattern in helper services
