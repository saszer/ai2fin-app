// --- 📦 WEBHOOK PROCESSOR ---
// embracingearth.space - Unified webhook processor for all connectors
// Handles webhook events from Basiq, Apideck, and future connectors
// Architecture: Extensible webhook processing system

import { StandardTransaction, ConnectorError, ConnectorErrorCode } from '../types/connector';
import { connectorRegistry } from '../core/ConnectorRegistry';
import { credentialManager } from '../core/CredentialManager';
import { realtimeTransactionService } from './RealtimeTransactionService';
import { createStandardTransaction } from '../utils/transactionNormalizer';
import { getCoreAppClient } from './CoreAppClient';
import { slackNotificationService } from './SlackNotificationService';

/**
 * Webhook Event Interface
 * Architecture: Standardized webhook event format for all connectors
 */
export interface WebhookEvent {
  eventType: string;
  connectorId: string;
  data: any;
  userId?: string;
  connectionId?: string;
  timestamp: string;
}

/**
 * WebhookProcessor
 * 
 * Architecture Notes:
 * - Unified interface for processing webhooks from any connector
 * - Normalizes webhook events to StandardTransaction format
 * - Integrates with connector registry for extensibility
 * - Sends transactions to core app and notifies frontend
 * - Handles deduplication and error recovery
 */
export class WebhookProcessor {
  /**
   * Process webhook event from any connector
   * Architecture: Routes to connector-specific handler, normalizes, stores, and notifies
   */
  async processWebhook(event: WebhookEvent): Promise<{ success: boolean; transaction?: StandardTransaction }> {
    try {
      // Get connector
      const connector = connectorRegistry.getConnector(event.connectorId);
      if (!connector) {
        throw new ConnectorError(
          `Connector not found: ${event.connectorId}`,
          ConnectorErrorCode.CONNECTION_FAILED,
          404
        );
      }

      // Route to connector-specific handler
      let transaction: StandardTransaction | null = null;

      switch (event.connectorId) {
        case 'basiq':
          transaction = await this.processBasiqWebhook(event);
          break;
        case 'apideck':
          transaction = await this.processApideckWebhook(event);
          break;
        default:
          // Generic handler for future connectors
          transaction = await this.processGenericWebhook(event, connector);
      }

      if (!transaction) {
        return { success: false };
      }

      // Store transaction in core app
      await this.storeTransaction(transaction);

      // Notify frontend in real-time
      if (transaction.userId) {
        await realtimeTransactionService.notifyTransaction(transaction.userId, transaction);
      }

      return { success: true, transaction };
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      throw error;
    }
  }

  /**
   * Process Basiq webhook event
   * Architecture: Handles Basiq-specific webhook format
   * Security: Validates connection ownership, never trusts userId from webhook payload
   */
  private async processBasiqWebhook(event: WebhookEvent): Promise<StandardTransaction | null> {
    const { data } = event;

    // Basiq webhook events: transaction.created, transaction.updated, etc.
    if (!data.transaction || !data.account) {
      console.warn('Invalid Basiq webhook data:', data);
      return null;
    }

    // SECURITY: Get connectionId from webhook (most reliable, from signature)
    const connectionId = event.connectionId || data.connectionId;
    if (!connectionId) {
      console.error('Missing connectionId in Basiq webhook - required for security');
      return null;
    }

    // SECURITY: Find connection by ID only (don't trust userId from webhook)
    const connection = await this.findConnection(connectionId, event.userId);
    if (!connection) {
      console.error('Connection not found for Basiq webhook:', connectionId);
      return null;
    }

    // SECURITY: Use userId from connection (database), not webhook payload
    const userId = connection.userId;
    if (!userId) {
      console.error('Connection missing userId:', connectionId);
      return null;
    }

    const tx = data.transaction;
    const account = data.account;

    // Normalize Basiq transaction format
    const amount = parseFloat(tx.amount || '0');
    const direction = tx.direction?.toLowerCase() || 'debit';
    const normalizedAmount = direction === 'debit' ? -Math.abs(amount) : Math.abs(amount);

    const rawTransaction = {
      id: tx.id,
      accountId: account.id,
      amount: normalizedAmount,
      type: direction,
      description: tx.description || tx.subClass?.title || 'Transaction',
      date: tx.postDate || tx.executeDate || new Date().toISOString(),
      merchant: tx.merchant?.name,
      reference: tx.reference || tx.institutionTransactionId,
      balance: tx.balance,
      currency: account.currency || 'AUD',
      metadata: {
        basiqTransactionId: tx.id,
        category: tx.category,
        subClass: tx.subClass,
        merchant: tx.merchant,
        institutionTransactionId: tx.institutionTransactionId
      }
    };

    // SECURITY: Final validation - ensure transaction userId matches connection
    const transaction = createStandardTransaction(
      rawTransaction,
      userId, // Use userId from connection, not webhook
      account.id,
      connection.id,
      'basiq',
      'bank',
      'BANK_API'
    );

    // CRITICAL: Validate transaction.userId matches connection.userId
    if (transaction.userId !== connection.userId) {
      const errorMsg = 'User ID mismatch - security violation';
      console.error('⚠️ SECURITY: Transaction userId mismatch', {
        transactionUserId: transaction.userId,
        connectionUserId: connection.userId,
        connectionId: connection.id
      });
      
      // Send Slack alert for security violation
      slackNotificationService.notifyError(errorMsg, {
        service: 'connectors-service',
        userId: transaction.userId,
        connectorId: 'apideck',
        metadata: {
          transactionUserId: transaction.userId,
          connectionUserId: connection.userId,
          connectionId: connection.id
        }
      }).catch(() => {}); // Don't block on notification failure

      throw new Error(errorMsg);
    }

    return transaction;
  }

