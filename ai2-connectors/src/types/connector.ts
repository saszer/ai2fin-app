// --- 📦 CONNECTOR FRAMEWORK TYPES ---
// embracingearth.space - Enterprise-grade connector types for public repository
// Core types that define the interface between connectors and the AI2 platform

/**
 * Standardized transaction format that all connectors must produce
 * This ensures consistency across all input sources (banks, APIs, SMS, etc.)
 */
export interface StandardTransaction {
  // Core identification
  transactionId: string; // Unique identifier from source (required for deduplication)
  accountId: string; // Account identifier from source
  userId: string; // AI2 platform user ID (set by framework)

  // Financial data
  amount: number; // Amount (negative = expense, positive = income)
  currency: string; // ISO currency code (default: 'USD')
  date: Date | string; // ISO date string or Date object
  
  // Transaction classification (required)
  primaryType: 'expense' | 'income' | 'transfer'; // Primary classification
  secondaryType?: 'bill' | 'one-time expense' | 'capital expense'; // Optional secondary classification
  
  // Description and metadata
  description: string; // Transaction description (sanitized)
  originalDescription?: string; // Raw description from source
  merchant?: string; // Merchant/vendor name
  reference?: string; // Reference number/transaction ID from source
  location?: string; // Geographic location if available
  
  // Account balance (if available)
  balance?: number; // Account balance after this transaction
  
  // Additional metadata (flexible for connector-specific data)
  metadata?: Record<string, any>; // Connector-specific metadata (sanitized)
  
  // Source tracking
  source: TransactionSource; // How transaction was obtained
  connectorId: string; // Connector identifier that produced this transaction
  connectorType: ConnectorType; // Type of connector
  
  // Categorization hints (optional, will be processed by AI modules)
  categoryHint?: string; // Suggested category
  tags?: string[]; // Suggested tags
  
  // Receipt/document links (if available)
  receiptUrl?: string; // URL to receipt/document
  documentUrl?: string; // URL to supporting document
}

/**
 * Transaction source types
 */
export type TransactionSource = 
  | 'BANK_API'           // Direct bank API integration
  | 'BANK_FEED'          // Bank feed/OFX/QFX
  | 'XERO'               // Xero accounting software
  | 'MYOB'               // MYOB accounting software
  | 'SMS_UPI'            // Indian SMS-based UPI transactions
  | 'EMAIL_EXTRACTION'   // Email receipt/invoice parsing
  | 'CSV_IMPORT'         // CSV file import
  | 'MANUAL_API'         // Manual API input
  | 'WEBHOOK'            // Webhook-based input
  | 'PAYMENT_API'        // Payment API (Wise, Stripe, etc.)
  | 'CUSTOM';            // Custom connector

/**
 * Connector type classification
 */
export type ConnectorType =
  | 'bank'
  | 'accounting'
  | 'sms'
  | 'email'
  | 'api'
  | 'webhook'
  | 'file'
  | 'custom';

/**
 * Connector connection status
 */
export type ConnectionStatus = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'syncing'
  | 'error'
  | 'expired';

/**
 * Connector configuration (user-provided)
 * This is what connectors receive when connecting
 */
export interface ConnectorCredentials {
  [key: string]: any; // Flexible structure - each connector defines its own schema
}

/**
 * Connector settings (user preferences)
 */
export interface ConnectorSettings {
  autoSync?: boolean; // Enable automatic sync
  syncInterval?: number; // Sync interval in minutes (default: 60)
  enableNotifications?: boolean; // Enable sync notifications
  categorizeTransactions?: boolean; // Auto-categorize transactions
  transactionFilters?: TransactionFilter; // Default filters to apply
  [key: string]: any; // Allow connector-specific settings
}

/**
 * Transaction filter for syncing
 */
export interface TransactionFilter {
  dateFrom?: Date | string; // Only sync transactions from this date
  dateTo?: Date | string; // Only sync transactions up to this date
  amountMin?: number; // Minimum amount
  amountMax?: number; // Maximum amount
  accountIds?: string[]; // Specific accounts to sync
  excludeCategories?: string[]; // Categories to exclude
  includeOnlyCategories?: string[]; // Only include these categories
  limit?: number; // Maximum number of transactions to return
}

