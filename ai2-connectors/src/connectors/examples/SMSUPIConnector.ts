// --- 📦 EXAMPLE SMS-BASED UPI CONNECTOR (INDIAN) ---
// embracingearth.space - Example implementation of SMS-based UPI transaction connector
// Demonstrates webhook/polling-based connector for Indian UPI transactions via SMS

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
 * Example SMS-Based UPI Connector (Indian)
 * 
 * Architecture Notes:
 * - Parses SMS messages from Indian banks/UPI providers (e.g., PhonePe, Google Pay, Paytm, etc.)
 * - Supports webhook-based real-time sync (when SMS forwarding is configured)
 * - Can also poll SMS inbox if device access is available
 * - Parses UPI transaction details from SMS format
 * 
 * SMS Format Examples:
 * - "Rs.500.00 debited from A/c **1234 on 01-Jan-25 to UPI123456789012@paytm"
 * - "UPI/123456789012/PAYTM/SUCCESS/Rs.1000.00/to MERCHANT NAME"
 * - "INR 250.00 credited to A/c **5678 via UPI ref 9876543210"
 * 
 * Real Implementation Steps:
 * 1. Set up SMS forwarding service (e.g., Twilio, AWS SNS, custom SMS gateway)
 * 2. Configure webhook endpoint to receive SMS
 * 3. Parse SMS content to extract transaction details
 * 4. Normalize to StandardTransaction format
 * 5. Handle deduplication (same transaction may arrive via multiple SMS)
 */
export class SMSUPIConnector extends BaseConnector {
  protected readonly connectorId = 'sms-upi-indian';
  protected readonly connectorType = 'sms' as const;
  protected readonly transactionSource = 'SMS_UPI' as const;

  getMetadata(): ConnectorMetadata {
    return {
      id: this.connectorId,
      name: 'SMS UPI (Indian)',
      type: this.connectorType,
      description: 'Connect to Indian UPI transactions via SMS notifications. Parses SMS from banks/UPI providers.',
      version: '1.0.0',
      author: 'AI2 Platform',
      credentialFields: [
        {
          name: 'phoneNumber',
          label: 'Phone Number',
          type: 'text',
          required: true,
          placeholder: '+91XXXXXXXXXX',
          helpText: 'Indian phone number registered with UPI/bank (with country code)',
          validation: {
            pattern: '^\\+91[6-9]\\d{9}$',
            message: 'Must be a valid Indian phone number with +91 country code'
          }
        },
        {
          name: 'smsGatewayUrl',
          label: 'SMS Gateway Webhook URL',
          type: 'url',
          required: false,
          placeholder: 'https://your-sms-gateway.com/webhook',
          helpText: 'Webhook URL for receiving SMS (optional, for real-time sync)'
        },
        {
          name: 'smsGatewayApiKey',
          label: 'SMS Gateway API Key',
          type: 'password',
          required: false,
          placeholder: 'Enter SMS gateway API key',
          helpText: 'API key for SMS gateway service',
          sensitive: true
        },
        {
          name: 'upiProviders',
          label: 'UPI Providers',
          type: 'select',
          required: false,
          options: [
            { value: 'all', label: 'All Providers' },
            { value: 'paytm', label: 'Paytm' },
            { value: 'phonepe', label: 'PhonePe' },
            { value: 'gpay', label: 'Google Pay' },
            { value: 'bhim', label: 'BHIM' }
          ],
          helpText: 'Select UPI providers to parse transactions from'
        }
      ],
      capabilities: {
        supportsAccounts: true,
        supportsTransactions: true,
        supportsBalance: false, // SMS usually doesn't include balance
        supportsWebhooks: true, // Can receive SMS via webhook
        supportsRealtime: true, // Real-time when SMS forwarding is configured
        requiresOAuth: false,
        supportsMultipleAccounts: true
      },
      documentationUrl: 'https://embracingearth.space/docs/connectors/sms-upi'
    };
  }

  async validateCredentials(credentials: ConnectorCredentials): Promise<boolean> {
    if (!credentials.phoneNumber) {
      throw new ConnectorError(
        'Phone number is required',
        ConnectorErrorCode.INVALID_CREDENTIALS,
        400
      );
    }

    // Validate phone number format (Indian)
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(credentials.phoneNumber as string)) {
      throw new ConnectorError(
        'Invalid Indian phone number format. Must be +91XXXXXXXXXX',
        ConnectorErrorCode.INVALID_CREDENTIALS,
        400
      );
    }

