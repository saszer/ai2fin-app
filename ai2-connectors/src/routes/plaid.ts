// --- 📦 PLAID ROUTES (SECURE) ---
// embracingearth.space - Secure Plaid integration with encrypted credential storage
// All access tokens stored encrypted, never exposed to client

import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../middleware/auth';
import { secureCredentialManager } from '../core/SecureCredentialManager';
import { auditService, AuditContext } from '../services/AuditService';
import { transactionEnrichmentService } from '../services/TransactionEnrichmentService';

const router = express.Router();

// --- PLAID WEBHOOK VERIFICATION (OFFICIAL IMPLEMENTATION) ---
// Reference: https://plaid.com/docs/api/webhooks/webhook-verification/
// Plaid webhooks use JWT signed with JWK public keys

// Cache for Plaid's JWK public keys (key_id -> key)
const jwkCache: Map<string, { key: crypto.KeyObject; expiresAt: number }> = new Map();
const JWK_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Decode JWT without verification (to extract header)
 */
function decodeJwtHeader(token: string): { alg: string; typ: string; kid: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    return header;
  } catch {
    return null;
  }
}

/**
 * Decode JWT payload without verification
 */
function decodeJwtPayload(token: string): { iat: number; request_body_sha256: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return payload;
  } catch {
    return null;
  }
}

/**
 * Fetch Plaid's JWK public key for webhook verification
 * Uses /webhook_verification_key/get endpoint
 */
