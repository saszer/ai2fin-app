// --- 📦 BASIQ CONNECTOR ---
// embracingearth.space - Basiq financial data aggregation API connector
// Documentation: https://api.basiq.io/docs

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
 * Basiq Connector
 * 
 * Financial data aggregation service that provides access to bank accounts and transactions
 * across multiple Australian banks.
 * 
 * Architecture Notes:
 * - Uses API key authentication (Bearer token obtained via OAuth2 client credentials)
 * - Supports sandbox and production environments
 * - Implements token refresh (tokens expire every 60 minutes)
 * - Normalizes Basiq transaction format to StandardTransaction
 * 
 * API Documentation: https://api.basiq.io/docs
 * Dashboard: https://dashboard.basiq.io
 */
export class BasiqConnector extends BaseConnector {
  protected readonly connectorId = 'basiq';
  protected readonly connectorType = 'bank' as const;
  protected readonly transactionSource = 'BANK_API' as const;

  private readonly API_BASE_SANDBOX = 'https://api.sandbox.basiq.io';
  private readonly API_BASE_PRODUCTION = 'https://api.basiq.io';

  getMetadata(): ConnectorMetadata {
    return {
      id: this.connectorId,
      name: 'Basiq',
      type: this.connectorType,
      description: 'Connect to Basiq financial data aggregation API. Access bank accounts and transactions across multiple Australian banks.',
      version: '1.0.0',
      author: 'AI2 Platform',
      credentialFields: [
        {
          name: 'apiKey',
          label: 'API Key',
          type: 'password',
          required: true,
          placeholder: 'Enter your Basiq API key',
          helpText: 'Your Basiq API key from https://dashboard.basiq.io/apiKeys',
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
          helpText: 'Basiq API environment (sandbox for testing, production for live data)'
        }
      ],
      capabilities: {
        supportsAccounts: true,
        supportsTransactions: true,
        supportsBalance: true,
        supportsWebhooks: true,
        supportsRealtime: true, // ✅ Real-time via webhooks
        requiresApiKey: true,
        supportsMultipleAccounts: true
      },
      documentationUrl: 'https://api.basiq.io/docs'
    };
  }

  /**
   * Get API base URL based on environment
   */
  private getApiBaseUrl(credentials: ConnectorCredentials): string {
    const env = credentials.environment || 'sandbox';
    return env === 'production' ? this.API_BASE_PRODUCTION : this.API_BASE_SANDBOX;
  }

