// --- 📦 BASE CONNECTOR ABSTRACT CLASS ---
// embracingearth.space - Core framework for building connectors
// All connectors must extend this class and implement abstract methods

import {
  StandardTransaction,
  ConnectorCredentials,
  ConnectorSettings,
  ConnectorAccount,
  ConnectorConnection,
  ConnectorMetadata,
  SyncResult,
  TransactionFilter,
  ConnectorError,
  ConnectorErrorCode,
  ConnectorType,
  TransactionSource
} from '../types/connector';

/**
 * Base abstract class that all connectors must extend
 * Provides common functionality and enforces consistent interface
 * 
 * Architecture Notes:
 * - Each connector is isolated and stateless (credentials passed per operation)
 * - Connectors normalize source data to StandardTransaction format
 * - Framework handles credential storage, user isolation, and transaction deduplication
 * - Connectors should be thread-safe and support concurrent operations
 */
export abstract class BaseConnector {
  protected abstract readonly connectorId: string;
  protected abstract readonly connectorType: ConnectorType;
  protected abstract readonly transactionSource: TransactionSource;
  
  /**
   * Get connector metadata (used for registration and UI generation)
   * This should return static metadata about the connector
   */
  abstract getMetadata(): ConnectorMetadata;

  /**
   * Validate credentials without establishing full connection
   * Used to verify credentials are correct before saving connection
   * 
   * @param credentials - Connector-specific credentials
   * @returns true if credentials are valid
   * @throws ConnectorError if credentials are invalid
   */
  abstract validateCredentials(credentials: ConnectorCredentials): Promise<boolean>;

  /**
   * Establish connection and return connection info
   * This should test the connection and fetch initial account list
   * 
   * @param userId - AI2 platform user ID
   * @param credentials - Connector-specific credentials
   * @param settings - User settings for this connection
   * @returns ConnectorConnection with account list
   * @throws ConnectorError if connection fails
   */
  abstract connect(
    userId: string,
    credentials: ConnectorCredentials,
    settings?: ConnectorSettings
  ): Promise<ConnectorConnection>;

  /**
   * Disconnect and clean up connection
   * Should revoke tokens, close connections, etc.
   * 
   * @param connectionId - Connection ID to disconnect
   * @param credentials - Credentials needed for disconnection
   * @returns true if disconnection successful
   */
  abstract disconnect(connectionId: string, credentials: ConnectorCredentials): Promise<boolean>;

  /**
   * Fetch accounts available through this connection
   * 
   * @param connectionId - Connection ID
   * @param credentials - Credentials for authentication
   * @returns List of accounts
   * @throws ConnectorError if fetch fails
   */
  abstract getAccounts(
    connectionId: string,
    credentials: ConnectorCredentials
  ): Promise<ConnectorAccount[]>;

  /**
   * Fetch transactions for a specific account
   * This is the core method - must normalize source data to StandardTransaction format
   * 
   * @param connectionId - Connection ID
   * @param accountId - Account ID to fetch transactions for
   * @param credentials - Credentials for authentication
   * @param filter - Optional filters (date range, amount, etc.)
   * @returns List of standardized transactions
   * @throws ConnectorError if fetch fails
   */
  abstract getTransactions(
    connectionId: string,
    accountId: string,
    credentials: ConnectorCredentials,
    filter?: TransactionFilter
  ): Promise<StandardTransaction[]>;

  /**
   * Sync transactions for a connection (all accounts or specific accounts)
   * Framework will call this for scheduled syncs
   * 
   * @param connectionId - Connection ID
   * @param credentials - Credentials for authentication
   * @param filter - Optional filters
   * @returns Sync result with transactions
   */
  abstract sync(
    connectionId: string,
    credentials: ConnectorCredentials,
    filter?: TransactionFilter
  ): Promise<SyncResult>;

  /**
   * Refresh authentication tokens (if connector uses OAuth/tokens)
   * Framework will call this when tokens expire
   * 
   * @param connectionId - Connection ID
   * @param credentials - Current credentials (may contain refresh token)
   * @returns Updated credentials with new tokens
   */
  async refreshAuth(
    connectionId: string,
    credentials: ConnectorCredentials
  ): Promise<ConnectorCredentials> {
    // Default implementation: no refresh needed
    // Override in connectors that support token refresh
    return credentials;
  }