async function getPlaidJwk(keyId: string): Promise<crypto.KeyObject | null> {
  // Check cache first
  const cached = jwkCache.get(keyId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.key;
  }

  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  
  if (!clientId || !secret) {
    console.error('❌ PLAID_CLIENT_ID/PLAID_SECRET required for webhook verification');
    return null;
  }

  const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';
  const PLAID_BASE_URL = PLAID_ENV === 'production' 
    ? 'https://production.plaid.com'
    : PLAID_ENV === 'development'
      ? 'https://development.plaid.com'
      : 'https://sandbox.plaid.com';

  try {
    const response = await fetch(`${PLAID_BASE_URL}/webhook_verification_key/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        secret: secret,
        key_id: keyId,
      }),
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch Plaid JWK:', await response.text());
      return null;
    }

    const data = await response.json() as { key: { alg: string; crv: string; kid: string; kty: string; use: string; x: string; y: string } };
    
    // Convert JWK to KeyObject
    const jwk = data.key;
    const keyObject = crypto.createPublicKey({
      key: jwk,
      format: 'jwk',
    });

    // Cache the key
    jwkCache.set(keyId, {
      key: keyObject,
      expiresAt: Date.now() + JWK_CACHE_TTL,
    });

    console.log(`✅ Fetched and cached Plaid JWK: ${keyId}`);
    return keyObject;
  } catch (error) {
    console.error('❌ Error fetching Plaid JWK:', error);
    return null;
  }
}

/**
 * Verify Plaid webhook signature using official JWT verification
 * Reference: https://plaid.com/docs/api/webhooks/webhook-verification/
 * 
 * Steps:
 * 1. Extract JWT from Plaid-Verification header
 * 2. Decode JWT header to get key_id (kid)
 * 3. Fetch public key from Plaid API
 * 4. Verify JWT signature
 * 5. Verify request_body_sha256 matches actual body
 * 6. Verify timestamp is within 5 minutes
 */
async function verifyPlaidWebhook(req: Request, rawBody: string): Promise<boolean> {
  try {
    const jwt = req.headers['plaid-verification'] as string;
    if (!jwt) {
      console.warn('⚠️ Missing Plaid-Verification header');
      return false;
    }

    // Step 1: Decode JWT header to get key_id
    const header = decodeJwtHeader(jwt);
    if (!header || !header.kid) {
      console.warn('⚠️ Invalid JWT header or missing kid');
      return false;
    }

    // Step 2: Fetch public key from Plaid
    const publicKey = await getPlaidJwk(header.kid);
    if (!publicKey) {
      console.error('❌ Could not fetch Plaid public key');
      return false;
    }

    // Step 3: Verify JWT signature
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      console.warn('⚠️ Invalid JWT format');
      return false;
    }

    const signatureInput = `${parts[0]}.${parts[1]}`;
    const signature = Buffer.from(parts[2], 'base64url');

    const isValidSignature = crypto.verify(
      'sha256',
      Buffer.from(signatureInput),
      publicKey,
      signature
    );

    if (!isValidSignature) {
      console.warn('⚠️ Invalid JWT signature');
      return false;
    }

    // Step 4: Decode payload and verify claims
    const payload = decodeJwtPayload(jwt);
    if (!payload) {
      console.warn('⚠️ Invalid JWT payload');
      return false;
    }

    // Step 5: Verify request body hash
    const bodyHash = crypto
      .createHash('sha256')
      .update(rawBody)
      .digest('hex');

    if (payload.request_body_sha256 !== bodyHash) {
      console.warn('⚠️ Request body hash mismatch');
      return false;
    }

    // Step 6: Verify timestamp (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;
    if (Math.abs(now - payload.iat) > fiveMinutes) {
      console.warn('⚠️ JWT timestamp too old or in future');
      return false;
    }

    console.log('✅ Plaid webhook signature verified');
    return true;
  } catch (error) {
    console.error('❌ Webhook verification error:', error);
    return false;
  }
}

// --- PLAID API CONFIGURATION ---
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';
const PLAID_BASE_URL = PLAID_ENV === 'production' 
  ? 'https://production.plaid.com'
  : PLAID_ENV === 'development'
    ? 'https://development.plaid.com'
    : 'https://sandbox.plaid.com';

interface PlaidConfig {
  clientId: string;
  secret: string;
}

function getPlaidConfig(): PlaidConfig {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  
  if (!clientId || !secret || clientId === 'your_client_id' || secret === 'your_secret') {
    console.error('❌ PLAID_CLIENT_ID and PLAID_SECRET must be configured');
    throw new Error('Plaid is not configured. Please add your Plaid API credentials.');
  }
  
  return { clientId, secret };
}

/**
 * Get audit context from request
 */
function getAuditContext(req: AuthenticatedRequest): AuditContext {
  return {
    userId: req.user?.id || 'anonymous',
    ipAddress: req.ip || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
}

// =============================================================================
// STATUS & CONFIGURATION
// =============================================================================

/**
 * GET /api/connectors/plaid/status
 * Check if Plaid is configured
 */
router.get('/status', async (req: AuthenticatedRequest, res: Response) => {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  
  const isConfigured = clientId && secret && 
    clientId !== 'your_client_id' && 
    secret !== 'your_secret';
  
  res.json({
    success: true,
    configured: isConfigured,
    environment: PLAID_ENV,
    message: isConfigured 
      ? 'Plaid is configured and ready' 
      : 'Plaid credentials not configured'
  });
});

// =============================================================================
// PLAID LINK FLOW
// =============================================================================

/**
 * POST /api/connectors/plaid/link-token
 * Create a Plaid Link token for initializing Plaid Link
 */
router.post('/link-token', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const auditContext = getAuditContext(req);
  const timer = auditService.createTimer();
  
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const config = getPlaidConfig();
    const { redirectUri, products = ['transactions'] } = req.body;

    console.log('🏦 Creating Plaid link token', { userId, products });

    const response = await fetch(`${PLAID_BASE_URL}/link/token/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.clientId,
        secret: config.secret,
        user: {
          client_user_id: userId,
          email_address: req.user?.email,
        },
        client_name: 'AI2 Finance',
        products: products,
        country_codes: ['US', 'GB', 'CA', 'AU', 'NZ', 'IE', 'FR', 'ES', 'NL', 'DE'],
        language: 'en',
        ...(redirectUri ? { redirect_uri: redirectUri } : {}),
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error('❌ Plaid link token error:', data);
      await auditService.failure('connect', auditContext, data.error_message || 'Failed to create link token', {
        step: 'link_token_create',
        plaidError: data.error_code,
      }, timer.elapsed());
      
      return res.status(response.status).json({
        success: false,
        error: data.error_message || 'Failed to create Plaid link token',
      });
    }

    console.log('✅ Plaid link token created');

    res.json({
      success: true,
      linkToken: data.link_token,
      expiration: data.expiration,
    });
  } catch (error: any) {
    console.error('Plaid link token error:', error);
    await auditService.failure('connect', auditContext, error, { step: 'link_token_create' }, timer.elapsed());
    res.status(500).json({ success: false, error: error.message || 'Failed to create Plaid link token' });
  }
});

