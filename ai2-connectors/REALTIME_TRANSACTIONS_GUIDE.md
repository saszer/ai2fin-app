# ⚡ Real-Time Transactions - Implementation Guide

**How to get real-time transaction updates as they happen in AI2Fin**

---

## 🔍 Current Status

**Why connectors are not real-time:**

Most connectors currently use **polling** (periodic sync) instead of real-time webhooks:

- ✅ **Webhooks supported** - Infrastructure exists
- ❌ **Transaction webhooks not implemented** - Only connection status webhooks
- ❌ **No WebSocket/SSE** - Frontend doesn't receive real-time updates
- ❌ **Polling only** - Sync happens on schedule (every 60 minutes by default)

---

## 🎯 Real-Time Options

### Option 1: Webhook-Based (Recommended)

**How it works:**
```
Transaction happens → Provider sends webhook → AI2Fin processes → Frontend updates
```

**Architecture:**
1. Provider (bank/accounting) sends webhook when transaction occurs
2. AI2Fin webhook endpoint receives transaction data
3. Transaction processed and stored
4. Frontend notified via WebSocket/SSE
5. User sees transaction immediately

**Supported Providers:**
- ✅ **Apideck** - Supports transaction webhooks (needs configuration)
- ✅ **Basiq** - Supports transaction webhooks
- ✅ **Stripe** - Real-time payment webhooks
- ✅ **Plaid** - Transaction webhooks (if integrated)
- ✅ **SMS UPI** - Real-time SMS forwarding

---

### Option 2: WebSocket/Server-Sent Events (SSE)

**How it works:**
```
Transaction processed → Backend → WebSocket/SSE → Frontend updates
```

**Architecture:**
1. Backend processes transaction (via webhook or polling)
2. Backend sends update via WebSocket/SSE
3. Frontend receives update instantly
4. UI updates without refresh

---

### Option 3: Polling with Short Intervals

**How it works:**
```
Frontend polls → Backend checks → New transactions → Frontend updates
```

**Architecture:**
1. Frontend polls every 30-60 seconds
2. Backend checks for new transactions
3. Returns only new transactions
4. Frontend updates UI

**Limitations:**
- ❌ Not truly real-time (30-60 second delay)
- ❌ Increased server load
- ❌ Battery drain on mobile

---

## 🏗️ Implementation: Webhook-Based Real-Time

### Step 1: Enable Transaction Webhooks

#### For Apideck:

```typescript
// In Apideck dashboard, configure webhook:
// Event: accounting.transaction.created
// URL: https://yourapp.com/api/connectors/apideck/webhook/transactions
```

#### For Basiq:

```typescript
// In Basiq dashboard, configure webhook:
// Event: transaction.created
// URL: https://yourapp.com/api/connectors/basiq/webhook/transactions
```

---

### Step 2: Create Transaction Webhook Endpoint

```typescript
// src/routes/apideck.ts

/**
 * POST /api/connectors/apideck/webhook/transactions
 * Handle real-time transaction webhooks from Apideck
 */
router.post('/webhook/transactions', async (req: Request, res: Response) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-apideck-signature'] as string;
    const webhookSecret = process.env.APIDECK_WEBHOOK_SECRET || '';
    
    if (webhookSecret && signature) {
      const isValid = apideckVaultService.verifyWebhookSignature(
        JSON.stringify(req.body),
        signature,
        webhookSecret
      );
      
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { event_type, data } = req.body;

    // Handle transaction events
    switch (event_type) {
      case 'accounting.transaction.created':
      case 'accounting.transaction.updated':
        await handleTransactionWebhook(data);
        break;
      
      default:
        console.log('Unhandled transaction webhook:', event_type);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Transaction webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleTransactionWebhook(transactionData: any) {
  // 1. Find connection by consumerId and serviceId
  const consumerId = transactionData.consumer_id;
  const serviceId = transactionData.service_id;
  
  // 2. Get connection from database
  const connection = await findConnectionByConsumerAndService(consumerId, serviceId);
  if (!connection) {
    console.error('Connection not found for transaction webhook');
    return;
  }

  // 3. Normalize transaction
  const connector = connectorRegistry.getConnector('apideck');
  const credentials = await credentialManager.getCredentials(connection.id, connection.userId);
  
  const normalizedTransaction = await connector.normalizeTransaction(
    transactionData,
    connection.userId,
    transactionData.account_id,
    connection.id
  );

  // 4. Store transaction
  await storeTransaction(normalizedTransaction);

  // 5. Notify frontend via WebSocket/SSE
  await notifyFrontend(connection.userId, normalizedTransaction);
}
```

