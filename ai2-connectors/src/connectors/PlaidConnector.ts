// --- 📦 PLAID CONNECTOR ---
// embracingearth.space - Plaid integration for US/UK/Canada/EU banks
// Coverage: 12,000+ US banks, UK, Canada, some EU
// Documentation: https://plaid.com/docs/

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

const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';
const PLAID_BASE_URL = PLAID_ENV === 'production' 
  ? 'https://production.plaid.com'
  : PLAID_ENV === 'development'
    ? 'https://development.plaid.com'
    : 'https://sandbox.plaid.com';

/**
 * Plaid Connector
 * 
 * Financial data aggregation service that provides access to bank accounts and transactions
 * across 12,000+ institutions in US, UK, Canada, and Europe.
 * 
 * Architecture Notes:
 * - Uses Plaid Link flow for user authentication (no credentials stored)
 * - Supports sandbox, development, and production environments
 * - Access tokens don't expire but can be invalidated
 * - Normalizes Plaid transaction format to StandardTransaction
 * 
 * API Documentation: https://plaid.com/docs/
 * Dashboard: https://dashboard.plaid.com
 */
export class PlaidConnector extends BaseConnector {
  protected readonly connectorId = 'plaid';
  protected readonly connectorType = 'bank' as const;
  protected readonly transactionSource = 'BANK_API' as const;

  getMetadata(): ConnectorMetadata {
    return {
      id: this.connectorId,
      name: 'Plaid',
      type: this.connectorType,
      description: 'Connect to 12,000+ US, UK, Canadian, and European banks with Plaid Link.',
      version: '1.0.0',
      author: 'embracingearth.space',
      credentialFields: [
        {
          name: 'accessToken',
          label: 'Access Token',
          type: 'password',
          required: true,
          placeholder: 'Obtained via Plaid Link',
          helpText: 'Access token received after completing Plaid Link flow',
          sensitive: true
        },
        {
          name: 'itemId',
          label: 'Item ID',
          type: 'text',
          required: true,
          placeholder: 'Plaid Item ID',
          helpText: 'Item ID received from Plaid Link'
        }
      ],
      capabilities: {
        supportsAccounts: true,
        supportsTransactions: true,
        supportsBalance: true,
        supportsWebhooks: true,
        supportsRealtime: false,
        requiresApiKey: false, // Uses Plaid Link flow instead
      },
      supportedCountries: ['US', 'GB', 'CA', 'IE', 'FR', 'ES', 'NL', 'DE'],
      documentationUrl: 'https://plaid.com/docs/',
      logoUrl: 'https://plaid.com/assets/img/logo-plaid.svg',
    };
  }

  private getPlaidCredentials(): { clientId: string; secret: string } {
    const clientId = process.env.PLAID_CLIENT_ID;
    const secret = process.env.PLAID_SECRET;
    
    if (!clientId || !secret || clientId === 'your_client_id' || secret === 'your_secret') {
      throw new ConnectorError(
        'Plaid API credentials not configured',
        ConnectorErrorCode.AUTHENTICATION_FAILED,
        500,
        { hint: 'Get credentials from https://dashboard.plaid.com/developers/keys' }
      );
    }
    
    return { clientId, secret };
  }