  /**
   * Normalize transaction amount based on source data
   * Some sources use positive/negative convention, others use type field
   * 
   * @param amount - Raw amount from source
   * @param type - Transaction type from source ('debit', 'credit', etc.)
   * @param sourceType - Source transaction type indicator
   * @returns Normalized amount (negative = expense, positive = income)
   */
  protected normalizeAmount(
    amount: number,
    type?: string,
    sourceType?: 'debit' | 'credit' | 'expense' | 'income' | 'transfer'
  ): number {
    // If already negative or positive with correct convention, return as-is
    // This handles sources that already use the correct convention
    
    if (sourceType === 'debit' || sourceType === 'expense') {
      // Debits/expenses should be negative
      return amount < 0 ? amount : -Math.abs(amount);
    }
    
    if (sourceType === 'credit' || sourceType === 'income') {
      // Credits/income should be positive
      return amount > 0 ? amount : Math.abs(amount);
    }
    
    if (sourceType === 'transfer') {
      // Transfers can be either, but usually negative
      return amount;
    }
    
    // Fallback: infer from type string
    if (type) {
      const lowerType = type.toLowerCase();
      if (lowerType.includes('debit') || lowerType.includes('expense') || lowerType.includes('outgoing')) {
        return amount < 0 ? amount : -Math.abs(amount);
      }
      if (lowerType.includes('credit') || lowerType.includes('income') || lowerType.includes('incoming')) {
        return amount > 0 ? amount : Math.abs(amount);
      }
    }
    
    // Default: return as-is (assumes source already uses correct convention)
    return amount;
  }

  /**
   * Infer primary type from amount and description
   * 
   * @param amount - Transaction amount (should already be normalized)
   * @param description - Transaction description
   * @param metadata - Additional metadata that might contain type hints
   * @returns Primary type ('expense', 'income', or 'transfer')
   */
  protected inferPrimaryType(
    amount: number,
    description?: string,
    metadata?: Record<string, any>
  ): 'expense' | 'income' | 'transfer' {
    // Check metadata first
    if (metadata?.type) {
      const type = String(metadata.type).toLowerCase();
      if (type === 'expense' || type === 'debit') return 'expense';
      if (type === 'income' || type === 'credit') return 'income';
      if (type === 'transfer') return 'transfer';
    }
    
    // Infer from amount sign (after normalization)
    if (amount < 0) return 'expense';
    if (amount > 0) return 'income';
    
    // Infer from description keywords
    if (description) {
      const lowerDesc = description.toLowerCase();
      const transferKeywords = ['transfer', 'payment to', 'payment from', 'send to', 'receive from'];
      if (transferKeywords.some(kw => lowerDesc.includes(kw))) {
        return 'transfer';
      }
    }
    
    // Default: assume expense if amount is negative or zero
    return amount < 0 ? 'expense' : 'income';
  }

  /**
   * Sanitize transaction description
   * Remove sensitive data, normalize whitespace, etc.
   * 
   * @param description - Raw description from source
   * @returns Sanitized description
   */
  protected sanitizeDescription(description: string): string {
    if (!description) return '';
    
    // Remove extra whitespace
    let sanitized = description.trim().replace(/\s+/g, ' ');
    
    // Remove sensitive patterns (adjust based on requirements)
    // Example: Remove full credit card numbers (keep last 4)
    sanitized = sanitized.replace(/\b\d{13,19}\b/g, (match) => {
      return `****${match.slice(-4)}`;
    });
    
    return sanitized;
  }

