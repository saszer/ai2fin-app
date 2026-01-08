// --- 📦 TRANSACTION ENRICHMENT SERVICE ---
// embracingearth.space - Unified transaction enrichment using Plaid Enrich API
// Enriches transactions from ANY source with merchant, category, and location data

import { auditService } from './AuditService';

// =============================================================================
// TYPES - Unified transaction schema for all connectors
// =============================================================================

export interface RawTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  currency?: string;
  direction?: 'credit' | 'debit' | 'inflow' | 'outflow';
  mcc?: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
  };
}

export interface EnrichedTransaction {
  // Core fields
  transactionId: string;
  accountId?: string;
  date: string;
  amount: number;
  currency: string;
  type: 'income' | 'expense' | 'transfer';
  pending?: boolean;
  
  // Descriptions
  description: string;
  originalDescription?: string;
  
  // Merchant info (from enrichment)
  merchant?: string;
  merchantLogo?: string;
  merchantWebsite?: string;
  merchantEntityId?: string;
  
  // Category info (from enrichment)
  category?: string;
  categoryDetailed?: string;
  categoryIcon?: string;
  
  // Location info (from enrichment)
  location?: {
    address?: string;
    city?: string;
    region?: string;
    country?: string;
    postalCode?: string;
    lat?: number;
    lon?: number;
    storeNumber?: string;
  };
  
  // Payment info
  paymentChannel?: 'online' | 'in store' | 'other';
  
  // Source metadata
  source: 'plaid' | 'basiq' | 'wise' | 'manual' | 'csv';
  enriched: boolean;
  enrichedAt?: string;
}

// Plaid Enrich API response types
interface PlaidEnrichResponse {
  enriched_transactions: Array<{
    id: string;
    merchant_name?: string;
    logo_url?: string;
    website?: string;
    entity_id?: string;
    counterparties?: Array<{
      name: string;
      type: string;
      logo_url?: string;
      website?: string;
      entity_id?: string;
    }>;
    personal_finance_category?: {
      primary: string;
      detailed: string;
    };
    personal_finance_category_icon_url?: string;
    payment_channel?: string;
    location?: {
      address?: string;
      city?: string;
      region?: string;
      country?: string;
      postal_code?: string;
      lat?: number;
      lon?: number;
      store_number?: string;
    };
  }>;
}

// =============================================================================
// PLAID ENRICH SERVICE
// =============================================================================

const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';
const PLAID_BASE_URL = PLAID_ENV === 'production' 
  ? 'https://production.plaid.com'
  : PLAID_ENV === 'development'
    ? 'https://development.plaid.com'
    : 'https://sandbox.plaid.com';

class TransactionEnrichmentService {
  private static instance: TransactionEnrichmentService;

  private constructor() {}

  static getInstance(): TransactionEnrichmentService {
    if (!TransactionEnrichmentService.instance) {
      TransactionEnrichmentService.instance = new TransactionEnrichmentService();
    }
    return TransactionEnrichmentService.instance;
  }

  /**
   * Check if Plaid Enrich is available
   */
  isEnrichAvailable(): boolean {
    return !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
  }