/**
 * Account information from connector
 */
export interface ConnectorAccount {
  id: string; // Account ID (unique within connector)
  name: string; // Account name/display name
  type: string; // Account type (checking, savings, credit, etc.)
  currency: string; // Account currency
  balance?: number; // Current balance
  availableBalance?: number; // Available balance (if different)
  accountNumber?: string; // Masked account number (last 4 digits)
  bankName?: string; // Bank/institution name
  metadata?: Record<string, any>; // Additional account metadata
}

/**
 * Connector connection information
 */
export interface ConnectorConnection {
  id: string; // Connection ID (generated by framework)
  connectorId: string; // Connector identifier
  connectorType: ConnectorType;
  userId: string; // User who owns this connection
  status: ConnectionStatus;
  accounts: ConnectorAccount[]; // Accounts available through this connection
  lastSync?: Date | string; // Last successful sync timestamp
  lastError?: string; // Last error message (if any)
  settings: ConnectorSettings; // User settings for this connection
  createdAt: Date | string; // Connection creation timestamp
  updatedAt: Date | string; // Last update timestamp
  metadata?: Record<string, any>; // Connection-specific metadata
}

/**
 * Connector metadata (describes a connector type)
 */
export interface ConnectorMetadata {
  id: string; // Connector identifier (e.g., 'anz-bank', 'xero', 'sms-upi')
  name: string; // Human-readable name
  type: ConnectorType;
  description: string; // Connector description
  version: string; // Connector version
  author?: string; // Connector author/maintainer
  
  // Credential requirements (for UI generation)
  credentialFields: CredentialField[]; // Fields required for connection
  
  // Capabilities
  capabilities: {
    supportsAccounts: boolean; // Can list accounts
    supportsTransactions: boolean; // Can fetch transactions
    supportsBalance: boolean; // Can fetch account balance
    supportsWebhooks: boolean; // Supports webhook-based sync
    supportsRealtime: boolean; // Supports real-time updates
    requiresOAuth?: boolean; // Requires OAuth flow
    requiresApiKey?: boolean; // Requires API key
    supportsMultipleAccounts?: boolean; // Can connect multiple accounts
  };
  
  // Documentation links
  documentationUrl?: string; // Link to connector documentation
  supportUrl?: string; // Link to support
  logoUrl?: string; // Logo URL
  supportedCountries?: string[]; // Supported country codes
}

/**
 * Credential field definition (for dynamic form generation)
 */
export interface CredentialField {
  name: string; // Field name (matches ConnectorCredentials key)
  label: string; // Human-readable label
  type: 'text' | 'password' | 'email' | 'url' | 'number' | 'select' | 'textarea';
  required: boolean; // Is this field required?
  placeholder?: string; // Placeholder text
  helpText?: string; // Help text/description
  options?: { value: string; label: string }[]; // Options for select type
  validation?: {
    min?: number;
    max?: number;
    pattern?: string; // Regex pattern
    message?: string; // Validation error message
  };
  sensitive?: boolean; // Should this be masked in logs/UI?
}

/**
 * Sync result from connector
 */
export interface SyncResult {
  success: boolean; // Was sync successful?
  connectionId: string; // Connection ID that was synced
  transactions: StandardTransaction[]; // Transactions retrieved (if any)
  accounts?: ConnectorAccount[]; // Updated account list (if any)
  error?: string; // Error message (if failed)
  stats?: {
    totalTransactions: number; // Total transactions retrieved
    newTransactions: number; // New transactions (not seen before)
    skippedTransactions: number; // Skipped transactions (duplicates, filters)
    startDate?: Date | string; // Sync start date
    endDate?: Date | string; // Sync end date
  };
  timestamp: Date | string; // Sync timestamp
}

/**
 * Connector error types
 */
export class ConnectorError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ConnectorError';
  }
}

// Common error codes
export enum ConnectorErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  TRANSACTION_FETCH_FAILED = 'TRANSACTION_FETCH_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  SYNC_FAILED = 'SYNC_FAILED',
  INVALID_DATA = 'INVALID_DATA',
  TIMEOUT = 'TIMEOUT',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  FETCH_FAILED = 'FETCH_FAILED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}


