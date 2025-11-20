// --- 📦 EXAMPLE BANK API CONNECTOR ---
// embracingearth.space - Example implementation of a bank API connector
// This demonstrates how to build a connector for bank APIs (e.g., ANZ, CBA, etc.)

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
 * Example Bank API Connector
 * 
 * Architecture Notes:
 * - Extends BaseConnector and implements all abstract methods
 * - Normalizes source data to StandardTransaction format
 * - Handles authentication (OAuth, API key, etc.)
 * - Implements error handling with proper ConnectorError types
 * 
 * To create your own bank connector:
 * 1. Extend BaseConnector
 * 2. Implement all abstract methods
 * 3. Normalize transaction data using createStandardTransaction helper
 * 4. Handle authentication/authorization per bank's API requirements
 * 5. Register connector in registry (see examples/registerConnectors.ts)
 */
export class BankAPIConnector extends BaseConnector {
  protected readonly connectorId = 'example-bank-api';
  protected readonly connectorType = 'bank' as const;
  protected readonly transactionSource = 'BANK_API' as const;

  getMetadata(): ConnectorMetadata {
    return {
      id: this.connectorId,
      name: 'Example Bank API',
      type: this.connectorType,
      description: 'Example connector for bank API integration (ANZ, CBA, Westpac, etc.)',
      version: '1.0.0',
      author: 'AI2 Platform',
      credentialFields: [
        {
          name: 'apiKey',
          label: 'API Key',
          type: 'password',
          required: true,
          placeholder: 'Enter your API key',
          helpText: 'Your bank API key from the bank\'s developer portal',
          sensitive: true
        },
        {
          name: 'apiSecret',
          label: 'API Secret',
          type: 'password',
          required: true,
          placeholder: 'Enter your API secret',
          helpText: 'Your bank API secret',
          sensitive: true
        },
        {
          name: 'environment',
          label: 'Environment',
          type: 'select',
          required: false,
          options: [
            { value: 'sandbox', label: 'Sandbox' },
            { value: 'production', label: 'Production' }
          ],
          helpText: 'API environment to use'
        }
      ],
      capabilities: {
        supportsAccounts: true,
        supportsTransactions: true,
        supportsBalance: true,
        supportsWebhooks: false,
        supportsRealtime: false,
        requiresApiKey: true,
        supportsMultipleAccounts: true
      },
      documentationUrl: 'https://embracingearth.space/docs/connectors/bank-api'
    };
  }

  async validateCredentials(credentials: ConnectorCredentials): Promise<boolean> {
    // Validate credentials structure
    if (!credentials.apiKey || !credentials.apiSecret) {
      throw new ConnectorError(
        'API key and secret are required',
        ConnectorErrorCode.INVALID_CREDENTIALS,
        400
      );
    }

    // In real implementation, make test API call to validate credentials
    // Example:
    // try {
    //   const response = await fetch(`${this.getApiUrl(credentials)}/auth/test`, {
    //     headers: {
    //       'Authorization': `Bearer ${credentials.apiKey}`,
    //       'X-API-Secret': credentials.apiSecret
    //     }
    //   });
    //   
    //   if (!response.ok) {
    //     throw new ConnectorError(
    //       'Invalid credentials',
    //       ConnectorErrorCode.INVALID_CREDENTIALS,
    //       response.status
    //     );
    //   }
    //   
    //   return true;
    // } catch (error) {
    //   this.handleError(error, 'validateCredentials');
    // }

    // Mock validation for example
    return true;
  }

