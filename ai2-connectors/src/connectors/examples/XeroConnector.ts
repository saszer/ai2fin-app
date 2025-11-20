// --- 📦 EXAMPLE XERO CONNECTOR ---
// embracingearth.space - Example implementation of Xero accounting software connector
// Demonstrates OAuth2-based connector for accounting software

import { BaseConnector } from '../../core/BaseConnector';
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
} from '../../types/connector';
import { createStandardTransaction } from '../../utils/transactionNormalizer';

/**
 * Example Xero Connector
 * 
 * Architecture Notes:
 * - Uses OAuth2 for authentication
 * - Fetches bank transactions from Xero accounting software
 * - Normalizes Xero transaction format to StandardTransaction
 * 
 * Real Implementation Steps:
 * 1. Register OAuth app in Xero Developer Portal
 * 2. Implement OAuth flow (authorization code grant)
 * 3. Exchange authorization code for access/refresh tokens
 * 4. Use access token to fetch bank transactions via Xero API
 * 5. Map Xero transaction format to StandardTransaction
 */
export class XeroConnector extends BaseConnector {
  protected readonly connectorId = 'xero';
  protected readonly connectorType = 'accounting' as const;
  protected readonly transactionSource = 'XERO' as const;

  getMetadata(): ConnectorMetadata {
    return {
      id: this.connectorId,
      name: 'Xero',
      type: this.connectorType,
      description: 'Connect to Xero accounting software to import bank transactions',
      version: '1.0.0',
      author: 'AI2 Platform',
      credentialFields: [
        {
          name: 'clientId',
          label: 'Client ID',
          type: 'text',
          required: true,
          placeholder: 'Enter your Xero Client ID',
          helpText: 'Your Xero app Client ID from Xero Developer Portal'
        },
        {
          name: 'clientSecret',
          label: 'Client Secret',
          type: 'password',
          required: true,
          placeholder: 'Enter your Xero Client Secret',
          helpText: 'Your Xero app Client Secret',
          sensitive: true
        },
        {
          name: 'accessToken',
          label: 'Access Token',
          type: 'password',
          required: true,
          placeholder: 'OAuth access token',
          helpText: 'OAuth access token (obtained via OAuth flow)',
          sensitive: true
        },
        {
          name: 'refreshToken',
          label: 'Refresh Token',
          type: 'password',
          required: false,
          placeholder: 'OAuth refresh token',
          helpText: 'OAuth refresh token for token renewal',
          sensitive: true
        },
        {
          name: 'tenantId',
          label: 'Tenant ID',
          type: 'text',
          required: true,
          placeholder: 'Enter your Xero Tenant ID',
          helpText: 'Your Xero organization tenant ID'
        }
      ],
      capabilities: {
        supportsAccounts: true,
        supportsTransactions: true,
        supportsBalance: true,
        supportsWebhooks: true,
        supportsRealtime: false,
        requiresOAuth: true,
        supportsMultipleAccounts: true
      },
      documentationUrl: 'https://embracingearth.space/docs/connectors/xero'
    };
  }

  async validateCredentials(credentials: ConnectorCredentials): Promise<boolean> {
    if (!credentials.clientId || !credentials.clientSecret || !credentials.accessToken || !credentials.tenantId) {
      throw new ConnectorError(
        'Client ID, Client Secret, Access Token, and Tenant ID are required',
        ConnectorErrorCode.INVALID_CREDENTIALS,
        400
      );
    }

    // In real implementation, test connection with Xero API
    // Example:
    // try {
    //   const response = await fetch('https://api.xero.com/api.xro/2.0/Organisation', {
    //     headers: {
    //       'Authorization': `Bearer ${credentials.accessToken}`,
    //       'Xero-tenant-id': credentials.tenantId
    //     }
    //   });
    //   
    //   if (response.status === 401) {
    //     throw new ConnectorError(
    //       'Invalid access token',
    //       ConnectorErrorCode.INVALID_CREDENTIALS,
    //       401
    //     );
    //   }
    //   
    //   return response.ok;
    // } catch (error) {
    //   this.handleError(error, 'validateCredentials');
    // }

    return true;
  }

