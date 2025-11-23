# 🚀 Real-Time Transactions - Setup Guide

**Complete setup instructions for real-time transaction processing**

---

## ✅ Implementation Status

All code has been implemented. Follow these steps to enable real-time transactions.

---

## 📋 Prerequisites

1. ✅ Code implemented (all files created)
2. ⚠️ Dependencies need to be installed
3. ⚠️ Environment variables need to be configured
4. ⚠️ Webhooks need to be configured in provider dashboards

---

## 🔧 Step 1: Install Dependencies

### Connectors Service

```bash
cd embracingearthspace/ai2-connectors
npm install socket.io crypto
```

### Frontend Client

```bash
cd embracingearthspace/ai2-core-app/client
npm install socket.io-client
```

---

## 🔐 Step 2: Configure Environment Variables

### Connectors Service (`.env`)

```bash
# Existing
JWT_SECRET=your_jwt_secret
CREDENTIAL_ENCRYPTION_KEY=your_encryption_key_min_32_chars
CONNECTORS_PORT=3003

# New - Real-time support
BASIQ_WEBHOOK_SECRET=your_basiq_webhook_secret
APIDECK_WEBHOOK_SECRET=your_apideck_webhook_secret
CORE_APP_URL=http://localhost:3001
SERVICE_SECRET=your_service_secret
FRONTEND_URL=http://localhost:3000
```

### Frontend Client (`.env`)

```bash
# Add to .env or .env.local
REACT_APP_CONNECTORS_URL=http://localhost:3003
```

---

## 🔗 Step 3: Configure Basiq Webhooks

1. **Login to Basiq Dashboard**
   - Go to https://dashboard.basiq.io
   - Navigate to **Settings** → **Webhooks**

2. **Create Webhook**
   - Click **Add Webhook**
   - URL: `https://yourapp.com/api/connectors/basiq/webhook`
   - Events to subscribe:
     - ✅ `transaction.created`
     - ✅ `transaction.updated`
     - ✅ `connection.created` (optional)
     - ✅ `connection.updated` (optional)
     - ✅ `job.completed` (optional)

3. **Copy Webhook Secret**
   - Copy the webhook secret
   - Add to `BASIQ_WEBHOOK_SECRET` environment variable

4. **Test Webhook**
   - Basiq will send a test webhook
   - Verify it's received in your logs

---

## 🔗 Step 4: Configure Apideck Webhooks

1. **Login to Apideck Dashboard**
   - Go to https://app.apideck.com
   - Navigate to **Webhooks**

2. **Create Webhook**
   - Click **Add Webhook**
   - URL: `https://yourapp.com/api/connectors/apideck/webhook`
   - Events to subscribe:
     - ✅ `accounting.transaction.created`
     - ✅ `accounting.transaction.updated`
     - ✅ `vault.connection.created` (existing)
     - ✅ `vault.connection.updated` (existing)

3. **Copy Webhook Secret**
   - Copy the webhook secret
   - Add to `APIDECK_WEBHOOK_SECRET` environment variable

---

## 🧪 Step 5: Test Real-Time Flow

### Test Webhook Reception

1. **Start connectors service:**
   ```bash
   cd ai2-connectors
   npm run dev
   ```

2. **Check logs for:**
   ```
   ✅ RealtimeTransactionService initialized
   ⚡ WebSocket Server: Enabled (Socket.io)
   🔔 Real-time Transactions: Enabled
   ```

3. **Trigger test transaction** (if possible via provider dashboard)

4. **Verify webhook received:**
   ```
   📨 Basiq webhook received: transaction.created
   ✅ Processed Basiq transaction: txn_123
   ```

### Test WebSocket Connection

1. **Start frontend:**
   ```bash
   cd ai2-core-app/client
   npm start
   ```

2. **Open browser console:**
   - Should see: `✅ Connected to WebSocket server`
   - Should see: `✅ Authenticated with WebSocket server`

3. **Trigger transaction:**
   - Create transaction via connector
   - Should see: `📨 New transaction received: txn_123`
   - UI should update automatically

---

## 📊 Step 6: Verify End-to-End Flow

### Complete Flow Test

1. **User connects Basiq/Apideck** via Connectors page
2. **Transaction occurs** in bank/accounting platform
3. **Webhook received** by connectors service
4. **Transaction processed** and normalized
5. **Transaction stored** in core app database
6. **WebSocket event** sent to frontend
7. **Frontend updates** UI automatically

### Verification Checklist

- [ ] Webhook endpoint accessible
- [ ] Webhook signature verified
- [ ] Transaction normalized correctly
- [ ] Transaction stored in core app
- [ ] WebSocket connection established
- [ ] Frontend receives update
- [ ] UI updates automatically

---

## 🔍 Troubleshooting

### Webhooks Not Received

**Check:**
1. Webhook URL is publicly accessible
2. Webhook secret matches
3. Provider webhook is enabled
4. Firewall/network allows incoming requests

**Debug:**
```bash
# Check webhook endpoint
curl -X POST http://localhost:3003/api/connectors/basiq/webhook \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "data": {}}'
```

### WebSocket Not Connecting

**Check:**
1. `REACT_APP_CONNECTORS_URL` is set correctly
2. CORS is configured in Socket.io
3. Firewall allows WebSocket connections
4. Authentication token is valid

**Debug:**
```javascript
// In browser console
const socket = io('http://localhost:3003');
socket.on('connect', () => console.log('Connected'));
socket.on('error', (err) => console.error('Error:', err));
```

### Transactions Not Stored

**Check:**
1. `CORE_APP_URL` is correct
2. `SERVICE_SECRET` matches core app
3. Core app endpoint exists
4. User ID is valid

**Debug:**
- Check connectors service logs
- Check core app logs
- Verify transaction format

---

## 🎯 Production Deployment

### Security Checklist

- [ ] Webhook secrets stored securely (not in code)
- [ ] HTTPS enabled for webhook endpoints
- [ ] WebSocket over WSS (secure WebSocket)
- [ ] Rate limiting enabled
- [ ] Authentication verified
- [ ] CORS configured correctly

### Scaling Considerations

- **Single Server:** Handles ~10k concurrent WebSocket connections
- **Multiple Servers:** Use Redis adapter for Socket.io
- **Load Balancing:** Requires sticky sessions for WebSocket

### Monitoring

- Monitor webhook reception rate
- Monitor WebSocket connection count
- Monitor transaction processing latency
- Alert on webhook failures

---

## 📚 API Reference

### Webhook Endpoints

**Basiq:**
```
POST /api/connectors/basiq/webhook
Headers: X-Basiq-Signature: sha256=<signature>
```

**Apideck:**
```
POST /api/connectors/apideck/webhook
Headers: X-Apideck-Signature: <signature>
```

### WebSocket Events

**Client → Server:**
- `authenticate` - Authenticate connection
- `ping` - Health check

**Server → Client:**
- `transaction:new` - New transaction received
- `transaction:updated` - Transaction updated
- `sync:complete` - Sync completed
- `authenticated` - Authentication successful
- `error` - Error occurred

---

## 🎉 Success Indicators

When everything is working:

1. ✅ Webhooks received in logs
2. ✅ Transactions stored in database
3. ✅ WebSocket connections active
4. ✅ Frontend receives updates
5. ✅ UI updates automatically
6. ✅ No errors in console

---

**Built with ❤️ for [embracingearth.space](https://embracingearth.space)**

*Real-time financial automation • Instant updates • Enterprise-grade reliability*

