# 🔗 Connector Development Guide

## Overview

This guide explains how to build custom connectors for the AI2 Connectors framework. The framework allows you to integrate any data source (banks, accounting software, APIs, SMS, etc.) into the AI2 platform.

## Architecture

### Core Components

1. **BaseConnector** - Abstract base class that all connectors must extend
2. **ConnectorRegistry** - Central registry for managing connectors
3. **CredentialManager** - Secure credential storage and encryption
4. **TransactionNormalizer** - Utilities for normalizing transaction data

### Connector Flow

```
User Request → API Route → Connector Registry → Connector Instance
                                             ↓
                                    Credential Manager (fetch credentials)
                                             ↓
                                    Connector.connect() / sync()
                                             ↓
                                    Transaction Normalizer
                                             ↓
                                    StandardTransaction Format
                                             ↓
                                    Return to Core App
```

## Creating a Custom Connector

### Step 1: Extend BaseConnector

```typescript
import { BaseConnector } from '../core/BaseConnector';
import {
  ConnectorCredentials,
  ConnectorSettings,
  ConnectorAccount,
  ConnectorConnection,
  ConnectorMetadata,
  SyncResult,
  TransactionFilter,
  StandardTransaction,
  ConnectorError,
  ConnectorErrorCode,
  CredentialField
} from '../types/connector';
import { createStandardTransaction } from '../utils/transactionNormalizer';

export class MyCustomConnector extends BaseConnector {
  protected readonly connectorId = 'my-custom-connector';
  protected readonly connectorType = 'custom' as const;
  protected readonly transactionSource = 'CUSTOM' as const;

  // Implement all abstract methods...
}
```

### Step 2: Implement Required Methods

#### 1. `getMetadata()` - Return connector metadata

```typescript
getMetadata(): ConnectorMetadata {
  return {
    id: this.connectorId,
    name: 'My Custom Connector',
    type: this.connectorType,
    description: 'Description of your connector',
    version: '1.0.0',
    credentialFields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        sensitive: true
      }
    ],
    capabilities: {
      supportsAccounts: true,
      supportsTransactions: true,
      supportsBalance: true,
      supportsWebhooks: false,
      supportsRealtime: false
    }
  };
}
```

#### 2. `validateCredentials()` - Validate credentials

```typescript
async validateCredentials(credentials: ConnectorCredentials): Promise<boolean> {
  if (!credentials.apiKey) {
    throw new ConnectorError(
      'API key is required',
      ConnectorErrorCode.INVALID_CREDENTIALS,
      400
    );
  }

  // Make test API call to validate credentials
  try {
    const response = await fetch('https://api.example.com/validate', {
      headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
    });
    
    if (!response.ok) {
      throw new ConnectorError(
        'Invalid credentials',
        ConnectorErrorCode.INVALID_CREDENTIALS,
        response.status
      );
    }
    
    return true;
  } catch (error) {
    this.handleError(error, 'validateCredentials');
  }
}
```

#### 3. `connect()` - Establish connection

```typescript
async connect(
  userId: string,
  credentials: ConnectorCredentials,
  settings?: ConnectorSettings
): Promise<ConnectorConnection> {
  // Validate credentials
  await this.validateCredentials(credentials);

  // Fetch accounts from API
  const response = await fetch('https://api.example.com/accounts', {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  
  const accountsData = await response.json();
  const accounts: ConnectorAccount[] = accountsData.map((acc: any) => ({
    id: acc.id,
    name: acc.name,
    type: acc.type,
    currency: acc.currency || 'USD',
    balance: acc.balance,
    metadata: {}
  }));

  const connectionId = `conn_${Date.now()}`;

  return {
    id: connectionId,
    connectorId: this.connectorId,
    connectorType: this.connectorType,
    userId,
    status: 'connected',
    accounts,
    lastSync: new Date().toISOString(),
    settings: settings || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
```

#### 4. `getTransactions()` - Fetch transactions

