// --- 📦 WISE CONNECTOR ---
// embracingearth.space - Wise (TransferWise) API connector
// Documentation: https://api-docs.wise.com/

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
} from '../types/connector';
import { createStandardTransaction } from '../utils/transactionNormalizer';

/**
 * Wise Connector
 * 
 * Multi-currency account and payment service connector.
 * Uses OAuth2 for user authorization.
 * 
 * Architecture Notes:
 * - OAuth2 authorization code flow for user consent
 * - Supports multi-currency accounts (balances)
 * - Read-only transaction access
 * - Supports webhooks for real-time updates
 * 
 * API Documentation: https://api-docs.wise.com/
 */
export class WiseConnector extends BaseConnector {
  protected readonly connectorId = 'wise';
  protected readonly connectorType = 'api' as const;
  protected readonly transactionSource = 'PAYMENT_API' as const;

  private readonly API_BASE_SANDBOX = 'https://api.sandbox.transferwise.tech';
  private readonly API_BASE_PRODUCTION = 'https://api.transferwise.com';

  getMetadata(): ConnectorMetadata {
    return {
      id: this.connectorId,
      name: 'Wise',
      type: this.connectorType,
      description: 'Connect your Wise account for multi-currency transactions and international payment tracking.',
      version: '1.0.0',
      author: 'AI2 Platform',
      credentialFields: [
        // OAuth flow - no user-facing fields needed
        // API credentials are stored in backend env vars
      ],
      capabilities: {
        supportsAccounts: true,
        supportsTransactions: true,
        supportsBalance: true,
        supportsWebhooks: true,
        supportsRealtime: false,
        requiresApiKey: false, // Uses OAuth
        supportsMultipleAccounts: true
      },
      documentationUrl: 'https://api-docs.wise.com/'
    };
  }

  /**
   * Get API base URL based on environment
   */
  private getApiBaseUrl(): string {
    const env = process.env.WISE_ENVIRONMENT || 'sandbox';
    return env === 'production' ? this.API_BASE_PRODUCTION : this.API_BASE_SANDBOX;
  }