  /**
   * Get access token using API key (OAuth2 client credentials flow)
   * Basiq tokens expire every 60 minutes
   */
  private async getAccessToken(credentials: ConnectorCredentials): Promise<string> {
    const apiBase = this.getApiBaseUrl(credentials);
    
    // Check if we have a cached token that's still valid
    const tokenCache = (credentials as any).accessTokenCache;
    if (tokenCache && tokenCache.expiresAt > Date.now()) {
      return tokenCache.accessToken;
    }

    try {
      const response = await fetch(`${apiBase}/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${credentials.apiKey}:`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'basiq-version': '3.0'
        },
        body: 'scope=SERVER_ACCESS'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ConnectorError(
          `Failed to obtain access token: ${errorText}`,
          ConnectorErrorCode.INVALID_CREDENTIALS,
          response.status
        );
      }

      const tokenData = await response.json() as { access_token?: string; expires_in?: number };
      const accessToken = tokenData.access_token;
      const expiresIn = tokenData.expires_in || 3600; // Default 60 minutes

      // Cache token with expiration
      (credentials as any).accessTokenCache = {
        accessToken,
        expiresAt: Date.now() + (expiresIn - 60) * 1000 // Expire 60 seconds early
      };

      return accessToken;
    } catch (error: any) {
      if (error instanceof ConnectorError) {
        throw error;
      }
      this.handleError(error, 'getAccessToken');
    }
  }

  /**
   * Make authenticated request to Basiq API
   */
  private async makeRequest(
    endpoint: string,
    credentials: ConnectorCredentials,
    options: RequestInit = {}
  ): Promise<any> {
    const apiBase = this.getApiBaseUrl(credentials);
    const accessToken = await this.getAccessToken(credentials);

    const response = await fetch(`${apiBase}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'basiq-version': '3.0',
        ...options.headers
      }
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
      throw new ConnectorError(
        `Rate limit exceeded. Retry after ${retryAfter} seconds`,
        ConnectorErrorCode.RATE_LIMIT_EXCEEDED,
        429,
        { retryAfter }
      );
    }

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      // Clear cached token on auth failure
      delete (credentials as any).accessTokenCache;
      
      if (response.status === 401) {
        throw new ConnectorError(
          'Invalid API key or expired token',
          ConnectorErrorCode.UNAUTHORIZED,
          401
        );
      }
      throw new ConnectorError(
        'Access forbidden',
        ConnectorErrorCode.UNAUTHORIZED,
        403
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new ConnectorError(
        `API request failed: ${errorText}`,
        ConnectorErrorCode.CONNECTION_FAILED,
        response.status
      );
    }

    return await response.json();
  }

  async validateCredentials(credentials: ConnectorCredentials): Promise<boolean> {
    if (!credentials.apiKey) {
      throw new ConnectorError(
        'API key is required',
        ConnectorErrorCode.INVALID_CREDENTIALS,
        400
      );
    }

    try {
      // Try to obtain an access token to validate credentials
      await this.getAccessToken(credentials);
      return true;
    } catch (error: any) {
      if (error instanceof ConnectorError) {
        throw error;
      }
      this.handleError(error, 'validateCredentials');
    }
  }

  async connect(
    userId: string,
    credentials: ConnectorCredentials,
    settings?: ConnectorSettings
  ): Promise<ConnectorConnection> {
    await this.validateCredentials(credentials);

    try {
      // Create a user in Basiq (if not exists) to link accounts
      // Note: In real implementation, you'd need to handle user creation/retrieval
      // For now, we'll fetch accounts directly (assuming user context is managed separately)
      
      // Fetch accounts from Basiq
      const accounts = await this.getAccounts('', credentials);

      const connectionId = `basiq_${Date.now()}`;

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
          basiqUserId: userId // Store Basiq user ID for future reference
        }
      };
    } catch (error: any) {
      this.handleError(error, 'connect');
    }
  }

  async disconnect(
    connectionId: string,
    credentials: ConnectorCredentials
  ): Promise<boolean> {
    // Basiq doesn't require explicit disconnection
    // Just clear cached tokens
    delete (credentials as any).accessTokenCache;
    return true;
  }

  async getAccounts(
    connectionId: string,
    credentials: ConnectorCredentials
  ): Promise<ConnectorAccount[]> {
    try {
      // In Basiq, you need a user ID first
      // This is a simplified version - in production, you'd need to:
      // 1. Create/retrieve Basiq user
      // 2. Link bank accounts via connection flow
      // 3. Fetch accounts for that user
      
      // Example endpoint structure:
      // GET /users/{userId}/accounts
      
      // For now, return empty array with note that accounts need to be linked first
      // In production implementation:
      // const userId = credentials.basiqUserId || connectionId;
      // const response = await this.makeRequest(`/users/${userId}/accounts`, credentials);
      // 
      // const accounts: ConnectorAccount[] = response.data.map((acc: any) => ({
      //   id: acc.id,
      //   name: acc.nickname || acc.accountNumber || 'Account',
      //   type: acc.class?.toLowerCase() || 'unknown',
      //   currency: acc.currency || 'AUD',
      //   balance: acc.balance?.available || acc.balance?.current || 0,
      //   availableBalance: acc.balance?.available,
      //   accountNumber: acc.accountNumber ? `****${acc.accountNumber.slice(-4)}` : undefined,
      //   bankName: acc.institution?.name || 'Basiq',
      //   metadata: {
      //     basiqAccountId: acc.id,
      //     institutionId: acc.institution?.id,
      //     accountClass: acc.class
      //   }
      // }));
      
      // Mock accounts for development (replace with real API call above)
      return [];
    } catch (error: any) {
      this.handleError(error, 'getAccounts');
    }
  }

  async getTransactions(
    connectionId: string,
    accountId: string,
    credentials: ConnectorCredentials,
    filter?: TransactionFilter
  ): Promise<StandardTransaction[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filter?.dateFrom) {
        const fromDate = typeof filter.dateFrom === 'string' ? new Date(filter.dateFrom) : filter.dateFrom;
        params.append('filter=transaction.postDate.gte', fromDate.toISOString().split('T')[0]);
      }
      
      if (filter?.dateTo) {
        const toDate = typeof filter.dateTo === 'string' ? new Date(filter.dateTo) : filter.dateTo;
        params.append('filter=transaction.postDate.lte', toDate.toISOString().split('T')[0]);
      }
      
      if (filter?.limit) {
        params.append('limit', filter.limit.toString());
      }

      // Basiq endpoint: GET /users/{userId}/accounts/{accountId}/transactions
      // const userId = credentials.basiqUserId || connectionId;
      // const queryString = params.toString();
      // const endpoint = `/users/${userId}/accounts/${accountId}/transactions${queryString ? `?${queryString}` : ''}`;
      // const response = await this.makeRequest(endpoint, credentials);
      
      // Parse Basiq transactions
      // const rawTransactions = response.data.map((tx: any) => {
      //   // Basiq transaction format
      //   const amount = parseFloat(tx.amount || '0');
      //   const direction = tx.direction?.toLowerCase() || 'debit';
      //   
      //   return {
      //     id: tx.id,
      //     accountId,
      //     amount: direction === 'debit' ? -Math.abs(amount) : Math.abs(amount),
      //     type: direction,
      //     description: tx.description || tx.subClass?.title || 'Transaction',
      //     date: tx.postDate || tx.executeDate || new Date().toISOString(),
      //     merchant: tx.merchant?.name,
      //     reference: tx.reference,
      //     balance: tx.balance,
      //     metadata: {
      //       basiqTransactionId: tx.id,
      //       category: tx.category,
      //       subClass: tx.subClass,
      //       merchant: tx.merchant,
      //       institutionTransactionId: tx.institutionTransactionId
      //     }
      //   };
      // });

      // Mock transactions for development (replace with real API call above)
      const rawTransactions: any[] = [];

      // Normalize to StandardTransaction format
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

      // Apply additional filters if needed
      let filteredTransactions = transactions;
      if (filter) {
        if (filter.amountMin !== undefined) {
          filteredTransactions = filteredTransactions.filter(tx => Math.abs(tx.amount) >= filter.amountMin!);
        }
        if (filter.amountMax !== undefined) {
          filteredTransactions = filteredTransactions.filter(tx => Math.abs(tx.amount) <= filter.amountMax!);
        }
      }

      return filteredTransactions;
    } catch (error: any) {
      this.handleError(error, 'getTransactions');
    }
  }

  async sync(
    connectionId: string,
    credentials: ConnectorCredentials,
    filter?: TransactionFilter
  ): Promise<SyncResult> {
    try {
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
    } catch (error: any) {
      this.handleError(error, 'sync');
    }
  }

  async refreshAuth(
    connectionId: string,
    credentials: ConnectorCredentials
  ): Promise<ConnectorCredentials> {
    // Clear cached token to force refresh
    delete (credentials as any).accessTokenCache;
    
    // Get new token (will be cached automatically)
    await this.getAccessToken(credentials);
    
    return credentials;
  }
}