  /**
   * Create standardized transaction from raw source data
   * Override this in connectors if you need custom normalization logic
   * 
   * @param rawTransaction - Raw transaction data from source
   * @param userId - AI2 platform user ID
   * @param accountId - Account ID
   * @param connectionId - Connection ID
   * @returns Standardized transaction
   */
  protected normalizeTransaction(
    rawTransaction: any,
    userId: string,
    accountId: string,
    connectionId: string
  ): StandardTransaction {
    // Extract common fields (adjust based on source format)
    const transactionId = rawTransaction.id || rawTransaction.transactionId || rawTransaction.reference || 
                         `${connectionId}_${accountId}_${rawTransaction.date}_${rawTransaction.amount}`;
    
    const amount = this.normalizeAmount(
      rawTransaction.amount || 0,
      rawTransaction.type,
      rawTransaction.sourceType
    );
    
    const primaryType = this.inferPrimaryType(
      amount,
      rawTransaction.description,
      rawTransaction.metadata
    );
    
    const description = this.sanitizeDescription(
      rawTransaction.description || rawTransaction.narrative || rawTransaction.merchant || ''
    );
    
    // Build standardized transaction
    return {
      transactionId,
      accountId,
      userId,
      amount,
      currency: rawTransaction.currency || 'USD',
      date: rawTransaction.date || new Date(),
      primaryType,
      secondaryType: rawTransaction.secondaryType,
      description,
      originalDescription: rawTransaction.description || rawTransaction.narrative,
      merchant: rawTransaction.merchant || rawTransaction.payee,
      reference: rawTransaction.reference || rawTransaction.transactionId || transactionId,
      location: rawTransaction.location || rawTransaction.address,
      balance: rawTransaction.balance,
      metadata: {
        ...rawTransaction.metadata,
        sourceRawData: rawTransaction // Keep raw data for debugging (sanitize sensitive fields)
      },
      source: this.transactionSource,
      connectorId: this.connectorId,
      connectorType: this.connectorType,
      categoryHint: rawTransaction.category || rawTransaction.categoryHint,
      tags: rawTransaction.tags,
      receiptUrl: rawTransaction.receiptUrl || rawTransaction.documentUrl,
      documentUrl: rawTransaction.documentUrl
    };
  }

  /**
   * Validate transaction before returning
   * Framework will call this to ensure transaction meets standards
   * 
   * @param transaction - Transaction to validate
   * @throws ConnectorError if validation fails
   */
  protected validateTransaction(transaction: StandardTransaction): void {
    if (!transaction.transactionId) {
      throw new ConnectorError(
        'Transaction ID is required',
        ConnectorErrorCode.INVALID_DATA,
        400
      );
    }
    
    if (!transaction.accountId) {
      throw new ConnectorError(
        'Account ID is required',
        ConnectorErrorCode.INVALID_DATA,
        400
      );
    }
    
    if (!transaction.userId) {
      throw new ConnectorError(
        'User ID is required',
        ConnectorErrorCode.INVALID_DATA,
        400
      );
    }
    
    if (typeof transaction.amount !== 'number' || isNaN(transaction.amount)) {
      throw new ConnectorError(
        'Valid amount is required',
        ConnectorErrorCode.INVALID_DATA,
        400
      );
    }
    
    if (!transaction.description || transaction.description.trim().length === 0) {
      throw new ConnectorError(
        'Transaction description is required',
        ConnectorErrorCode.INVALID_DATA,
        400
      );
    }
    
    if (!transaction.date) {
      throw new ConnectorError(
        'Transaction date is required',
        ConnectorErrorCode.INVALID_DATA,
        400
      );
    }
    
    if (!['expense', 'income', 'transfer'].includes(transaction.primaryType)) {
      throw new ConnectorError(
        'Invalid primary type',
        ConnectorErrorCode.INVALID_DATA,
        400
      );
    }
  }

  /**
   * Handle errors and convert to ConnectorError
   * Provides consistent error handling across connectors
   */
  protected handleError(error: any, context: string): never {
    if (error instanceof ConnectorError) {
      throw error;
    }
    
    // Convert HTTP errors
    if (error.response) {
      const statusCode = error.response.status || 500;
      const message = error.response.data?.message || error.message || 'Connection failed';
      
      if (statusCode === 401 || statusCode === 403) {
        throw new ConnectorError(
          'Authentication failed',
          ConnectorErrorCode.UNAUTHORIZED,
          401,
          { context, originalError: message }
        );
      }
      
      if (statusCode === 429) {
        throw new ConnectorError(
          'Rate limit exceeded',
          ConnectorErrorCode.RATE_LIMIT_EXCEEDED,
          429,
          { context }
        );
      }
      
      throw new ConnectorError(
        message,
        ConnectorErrorCode.CONNECTION_FAILED,
        statusCode,
        { context, originalError: error.message }
      );
    }
    
    // Convert timeout errors
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      throw new ConnectorError(
        'Connection timeout',
        ConnectorErrorCode.TIMEOUT,
        408,
        { context }
      );
    }
    
    // Generic error
    throw new ConnectorError(
      error.message || 'Unknown error',
      ConnectorErrorCode.SYNC_FAILED,
      500,
      { context, originalError: error }
    );
  }
}