  /**
   * Make authenticated request to Wise API
   */
  private async makeRequest(
    endpoint: string,
    accessToken: string,
    options: RequestInit = {}
  ): Promise<any> {
    const apiBase = this.getApiBaseUrl();

    const response = await fetch(`${apiBase}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.status === 429) {
      throw new ConnectorError(
        'Rate limit exceeded',
        ConnectorErrorCode.RATE_LIMIT_EXCEEDED,
        429
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new ConnectorError(
        'Unauthorized - token expired or invalid',
        ConnectorErrorCode.UNAUTHORIZED,
        response.status
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new ConnectorError(
        `Wise API error: ${errorText}`,
        ConnectorErrorCode.CONNECTION_FAILED,
        response.status
      );
    }

    return await response.json();
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const clientId = process.env.WISE_CLIENT_ID;
    const clientSecret = process.env.WISE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new ConnectorError(
        'Wise OAuth not configured',
        ConnectorErrorCode.CONFIGURATION_ERROR,
        500
      );
    }

    const apiBase = this.getApiBaseUrl();
    
    const response = await fetch(`${apiBase}/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      }).toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new ConnectorError(
        `Failed to exchange code: ${error}`,
        ConnectorErrorCode.INVALID_CREDENTIALS,
        response.status
      );
    }

    const data = await response.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const clientId = process.env.WISE_CLIENT_ID;
    const clientSecret = process.env.WISE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new ConnectorError(
        'Wise OAuth not configured',
        ConnectorErrorCode.CONFIGURATION_ERROR,
        500
      );
    }

    const apiBase = this.getApiBaseUrl();
    
    const response = await fetch(`${apiBase}/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }).toString()
    });

    if (!response.ok) {
      throw new ConnectorError(
        'Failed to refresh token',
        ConnectorErrorCode.UNAUTHORIZED,
        response.status
      );
    }

    const data = await response.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in
    };
  }

  async validateCredentials(credentials: ConnectorCredentials): Promise<boolean> {
    if (!credentials.accessToken) {
      throw new ConnectorError(
        'Access token is required',
        ConnectorErrorCode.INVALID_CREDENTIALS,
        400
      );
    }

    try {
      // Validate by fetching profiles
      await this.makeRequest('/v1/profiles', credentials.accessToken);
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
      // Get profiles (personal and business)
      const profiles = await this.makeRequest('/v1/profiles', credentials.accessToken);
      
      // Get accounts for each profile
      const allAccounts: ConnectorAccount[] = [];
      
      for (const profile of profiles) {
        const profileId = profile.id;
        
        // Get balances (multi-currency accounts)
        try {
          const balances = await this.makeRequest(
            `/v4/profiles/${profileId}/balances?types=STANDARD`,
            credentials.accessToken
          );

          for (const balance of balances) {
            allAccounts.push({
              id: `${profileId}-${balance.id}`,
              name: `${balance.currency} Account`,
              type: 'multi_currency',
              currency: balance.currency,
              balance: balance.amount?.value || 0,
              availableBalance: balance.amount?.value,
              metadata: {
                wiseProfileId: profileId,
                wiseBalanceId: balance.id,
                profileType: profile.type // 'personal' or 'business'
              }
            });
          }
        } catch (err) {
          console.error(`Failed to fetch balances for profile ${profileId}:`, err);
        }
      }

      const connectionId = `wise_${Date.now()}`;

      return {
        id: connectionId,
        connectorId: this.connectorId,
        connectorType: this.connectorType,
        userId,
        status: 'connected',
        accounts: allAccounts,
        lastSync: new Date().toISOString(),
        settings: settings || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          profiles: profiles.map((p: any) => ({ id: p.id, type: p.type }))
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
    // Wise doesn't require explicit disconnection
    // Token will expire naturally or can be revoked via Wise dashboard
    return true;
  }

  async getAccounts(
    connectionId: string,
    credentials: ConnectorCredentials
  ): Promise<ConnectorAccount[]> {
    try {
      const profiles = await this.makeRequest('/v1/profiles', credentials.accessToken);
      const allAccounts: ConnectorAccount[] = [];
      
      for (const profile of profiles) {
        const balances = await this.makeRequest(
          `/v4/profiles/${profile.id}/balances?types=STANDARD`,
          credentials.accessToken
        );

        for (const balance of balances) {
          allAccounts.push({
            id: `${profile.id}-${balance.id}`,
            name: `${balance.currency} Account`,
            type: 'multi_currency',
            currency: balance.currency,
            balance: balance.amount?.value || 0,
            availableBalance: balance.amount?.value,
            bankName: 'Wise',
            metadata: {
              wiseProfileId: profile.id,
              wiseBalanceId: balance.id,
              profileType: profile.type
            }
          });
        }
      }

      return allAccounts;
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
      // Parse accountId to get profileId and balanceId
      const [profileId, balanceId] = accountId.split('-');
      
      // Build query params
      const params = new URLSearchParams();
      if (filter?.dateFrom) {
        const fromDate = typeof filter.dateFrom === 'string' ? filter.dateFrom : filter.dateFrom.toISOString();
        params.append('intervalStart', fromDate);
      }
      if (filter?.dateTo) {
        const toDate = typeof filter.dateTo === 'string' ? filter.dateTo : filter.dateTo.toISOString();
        params.append('intervalEnd', toDate);
      }
      if (filter?.limit) {
        params.append('size', filter.limit.toString());
      }

      // Get balance statement (transactions)
      const queryString = params.toString();
      const endpoint = `/v1/profiles/${profileId}/balance-statements/${balanceId}/statement.json${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.makeRequest(endpoint, credentials.accessToken);
      const transactions = response.transactions || [];

      // Normalize to StandardTransaction format
      return transactions.map((tx: any) => {
        const amount = tx.amount?.value || 0;
        
        return createStandardTransaction(
          {
            id: tx.referenceNumber || `wise-${Date.now()}-${Math.random()}`,
            accountId,
            amount: amount,
            type: amount >= 0 ? 'credit' : 'debit',
            description: tx.details?.description || tx.type || 'Transaction',
            date: tx.date || new Date().toISOString(),
            reference: tx.referenceNumber,
            balance: tx.runningBalance?.value,
            metadata: {
              wiseTransactionId: tx.referenceNumber,
              type: tx.type,
              currency: tx.amount?.currency
            }
          },
          '',
          accountId,
          connectionId,
          this.connectorId,
          this.connectorType,
          this.transactionSource
        );
      });
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
          console.error(`Error fetching Wise transactions for account ${accountId}:`, error);
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
    if (!credentials.refreshToken) {
      throw new ConnectorError(
        'Refresh token not available',
        ConnectorErrorCode.UNAUTHORIZED,
        401
      );
    }

    const tokens = await this.refreshAccessToken(credentials.refreshToken);
    
    return {
      ...credentials,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(redirectUri: string, state?: string): string {
    const clientId = process.env.WISE_CLIENT_ID;
    if (!clientId) {
      throw new ConnectorError(
        'WISE_CLIENT_ID not configured',
        ConnectorErrorCode.CONFIGURATION_ERROR,
        500
      );
    }

    const apiBase = this.getApiBaseUrl();
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'transfers' // Read-only scope
    });

    if (state) {
      params.append('state', state);
    }

    return `${apiBase}/oauth/authorize?${params.toString()}`;
  }
}






