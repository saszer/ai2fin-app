// --- 📦 TRANSACTION NORMALIZER UTILITIES ---
// embracingearth.space - Utilities for normalizing transaction data
// Ensures all transactions from various sources conform to StandardTransaction format

import { StandardTransaction, TransactionSource, ConnectorType } from '../types/connector';

/**
 * Normalize transaction date to ISO string
 */
export function normalizeDate(date: Date | string | number): string {
  if (!date) {
    return new Date().toISOString();
  }
  
  if (typeof date === 'string') {
    // Try parsing ISO string
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date string: ${date}`);
    }
    return parsed.toISOString();
  }
  
  if (typeof date === 'number') {
    // Assume timestamp
    return new Date(date).toISOString();
  }
  
  // Date object
  return date.toISOString();
}

/**
 * Normalize transaction amount
 * Ensures consistent format: negative = expense, positive = income
 */
export function normalizeAmount(
  amount: number,
  type?: string,
  sourceType?: 'debit' | 'credit' | 'expense' | 'income' | 'transfer'
): number {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  
  // Handle zero amounts
  if (amount === 0) {
    return 0;
  }
  
  // If source type is provided, use it
  if (sourceType === 'debit' || sourceType === 'expense') {
    return amount < 0 ? amount : -Math.abs(amount);
  }
  
  if (sourceType === 'credit' || sourceType === 'income') {
    return amount > 0 ? amount : Math.abs(amount);
  }
  
  if (sourceType === 'transfer') {
    // Transfers are usually negative, but can be either
    return amount;
  }
  
  // Try to infer from type string
  if (type) {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('debit') || lowerType.includes('expense') || 
        lowerType.includes('outgoing') || lowerType.includes('withdrawal') ||
        lowerType.includes('payment')) {
      return amount < 0 ? amount : -Math.abs(amount);
    }
    if (lowerType.includes('credit') || lowerType.includes('income') || 
        lowerType.includes('incoming') || lowerType.includes('deposit')) {
      return amount > 0 ? amount : Math.abs(amount);
    }
  }
  
  // Default: return as-is (assume source already uses correct convention)
  return amount;
}

/**
 * Infer primary type from amount and description
 */
export function inferPrimaryType(
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
  
  // Infer from amount (after normalization)
  if (amount < 0) return 'expense';
  if (amount > 0) return 'income';
  
  // Infer from description keywords
  if (description) {
    const lowerDesc = description.toLowerCase();
    const transferKeywords = ['transfer', 'payment to', 'payment from', 'send to', 'receive from', 'move'];
    if (transferKeywords.some(kw => lowerDesc.includes(kw))) {
      return 'transfer';
    }
  }
  
  // Default: assume expense if amount is negative or zero
  return amount < 0 ? 'expense' : 'income';
}

/**
 * Sanitize transaction description
 * Removes sensitive data, normalizes whitespace
 */
export function sanitizeDescription(description: string): string {
  if (!description) return '';
  
  // Trim and normalize whitespace
  let sanitized = description.trim().replace(/\s+/g, ' ');
  
  // Remove sensitive patterns (credit card numbers, SSN, etc.)
  // Credit card numbers (keep last 4 digits)
  sanitized = sanitized.replace(/\b\d{13,19}\b/g, (match) => {
    return `****${match.slice(-4)}`;
  });
  
  // SSN patterns
  sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '***-**-****');
  sanitized = sanitized.replace(/\b\d{9}\b/g, (match) => {
    // Only mask if it looks like an SSN (not just any 9-digit number)
    if (/^\d{3}\d{2}\d{4}$/.test(match)) {
      return '***-**-****';
    }
    return match;
  });
  
  // Email addresses (optional - can be removed if needed)
  // sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***.***');
  
  return sanitized;
}

/**
 * Validate transaction structure
 */
export function validateTransaction(transaction: Partial<StandardTransaction>): void {
  const errors: string[] = [];
  
  if (!transaction.transactionId) {
    errors.push('transactionId is required');
  }
  
  if (!transaction.accountId) {
    errors.push('accountId is required');
  }
  
  if (!transaction.userId) {
    errors.push('userId is required');
  }
  
  if (typeof transaction.amount !== 'number' || isNaN(transaction.amount)) {
    errors.push('Valid amount is required');
  }
  
  if (!transaction.description || transaction.description.trim().length === 0) {
    errors.push('Transaction description is required');
  }
  
  if (!transaction.date) {
    errors.push('Transaction date is required');
  }
  
  if (!transaction.primaryType || !['expense', 'income', 'transfer'].includes(transaction.primaryType)) {
    errors.push('Valid primaryType is required (expense, income, or transfer)');
  }
  
  if (!transaction.source) {
    errors.push('Transaction source is required');
  }
  
  if (!transaction.connectorId) {
    errors.push('connectorId is required');
  }
  
  if (!transaction.connectorType) {
    errors.push('connectorType is required');
  }
  
  if (errors.length > 0) {
    throw new Error(`Transaction validation failed: ${errors.join(', ')}`);
  }
}

/**
 * Create standardized transaction from raw data
 * This is a helper function for connectors to use
 */
export function createStandardTransaction(
  rawTransaction: any,
  userId: string,
  accountId: string,
  connectionId: string,
  connectorId: string,
  connectorType: ConnectorType,
  source: TransactionSource
): StandardTransaction {
  // Extract transaction ID (try multiple fields)
  const transactionId = rawTransaction.id || 
                       rawTransaction.transactionId || 
                       rawTransaction.reference || 
                       rawTransaction.externalId ||
                       `${connectionId}_${accountId}_${rawTransaction.date || Date.now()}_${rawTransaction.amount || 0}`;
  
  // Normalize amount
  const amount = normalizeAmount(
    rawTransaction.amount || 0,
    rawTransaction.type,
    rawTransaction.sourceType
  );
  
  // Infer primary type
  const primaryType = inferPrimaryType(
    amount,
    rawTransaction.description || rawTransaction.narrative || rawTransaction.merchant,
    rawTransaction.metadata
  );
  
  // Sanitize description
  const description = sanitizeDescription(
    rawTransaction.description || 
    rawTransaction.narrative || 
    rawTransaction.merchant || 
    rawTransaction.payee ||
    ''
  );
  
  // Normalize date
  const date = normalizeDate(rawTransaction.date || new Date());
  
  // Build standardized transaction
  const transaction: StandardTransaction = {
    transactionId,
    accountId,
    userId,
    amount,
    currency: rawTransaction.currency || 'USD',
    date,
    primaryType,
    secondaryType: rawTransaction.secondaryType,
    description,
    originalDescription: rawTransaction.description || rawTransaction.narrative,
    merchant: rawTransaction.merchant || rawTransaction.payee,
    reference: rawTransaction.reference || rawTransaction.transactionId || transactionId,
    location: rawTransaction.location || rawTransaction.address,
    balance: rawTransaction.balance,
    metadata: {
      ...(rawTransaction.metadata || {}),
      // Keep some raw data for debugging (sanitize sensitive fields)
      sourceRawData: {
        ...rawTransaction,
        // Remove sensitive fields from source data if present
        password: undefined,
        secret: undefined,
        token: undefined
      }
    },
    source,
    connectorId,
    connectorType,
    categoryHint: rawTransaction.category || rawTransaction.categoryHint,
    tags: rawTransaction.tags || [],
    receiptUrl: rawTransaction.receiptUrl || rawTransaction.documentUrl,
    documentUrl: rawTransaction.documentUrl
  };
  
  // Validate transaction
  validateTransaction(transaction);
  
  return transaction;
}