  /**
   * Process Apideck webhook event
   * Architecture: Handles Apideck-specific webhook format
   * Security: Validates connection ownership, never trusts userId from webhook payload
   */
  private async processApideckWebhook(event: WebhookEvent): Promise<StandardTransaction | null> {
    const { data } = event;

    // Apideck webhook events: accounting.transaction.created, accounting.transaction.updated
    if (!data.transaction || !data.account) {
      console.warn('Invalid Apideck webhook data:', data);
      return null;
    }

    // SECURITY: Get connectionId from webhook (most reliable, from signature)
    const connectionId = event.connectionId || data.connectionId || data.connection?.id;
    if (!connectionId) {
      console.error('Missing connectionId in Apideck webhook - required for security');
      return null;
    }

    // SECURITY: Find connection by ID only (don't trust userId from webhook)
    const connection = await this.findConnection(connectionId, event.userId);
    if (!connection) {
      console.error('Connection not found for Apideck webhook:', connectionId);
      return null;
    }

    // SECURITY: Use userId from connection (database), not webhook payload
    const userId = connection.userId;
    if (!userId) {
      console.error('Connection missing userId:', connectionId);
      return null;
    }

    const tx = data.transaction;
    const account = data.account;

    // Normalize Apideck transaction format
    const amount = parseFloat(tx.total_amount || tx.amount || '0');
    const isDebit = tx.type === 'debit' || tx.direction === 'outbound';
    const normalizedAmount = isDebit ? -Math.abs(amount) : Math.abs(amount);

    const rawTransaction = {
      id: tx.id || tx.transaction_id,
      accountId: account.id || account.account_id,
      amount: normalizedAmount,
      type: isDebit ? 'debit' : 'credit',
      description: tx.description || tx.reference || 'Transaction',
      date: tx.transaction_date || tx.date || new Date().toISOString(),
      merchant: tx.merchant_name || tx.contact_name,
      reference: tx.reference || tx.id,
      currency: tx.currency || account.currency || 'USD',
      metadata: {
        apideckTransactionId: tx.id,
        rawTransaction: tx
      }
    };

    // SECURITY: Final validation - ensure transaction userId matches connection
    const transaction = createStandardTransaction(
      rawTransaction,
      userId, // Use userId from connection, not webhook
      account.id || account.account_id,
      connection.id,
      'apideck',
      'accounting',
      'CUSTOM'
    );

    // CRITICAL: Validate transaction.userId matches connection.userId
    if (transaction.userId !== connection.userId) {
      const errorMsg = 'User ID mismatch - security violation';
      console.error('⚠️ SECURITY: Transaction userId mismatch', {
        transactionUserId: transaction.userId,
        connectionUserId: connection.userId,
        connectionId: connection.id
      });
      
      // Send Slack alert for security violation
      slackNotificationService.notifyError(errorMsg, {
        service: 'connectors-service',
        userId: transaction.userId,
        connectorId: 'apideck',
        metadata: {
          transactionUserId: transaction.userId,
          connectionUserId: connection.userId,
          connectionId: connection.id
        }
      }).catch(() => {}); // Don't block on notification failure

      throw new Error(errorMsg);
    }

    return transaction;
  }

  /**
   * Process generic webhook for future connectors
   * Architecture: Extensible handler for new connectors
   */
  private async processGenericWebhook(
    event: WebhookEvent,
    connector: any
  ): Promise<StandardTransaction | null> {
    // Try to use connector's webhook handler if available
    if (typeof connector.processWebhook === 'function') {
      return await connector.processWebhook(event.data);
    }

    // Fallback: Try to normalize using connector's transaction format
    const connection = await this.findConnection(event.connectionId, event.userId);
    if (!connection) {
      return null;
    }

    // Generic normalization (connector should implement processWebhook)
    console.warn(`Connector ${event.connectorId} does not implement processWebhook`);
    return null;
  }

