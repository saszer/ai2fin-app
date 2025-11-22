// --- 📦 APIDECK UNIFIED API CONNECTOR ---
// embracingearth.space - Apideck Unified API connector for accounting platforms
// Supports QuickBooks, Xero, NetSuite, Exact Online, and 100+ accounting platforms via single API
// Architecture: Uses Apideck Unified API to normalize multiple accounting platforms into one interface

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

/**
 * Apideck Unified API Connector
 * 
 * Architecture Notes:
 * - Uses Apideck Unified API to access 100+ accounting platforms (QuickBooks, Xero, NetSuite, etc.)
 * - OAuth handled via Apideck Vault (no manual OAuth flow needed)
 * - Single API interface for multiple accounting platforms
 * - Automatically handles token refresh and connection management
 * 
 * Supported Platforms (via Apideck):
 * - QuickBooks Online/Desktop
 * - Xero
 * - NetSuite
 * - Exact Online
 * - Sage
 * - FreshBooks
 * - Wave
 * - And 100+ more...
 * 
 * Environment Variables Required:
 * - APIDECK_API_KEY: Your Apideck API key
 * - APIDECK_APP_ID: Your Apideck App ID
 * - APIDECK_VAULT_REDIRECT_URI: OAuth redirect URI (e.g., https://yourapp.com/api/connectors/apideck/callback)
 */
export class ApideckConnector extends BaseConnector {
  protected readonly connectorId = 'apideck';
  protected readonly connectorType = 'accounting' as const;
  protected readonly transactionSource = 'CUSTOM' as const; // Using CUSTOM since it's via Unified API

  private readonly apideckBaseUrl = 'https://unify.apideck.com';
  private readonly apideckApiKey: string;
  private readonly apideckAppId: string;

  constructor() {
    super();
    
    // Validate required environment variables
    this.apideckApiKey = process.env.APIDECK_API_KEY || '';
    this.apideckAppId = process.env.APIDECK_APP_ID || '';
    
    if (!this.apideckApiKey || !this.apideckAppId) {
      console.warn('⚠️ Apideck connector: APIDECK_API_KEY and APIDECK_APP_ID must be set in environment variables');
    }
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: this.connectorId,
      name: 'Apideck Unified API',
      type: this.connectorType,
      description: 'Connect to 100+ accounting platforms (QuickBooks, Xero, NetSuite, etc.) via Apideck Unified API. Single integration for multiple accounting software.',
      version: '1.0.0',
      author: 'AI2 Platform',
      credentialFields: [
        {
          name: 'serviceId',
          label: 'Accounting Platform',
          type: 'select',
          required: true,
          placeholder: 'Select accounting platform',
          helpText: 'The accounting platform you want to connect (e.g., quickbooks, xero, netsuite)',
          options: [
            { value: 'quickbooks', label: 'QuickBooks Online' },
            { value: 'xero', label: 'Xero' },
            { value: 'netsuite', label: 'NetSuite' },
            { value: 'exact-online', label: 'Exact Online' },
            { value: 'sage', label: 'Sage' },
            { value: 'freshbooks', label: 'FreshBooks' },
            { value: 'wave', label: 'Wave' }
          ]
        },
        {
          name: 'consumerId',
          label: 'Consumer ID',
          type: 'text',
          required: true,
          placeholder: 'Your unique consumer ID',
          helpText: 'Unique identifier for this connection (usually your user ID or account ID)',
          sensitive: false
        },
        {
          name: 'connectionId',
          label: 'Connection ID',
          type: 'text',
          required: false,
          placeholder: 'Apideck connection ID (auto-generated)',
          helpText: 'Apideck connection ID (automatically created via Vault OAuth flow)',
          sensitive: false
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
      documentationUrl: 'https://developers.apideck.com'
    };
  }

  /**
   * Make authenticated request to Apideck Unified API
   * Architecture: Centralized API call handler with error handling and token management
   */
  private async makeApideckRequest(
    endpoint: string,
    credentials: ConnectorCredentials,
    options: RequestInit = {}
  ): Promise<any> {
    const serviceId = credentials.serviceId as string;
    const consumerId = credentials.consumerId as string;

    if (!serviceId || !consumerId) {
      throw new ConnectorError(
        'Service ID and Consumer ID are required',
        ConnectorErrorCode.INVALID_CREDENTIALS,
        400
      );
    }

    const url = `${this.apideckBaseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.apideckApiKey}`,
      'x-apideck-app-id': this.apideckAppId,
      'x-apideck-consumer-id': consumerId,
      'x-apideck-service-id': serviceId,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        
        if (response.status === 401 || response.status === 403) {
          throw new ConnectorError(
            'Authentication failed. Please reconnect your account.',
            ConnectorErrorCode.UNAUTHORIZED,
            response.status,
            { serviceId, error: errorData }
          );
        }

        if (response.status === 429) {
          throw new ConnectorError(
            'Rate limit exceeded. Please try again later.',
            ConnectorErrorCode.RATE_LIMIT_EXCEEDED,
            429
          );
        }

        throw new ConnectorError(
          errorData.message || `API request failed: ${response.statusText}`,
          ConnectorErrorCode.CONNECTION_FAILED,
          response.status,
          { serviceId, error: errorData }
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ConnectorError) {
        throw error;
      }
      this.handleError(error, 'makeApideckRequest');
    }
  }