  /**
   * Enrich transactions using Plaid Enrich API
   * Works for transactions from ANY source (Basiq, CSV, manual, etc.)
   * 
   * @param transactions - Raw transactions to enrich
   * @param userId - For audit logging
   * @returns Enriched transactions
   */
  async enrichTransactions(
    transactions: RawTransaction[],
    userId: string
  ): Promise<EnrichedTransaction[]> {
    const timer = auditService.createTimer();
    
    // If no Plaid credentials or no transactions, return as-is
    if (!this.isEnrichAvailable() || transactions.length === 0) {
      console.log('⚠️ Plaid Enrich not available or no transactions to enrich');
      return transactions.map(tx => this.toEnrichedTransaction(tx, 'manual', false));
    }

    try {
      const clientId = process.env.PLAID_CLIENT_ID!;
      const secret = process.env.PLAID_SECRET!;

      // Plaid Enrich accepts max 100 transactions per request
      const batches = this.chunkArray(transactions, 100);
      const allEnriched: EnrichedTransaction[] = [];

      for (const batch of batches) {
        // Prepare transactions for Plaid Enrich API
        const plaidTransactions = batch.map(tx => ({
          id: tx.id,
          description: tx.description,
          amount: Math.abs(tx.amount),
          direction: tx.amount < 0 ? 'OUTFLOW' : 'INFLOW',
          iso_currency_code: tx.currency || 'USD',
          ...(tx.mcc ? { mcc: tx.mcc } : {}),
          ...(tx.location ? { location: tx.location } : {}),
        }));

        console.log(`🔮 Enriching ${batch.length} transactions via Plaid...`);

        const response = await fetch(`${PLAID_BASE_URL}/transactions/enrich`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            secret: secret,
            account_type: 'depository',
            transactions: plaidTransactions,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Plaid Enrich error:', errorData);
          
          // Return un-enriched transactions
          allEnriched.push(...batch.map(tx => this.toEnrichedTransaction(tx, 'manual', false)));
          continue;
        }

        const data = await response.json() as PlaidEnrichResponse;
        
        // Map enriched data back to transactions
        const enrichedMap = new Map(
          data.enriched_transactions.map(etx => [etx.id, etx])
        );

        for (const tx of batch) {
          const enriched = enrichedMap.get(tx.id);
          if (enriched) {
            allEnriched.push(this.mergeEnrichment(tx, enriched));
          } else {
            allEnriched.push(this.toEnrichedTransaction(tx, 'manual', false));
          }
        }
      }

      await auditService.success('enrich', {
        userId,
        connectorId: 'plaid-enrich',
      }, {
        transactionCount: transactions.length,
        enrichedCount: allEnriched.filter(t => t.enriched).length,
      }, timer.elapsed());

      console.log(`✅ Enriched ${allEnriched.filter(t => t.enriched).length}/${transactions.length} transactions`);
      return allEnriched;

    } catch (error: any) {
      console.error('❌ Enrichment failed:', error);
      await auditService.failure('enrich', { userId }, error);
      
      // Return un-enriched transactions
      return transactions.map(tx => this.toEnrichedTransaction(tx, 'manual', false));
    }
  }

  /**
   * Map Plaid transaction response to enriched format
   * (For transactions already fetched via Plaid API)
   */
  mapPlaidTransaction(tx: any, accountId?: string): EnrichedTransaction {
    // Plaid transactions already have enrichment data
    const primaryCategory = tx.personal_finance_category?.primary || 
      tx.category?.[0] || 'UNCATEGORIZED';
    const detailedCategory = tx.personal_finance_category?.detailed || 
      tx.category?.join(' > ') || '';

    return {
      transactionId: tx.transaction_id,
      accountId: accountId || tx.account_id,
      date: tx.date,
      amount: tx.amount * -1, // Plaid uses positive for debits
      currency: tx.iso_currency_code || 'USD',
      type: tx.amount > 0 ? 'expense' : 'income',
      pending: tx.pending,
      
      description: tx.name,
      originalDescription: tx.original_description,
      
      // Merchant info
      merchant: tx.merchant_name || tx.counterparties?.[0]?.name,
      merchantLogo: tx.logo_url || tx.counterparties?.[0]?.logo_url,
      merchantWebsite: tx.website || tx.counterparties?.[0]?.website,
      merchantEntityId: tx.merchant_entity_id || tx.counterparties?.[0]?.entity_id,
      
      // Category info - prefer personal_finance_category (better than legacy category)
      category: this.formatCategory(primaryCategory),
      categoryDetailed: this.formatCategory(detailedCategory),
      categoryIcon: tx.personal_finance_category_icon_url,
      
      // Location
      location: tx.location ? {
        address: tx.location.address,
        city: tx.location.city,
        region: tx.location.region,
        country: tx.location.country,
        postalCode: tx.location.postal_code,
        lat: tx.location.lat,
        lon: tx.location.lon,
        storeNumber: tx.location.store_number,
      } : undefined,
      
      paymentChannel: tx.payment_channel,
      
      source: 'plaid',
      enriched: !!(tx.merchant_name || tx.personal_finance_category),
      enrichedAt: new Date().toISOString(),
    };
  }