  /**
   * Find connection by ID or userId
   * Architecture: Retrieves connection from storage (currently in-memory, should be DB in production)
   * Security: Validates connection ownership to prevent userId spoofing
   */
  private async findConnection(connectionId?: string, userId?: string): Promise<any> {
    // Import connections storage from routes (temporary until DB integration)
    // In production, this should query the database
    try {
      const connectorsModule = await import('../routes/connectors');
      const { getConnectionById, getConnectionsByUserId } = connectorsModule as any;
      
      // SECURITY: Always prefer connectionId (most reliable, from webhook signature)
      if (connectionId && typeof getConnectionById === 'function') {
        const conn = getConnectionById(connectionId);
        if (conn) {
          // CRITICAL: Validate userId matches if provided (prevents spoofing)
          if (userId && conn.userId !== userId) {
            const errorMsg = 'UserId mismatch in webhook - security violation';
            console.error('⚠️ SECURITY: UserId mismatch in webhook', {
              connectionId,
              webhookUserId: userId,
              connectionUserId: conn.userId,
              ip: 'unknown' // Would need to pass req object
            });
            
            // Send Slack alert for security violation
            slackNotificationService.notifyError(errorMsg, {
              service: 'connectors-service',
              userId: userId,
              metadata: {
                connectionId,
                webhookUserId: userId,
                connectionUserId: conn.userId
              }
            }).catch(() => {}); // Don't block on notification failure

            return null; // Reject - security violation
          }
          return conn;
        }
      }
      
      // SECURITY: Only use userId lookup if connectionId not provided
      // But this is less secure - prefer connectionId in webhooks
      if (userId && !connectionId && typeof getConnectionsByUserId === 'function') {
        const userConnections = getConnectionsByUserId(userId);
        // Return first connection matching connectorId if available
        // In production, should match by connectorId from webhook
        if (userConnections.length > 0) {
          return userConnections[0];
        }
      }

      // Security: Reject if connection not found
      // This prevents processing transactions for invalid/non-existent connections
      console.warn('Connection not found for webhook', { 
        connectionId, 
        userId,
        note: 'connectionId is required for secure webhook processing'
      });
      return null;
    } catch (error) {
      console.error('Error finding connection:', error);
    }

    return null;
  }

  /**
   * Store transaction in core app
   * Architecture: Sends transaction to core app API for storage
   * Features: Timeout, retry, circuit breaker, connection pooling, rate limiting, idempotency
   * Note: Uses service-to-service authentication for security
   */
  private async storeTransaction(transaction: StandardTransaction): Promise<void> {
    const client = getCoreAppClient();
    
    try {
      // Prepare transaction payload matching core app format
      const payload = {
        transactionId: transaction.transactionId,
        description: transaction.description,
        amount: Math.abs(transaction.amount), // Core app expects positive amount
        date: typeof transaction.date === 'string' ? transaction.date : transaction.date.toISOString(),
        type: transaction.primaryType === 'expense' ? 'debit' : transaction.primaryType === 'income' ? 'credit' : 'transfer',
        primaryType: transaction.primaryType,
        secondaryType: transaction.secondaryType,
        category: transaction.categoryHint,
        merchant: transaction.merchant,
        reference: transaction.reference,
        // Additional fields
        currency: transaction.currency,
        location: transaction.location,
        balance: transaction.balance,
        // Source tracking
        source: transaction.source,
        connectorId: transaction.connectorId,
        connectorType: transaction.connectorType,
        // Metadata
        metadata: {
          ...transaction.metadata,
          originalDescription: transaction.originalDescription,
          tags: transaction.tags,
          receiptUrl: transaction.receiptUrl,
          documentUrl: transaction.documentUrl
        }
      };

      // Generate idempotency key to prevent duplicates
      const idempotencyKey = `${transaction.connectorId}:${transaction.transactionId}`;

      // Send to core app with all resilience features
      const result = await client.post('/api/bank/transactions', payload, {
        userId: transaction.userId,
        idempotencyKey
      });

      console.log(`✅ Transaction stored in core app: ${transaction.transactionId}`, {
        transactionId: result?.transaction?.id || result?.id
      });
    } catch (error: any) {
      // Log error
      console.error('Error storing transaction in core app:', {
        error: error.message,
        transactionId: transaction.transactionId,
        status: error.status,
        circuitBreakerState: client.getCircuitBreakerState()
      });

      // Send Slack notification for critical errors
      if (error.status >= 500 || error.message.includes('timeout') || error.message.includes('Circuit breaker')) {
        await slackNotificationService.notifyError(
          `Failed to store transaction in core app: ${error.message}`,
          {
            service: 'connectors-service',
            userId: transaction.userId,
            connectorId: transaction.connectorId,
            transactionId: transaction.transactionId,
            metadata: {
              status: error.status,
              circuitBreakerState: client.getCircuitBreakerState(),
              error: error.message
            }
          }
        );
      }

      // Don't throw - allow transaction notification to proceed
      // Transaction will be synced on next regular sync
      // This is non-breaking - webhook processing continues
    }
  }
}

// Singleton instance
export const webhookProcessor = new WebhookProcessor();