/**
 * POST /api/connectors/plaid/exchange-token
 * Exchange public token for access token and SECURELY STORE IT
 * 
 * SECURITY: Access token is encrypted and stored in database
 * Client receives only connectionId, NEVER the access token
 */
router.post('/exchange-token', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const auditContext = getAuditContext(req);
  const timer = auditService.createTimer();
  
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { publicToken, metadata } = req.body;
    if (!publicToken) {
      return res.status(400).json({ success: false, error: 'publicToken is required' });
    }

    const config = getPlaidConfig();

    console.log('🔄 Exchanging Plaid public token', { userId, institution: metadata?.institution?.name });

    // Exchange public token for access token
    const response = await fetch(`${PLAID_BASE_URL}/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.clientId,
        secret: config.secret,
        public_token: publicToken,
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error('❌ Plaid token exchange error:', data);
      await auditService.failure('token_exchange', auditContext, data.error_message || 'Token exchange failed', {
        plaidError: data.error_code,
        institutionId: metadata?.institution?.institution_id,
      }, timer.elapsed());
      
      return res.status(response.status).json({
        success: false,
        error: data.error_message || 'Failed to exchange token',
      });
    }

    const accessToken = data.access_token;
    const itemId = data.item_id;

    console.log('✅ Plaid token exchanged, storing securely...', { itemId });

    // Fetch accounts
    const accountsResponse = await fetch(`${PLAID_BASE_URL}/accounts/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.clientId,
        secret: config.secret,
        access_token: accessToken,
      }),
    });

    const accountsData = await accountsResponse.json() as any;
    const accounts = (accountsData.accounts || []).map((acc: any) => ({
      id: acc.account_id,
      name: acc.name,
      type: acc.type,
      subtype: acc.subtype,
      currency: acc.balances?.iso_currency_code || 'USD',
      balance: acc.balances?.current,
      accountNumber: acc.mask,
      bankName: metadata?.institution?.name,
    }));

    // =========================================================================
    // SECURE STORAGE: Encrypt and store credentials in database
    // =========================================================================
    const connection = await secureCredentialManager.createConnection(
      userId,
      'plaid',
      'bank',
      {
        accessToken,  // ENCRYPTED before storage
        itemId,
      },
      {
        institutionId: metadata?.institution?.institution_id,
        institutionName: metadata?.institution?.name,
        accounts,
        settings: {
          autoSync: true,
          syncInterval: 60,
          categorizeTransactions: true,
        },
      },
      auditContext
    );

    await auditService.success('token_exchange', {
      ...auditContext,
      connectionId: connection.id,
      connectorId: 'plaid',
    }, {
      institutionId: metadata?.institution?.institution_id,
      institutionName: metadata?.institution?.name,
      accountCount: accounts.length,
    }, timer.elapsed());

    console.log('✅ Connection created securely:', connection.id);

    // Return connectionId to client - NEVER return accessToken
    res.json({
      success: true,
      connectionId: connection.id,  // Client uses this for all future requests
      accounts: accounts,
      institution: metadata?.institution,
      message: 'Bank connected successfully',
    });
  } catch (error: any) {
    console.error('Plaid token exchange error:', error);
    await auditService.failure('token_exchange', auditContext, error, {}, timer.elapsed());
    res.status(500).json({ success: false, error: error.message || 'Failed to exchange token' });
  }
});