```typescript
async getTransactions(
  connectionId: string,
  accountId: string,
  credentials: ConnectorCredentials,
  filter?: TransactionFilter
): Promise<StandardTransaction[]> {
  // Build API request with filters
  const params = new URLSearchParams();
  if (filter?.dateFrom) params.append('from', filter.dateFrom.toISOString());
  if (filter?.dateTo) params.append('to', filter.dateTo.toISOString());

  const response = await fetch(
    `https://api.example.com/accounts/${accountId}/transactions?${params}`,
    {
      headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
    }
  );

  const rawTransactions = await response.json();

  // Normalize to StandardTransaction format
  const transactions = rawTransactions.map((rawTx: any) => {
    return createStandardTransaction(
      rawTx,
      '', // userId will be set by framework
      accountId,
      connectionId,
      this.connectorId,
      this.connectorType,
      this.transactionSource
    );
  });

  return transactions;
}
```

#### 5. `sync()` - Sync all accounts

```typescript
async sync(
  connectionId: string,
  credentials: ConnectorCredentials,
  filter?: TransactionFilter
): Promise<SyncResult> {
  const accounts = await this.getAccounts(connectionId, credentials);
  const accountIds = filter?.accountIds || accounts.map(acc => acc.id);
  const allTransactions: StandardTransaction[] = [];

  for (const accountId of accountIds) {
    try {
      const transactions = await this.getTransactions(
        connectionId,
        accountId,
        credentials,
        filter
      );
      allTransactions.push(...transactions);
    } catch (error) {
      console.error(`Error fetching transactions for account ${accountId}:`, error);
    }
  }

  return {
    success: true,
    connectionId,
    transactions: allTransactions,
    accounts,
    stats: {
      totalTransactions: allTransactions.length,
      newTransactions: allTransactions.length,
      skippedTransactions: 0
    },
    timestamp: new Date().toISOString()
  };
}
```

### Step 3: Register Your Connector

Add your connector to `src/connectors/registerConnectors.ts`:

```typescript
import { MyCustomConnector } from './my-custom-connector';

export function registerAllConnectors(): void {
  connectorRegistry.register(MyCustomConnector);
  // ... other connectors
}
```

## Transaction Normalization

All connectors must normalize source data to `StandardTransaction` format:

```typescript
interface StandardTransaction {
  transactionId: string;        // Unique ID from source
  accountId: string;            // Account ID
  userId: string;               // Set by framework
  amount: number;               // Negative = expense, positive = income
  currency: string;             // ISO currency code
  date: Date | string;          // ISO date
  primaryType: 'expense' | 'income' | 'transfer';
  description: string;          // Sanitized description
  source: TransactionSource;    // Source type
  connectorId: string;          // Your connector ID
  connectorType: ConnectorType; // Your connector type
  // ... other optional fields
}
```

Use the `createStandardTransaction()` helper:

```typescript
const transaction = createStandardTransaction(
  rawTransaction,
  userId,
  accountId,
  connectionId,
  this.connectorId,
  this.connectorType,
  this.transactionSource
);
```

## Error Handling

Always use `ConnectorError` for errors:

```typescript
throw new ConnectorError(
  'Error message',
  ConnectorErrorCode.INVALID_CREDENTIALS,
  400,
  { additionalDetails: '...' }
);
```

Or use the `handleError()` method:

```typescript
try {
  // API call
} catch (error) {
  this.handleError(error, 'methodName');
}
```

## Security Best Practices

1. **Never store credentials in code** - Use `CredentialManager` for storage
2. **Encrypt credentials** - Credentials are automatically encrypted
3. **Sanitize inputs** - Use `sanitizeDescription()` for descriptions
4. **Validate all inputs** - Use validation middleware
5. **Mask sensitive data in logs** - Use `credentialManager.maskCredentials()`

## Testing Your Connector

1. Create a test file: `src/connectors/examples/MyCustomConnector.test.ts`
2. Test each method:
   - `validateCredentials()`
   - `connect()`
   - `getTransactions()`
   - `sync()`

## API Endpoints

Your connector will be accessible via:

- `GET /api/connectors/providers` - List all connectors
- `POST /api/connectors/bank/connections` - Create connection
- `GET /api/connectors/bank/connections` - List connections
- `POST /api/connectors/bank/connections/:id/sync` - Sync transactions
- `DELETE /api/connectors/bank/connections/:id` - Delete connection

## Examples

See `src/connectors/examples/` for complete examples:

- **BankAPIConnector.ts** - Bank API integration
- **XeroConnector.ts** - OAuth2 accounting software
- **SMSUPIConnector.ts** - SMS parsing for Indian UPI

## Need Help?

- Documentation: https://embracingearth.space/docs/connectors
- Issues: Create an issue in the repository
- Security: Never commit secrets or credentials

---

*Built with ❤️ for embracingearth.space*



