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
        ConnectorErrorCode.AUTHENTICATION_FAILED,
        'Plaid API credentials not configured',
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
    credentials: ConnectorCredentials,
    settings?: ConnectorSettings
  ): Promise<ConnectorConnection> {
    const { clientId, secret } = this.getPlaidCredentials();
    const accessToken = credentials.accessToken as string;
    const itemId = credentials.itemId as string;
    
    if (!accessToken || !itemId) {
      throw new ConnectorError(
        ConnectorErrorCode.INVALID_CREDENTIALS,
        'Access token and item ID are required'
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
        ConnectorErrorCode.CONNECTION_FAILED,
        error.error_message || 'Failed to connect to Plaid',
        { plaidError: error }
      );
    }
    
    const data = await response.json() as any;
    
    return {
      id: itemId,
      connectorId: this.connectorId,
      status: 'connected',
      lastSync: new Date().toISOString(),
      metadata: {
        accessToken, // Store encrypted in production
        itemId,
        institutionId: data.item?.institution_id,
        plaidItemStatus: data.item?.status,
      },
    };
  }

  async disconnect(connectionId: string, credentials?: ConnectorCredentials): Promise<void> {
    const { clientId, secret } = this.getPlaidCredentials();
    const accessToken = credentials?.accessToken as string;
    
    if (accessToken) {
      try {
        await fetch(`${PLAID_BASE_URL}/item/remove`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            secret: secret,
            access_token: accessToken,
          }),
        });
        console.log(`🔌 Plaid item ${connectionId} removed`);
      } catch (error) {
        console.warn('Failed to remove Plaid item:', error);
      }
    }
  }

  async fetchAccounts(
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
        ConnectorErrorCode.FETCH_FAILED,
        error.error_message || 'Failed to fetch Plaid accounts'
      );
    }
    
    const data = await response.json() as any;
    
    return (data.accounts || []).map((acc: any) => ({
      id: acc.account_id,
      connectorId: this.connectorId,
      connectionId,
      name: acc.name,
      officialName: acc.official_name,
      type: this.mapAccountType(acc.type, acc.subtype),
      subtype: acc.subtype,
      balance: acc.balances?.current || 0,
      availableBalance: acc.balances?.available,
      currency: acc.balances?.iso_currency_code || 'USD',
      mask: acc.mask,
      metadata: {
        plaidAccountId: acc.account_id,
        subtype: acc.subtype,
        institutionId: data.item?.institution_id,
      },
    }));
  }

  async syncTransactions(
    connectionId: string,
    credentials: ConnectorCredentials,
    filter?: TransactionFilter
  ): Promise<SyncResult> {
    const { clientId, secret } = this.getPlaidCredentials();
    const accessToken = credentials.accessToken as string;
    
    const endDate = (filter?.endDate || new Date()).toISOString().split('T')[0];
    const startDate = filter?.startDate 
      ? filter.startDate.toISOString().split('T')[0]
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
        options: { count: 500, offset: 0 },
      }),
    });
    
    if (!response.ok) {
      const error = await response.json() as any;
      throw new ConnectorError(
        ConnectorErrorCode.FETCH_FAILED,
        error.error_message || 'Failed to fetch Plaid transactions'
      );
    }
    
    const data = await response.json() as any;
    const transactions: StandardTransaction[] = (data.transactions || []).map((tx: any) => 
      createStandardTransaction({
        id: tx.transaction_id,
        source: this.transactionSource,
        connectorId: this.connectorId,
        accountId: tx.account_id,
        date: new Date(tx.date),
        description: tx.name,
        amount: Math.abs(tx.amount),
        type: tx.amount < 0 ? 'credit' : 'debit',
        currency: tx.iso_currency_code || 'USD',
        category: tx.category?.join(' > '),
        merchantName: tx.merchant_name,
        pending: tx.pending,
        metadata: {
          plaidTransactionId: tx.transaction_id,
          categoryId: tx.category_id,
          paymentChannel: tx.payment_channel,
          location: tx.location,
        },
      })
    );
    
    return {
      success: true,
      transactionsAdded: transactions.length,
      transactionsModified: 0,
      transactionsRemoved: 0,
      transactions,
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