---

### Step 3: WebSocket/SSE Server

```typescript
// src/services/RealtimeTransactionService.ts

import { Server } from 'socket.io';
import { EventEmitter } from 'events';

export class RealtimeTransactionService {
  private io: Server;
  private eventEmitter: EventEmitter;

  constructor(io: Server) {
    this.io = io;
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Notify frontend of new transaction
   */
  async notifyTransaction(userId: string, transaction: StandardTransaction) {
    // Emit to user's room
    this.io.to(`user:${userId}`).emit('transaction:new', {
      transaction,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Setup WebSocket connection
   */
  setupConnection(socket: any) {
    // User joins their room
    socket.on('authenticate', (userId: string) => {
      socket.join(`user:${userId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  }
}
```

---

### Step 4: Frontend WebSocket Client

```typescript
// client/src/services/realtimeTransactions.ts

import io from 'socket.io-client';

class RealtimeTransactionService {
  private socket: any;
  private userId: string;

  connect(userId: string, token: string) {
    this.userId = userId;
    
    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3000', {
      auth: { token }
    });

    // Authenticate
    this.socket.emit('authenticate', userId);

    // Listen for new transactions
    this.socket.on('transaction:new', (data: { transaction: any }) => {
      // Update UI with new transaction
      this.handleNewTransaction(data.transaction);
    });
  }

  private handleNewTransaction(transaction: any) {
    // Update transaction list
    // Show notification
    // Update balance
    // Trigger AI categorization if enabled
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export const realtimeTransactionService = new RealtimeTransactionService();
```

---

### Step 5: Frontend Integration

```typescript
// client/src/pages/Dashboard.tsx

import { useEffect } from 'react';
import { realtimeTransactionService } from '../services/realtimeTransactions';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      // Connect to real-time service
      realtimeTransactionService.connect(user.id, token);

      // Cleanup on unmount
      return () => {
        realtimeTransactionService.disconnect();
      };
    }
  }, [user, token]);

  // ... rest of component
}
```

---

## 🔧 Implementation: Polling-Based (Fallback)

If webhooks aren't available, use short-interval polling:

```typescript
// client/src/hooks/useRealtimeTransactions.ts

import { useEffect, useState } from 'react';
import { api } from '../services/api';