  async connect(
    userId: string,
    credentials: ConnectorCredentials,
    settings?: ConnectorSettings
  ): Promise<ConnectorConnection> {
    // Validate credentials first
    await this.validateCredentials(credentials);

    // In real implementation, establish connection with bank API
    // Example:
    // const apiUrl = this.getApiUrl(credentials);
    // const response = await fetch(`${apiUrl}/accounts`, {
    //   headers: {
    //     'Authorization': `Bearer ${credentials.apiKey}`,
    //     'X-API-Secret': credentials.apiSecret
    //   }
    // });
    // 
    // if (!response.ok) {
    //   throw new ConnectorError(
    //     'Failed to connect to bank API',
    //     ConnectorErrorCode.CONNECTION_FAILED,
    //     response.status
    //   );
    // }
    // 
    // const accountsData = await response.json();

    // Mock connection for example
    const accounts: ConnectorAccount[] = [
      {
        id: 'acc_001',
        name: 'Checking Account',
        type: 'checking',
        currency: 'USD',
        balance: 5000.00,
        availableBalance: 4800.00,
        accountNumber: '****1234',
        bankName: 'Example Bank',
        metadata: {}
      },
      {
        id: 'acc_002',
        name: 'Savings Account',
        type: 'savings',
        currency: 'USD',
        balance: 15000.00,
        availableBalance: 15000.00,
        accountNumber: '****5678',
        bankName: 'Example Bank',
        metadata: {}
      }
    ];

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

  async disconnect(
    connectionId: string,
    credentials: ConnectorCredentials
  ): Promise<boolean> {
    // In real implementation, revoke tokens, close connections, etc.
    // Example:
    // const apiUrl = this.getApiUrl(credentials);
    // await fetch(`${apiUrl}/disconnect`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${credentials.apiKey}`,
    //     'X-API-Secret': credentials.apiSecret
    //   }
    // });

    return true;
  }

  async getAccounts(
    connectionId: string,
    credentials: ConnectorCredentials
  ): Promise<ConnectorAccount[]> {
    // In real implementation, fetch accounts from bank API
    // Mock for example
    return [
      {
        id: 'acc_001',
        name: 'Checking Account',
        type: 'checking',
        currency: 'USD',
        balance: 5000.00,
        accountNumber: '****1234',
        bankName: 'Example Bank'
      }
    ];
  }

  async getTransactions(
    connectionId: string,
    accountId: string,
    credentials: ConnectorCredentials,
    filter?: TransactionFilter
  ): Promise<StandardTransaction[]> {
    // In real implementation, fetch transactions from bank API
    // Example:
    // const apiUrl = this.getApiUrl(credentials);
    // const params = new URLSearchParams();
    // if (filter?.dateFrom) params.append('from', filter.dateFrom.toISOString());
    // if (filter?.dateTo) params.append('to', filter.dateTo.toISOString());
    // 
    // const response = await fetch(`${apiUrl}/accounts/${accountId}/transactions?${params}`, {
    //   headers: {
    //     'Authorization': `Bearer ${credentials.apiKey}`,
    //     'X-API-Secret': credentials.apiSecret
    //   }
    // });
    // 
    // if (!response.ok) {
    //   throw new ConnectorError(
    //     'Failed to fetch transactions',
    //     ConnectorErrorCode.TRANSACTION_FETCH_FAILED,
    //     response.status
    //   );
    // }
    // 
    // const rawTransactions = await response.json();

    // Mock transactions for example
    const rawTransactions = [
      {
        id: 'txn_001',
        accountId,
        amount: -50.00,
        type: 'debit',
        description: 'Coffee Shop Purchase',
        date: new Date().toISOString(),
        merchant: 'Coffee Shop',
        reference: 'REF001',
        balance: 4950.00,
        metadata: { category: 'Food & Drink' }
      },
      {
        id: 'txn_002',
        accountId,
        amount: 2000.00,
        type: 'credit',
        description: 'Salary Payment',
        date: new Date(Date.now() - 86400000).toISOString(),
        merchant: 'Employer Inc',
        reference: 'REF002',
        balance: 7000.00,
        metadata: { category: 'Income' }
      }
    ];

    // Normalize transactions to StandardTransaction format
    const transactions = rawTransactions.map(rawTx => {
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
      if (filter.amountMin !== undefined) {
        filteredTransactions = filteredTransactions.filter(tx => Math.abs(tx.amount) >= filter.amountMin!);
      }
      if (filter.amountMax !== undefined) {
        filteredTransactions = filteredTransactions.filter(tx => Math.abs(tx.amount) <= filter.amountMax!);
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
    // Get accounts
    const accounts = await this.getAccounts(connectionId, credentials);
    
    // Fetch transactions for all accounts (or filtered accounts)
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
        // Log error but continue with other accounts
        console.error(`Error fetching transactions for account ${accountId}:`, error);
      }
    }

    // In real implementation, track new vs existing transactions
    // For now, return all transactions
    const newTransactions = allTransactions; // TODO: Implement deduplication

    return {
      success: true,
      connectionId,
      transactions: allTransactions,
      accounts,
      stats: {
        totalTransactions: allTransactions.length,
        newTransactions: newTransactions.length,
        skippedTransactions: allTransactions.length - newTransactions.length,
        startDate: filter?.dateFrom,
        endDate: filter?.dateTo
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Helper method to get API URL based on environment
   */
  private getApiUrl(credentials: ConnectorCredentials): string {
    const env = credentials.environment || 'sandbox';
    // In real implementation, return actual API URLs
    return env === 'production' 
      ? 'https://api.examplebank.com/v1'
      : 'https://api-sandbox.examplebank.com/v1';
  }
}