  async validateCredentials(credentials: ConnectorCredentials): Promise<boolean> {
    try {
      const { clientId, secret } = this.getPlaidCredentials();
      const accessToken = credentials.accessToken as string;
      
      if (!accessToken) return false;
      
      // Test by fetching accounts
      const response = await fetch(`${PLAID_BASE_URL}/accounts/get`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          secret: secret,
          access_token: accessToken,
        }),
      });
      
      return response.ok;
    } catch (error) {
      console.error('Plaid credential validation failed:', error);
      return false;
    }
  }

  async connect(
    userId: string,
    credentials: ConnectorCredentials,
    settings?: ConnectorSettings
  ): Promise<ConnectorConnection> {
    const { clientId, secret } = this.getPlaidCredentials();
    const accessToken = credentials.accessToken as string;
    const itemId = credentials.itemId as string;
    
    if (!accessToken || !itemId) {
      throw new ConnectorError(
        'Access token and item ID are required',
        ConnectorErrorCode.INVALID_CREDENTIALS,
        400
      );
    }
    
    // Fetch item info
    const response = await fetch(`${PLAID_BASE_URL}/item/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        secret: secret,
        access_token: accessToken,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json() as any;
      throw new ConnectorError(
        error.error_message || 'Failed to connect to Plaid',
        ConnectorErrorCode.CONNECTION_FAILED,
        response.status,
        { plaidError: error }
      );
    }
    
    const data = await response.json() as any;
    
    // Fetch accounts to include in connection
    const accountsResponse = await fetch(`${PLAID_BASE_URL}/accounts/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        secret: secret,
        access_token: accessToken,
      }),
    });
    
    const accountsData = accountsResponse.ok ? await accountsResponse.json() as any : { accounts: [] };
    
    return {
      id: itemId,
      connectorId: this.connectorId,
      connectorType: this.connectorType,
      userId,
      status: 'connected',
      accounts: (accountsData.accounts || []).map((acc: any) => ({
        id: acc.account_id,
        name: acc.name || acc.official_name || 'Account',
        type: acc.type || 'other',
        currency: acc.balances?.iso_currency_code || 'USD',
        balance: acc.balances?.current || 0,
        availableBalance: acc.balances?.available,
        accountNumber: acc.mask,
        bankName: data.item?.institution_id,
        metadata: {
          plaidAccountId: acc.account_id,
          subtype: acc.subtype,
        },
      })),
      settings: settings || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        itemId,
        institutionId: data.item?.institution_id,
        plaidItemStatus: data.item?.status,
      },
    };
  }

  async disconnect(connectionId: string, credentials: ConnectorCredentials): Promise<boolean> {
    const { clientId, secret } = this.getPlaidCredentials();
    const accessToken = credentials.accessToken as string;
    
    if (!accessToken) {
      return false;
    }
    
    try {
      const response = await fetch(`${PLAID_BASE_URL}/item/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          secret: secret,
          access_token: accessToken,
        }),
      });
      console.log(`🔌 Plaid item ${connectionId} removed`);
      return response.ok;
    } catch (error) {
      console.warn('Failed to remove Plaid item:', error);
      return false;
    }
  }

  async getAccounts(
    connectionId: string,
    credentials: ConnectorCredentials
  ): Promise<ConnectorAccount[]> {
    const { clientId, secret } = this.getPlaidCredentials();
    const accessToken = credentials.accessToken as string;
    
    const response = await fetch(`${PLAID_BASE_URL}/accounts/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        secret: secret,
        access_token: accessToken,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json() as any;
      throw new ConnectorError(
        error.error_message || 'Failed to fetch Plaid accounts',
        ConnectorErrorCode.FETCH_FAILED,
        response.status
      );
    }
    
    const data = await response.json() as any;
    
    return (data.accounts || []).map((acc: any) => ({
      id: acc.account_id,
      name: acc.name || acc.official_name || 'Account',
      type: this.mapAccountType(acc.type, acc.subtype),
      currency: acc.balances?.iso_currency_code || 'USD',
      balance: acc.balances?.current || 0,
      availableBalance: acc.balances?.available,
      accountNumber: acc.mask,
      bankName: data.item?.institution_id,
      metadata: {
        plaidAccountId: acc.account_id,
        subtype: acc.subtype,
        officialName: acc.official_name,
      },
    }));
  }

  async getTransactions(
    connectionId: string,
    accountId: string,
    credentials: ConnectorCredentials,
    filter?: TransactionFilter
  ): Promise<StandardTransaction[]> {
    const { clientId, secret } = this.getPlaidCredentials();
    const accessToken = credentials.accessToken as string;
    
    const endDate = filter?.dateTo 
      ? (typeof filter.dateTo === 'string' ? filter.dateTo : filter.dateTo.toISOString().split('T')[0])
      : new Date().toISOString().split('T')[0];
    const startDate = filter?.dateFrom
      ? (typeof filter.dateFrom === 'string' ? filter.dateFrom : filter.dateFrom.toISOString().split('T')[0])
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const response = await fetch(`${PLAID_BASE_URL}/transactions/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        secret: secret,
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        account_ids: [accountId],
        options: { count: filter?.limit || 500, offset: 0 },
      }),
    });
    
    if (!response.ok) {
      const error = await response.json() as any;
      throw new ConnectorError(
        error.error_message || 'Failed to fetch Plaid transactions',
        ConnectorErrorCode.FETCH_FAILED,
        response.status
      );
    }
    
    const data = await response.json() as any;
    return (data.transactions || []).map((tx: any) => 
      createStandardTransaction(
        {
          id: tx.transaction_id,
          accountId: tx.account_id,
          date: new Date(tx.date),
          description: tx.name,
          amount: tx.amount, // Plaid uses positive for debits, negative for credits
          type: tx.amount < 0 ? 'credit' : 'debit',
          sourceType: tx.amount < 0 ? 'credit' : 'debit',
          currency: tx.iso_currency_code || 'USD',
          category: tx.category?.join(' > '),
          merchant: tx.merchant_name,
          pending: tx.pending,
          metadata: {
            plaidTransactionId: tx.transaction_id,
            categoryId: tx.category_id,
            paymentChannel: tx.payment_channel,
            location: tx.location,
          },
        },
        '', // userId - will be set by framework
        tx.account_id,
        connectionId,
        this.connectorId,
        this.connectorType,
        this.transactionSource
      )
    );
  }

  async sync(
    connectionId: string,
    credentials: ConnectorCredentials,
    filter?: TransactionFilter
  ): Promise<SyncResult> {
    const accounts = await this.getAccounts(connectionId, credentials);
    const allTransactions: StandardTransaction[] = [];
    
    for (const account of accounts) {
      const transactions = await this.getTransactions(connectionId, account.id, credentials, filter);
      allTransactions.push(...transactions);
    }
    
    return {
      success: true,
      connectionId,
      transactions: allTransactions,
      timestamp: new Date(),
      stats: {
        totalTransactions: allTransactions.length,
        newTransactions: allTransactions.length,
        skippedTransactions: 0,
        startDate: filter?.dateFrom,
        endDate: filter?.dateTo,
      },
    };
  }

  private mapAccountType(type: string, subtype?: string): string {
    if (subtype === 'savings') return 'savings';
    if (subtype === 'checking') return 'checking';
    if (subtype === 'credit card') return 'credit';
    if (subtype === 'mortgage') return 'mortgage';
    
    const mapping: Record<string, string> = {
      depository: 'checking',
      credit: 'credit',
      loan: 'loan',
      investment: 'investment',
      brokerage: 'investment',
      other: 'other',
    };
    
    return mapping[type?.toLowerCase()] || 'other';
  }
}