export function useRealtimeTransactions(connectionId: string) {
  const [transactions, setTransactions] = useState([]);
  const [lastSync, setLastSync] = useState(new Date());

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        // Fetch only new transactions since last sync
        const response = await api.get(
          `/api/connectors/bank/connections/${connectionId}/transactions`,
          {
            params: {
              dateFrom: lastSync.toISOString(),
              limit: 100
            }
          }
        );

        if (response.data.transactions.length > 0) {
          // Add new transactions
          setTransactions(prev => [...response.data.transactions, ...prev]);
          setLastSync(new Date());
          
          // Show notification
          showNotification(`New transaction: ${response.data.transactions[0].description}`);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, [connectionId, lastSync]);

  return transactions;
}
```

---

## 📊 Comparison: Real-Time Methods

| Method | Latency | Complexity | Cost | Reliability |
|--------|---------|------------|------|-------------|
| **Webhooks** | < 1 second | Medium | Low | High |
| **WebSocket** | < 100ms | High | Medium | Medium |
| **SSE** | < 500ms | Medium | Low | High |
| **Polling (30s)** | 30 seconds | Low | High | High |
| **Polling (60s)** | 60 seconds | Low | Medium | High |

---

## 🎯 Recommended Approach

### For Production:

1. **Primary: Webhook + WebSocket**
   - Webhooks for transaction events
   - WebSocket for frontend updates
   - Best user experience

2. **Fallback: Short-Interval Polling**
   - If webhooks unavailable
   - Poll every 30-60 seconds
   - Good enough for most users

3. **Hybrid: Webhook + Polling**
   - Webhooks when available
   - Polling as backup
   - Most reliable

---

## 🚀 Quick Implementation Steps

### Step 1: Add Transaction Webhook Handler

```typescript
// In apideck.ts or basiq.ts routes
router.post('/webhook/transactions', handleTransactionWebhook);
```

### Step 2: Process Transaction

```typescript
async function handleTransactionWebhook(data: any) {
  // 1. Normalize transaction
  // 2. Store in database
  // 3. Emit WebSocket event
}
```

### Step 3: Setup WebSocket Server

```typescript
// In server.ts
import { Server } from 'socket.io';
const io = new Server(server);
realtimeTransactionService.setup(io);
```

### Step 4: Frontend Connection

```typescript
// In Dashboard or Transactions page
useEffect(() => {
  realtimeTransactionService.connect(userId, token);
}, [userId, token]);
```

---

## 🔒 Security Considerations

### Webhook Security:

1. **Signature Verification**
   ```typescript
   // Always verify webhook signatures
   const isValid = verifyWebhookSignature(payload, signature, secret);
   ```

2. **Rate Limiting**
   ```typescript
   // Limit webhook requests per IP
   app.use('/webhook', rateLimit({ max: 100, window: '1m' }));
   ```

3. **Idempotency**
   ```typescript
   // Prevent duplicate processing
   const idempotencyKey = req.headers['x-idempotency-key'];
   if (await isProcessed(idempotencyKey)) {
     return res.json({ success: true, duplicate: true });
   }
   ```

### WebSocket Security:

1. **Authentication**
   ```typescript
   // Verify JWT token on connection
   socket.on('authenticate', async (token) => {
     const user = await verifyToken(token);
     socket.userId = user.id;
   });
   ```

2. **Room Isolation**
   ```typescript
   // Users only receive their own transactions
   socket.join(`user:${userId}`);
   ```

---

## 📈 Performance Optimization

### 1. Batch Processing

```typescript
// Process multiple transactions at once
const batch = await getTransactionBatch();
await processBatch(batch);
```

### 2. Debouncing

```typescript
// Debounce rapid updates
const debouncedNotify = debounce(notifyFrontend, 1000);
```

### 3. Caching

```typescript
// Cache recent transactions
const cache = new Map();
if (cache.has(transactionId)) {
  return; // Skip duplicate
}
```

---

## 🧪 Testing Real-Time

### Test Webhook:

```bash
curl -X POST https://yourapp.com/api/connectors/apideck/webhook/transactions \
  -H "Content-Type: application/json" \
  -H "x-apideck-signature: test-signature" \
  -d '{
    "event_type": "accounting.transaction.created",
    "data": {
      "id": "txn_123",
      "amount": -50.00,
      "description": "Test Transaction"
    }
  }'
```

### Test WebSocket:

```javascript
// In browser console
const socket = io('http://localhost:3000');
socket.emit('authenticate', 'user_123');
socket.on('transaction:new', (data) => {
  console.log('New transaction:', data);
});
```

---

## 📋 Implementation Checklist

- [ ] **Webhook Endpoints**
  - [ ] Transaction webhook handler
  - [ ] Signature verification
  - [ ] Error handling

- [ ] **WebSocket Server**
  - [ ] Socket.io setup
  - [ ] Authentication
  - [ ] Room management

- [ ] **Frontend Integration**
  - [ ] WebSocket client
  - [ ] UI updates
  - [ ] Notifications

- [ ] **Provider Configuration**
  - [ ] Apideck webhook setup
  - [ ] Basiq webhook setup
  - [ ] Other providers

- [ ] **Security**
  - [ ] Webhook signature verification
  - [ ] WebSocket authentication
  - [ ] Rate limiting

- [ ] **Testing**
  - [ ] Webhook testing
  - [ ] WebSocket testing
  - [ ] End-to-end testing

---

## 🎯 Summary

**Why not real-time currently:**
- Webhooks exist but only handle connection status
- Transaction webhooks not implemented
- No WebSocket/SSE for frontend updates
- Polling only (60-minute intervals)

**How to make it real-time:**
1. ✅ Implement transaction webhook handlers
2. ✅ Setup WebSocket/SSE server
3. ✅ Connect frontend to WebSocket
4. ✅ Configure providers to send webhooks
5. ✅ Add fallback polling (30-60 seconds)

**Result:**
- Transactions appear within 1 second
- Better user experience
- Reduced server load (vs constant polling)
- More accurate real-time data

---

**Built with ❤️ for [embracingearth.space](https://embracingearth.space)**

*Real-time financial data • Instant updates • Better user experience*

