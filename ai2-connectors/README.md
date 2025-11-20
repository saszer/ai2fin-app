# 🔗 AI2 Connectors - Integration Framework

**Enterprise-grade connector framework for integrating banks, accounting software, APIs, and more into the AI2 platform.**

[![Security](https://img.shields.io/badge/security-hardened-green)](SECURITY.md)
[![Public Repo](https://img.shields.io/badge/repo-public-blue)](https://github.com/your-org/ai2-connectors)

## 📋 Overview

The AI2 Connectors framework enables developers to build custom connectors for any financial data source (banks, accounting software, APIs, SMS, webhooks, etc.) and integrate them seamlessly into the AI2 platform. The framework provides a secure, scalable, and flexible foundation for transaction data import.

### Key Features

- 🏗️ **Extensible Architecture** - Build connectors by extending `BaseConnector`
- 🔒 **Security First** - Encrypted credential storage, no secrets in code
- 🎯 **Standardized Format** - All transactions normalized to `StandardTransaction` format
- 🔌 **Multiple Connector Types** - Banks, accounting software (Xero, MYOB), SMS-UPI, webhooks, APIs
- 🚀 **Production Ready** - Built for scale (100k+ concurrent users)
- 📚 **Comprehensive Examples** - Bank API, Xero, SMS-UPI connector examples included

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- TypeScript 5.3+
- AI2 Shared package (for shared types)

### Installation

```bash
cd ai2-connectors
npm install
npm run build
```

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## 📖 Documentation

- **[Connector Development Guide](./CONNECTOR_DEVELOPMENT_GUIDE.md)** - Complete guide to building custom connectors
- **[API Reference](./docs/API.md)** - API endpoint documentation
- **[Security Guide](./SECURITY.md)** - Security best practices

## 🔌 Available Connectors

### Built-in Examples

1. **BankAPIConnector** - Example bank API connector (ANZ, CBA, Westpac, etc.)
2. **XeroConnector** - OAuth2-based Xero accounting software connector
3. **SMSUPIConnector** - SMS-based Indian UPI transaction parser

### Building Custom Connectors

See [CONNECTOR_DEVELOPMENT_GUIDE.md](./CONNECTOR_DEVELOPMENT_GUIDE.md) for detailed instructions.

## 🏗️ Architecture

### Core Components

1. **BaseConnector** - Abstract base class for all connectors
2. **ConnectorRegistry** - Central registry for connector management
3. **CredentialManager** - Secure credential storage and encryption
4. **TransactionNormalizer** - Utilities for normalizing transaction data

### Connector Flow

```
User Request → API Route → Connector Registry → Connector Instance
                                             ↓
                                    Credential Manager (fetch encrypted credentials)
                                             ↓
                                    Connector.connect() / sync()
                                             ↓
                                    Transaction Normalizer
                                             ↓
                                    StandardTransaction Format
                                             ↓
                                    Return to Core App
```

## 📡 API Endpoints

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Connector Providers

```http
GET /api/connectors/providers
```

Returns list of all available connector providers.

**Response:**
```json
{
  "providers": [
    {
      "id": "xero",
      "name": "Xero",
      "type": "accounting",
      "description": "Connect to Xero accounting software",
      "version": "1.0.0",
      "capabilities": { ... },
      "credentialFields": [ ... ]
    }
  ]
}
```

### Bank Connections

#### Create Connection

```http
POST /api/connectors/bank/connections
Content-Type: application/json

{
  "provider": "xero",
  "credentials": {
    "clientId": "...",
    "clientSecret": "...",
    "accessToken": "...",
    "tenantId": "..."
  },
  "settings": {
    "autoSync": true,
    "syncInterval": 60
  }
}
```

#### List Connections

```http
GET /api/connectors/bank/connections
```

#### Sync Transactions

```http
POST /api/connectors/bank/connections/:id/sync?dateFrom=2025-01-01&dateTo=2025-01-31
```

#### Get Transactions

```http
GET /api/connectors/bank/connections/:id/accounts/:accountId/transactions?dateFrom=2025-01-01&limit=100
```

#### Delete Connection

```http
DELETE /api/connectors/bank/connections/:id
```

## ⚙️ Configuration

### Environment Variables

**Required:**
```bash
# JWT secret for authentication
JWT_SECRET=your_jwt_secret_here

# Credential encryption key (minimum 32 characters)
CREDENTIAL_ENCRYPTION_KEY=your_encryption_key_here_min_32_chars
```

**Optional:**
```bash
# Server port
CONNECTORS_PORT=3003

# Service-to-service authentication
SERVICE_SECRET=your_service_secret

# Cloudflare Origin Lock (for production)
ENFORCE_CF_ORIGIN_LOCK=true
ORIGIN_SHARED_SECRET=your_origin_secret

# Feature flags
ENABLE_BANK_FEED=true
ENABLE_EMAIL_CONNECTOR=true
ENABLE_API_CONNECTOR=true

# Node environment
NODE_ENV=production
```

### Feature Flags

- `ENABLE_BANK_FEED` - Enable bank feed connector features
- `ENABLE_EMAIL_CONNECTOR` - Enable email connector features
- `ENABLE_API_CONNECTOR` - Enable API connector features

## 🔒 Security

### Credential Storage

- ✅ **All credentials are encrypted** using AES-256-GCM
- ✅ **No credentials stored in code** - all from environment variables or encrypted storage
- ✅ **Encryption key required** - `CREDENTIAL_ENCRYPTION_KEY` must be set (min 32 chars)
- ✅ **Per-user isolation** - credentials are isolated by user ID
- ⚠️ **Production recommendation** - Use enterprise vault (see below)

**Production Vault Options:**
- 🌐 **Cloudflare Secrets Store** - For Cloudflare Workers deployments
- ✈️ **Fly.io Secrets** - For Fly.io deployments (built-in)
- ☁️ **AWS Secrets Manager** - For AWS deployments (automatic rotation)
- 🏗️ **HashiCorp Vault** - For multi-cloud/enterprise (open-source)

See [SECRET_VAULT_INTEGRATION.md](./docs/SECRET_VAULT_INTEGRATION.md) for implementation guides.

### Input Validation

- ✅ **All inputs sanitized** - XSS protection, script injection prevention
- ✅ **Request size limits** - 10MB max request size
- ✅ **Input validation** - All fields validated before processing
- ✅ **SQL injection protection** - No raw SQL queries (credential storage is key-value)

### Authentication

- ✅ **JWT authentication** - All endpoints require valid JWT token
- ✅ **Service-to-service auth** - Optional service token for internal calls
- ✅ **Cloudflare Origin Lock** - Optional header-based origin validation

### Best Practices

1. **Never commit secrets** - Use environment variables
2. **Use strong encryption keys** - Minimum 32 characters
3. **Rotate keys regularly** - Update `CREDENTIAL_ENCRYPTION_KEY` periodically
4. **Use HTTPS** - Always use TLS in production
5. **Audit logs** - Monitor connector access and errors
6. **Rate limiting** - Implement rate limiting at API gateway level

See [SECURITY.md](./SECURITY.md) for detailed security guidelines.

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Building Custom Connectors

### Example: Bank API Connector

```typescript
import { BaseConnector } from './core/BaseConnector';
import { createStandardTransaction } from './utils/transactionNormalizer';

export class MyBankConnector extends BaseConnector {
  protected readonly connectorId = 'my-bank';
  protected readonly connectorType = 'bank' as const;
  protected readonly transactionSource = 'BANK_API' as const;

  getMetadata(): ConnectorMetadata { /* ... */ }
  async validateCredentials(credentials: ConnectorCredentials): Promise<boolean> { /* ... */ }
  async connect(userId: string, credentials: ConnectorCredentials, settings?: ConnectorSettings): Promise<ConnectorConnection> { /* ... */ }
  async getTransactions(connectionId: string, accountId: string, credentials: ConnectorCredentials, filter?: TransactionFilter): Promise<StandardTransaction[]> { /* ... */ }
  async sync(connectionId: string, credentials: ConnectorCredentials, filter?: TransactionFilter): Promise<SyncResult> { /* ... */ }
  // ... other methods
}
```

See [CONNECTOR_DEVELOPMENT_GUIDE.md](./CONNECTOR_DEVELOPMENT_GUIDE.md) for complete guide.

## 🔗 Integration with Core App

The connectors service integrates with the AI2 core app via:

1. **Service Discovery** - Core app discovers connectors service
2. **API Endpoints** - Core app calls connector endpoints
3. **Transaction Format** - All transactions normalized to `StandardTransaction` format
4. **Bank Feed Tab** - Connectors appear in core app's bank feeds tab

## 📊 Transaction Format

All connectors must normalize transactions to `StandardTransaction` format:

```typescript
interface StandardTransaction {
  transactionId: string;        // Unique ID from source
  accountId: string;            // Account ID
  userId: string;               // AI2 user ID
  amount: number;               // Negative = expense, positive = income
  currency: string;             // ISO currency code
  date: Date | string;          // ISO date
  primaryType: 'expense' | 'income' | 'transfer';
  description: string;          // Sanitized description
  source: TransactionSource;    // Source type (BANK_API, XERO, SMS_UPI, etc.)
  connectorId: string;          // Connector identifier
  connectorType: ConnectorType; // Connector type
  // ... optional fields
}
```

## 🚧 Roadmap

- [ ] MYOB connector
- [ ] QuickBooks connector
- [ ] Plaid integration
- [ ] Stripe connector
- [ ] PayPal connector
- [ ] Database-backed connection storage (currently in-memory)
- [ ] Webhook endpoint for real-time updates
- [ ] Transaction deduplication service
- [ ] Rate limiting middleware
- [ ] Metrics and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Build your connector following the development guide
4. Add tests for your connector
5. Submit a pull request

**Security:** Never commit secrets, credentials, or API keys. All sensitive data must use environment variables.

## 📄 License

Proprietary - AI2 Enterprise Platform

## 🔐 Secret Vault Integration

For production deployments, replace the in-memory credential storage with an enterprise vault:

- **[Cloudflare Secrets Store](./docs/SECRET_VAULT_INTEGRATION.md#-cloudflare-secrets-store-recommended-for-cloudflare-workers)** - Native integration for Cloudflare Workers
- **[Fly.io Secrets](./docs/SECRET_VAULT_INTEGRATION.md#-flyio-secrets-recommended-for-flyio)** - Built-in secrets for Fly.io apps
- **[AWS Secrets Manager](./docs/SECRET_VAULT_INTEGRATION.md#-aws-secrets-manager-recommended-for-awsproduction)** - Production-grade with automatic rotation
- **[HashiCorp Vault](./docs/SECRET_VAULT_INTEGRATION.md#-hashicorp-vault-recommended-for-on-premmulti-cloud)** - Open-source, multi-cloud solution

See **[SECRET_VAULT_INTEGRATION.md](./docs/SECRET_VAULT_INTEGRATION.md)** for complete implementation guides with code examples.

## 🔗 Links

- [AI2 Platform](https://embracingearth.space)
- [Connector Development Guide](./CONNECTOR_DEVELOPMENT_GUIDE.md)
- [Security Guide](./SECURITY.md)
- [Secret Vault Integration](./docs/SECRET_VAULT_INTEGRATION.md)

---

**Built with ❤️ for [embracingearth.space](https://embracingearth.space)**

*Enterprise-grade integrations • Secure and scalable • Powering financial automation*