// =============================================================================
// CONNECTION MANAGEMENT (using connectionId, not tokens)
// =============================================================================

/**
 * GET /api/connectors/plaid/connections
 * List all Plaid connections for the user
 */
router.get('/connections', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const connections = await secureCredentialManager.getUserConnections(userId);
    const plaidConnections = connections.filter(c => c.connectorId === 'plaid');

    res.json({
      success: true,
      connections: plaidConnections.map(c => ({
        id: c.id,
        institutionId: c.institutionId,
        institutionName: c.institutionName,
        status: c.status,
        accounts: c.accounts,
        lastSync: c.lastSync,
        createdAt: c.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/connectors/plaid/connections/:connectionId/accounts
 * Get accounts for a specific connection
 */
router.get('/connections/:connectionId/accounts', async (req: AuthenticatedRequest, res: Response) => {
  const auditContext = getAuditContext(req);
  
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { connectionId } = req.params;
    
    const connection = await secureCredentialManager.getConnection(connectionId, userId);
    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    // Get credentials securely (audit logged)
    const credentials = await secureCredentialManager.getCredentials(connectionId, userId, auditContext);
    const config = getPlaidConfig();

    // Fetch fresh account data from Plaid
    const response = await fetch(`${PLAID_BASE_URL}/accounts/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.clientId,
        secret: config.secret,
        access_token: credentials.accessToken,
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      await secureCredentialManager.updateConnectionStatus(connectionId, userId, 'error', data.error_message);
      return res.status(response.status).json({
        success: false,
        error: data.error_message || 'Failed to fetch accounts',
      });
    }

    const accounts = (data.accounts || []).map((acc: any) => ({
      id: acc.account_id,
      name: acc.name,
      officialName: acc.official_name,
      type: acc.type,
      subtype: acc.subtype,
      balance: acc.balances?.current,
      availableBalance: acc.balances?.available,
      currency: acc.balances?.iso_currency_code || 'USD',
      accountNumber: acc.mask,
    }));

    // Update stored accounts
    await secureCredentialManager.updateAccounts(connectionId, userId, accounts);

    await auditService.success('account_list', {
      ...auditContext,
      connectionId,
    }, { accountCount: accounts.length });

    res.json({ success: true, accounts });
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    await auditService.failure('account_list', auditContext, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/connectors/plaid/connections/:connectionId/transactions
 * Fetch transactions for a connection (with date range)
 */
router.get('/connections/:connectionId/transactions', async (req: AuthenticatedRequest, res: Response) => {
  const auditContext = getAuditContext(req);
  const timer = auditService.createTimer();
  
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { connectionId } = req.params;
    const { startDate, endDate, accountIds } = req.query;
    
    const connection = await secureCredentialManager.getConnection(connectionId, userId);
    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    // Get credentials securely
    const credentials = await secureCredentialManager.getCredentials(connectionId, userId, auditContext);
    const config = getPlaidConfig();

    // Default date range: last 30 days
    const end = endDate as string || new Date().toISOString().split('T')[0];
    const start = startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log('📊 Fetching Plaid transactions', { connectionId, start, end });

    const response = await fetch(`${PLAID_BASE_URL}/transactions/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.clientId,
        secret: config.secret,
        access_token: credentials.accessToken,
        start_date: start,
        end_date: end,
        options: {
          count: 500,
          offset: 0,
          ...(accountIds ? { account_ids: (accountIds as string).split(',') } : {}),
        },
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      await secureCredentialManager.updateConnectionStatus(connectionId, userId, 'error', data.error_message);
      await auditService.failure('transaction_fetch', { ...auditContext, connectionId }, data.error_message, {
        plaidError: data.error_code,
      }, timer.elapsed());
      
      return res.status(response.status).json({
        success: false,
        error: data.error_message || 'Failed to fetch transactions',
      });
    }

    // Map transactions using enrichment service for consistent schema
    // Plaid transactions already include enrichment data (merchant, category, location)
    const transactions = (data.transactions || []).map((tx: any) => 
      transactionEnrichmentService.mapPlaidTransaction(tx)
    );
    
    console.log(`✅ Mapped ${transactions.length} Plaid transactions with enrichment data`);

    // Record sync
    await secureCredentialManager.recordSync(connectionId, userId, {
      totalTransactions: transactions.length,
      newTransactions: transactions.length,
      skippedTransactions: 0,
      startDate: new Date(start),
      endDate: new Date(end),
    });

    await auditService.success('transaction_fetch', {
      ...auditContext,
      connectionId,
    }, {
      transactionCount: transactions.length,
      startDate: start,
      endDate: end,
    }, timer.elapsed());

    res.json({
      success: true,
      transactions,
      total: data.total_transactions,
      accounts: data.accounts?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    await auditService.failure('transaction_fetch', auditContext, error, {}, timer.elapsed());
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/connectors/plaid/connections/:connectionId/sync
 * Manually trigger a sync for a connection
 */
router.post('/connections/:connectionId/sync', async (req: AuthenticatedRequest, res: Response) => {
  const auditContext = getAuditContext(req);
  const timer = auditService.createTimer();
  
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { connectionId } = req.params;
    
    // Update status to syncing
    await secureCredentialManager.updateConnectionStatus(connectionId, userId, 'syncing');

    await auditService.success('sync', {
      ...auditContext,
      connectionId,
    }, { type: 'manual' }, timer.elapsed());

    // Trigger transaction fetch (could be async in production)
    // For now, just return success - client should call /transactions
    res.json({
      success: true,
      message: 'Sync initiated',
      connectionId,
    });
  } catch (error: any) {
    console.error('Error initiating sync:', error);
    await auditService.failure('sync', auditContext, error, {}, timer.elapsed());
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/connectors/plaid/connections/:connectionId
 * Disconnect a Plaid connection (revoke access token and delete)
 */
router.delete('/connections/:connectionId', async (req: AuthenticatedRequest, res: Response) => {
  const auditContext = getAuditContext(req);
  const timer = auditService.createTimer();
  
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { connectionId } = req.params;
    
    const connection = await secureCredentialManager.getConnection(connectionId, userId);
    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    // Get credentials to revoke with Plaid
    try {
      const credentials = await secureCredentialManager.getCredentials(connectionId, userId, auditContext);
      const config = getPlaidConfig();

      // Revoke access token with Plaid
      await fetch(`${PLAID_BASE_URL}/item/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: config.clientId,
          secret: config.secret,
          access_token: credentials.accessToken,
        }),
      });
      
      console.log('✅ Plaid item removed');
    } catch (e) {
      console.warn('⚠️ Could not revoke Plaid token (may already be revoked)');
    }

    // Delete from our database
    await secureCredentialManager.deleteConnection(connectionId, userId, auditContext);

    res.json({
      success: true,
      message: 'Connection disconnected successfully',
    });
  } catch (error: any) {
    console.error('Error disconnecting:', error);
    await auditService.failure('disconnect', auditContext, error, {}, timer.elapsed());
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================================
// WEBHOOKS (signature verified)
// =============================================================================

// =============================================================================
// ENRICH API (For external transactions - CSV, manual, etc.)
// =============================================================================

/**
 * POST /api/connectors/plaid/enrich
 * Enrich transactions from ANY source using Plaid Enrich API
 * Use this for CSV imports, manual transactions, non-Plaid connectors
 * 
 * Request body:
 * {
 *   "transactions": [
 *     { "id": "tx1", "description": "AMZN MKTP US*123", "amount": -45.99, "date": "2024-01-15" },
 *     ...
 *   ]
 * }
 */
router.post('/enrich', async (req: AuthenticatedRequest, res: Response) => {
  const auditContext = getAuditContext(req);
  const timer = auditService.createTimer();
  
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { transactions } = req.body;
    
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'transactions array is required' 
      });
    }

    if (transactions.length > 100) {
      return res.status(400).json({ 
        success: false, 
        error: 'Maximum 100 transactions per request (Plaid API limit)' 
      });
    }

    // Validate transaction structure
    for (const tx of transactions) {
      if (!tx.id || !tx.description || tx.amount === undefined || !tx.date) {
        return res.status(400).json({ 
          success: false, 
          error: 'Each transaction requires: id, description, amount, date' 
        });
      }
    }

    if (!transactionEnrichmentService.isEnrichAvailable()) {
      return res.status(503).json({ 
        success: false, 
        error: 'Plaid Enrich not configured' 
      });
    }

    console.log(`🔮 Enriching ${transactions.length} external transactions for user ${userId}`);

    const enriched = await transactionEnrichmentService.enrichTransactions(
      transactions,
      userId
    );

    const enrichedCount = enriched.filter(t => t.enriched).length;
    
    await auditService.success('enrich', {
      ...auditContext,
      connectorId: 'plaid-enrich',
    }, {
      inputCount: transactions.length,
      enrichedCount,
    }, timer.elapsed());

    res.json({
      success: true,
      transactions: enriched,
      enrichedCount,
      totalCount: transactions.length,
    });

  } catch (error: any) {
    console.error('Enrich error:', error);
    await auditService.failure('enrich', auditContext, error, {}, timer.elapsed());
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================================
// WEBHOOKS (signature verified)
// =============================================================================

/**
 * POST /api/connectors/plaid/webhook
 * Handle Plaid webhooks (item updates, transactions, errors)
 * SECURITY: Webhook signature must be verified
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const timer = auditService.createTimer();
  
  try {
    // Get raw body for signature verification
    const rawBody = req.body.toString();
    let payload: any;
    
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    // Verify webhook signature (always in production, optional in dev)
    if (process.env.NODE_ENV === 'production' || process.env.VERIFY_PLAID_WEBHOOKS === 'true') {
      const isValid = await verifyPlaidWebhook(req, rawBody);
      if (!isValid) {
        console.warn('🚨 Invalid Plaid webhook signature');
        await auditService.securityAlert({
          userId: 'system',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }, 'invalid_webhook_signature', {
          connector: 'plaid',
          headers: Object.keys(req.headers),
        });
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { webhook_type, webhook_code, item_id, error } = payload;
    
    console.log('📥 Plaid webhook received:', { webhook_type, webhook_code, item_id });

    // Log webhook receipt
    await auditService.log('webhook_receive', 'success', {
      userId: 'system',
      connectorId: 'plaid',
    }, {
      webhookType: webhook_type,
      webhookCode: webhook_code,
      itemId: item_id,
      hasError: !!error,
    }, timer.elapsed());

    // Handle different webhook types
    switch (webhook_type) {
      case 'TRANSACTIONS':
        // New transactions available
        console.log('📊 Transaction webhook:', webhook_code);
        break;
        
      case 'ITEM':
        // Item status changes (e.g., needs re-auth)
        if (webhook_code === 'ERROR' || webhook_code === 'PENDING_EXPIRATION') {
          console.warn('⚠️ Plaid item needs attention:', { item_id, webhook_code, error });
        }
        break;
        
      case 'AUTH':
        // Auth data changes
        console.log('🔐 Auth webhook:', webhook_code);
        break;
        
      default:
        console.log('📬 Other webhook:', webhook_type, webhook_code);
    }

    // Acknowledge webhook
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;