  /**
   * Map Basiq transaction response to enriched format
   */
  mapBasiqTransaction(tx: any, accountId?: string): EnrichedTransaction {
    // Basiq has its own enrichment via enrich field
    const hasEnrichment = !!(tx.enrich?.merchant || tx.enrich?.category);
    
    return {
      transactionId: tx.id,
      accountId: accountId || tx.account?.id,
      date: tx.postDate || tx.transactionDate,
      amount: parseFloat(tx.amount || '0'),
      currency: tx.currency || 'AUD',
      type: tx.direction?.toLowerCase() === 'credit' ? 'income' : 'expense',
      pending: tx.status === 'pending',
      
      description: tx.description,
      originalDescription: tx.originalDescription,
      
      // Merchant info from Basiq enrichment
      merchant: tx.enrich?.merchant?.businessName || tx.enrich?.merchant?.name,
      merchantLogo: tx.enrich?.merchant?.logoUrl,
      merchantWebsite: tx.enrich?.merchant?.website,
      
      // Category from Basiq enrichment
      category: tx.enrich?.category?.anzsic?.division?.title || 
        tx.subClass?.title || tx.class?.title,
      categoryDetailed: tx.enrich?.category?.anzsic?.subdivision?.title,
      
      // Location from Basiq
      location: tx.enrich?.location ? {
        city: tx.enrich.location.city,
        region: tx.enrich.location.state,
        country: tx.enrich.location.country || 'AU',
        postalCode: tx.enrich.location.postcode,
      } : undefined,
      
      paymentChannel: tx.enrich?.channel,
      
      source: 'basiq',
      enriched: hasEnrichment,
      enrichedAt: hasEnrichment ? new Date().toISOString() : undefined,
    };
  }

  /**
   * Map Wise transaction to enriched format
   */
  mapWiseTransaction(tx: any, accountId?: string): EnrichedTransaction {
    return {
      transactionId: tx.referenceNumber || tx.id?.toString(),
      accountId: accountId,
      date: tx.date,
      amount: tx.amount?.value || 0,
      currency: tx.amount?.currency || 'USD',
      type: tx.type === 'CREDIT' ? 'income' : 'expense',
      pending: tx.status === 'PENDING',
      
      description: tx.details?.description || tx.type,
      originalDescription: tx.details?.paymentReference,
      
      // Wise doesn't have merchant enrichment
      merchant: tx.details?.recipientName || tx.details?.senderName,
      
      // Basic category from transaction type
      category: this.formatCategory(tx.type),
      
      source: 'wise',
      enriched: false, // Wise doesn't provide enrichment
    };
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Convert raw transaction to enriched format (without enrichment data)
   */
  private toEnrichedTransaction(
    tx: RawTransaction, 
    source: EnrichedTransaction['source'],
    enriched: boolean
  ): EnrichedTransaction {
    return {
      transactionId: tx.id,
      date: tx.date,
      amount: tx.amount,
      currency: tx.currency || 'USD',
      type: tx.amount < 0 ? 'expense' : 'income',
      
      description: tx.description,
      
      location: tx.location ? {
        city: tx.location.city,
        region: tx.location.region,
        country: tx.location.country,
      } : undefined,
      
      source,
      enriched,
    };
  }

  /**
   * Merge Plaid Enrich API response with raw transaction
   */
  private mergeEnrichment(
    tx: RawTransaction,
    enriched: PlaidEnrichResponse['enriched_transactions'][0]
  ): EnrichedTransaction {
    const counterparty = enriched.counterparties?.[0];
    
    return {
      transactionId: tx.id,
      date: tx.date,
      amount: tx.amount,
      currency: tx.currency || 'USD',
      type: tx.amount < 0 ? 'expense' : 'income',
      
      description: tx.description,
      
      // Enriched merchant info
      merchant: enriched.merchant_name || counterparty?.name,
      merchantLogo: enriched.logo_url || counterparty?.logo_url,
      merchantWebsite: enriched.website || counterparty?.website,
      merchantEntityId: enriched.entity_id || counterparty?.entity_id,
      
      // Enriched category
      category: enriched.personal_finance_category 
        ? this.formatCategory(enriched.personal_finance_category.primary)
        : undefined,
      categoryDetailed: enriched.personal_finance_category
        ? this.formatCategory(enriched.personal_finance_category.detailed)
        : undefined,
      categoryIcon: enriched.personal_finance_category_icon_url,
      
      // Enriched location
      location: enriched.location ? {
        address: enriched.location.address,
        city: enriched.location.city,
        region: enriched.location.region,
        country: enriched.location.country,
        postalCode: enriched.location.postal_code,
        lat: enriched.location.lat,
        lon: enriched.location.lon,
        storeNumber: enriched.location.store_number,
      } : undefined,
      
      paymentChannel: enriched.payment_channel as any,
      
      source: 'manual', // Will be overridden by caller
      enriched: true,
      enrichedAt: new Date().toISOString(),
    };
  }

  /**
   * Format category string (SNAKE_CASE to Title Case)
   */
  private formatCategory(category?: string): string | undefined {
    if (!category) return undefined;
    return category
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export const transactionEnrichmentService = TransactionEnrichmentService.getInstance();
export default transactionEnrichmentService;