  async connect(
    userId: string,
    credentials: ConnectorCredentials,
    settings?: ConnectorSettings
  ): Promise<ConnectorConnection> {
    await this.validateCredentials(credentials);

    // In real implementation, fetch accounts from Xero
    // Example:
    // const response = await fetch('https://api.xero.com/api.xro/2.0/Accounts', {
    //   headers: {
    //     'Authorization': `Bearer ${credentials.accessToken}`,
    //     'Xero-tenant-id': credentials.tenantId
    //   }
    // });
    // 
    // const accountsData = await response.json();
    // const accounts = accountsData.Accounts
    //   .filter((acc: any) => acc.Type === 'BANK')
    //   .map((acc: any) => ({
    //     id: acc.AccountID,
    //     name: acc.Name,
    //     type: acc.Type.toLowerCase(),
    //     currency: acc.CurrencyCode || 'USD',
    //     balance: acc.Balance || 0,
    //     accountNumber: acc.BankAccountNumber ? `****${acc.BankAccountNumber.slice(-4)}` : undefined,
    //     bankName: acc.BankAccountType || 'Xero',
    //     metadata: { xeroAccountId: acc.AccountID }
    //   }));

    // Mock accounts for example
    const accounts: ConnectorAccount[] = [
      {
        id: 'xero_acc_001',
        name: 'Business Bank Account',
        type: 'checking',
        currency: 'USD',
        balance: 25000.00,
        accountNumber: '****9876',
        bankName: 'Xero Bank',
        metadata: { xeroAccountId: 'xero_acc_001' }
      }
    ];

    const connectionId = `xero_conn_${Date.now()}`;

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

  async disconnect(
    connectionId: string,
    credentials: ConnectorCredentials
  ): Promise<boolean> {
    // Xero doesn't require explicit disconnection, but we can revoke tokens
    // In real implementation:
    // await fetch('https://identity.xero.com/connect/revocation', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded'
    //   },
    //   body: new URLSearchParams({
    //     token: credentials.accessToken
    //   })
    // });

    return true;
  }

  async getAccounts(
    connectionId: string,
    credentials: ConnectorCredentials
  ): Promise<ConnectorAccount[]> {
    // Similar to connect() method - fetch accounts from Xero
    return [
      {
        id: 'xero_acc_001',
        name: 'Business Bank Account',
        type: 'checking',
        currency: 'USD',
        balance: 25000.00
      }
    ];
  }

  async getTransactions(
    connectionId: string,
    accountId: string,
    credentials: ConnectorCredentials,
    filter?: TransactionFilter
  ): Promise<StandardTransaction[]> {
    // In real implementation, fetch bank transactions from Xero
    // Example:
    // const params = new URLSearchParams();
    // if (filter?.dateFrom) {
    //   params.append('where', `Date >= DateTime(${filter.dateFrom.toISOString()})`);
    // }
    // if (filter?.dateTo) {
    //   params.append('where', params.get('where') + ` AND Date <= DateTime(${filter.dateTo.toISOString()})`);
    // }
    // 
    // const response = await fetch(`https://api.xero.com/api.xro/2.0/BankTransactions?${params}`, {
    //   headers: {
    //     'Authorization': `Bearer ${credentials.accessToken}`,
    //     'Xero-tenant-id': credentials.tenantId
    //   }
    // });
    // 
    // const transactionsData = await response.json();
    // const rawTransactions = transactionsData.BankTransactions
    //   .filter((tx: any) => tx.BankAccount?.AccountID === accountId)
    //   .map((tx: any) => ({
    //     id: tx.BankTransactionID,
    //     accountId,
    //     amount: tx.Total || 0,
    //     type: tx.Type === 'RECEIVE' ? 'credit' : 'debit',
    //     description: tx.Reference || tx.LineItems?.[0]?.Description || 'Xero Transaction',
    //     date: tx.Date,
    //     reference: tx.Reference || tx.BankTransactionID,
    //     metadata: {
    //       xeroTransactionId: tx.BankTransactionID,
    //       contactId: tx.Contact?.ContactID,
    //       contactName: tx.Contact?.Name
    //     }
    //   }));

    // Mock transactions for example
    const rawTransactions = [
      {
        id: 'xero_txn_001',
        accountId,
        amount: -1200.00,
        type: 'debit',
        description: 'Office Supplies Purchase',
        date: new Date().toISOString(),
        reference: 'INV-001',
        metadata: { xeroTransactionId: 'xero_txn_001' }
      },
      {
        id: 'xero_txn_002',
        accountId,
        amount: 5000.00,
        type: 'credit',
        description: 'Client Payment - Invoice #123',
        date: new Date(Date.now() - 86400000).toISOString(),
        reference: 'INV-123',
        metadata: { xeroTransactionId: 'xero_txn_002' }
      }
    ];

    const transactions = rawTransactions.map(rawTx => {
      return createStandardTransaction(
        rawTx,
        '',
        accountId,
        connectionId,
        this.connectorId,
        this.connectorType,
        this.transactionSource
      );
    });

    // Apply filters
    let filteredTransactions = transactions;
    if (filter) {
      if (filter.dateFrom) {
        const fromDate = typeof filter.dateFrom === 'string' ? new Date(filter.dateFrom) : filter.dateFrom;
        filteredTransactions = filteredTransactions.filter(tx => new Date(tx.date) >= fromDate);
      }
      if (filter.dateTo) {
        const toDate = typeof filter.dateTo === 'string' ? new Date(filter.dateTo) : filter.dateTo;
        filteredTransactions = filteredTransactions.filter(tx => new Date(tx.date) <= toDate);
      }
      if (filter.limit) {
        filteredTransactions = filteredTransactions.slice(0, filter.limit);
      }
    }

    return filteredTransactions;
  }

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

  async refreshAuth(
    connectionId: string,
    credentials: ConnectorCredentials
  ): Promise<ConnectorCredentials> {
    // Refresh Xero OAuth token
    // In real implementation:
    // const response = await fetch('https://identity.xero.com/connect/token', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded'
    //   },
    //   body: new URLSearchParams({
    //     grant_type: 'refresh_token',
    //     refresh_token: credentials.refreshToken,
    //     client_id: credentials.clientId,
    //     client_secret: credentials.clientSecret
    //   })
    // });
    // 
    // const tokenData = await response.json();
    // 
    // return {
    //   ...credentials,
    //   accessToken: tokenData.access_token,
    //   refreshToken: tokenData.refresh_token || credentials.refreshToken
    // };

    return credentials;
  }
}