    return true;
  }

  async connect(
    userId: string,
    credentials: ConnectorCredentials,
    settings?: ConnectorSettings
  ): Promise<ConnectorConnection> {
    await this.validateCredentials(credentials);

    // In real implementation, set up SMS forwarding/webhook
    // Example:
    // if (credentials.smsGatewayUrl && credentials.smsGatewayApiKey) {
    //   await this.setupWebhook(credentials);
    // }

    // Mock accounts (derived from phone number)
    const accounts: ConnectorAccount[] = [
      {
        id: `upi_${credentials.phoneNumber}`,
        name: `UPI Account (${credentials.phoneNumber})`,
        type: 'digital_wallet',
        currency: 'INR',
        metadata: {
          phoneNumber: credentials.phoneNumber,
          upiProviders: credentials.upiProviders || 'all'
        }
      }
    ];

    const connectionId = `upi_conn_${Date.now()}`;

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
    // In real implementation, remove webhook, stop SMS forwarding
    return true;
  }

  async getAccounts(
    connectionId: string,
    credentials: ConnectorCredentials
  ): Promise<ConnectorAccount[]> {
    return [
      {
        id: `upi_${credentials.phoneNumber}`,
        name: `UPI Account (${credentials.phoneNumber})`,
        type: 'digital_wallet',
        currency: 'INR'
      }
    ];
  }

  /**
   * Parse UPI transaction from SMS content
   */
  private parseUPISMS(smsContent: string): any {
    // Common UPI SMS patterns
    const patterns = [
      // Pattern 1: "Rs.500.00 debited from A/c **1234 on 01-Jan-25 to UPI123456789012@paytm"
      {
        regex: /Rs?\.?(\d+(?:\.\d{2})?)\s+(debited|credited|deducted)/i,
        type: (match: RegExpMatchArray) => match[2].toLowerCase().includes('debit') || match[2].toLowerCase().includes('deduct') ? 'debit' : 'credit',
        amount: (match: RegExpMatchArray) => parseFloat(match[1])
      },
      // Pattern 2: "UPI/123456789012/PAYTM/SUCCESS/Rs.1000.00/to MERCHANT NAME"
      {
        regex: /UPI\/\d+\/(\w+)\/(SUCCESS|FAILED)\/Rs?\.?(\d+(?:\.\d{2})?)\/to\s+(.+)/i,
        type: (match: RegExpMatchArray) => 'debit',
        amount: (match: RegExpMatchArray) => parseFloat(match[3]),
        merchant: (match: RegExpMatchArray) => match[4].trim()
      },
      // Pattern 3: "INR 250.00 credited to A/c **5678 via UPI ref 9876543210"
      {
        regex: /INR\s+(\d+(?:\.\d{2})?)\s+(credited|debited)/i,
        type: (match: RegExpMatchArray) => match[2].toLowerCase().includes('debit') ? 'debit' : 'credit',
        amount: (match: RegExpMatchArray) => parseFloat(match[1])
      }
    ];

    for (const pattern of patterns) {
      const match = smsContent.match(pattern.regex);
      if (match) {
        const amount = pattern.amount(match);
        const type = pattern.type(match);
        const merchant = pattern.merchant ? pattern.merchant(match) : undefined;

        // Extract reference/transaction ID
        const refMatch = smsContent.match(/(?:ref|ref\.|reference|Txn Id)[\s:]*(\d+)/i);
        const reference = refMatch ? refMatch[1] : undefined;

        // Extract date
        const dateMatch = smsContent.match(/(\d{1,2}[-/]\w{3}[-/]\d{2,4})/i);
        const dateStr = dateMatch ? dateMatch[1] : new Date().toISOString();

        return {
          amount: type === 'debit' ? -Math.abs(amount) : Math.abs(amount),
          type,
          description: smsContent.trim(),
          merchant,
          reference,
          date: dateStr,
          metadata: {
            smsContent,
            parsed: true
          }
        };
      }
    }

    // If no pattern matches, return null
    return null;
  }

  async getTransactions(
    connectionId: string,
    accountId: string,
    credentials: ConnectorCredentials,
    filter?: TransactionFilter
  ): Promise<StandardTransaction[]> {
    // In real implementation:
    // 1. Fetch SMS messages from inbox or webhook storage
    // 2. Filter SMS by phone number and date range
    // 3. Parse each SMS using parseUPISMS()
    // 4. Normalize to StandardTransaction format

    // Mock SMS messages for example
    const mockSMSMessages = [
      {
        id: 'sms_001',
        content: 'Rs.500.00 debited from A/c **1234 on 15-Jan-25 to UPI123456789012@paytm. Ref: 9876543210',
        timestamp: new Date().toISOString()
      },
      {
        id: 'sms_002',
        content: 'INR 1000.00 credited to A/c **5678 via UPI ref 1234567890 on 14-Jan-25',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'sms_003',
        content: 'UPI/987654321012/PHONEPE/SUCCESS/Rs.250.00/to GROCERY STORE. Txn Id: 555666777888',
        timestamp: new Date(Date.now() - 172800000).toISOString()
      }
    ];

    // Parse SMS messages to transactions
    const rawTransactions = mockSMSMessages
      .map(sms => {
        const parsed = this.parseUPISMS(sms.content);
        if (parsed) {
          return {
            id: sms.id,
            accountId,
            ...parsed,
            date: parsed.date || sms.timestamp,
            metadata: {
              ...parsed.metadata,
              smsId: sms.id
            }
          };
        }
        return null;
      })
      .filter(tx => tx !== null) as any[];

    // Normalize to StandardTransaction
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
    const accounts = await this.getAccounts(connectionId, credentials);
    const accountId = accounts[0].id; // UPI typically has one account per phone number

    const transactions = await this.getTransactions(
      connectionId,
      accountId,
      credentials,
      filter
    );

    return {
      success: true,
      connectionId,
      transactions,
      accounts,
      stats: {
        totalTransactions: transactions.length,
        newTransactions: transactions.length,
        skippedTransactions: 0
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Webhook endpoint handler for receiving SMS
   * This should be called when an SMS is received via webhook
   */
  async processWebhookSMS(smsData: {
    from: string;
    to: string;
    content: string;
    timestamp: string;
  }): Promise<StandardTransaction | null> {
    // Validate phone number matches
    // Parse SMS
    const parsed = this.parseUPISMS(smsData.content);
    if (!parsed) {
      return null;
    }

    // Normalize to StandardTransaction
    // Note: This requires connectionId and accountId which should be retrieved from storage
    // For now, return parsed data
    return parsed as any;
  }
}



