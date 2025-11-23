# 🔌 AI2 Connectors - Complete Overview

**All available connectors in the AI2 Connectors framework**

---

## 📊 Connector Summary

| Connector | Type | Status | Platforms Supported | Auth Method |
|-----------|------|--------|---------------------|-------------|
| **Apideck** | Accounting | ✅ Production | 100+ (QuickBooks, Xero, NetSuite, etc.) | OAuth (Vault) |
| **Basiq** | Bank | ✅ Production | Australian Banks | API Key |
| **Xero** | Accounting | 📝 Example | Xero | OAuth2 |
| **Bank API** | Bank | 📝 Example | Generic Bank APIs | API Key |
| **SMS UPI** | SMS | 📝 Example | Indian UPI/Banks | SMS Gateway |

---

## 🔵 Production Connectors

### 1. **Apideck Unified API** (`apideck`)

**Type**: Accounting  
**Status**: ✅ Production Ready  
**Version**: 1.0.0

**Description**:  
Single connector that provides access to **100+ accounting platforms** via Apideck's Unified API. No need to build separate connectors for each platform.

**Supported Platforms**:
- QuickBooks Online/Desktop
- Xero
- NetSuite
- Exact Online
- Sage
- FreshBooks
- Wave
- Zoho Books
- MYOB
- And 90+ more...

**Features**:
- ✅ OAuth management via Apideck Vault
- ✅ Automatic token refresh
- ✅ Webhook support for real-time updates
- ✅ Unified API interface
- ✅ Multi-account support

**Authentication**: OAuth via Apideck Vault  
**Environment Variables**:
```bash
APIDECK_API_KEY=your_api_key
APIDECK_APP_ID=your_app_id
APIDECK_WEBHOOK_SECRET=your_webhook_secret  # Optional
```

**Documentation**: [APIDECK_SETUP.md](./APIDECK_SETUP.md)

---

### 2. **Basiq** (`basiq`)

**Type**: Bank  
**Status**: ✅ Production Ready  
**Version**: 1.0.0

**Description**:  
Financial data aggregation service providing access to bank accounts and transactions across **multiple Australian banks**.

**Supported Banks**:
- ANZ
- Commonwealth Bank (CBA)
- Westpac
- NAB
- And other Australian banks via Basiq

**Features**:
- ✅ Multi-bank support
- ✅ Account and transaction fetching
- ✅ Balance tracking
- ✅ Webhook support
- ✅ Sandbox and production environments

**Authentication**: API Key (OAuth2 client credentials)  
**Environment Variables**:
```bash
BASIQ_API_KEY=your_basiq_api_key
```