  async validateCredentials(credentials: ConnectorCredentials): Promise<boolean> {
    if (!credentials.serviceId || !credentials.consumerId) {
      throw new ConnectorError(
        'Service ID and Consumer ID are required',
        ConnectorErrorCode.INVALID_CREDENTIALS,
        400
      );
    }

    // If connectionId is provided, validate the connection exists
    if (credentials.connectionId) {
      try {
        // Test connection by fetching accounts
        await this.makeApideckRequest('/accounting/accounts', credentials, {
          method: 'GET'
        });
        return true;
      } catch (error: any) {
        if (error instanceof ConnectorError && error.code === ConnectorErrorCode.UNAUTHORIZED) {
          throw new ConnectorError(
            'Connection expired or invalid. Please reconnect via Vault.',
            ConnectorErrorCode.INVALID_CREDENTIALS,
            401
          );
        }
        throw error;
      }
    }

    // Without connectionId, we can't fully validate (connection must be created via Vault first)
    return true;
  }

  async connect(
    userId: string,
    credentials: ConnectorCredentials,
    settings?: ConnectorSettings
  ): Promise<ConnectorConnection> {
    // Note: Connection should be created via Apideck Vault OAuth flow first
    // This method validates and fetches account information
    
    if (!credentials.connectionId) {
      throw new ConnectorError(
        'Connection ID is required. Please connect via Apideck Vault OAuth flow first.',
        ConnectorErrorCode.INVALID_CREDENTIALS,
        400
      );
    }

    await this.validateCredentials(credentials);

    // Fetch accounts from Apideck Unified API
    const accountsData = await this.makeApideckRequest('/accounting/accounts', credentials, {
      method: 'GET'
    });

    // Normalize accounts to ConnectorAccount format
    const accounts: ConnectorAccount[] = (accountsData.data || []).map((acc: any) => {
      // Apideck returns accounts in unified format, normalize to our format
      return {
        id: acc.id || acc.account_id || acc.AccountID,
        name: acc.name || acc.Name || acc.display_name,
        type: (acc.type || acc.Type || 'checking').toLowerCase(),
        currency: acc.currency || acc.CurrencyCode || 'USD',
        balance: acc.balance || acc.Balance || 0,
        availableBalance: acc.available_balance || acc.AvailableBalance,
        accountNumber: acc.account_number ? `****${String(acc.account_number).slice(-4)}` : undefined,
        bankName: acc.bank_name || acc.institution_name,
        metadata: {
          apideckAccountId: acc.id || acc.account_id,
          rawAccount: acc // Keep raw data for reference
        }
      };
    });

    const connectionId = credentials.connectionId as string;

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
      updatedAt: new Date().toISOString(),
      metadata: {
        serviceId: credentials.serviceId,
        consumerId: credentials.consumerId
      }
    };
  }

  async disconnect(
    connectionId: string,
    credentials: ConnectorCredentials
  ): Promise<boolean> {
    // Apideck handles disconnection via Vault API
    // In production, you would call Apideck Vault API to delete connection
    // For now, we just return true as the connection is managed by Apideck Vault
    
    try {
      // Optional: Call Apideck to revoke connection
      // await this.makeApideckRequest(`/vault/connections/${connectionId}`, credentials, {
      //   method: 'DELETE'
      // });
      return true;
    } catch (error) {
      // Log but don't fail - connection may already be deleted
      console.error('Error disconnecting Apideck connection:', error);
      return true;
    }
  }

  async getAccounts(
    connectionId: string,
    credentials: ConnectorCredentials
  ): Promise<ConnectorAccount[]> {
    const accountsData = await this.makeApideckRequest('/accounting/accounts', credentials, {
      method: 'GET'
    });

    return (accountsData.data || []).map((acc: any) => ({
      id: acc.id || acc.account_id || acc.AccountID,
      name: acc.name || acc.Name || acc.display_name,
      type: (acc.type || acc.Type || 'checking').toLowerCase(),
      currency: acc.currency || acc.CurrencyCode || 'USD',
      balance: acc.balance || acc.Balance || 0,
      availableBalance: acc.available_balance || acc.AvailableBalance,
      accountNumber: acc.account_number ? `****${String(acc.account_number).slice(-4)}` : undefined,
      bankName: acc.bank_name || acc.institution_name,
      metadata: {
        apideckAccountId: acc.id || acc.account_id,
        rawAccount: acc
      }
    }));
  }

  async getTransactions(
    connectionId: string,
    accountId: string,
    credentials: ConnectorCredentials,
    filter?: TransactionFilter
  ): Promise<StandardTransaction[]> {
    // Build query parameters for Apideck API
    const params = new URLSearchParams();
    
    if (filter?.dateFrom) {
      const fromDate = typeof filter.dateFrom === 'string' ? filter.dateFrom : filter.dateFrom.toISOString();
      params.append('filter', `date.gte=${fromDate.split('T')[0]}`);
    }
    
    if (filter?.dateTo) {
      const toDate = typeof filter.dateTo === 'string' ? filter.dateTo : filter.dateTo.toISOString();
      params.append('filter', `date.lte=${toDate.split('T')[0]}`);
    }
    
    if (filter?.limit) {
      params.append('limit', String(filter.limit));
    }

    // Fetch transactions from Apideck Unified API
    const transactionsData = await this.makeApideckRequest(
      `/accounting/transactions?${params.toString()}`,
      credentials,
      { method: 'GET' }
    );

    // Filter by account if needed (Apideck may return all accounts)
    const rawTransactions = (transactionsData.data || []).filter((tx: any) => {
      const txAccountId = tx.account_id || tx.AccountID || tx.account?.id;
      return txAccountId === accountId || tx.account_id === accountId;
    });

    // Normalize to StandardTransaction format
    const transactions = rawTransactions.map((rawTx: any) => {
      // Apideck returns transactions in unified format
      const amount = parseFloat(rawTx.total_amount || rawTx.amount || rawTx.Total || 0);
      const isDebit = rawTx.type === 'debit' || rawTx.type === 'DEBIT' || 
                     rawTx.direction === 'outbound' || rawTx.direction === 'OUTBOUND';
      
      const normalizedAmount = isDebit ? -Math.abs(amount) : Math.abs(amount);
      
      return createStandardTransaction(
        {
          id: rawTx.id || rawTx.transaction_id || rawTx.TransactionID,
          accountId,
          amount: normalizedAmount,
          type: isDebit ? 'debit' : 'credit',
          description: rawTx.description || rawTx.Description || rawTx.reference || 'Transaction',
          date: rawTx.transaction_date || rawTx.date || rawTx.Date || new Date().toISOString(),
          reference: rawTx.reference || rawTx.Reference || rawTx.id,
          currency: rawTx.currency || rawTx.CurrencyCode || 'USD',
          merchant: rawTx.merchant_name || rawTx.contact_name,
          category: rawTx.category || rawTx.Category,
          metadata: {
            apideckTransactionId: rawTx.id || rawTx.transaction_id,
            rawTransaction: rawTx
          }
        },
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
        skippedTransactions: 0,
        startDate: filter?.dateFrom,
        endDate: filter?.dateTo
      },
      timestamp: new Date().toISOString()
    };
  }

  async refreshAuth(
    connectionId: string,
    credentials: ConnectorCredentials
  ): Promise<ConnectorCredentials> {
    // Apideck handles token refresh automatically via Vault
    // If tokens are expired, connection needs to be re-established via Vault
    // This method can be used to check connection status
    
    try {
      await this.validateCredentials(credentials);
      return credentials;
    } catch (error: any) {
      if (error instanceof ConnectorError && error.code === ConnectorErrorCode.UNAUTHORIZED) {
        throw new ConnectorError(
          'Connection expired. Please reconnect via Apideck Vault.',
          ConnectorErrorCode.TOKEN_EXPIRED,
          401
        );
      }
      throw error;
    }
  }
}