**Documentation**: [Basiq API Docs](https://api.basiq.io/docs)

---

## 📝 Example Connectors

### 3. **Xero Connector** (`xero`)

**Type**: Accounting  
**Status**: 📝 Example/Template  
**Version**: 1.0.0

**Description**:  
Example implementation of an OAuth2-based connector for Xero accounting software. Demonstrates how to build connectors for accounting platforms.

**Features**:
- ✅ OAuth2 authentication flow
- ✅ Account fetching
- ✅ Transaction syncing
- ✅ Token refresh handling

**Authentication**: OAuth2  
**Credentials Required**:
- Client ID
- Client Secret
- Access Token
- Refresh Token
- Tenant ID

**Note**: This is an example/template. For production Xero integration, use **Apideck** connector which supports Xero and many more platforms.

**File**: `src/connectors/examples/XeroConnector.ts`

---

### 4. **Example Bank API** (`example-bank-api`)

**Type**: Bank  
**Status**: 📝 Example/Template  
**Version**: 1.0.0

**Description**:  
Example connector demonstrating how to build a bank API connector. Can be used as a template for connecting to specific bank APIs (ANZ, CBA, Westpac, etc.).

**Features**:
- ✅ API key authentication
- ✅ Account management
- ✅ Transaction fetching
- ✅ Sandbox/production environments

**Authentication**: API Key + API Secret  
**Credentials Required**:
- API Key
- API Secret
- Environment (sandbox/production)

**Note**: This is a template. For production, implement specific bank API integration or use **Basiq** for Australian banks.

**File**: `src/connectors/examples/BankAPIConnector.ts`

---

### 5. **SMS UPI (Indian)** (`sms-upi-indian`)

**Type**: SMS  
**Status**: 📝 Example/Template  
**Version**: 1.0.0

**Description**:  
Example connector for parsing Indian UPI transactions from SMS notifications. Demonstrates webhook-based and polling-based connectors.

**Supported Providers**:
- PhonePe
- Google Pay
- Paytm
- BHIM UPI
- Other Indian UPI providers

**Features**:
- ✅ SMS parsing
- ✅ Webhook support (real-time)
- ✅ Polling support (if device access available)
- ✅ UPI transaction extraction
- ✅ Multi-provider support

**Authentication**: Phone Number + SMS Gateway  
**Credentials Required**:
- Phone Number (+91XXXXXXXXXX)
- SMS Gateway Webhook URL (optional)
- SMS Gateway API Key (optional)
- UPI Providers (PhonePe, Google Pay, Paytm, etc.)

**SMS Format Examples**:
```
Rs.500.00 debited from A/c **1234 on 01-Jan-25 to UPI123456789012@paytm
UPI/123456789012/PAYTM/SUCCESS/Rs.1000.00/to MERCHANT NAME
INR 250.00 credited to A/c **5678 via UPI ref 9876543210
```

**File**: `src/connectors/examples/SMSUPIConnector.ts`

---

## 📋 Connector Comparison

### By Type

| Type | Connectors | Use Case |
|------|-----------|----------|
| **Accounting** | Apideck, Xero | Connect to accounting software (QuickBooks, Xero, etc.) |
| **Bank** | Basiq, Bank API | Direct bank account access |
| **SMS** | SMS UPI | Parse transactions from SMS notifications |

### By Authentication Method

| Auth Method | Connectors | Description |
|-------------|-----------|-------------|
| **OAuth (Vault)** | Apideck | Managed OAuth via Apideck Vault |
| **OAuth2** | Xero | Direct OAuth2 implementation |
| **API Key** | Basiq, Bank API | API key authentication |
| **SMS Gateway** | SMS UPI | SMS-based authentication |

### By Status

| Status | Connectors | Notes |
|--------|-----------|-------|
| **✅ Production** | Apideck, Basiq | Ready for production use |
| **📝 Example** | Xero, Bank API, SMS UPI | Templates for building custom connectors |

---

## 🚀 Quick Start

### Using Production Connectors

#### Apideck (Recommended for Accounting)
```bash
# Set environment variables
export APIDECK_API_KEY=your_key
export APIDECK_APP_ID=your_app_id

# Connector automatically registered
# Use in frontend: Select "Apideck Unified API" → Choose platform
```

#### Basiq (For Australian Banks)
```bash
# Set environment variable
export BASIQ_API_KEY=your_basiq_key

# Connector automatically registered
# Use in frontend: Select "Basiq" → Enter API key
```

### Building Custom Connectors

1. **Copy example connector**:
   ```bash
   cp src/connectors/examples/BankAPIConnector.ts src/connectors/MyConnector.ts
   ```

2. **Implement connector**:
   - Extend `BaseConnector`
   - Implement all abstract methods
   - Normalize data to `StandardTransaction` format

3. **Register connector**:
   ```typescript
   // In registerConnectors.ts
   import { MyConnector } from './MyConnector';
   connectorRegistry.register(MyConnector);
   ```

4. **Test connector**:
   - Use connector API endpoints
   - Test in frontend Connectors page

See [CONNECTOR_DEVELOPMENT_GUIDE.md](./CONNECTOR_DEVELOPMENT_GUIDE.md) for details.

---

## 📊 Connector Capabilities

| Feature | Apideck | Basiq | Xero | Bank API | SMS UPI |
|---------|---------|-------|------|----------|---------|
| **Accounts** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Transactions** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Balance** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Webhooks** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Real-time** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Multi-account** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **OAuth** | ✅ | ❌ | ✅ | ❌ | ❌ |

---

## 🔧 Environment Variables Summary

### Required for Production Connectors

```bash
# Apideck
APIDECK_API_KEY=your_api_key
APIDECK_APP_ID=your_app_id

# Basiq
BASIQ_API_KEY=your_basiq_api_key

# Optional
APIDECK_WEBHOOK_SECRET=your_webhook_secret
FRONTEND_URL=https://yourapp.com
```

### For Example Connectors

Example connectors don't require environment variables (they use mock data or require manual credentials).

---

## 📈 Roadmap

### Planned Connectors

- [ ] **Plaid** - US/Canada bank connections
- [ ] **Stripe** - Payment processing
- [ ] **PayPal** - Payment processing
- [ ] **MYOB** - Australian accounting (via Apideck or direct)
- [ ] **QuickBooks Direct** - Direct QuickBooks integration (alternative to Apideck)
- [ ] **Email Parser** - Parse transactions from email receipts
- [ ] **CSV Import** - Generic CSV file import

### Enhancement Ideas

- [ ] Database-backed connection storage (currently in-memory)
- [ ] Transaction deduplication service
- [ ] Rate limiting middleware
- [ ] Metrics and monitoring
- [ ] Connector plugin system

---

## 📚 Documentation

- **[Connector Development Guide](./CONNECTOR_DEVELOPMENT_GUIDE.md)** - Build custom connectors
- **[Apideck Setup Guide](./APIDECK_SETUP.md)** - Apideck integration setup
- **[Apideck Data Flow](./APIDECK_DATA_FLOW.md)** - How Apideck data flows through AI2Fin
- **[API Reference](./docs/API.md)** - API endpoint documentation
- **[Security Guide](./SECURITY.md)** - Security best practices

---

## 🎯 Recommendations

### For Accounting Software
**Use Apideck** - Single connector for 100+ platforms, OAuth management, unified API.

### For Australian Banks
**Use Basiq** - Aggregates multiple Australian banks, production-ready.

### For Other Use Cases
- **Custom Bank API**: Use `BankAPIConnector` as template
- **SMS Parsing**: Use `SMSUPIConnector` as template
- **Other Accounting**: Use `XeroConnector` as template or extend Apideck

---

## ✅ Summary

**Total Connectors**: 5
- **Production**: 2 (Apideck, Basiq)
- **Examples**: 3 (Xero, Bank API, SMS UPI)

**Platforms Supported**: 100+ (via Apideck) + Australian banks (via Basiq)

**Ready for Production**: ✅ Yes (Apideck + Basiq)

---

**Built with ❤️ for [embracingearth.space](https://embracingearth.space)**

*Enterprise-grade integrations • Secure and scalable • Powering financial automation*

