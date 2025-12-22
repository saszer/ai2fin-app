// --- 📦 WISE ROUTES (SECURE) ---
// embracingearth.space - Secure Wise integration with encrypted credential storage
// All access tokens stored encrypted, never exposed to client

import express, { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { secureCredentialManager } from '../core/SecureCredentialManager';
import { auditService, AuditContext } from '../services/AuditService';
import { transactionEnrichmentService, RawTransaction } from '../services/TransactionEnrichmentService';
import crypto from 'crypto';

const router = express.Router();

// --- WISE API CONFIGURATION ---
const WISE_ENV = process.env.WISE_ENV || 'sandbox';
const WISE_API_BASE = WISE_ENV === 'production'
  ? 'https://api.wise.com'
  : 'https://api.sandbox.wise.com';

const WISE_WEBHOOK_SECRET = process.env.WISE_WEBHOOK_SECRET;

// OAuth state tokens (use Redis in production for multi-instance)
const stateTokens = new Map<string, { userId: string; redirectUri: string; createdAt: number }>();

// Cleanup stale state tokens every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of stateTokens.entries()) {
    if (now - value.createdAt > 600000) { // 10 minutes
      stateTokens.delete(key);
    }
  }
}, 60000);

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

/**
 * Verify Wise webhook signature
 * SECURITY: HMAC-SHA256 verification
 */
function verifyWiseSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// =============================================================================
// STATUS & CONFIGURATION
// =============================================================================

/**
 * GET /api/connectors/wise/status
 * Check if Wise is configured
 */
router.get('/status', async (req: AuthenticatedRequest, res: Response) => {
  const clientId = process.env.WISE_CLIENT_ID;
  const clientSecret = process.env.WISE_CLIENT_SECRET;
  const isConfigured = !!clientId && !!clientSecret && 
    clientId !== 'your_client_id' && 
    clientSecret !== 'your_client_secret';
  
  res.json({
    success: true,
    configured: isConfigured,
    environment: WISE_ENV,
    message: isConfigured ? 'Wise is configured and ready' : 'Wise credentials not configured'
  });
});

// =============================================================================
// WISE OAUTH FLOW
// =============================================================================

/**
 * POST /api/connectors/wise/authorize
 * Initiate Wise OAuth flow
 * SECURITY: State token prevents CSRF attacks
 */
router.post('/authorize', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const auditContext = getAuditContext(req);
  
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { redirectUri } = req.body;
    if (!redirectUri) {
      return res.status(400).json({ success: false, error: 'redirectUri is required' });
    }

    const clientId = process.env.WISE_CLIENT_ID;
    if (!clientId || !process.env.WISE_CLIENT_SECRET) {
      return res.status(503).json({ 
        success: false, 
        error: 'Wise integration not configured',
      });
    }

    // Generate CSRF state token
    const state = crypto.randomBytes(32).toString('hex');
    stateTokens.set(state, { 
      userId, 
      redirectUri,
      createdAt: Date.now() 
    });

    const callbackUri = `${process.env.CONNECTORS_URL || 'https://connectors.ai2fin.com'}/api/connectors/wise/callback`;
    
    // Build OAuth URL
    const authUrl = new URL(`${WISE_API_BASE.replace('api.', 'secure.')}/oauth/authorize`);
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', callbackUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'read_profile read_balances read_transactions');

    console.log(`✅ Generated Wise OAuth URL for user: ${userId}`);

    res.json({
      success: true,
      authUrl: authUrl.toString(),
      message: 'Redirect user to authUrl to authorize Wise access'
    });

  } catch (error: any) {
    console.error('Wise authorize error:', error);
    await auditService.failure('connect', auditContext, error, { step: 'authorize' });
    res.status(500).json({ success: false, error: error.message || 'Failed to initiate OAuth flow' });
  }
});

/**
 * GET /api/connectors/wise/callback
 * Handle OAuth callback from Wise
 * SECURITY: Validates state token, stores tokens securely
 */
router.get('/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error('Wise OAuth error:', error, error_description);
      return res.redirect(`/connectors?status=error&provider=wise&message=${encodeURIComponent(error_description as string || error as string)}`);
    }

    if (!code || !state) {
      return res.redirect('/connectors?status=error&provider=wise&message=Missing authorization code');
    }

    // Validate state token (CSRF protection)
    const stateData = stateTokens.get(state as string);
    if (!stateData) {
      console.error('Invalid OAuth state token');
      return res.redirect('/connectors?status=error&provider=wise&message=Invalid state token');
    }

    // Delete used state token
    stateTokens.delete(state as string);

    const callbackUri = `${process.env.CONNECTORS_URL || 'https://connectors.ai2fin.com'}/api/connectors/wise/callback`;
    
    // Exchange code for tokens
    const tokenResponse = await fetch(`${WISE_API_BASE}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.WISE_CLIENT_ID}:${process.env.WISE_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: callbackUri,
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Wise token exchange failed:', errorText);
      return res.redirect('/connectors?status=error&provider=wise&message=Token exchange failed');
    }

    const tokens = await tokenResponse.json() as { 
      access_token: string; 
      refresh_token?: string;
      expires_in?: number;
    };

    console.log(`✅ Wise OAuth successful for user: ${stateData.userId}`);

    // Fetch profile to get profile ID
    const profileResponse = await fetch(`${WISE_API_BASE}/v1/profiles`, {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });

    let profileId: string | undefined;
    let accounts: any[] = [];
    
    if (profileResponse.ok) {
      const profiles = await profileResponse.json() as Array<{ id: number; type: string }>;
      const personalProfile = profiles.find(p => p.type === 'personal');
      profileId = personalProfile?.id?.toString();

      // Fetch accounts
      if (profileId) {
        const accountsResponse = await fetch(`${WISE_API_BASE}/v4/profiles/${profileId}/balances?types=STANDARD`, {
          headers: { 'Authorization': `Bearer ${tokens.access_token}` }
        });
        
        if (accountsResponse.ok) {
          const balances = await accountsResponse.json() as Array<{
            id: number;
            currency: string;
            amount: { value: number; currency: string };
          }>;
          
          accounts = balances.map(b => ({
            id: b.id.toString(),
            name: `${b.currency} Balance`,
            type: 'balance',
            currency: b.currency,
            balance: b.amount?.value || 0,
          }));
        }
      }
    }

    // =========================================================================
    // SECURE STORAGE: Encrypt and store tokens
    // =========================================================================
    const auditContext: AuditContext = {
      userId: stateData.userId,
      connectorId: 'wise',
    };

    await secureCredentialManager.createConnection(
      stateData.userId,
      'wise',
      'bank',
      {
        accessToken: tokens.access_token,  // ENCRYPTED before storage
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        profileId,
      },
      {
        institutionId: 'wise',
        institutionName: 'Wise',
        accounts,
        settings: { autoSync: true },
        expiresAt: tokens.expires_in 
          ? new Date(Date.now() + tokens.expires_in * 1000) 
          : undefined,
      },
      auditContext
    );

    res.redirect(`/connectors?status=success&provider=wise&accounts=${accounts.length}`);

  } catch (error: any) {
    console.error('Wise callback error:', error);
    res.redirect(`/connectors?status=error&provider=wise&message=${encodeURIComponent(error.message || 'Callback failed')}`);
  }
});

// =============================================================================
// CONNECTION MANAGEMENT (using connectionId)
// =============================================================================

/**
 * GET /api/connectors/wise/connections
 * List all Wise connections for the user
 */
router.get('/connections', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const connections = await secureCredentialManager.getUserConnections(userId);
    const wiseConnections = connections.filter(c => c.connectorId === 'wise');

    res.json({
      success: true,
      connections: wiseConnections.map(c => ({
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
 * GET /api/connectors/wise/connections/:connectionId/accounts
 * Get accounts (balances) for a Wise connection
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

    const credentials = await secureCredentialManager.getCredentials(connectionId, userId, auditContext);
    const accessToken = credentials.accessToken as string;
    const profileId = credentials.profileId as string;
    
    if (!accessToken || !profileId) {
      return res.status(400).json({ success: false, error: 'Invalid credentials' });
    }

    const response = await fetch(`${WISE_API_BASE}/v4/profiles/${profileId}/balances?types=STANDARD`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      if (response.status === 401) {
        await secureCredentialManager.updateConnectionStatus(connectionId, userId, 'expired', 'Token expired');
        return res.status(401).json({ success: false, error: 'Token expired - reconnect required' });
      }
      return res.status(500).json({ success: false, error: 'Failed to fetch accounts' });
    }

    const balances = await response.json() as Array<{
      id: number;
      currency: string;
      amount: { value: number; currency: string };
    }>;

    const accounts = balances.map(b => ({
      id: b.id.toString(),
      name: `${b.currency} Balance`,
      type: 'balance',
      currency: b.currency,
      balance: b.amount?.value || 0,
    }));

    await secureCredentialManager.updateAccounts(connectionId, userId, accounts);
    await auditService.success('account_list', { ...auditContext, connectionId }, { accountCount: accounts.length });

    res.json({ success: true, accounts });

  } catch (error: any) {
    console.error('Wise accounts error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch accounts' });
  }
});

/**
 * GET /api/connectors/wise/connections/:connectionId/transactions
 * Fetch transactions for a Wise connection
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
    const { balanceId, fromDate, toDate, limit = '100' } = req.query;
    
    const connection = await secureCredentialManager.getConnection(connectionId, userId);
    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    const credentials = await secureCredentialManager.getCredentials(connectionId, userId, auditContext);
    const accessToken = credentials.accessToken as string;
    const profileId = credentials.profileId as string;
    
    if (!accessToken || !profileId || !balanceId) {
      return res.status(400).json({ success: false, error: 'balanceId is required' });
    }

    // Build query params
    const params = new URLSearchParams();
    params.set('currency', 'USD'); // Wise requires currency
    if (fromDate) params.set('intervalStart', new Date(fromDate as string).toISOString());
    if (toDate) params.set('intervalEnd', new Date(toDate as string).toISOString());
    params.set('limit', limit as string);

    const response = await fetch(
      `${WISE_API_BASE}/v3/profiles/${profileId}/balances/${balanceId}/transactions?${params.toString()}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      await secureCredentialManager.updateConnectionStatus(connectionId, userId, 'error', 'Failed to fetch transactions');
      await auditService.failure('transaction_fetch', { ...auditContext, connectionId }, 'Wise API error', {}, timer.elapsed());
      return res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
    }

    const data = await response.json() as { transactions?: any[] };
    // Map transactions using enrichment service for consistent schema
    let transactions = (data.transactions || []).map((tx: any) => 
      transactionEnrichmentService.mapWiseTransaction(tx, balanceId as string)
    );
    
    // Wise doesn't have enrichment - optionally enrich via Plaid Enrich API
    const { enrich } = req.query;
    if (enrich === 'true' && transactionEnrichmentService.isEnrichAvailable()) {
      console.log('🔮 Enriching Wise transactions via Plaid Enrich API...');
      
      const rawTx: RawTransaction[] = transactions.map(tx => ({
        id: tx.transactionId,
        description: tx.description,
        amount: tx.amount,
        date: tx.date,
        currency: tx.currency,
      }));
      
      const enriched = await transactionEnrichmentService.enrichTransactions(rawTx, userId);
      transactions = enriched.map(etx => ({ ...etx, source: 'wise' as const }));
    }
    
    console.log(`✅ Mapped ${transactions.length} Wise transactions`);

    await secureCredentialManager.recordSync(connectionId, userId, {
      totalTransactions: transactions.length,
      newTransactions: transactions.length,
      skippedTransactions: 0,
    });

    await auditService.success('transaction_fetch', {
      ...auditContext,
      connectionId,
    }, {
      transactionCount: transactions.length,
    }, timer.elapsed());

    res.json({ success: true, transactions, count: transactions.length });

  } catch (error: any) {
    console.error('Wise transactions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

/**
 * POST /api/connectors/wise/connections/:connectionId/refresh
 * Refresh Wise access token
 */
router.post('/connections/:connectionId/refresh', async (req: AuthenticatedRequest, res: Response) => {
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

    const credentials = await secureCredentialManager.getCredentials(connectionId, userId, auditContext);
    const refreshToken = credentials.refreshToken as string;
    
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'No refresh token available' });
    }

    const tokenResponse = await fetch(`${WISE_API_BASE}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.WISE_CLIENT_ID}:${process.env.WISE_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString()
    });

    if (!tokenResponse.ok) {
      await secureCredentialManager.updateConnectionStatus(connectionId, userId, 'expired', 'Token refresh failed');
      await auditService.failure('token_refresh', { ...auditContext, connectionId }, 'Token refresh failed', {}, timer.elapsed());
      return res.status(401).json({ success: false, error: 'Token refresh failed - reconnect required' });
    }

    const tokens = await tokenResponse.json() as { 
      access_token: string; 
      refresh_token?: string;
      expires_in?: number;
    };

    // Update stored credentials
    await secureCredentialManager.updateCredentials(connectionId, userId, {
      ...credentials,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || refreshToken,
      expiresIn: tokens.expires_in,
    }, auditContext);

    await secureCredentialManager.updateConnectionStatus(connectionId, userId, 'connected');

    await auditService.success('token_refresh', { ...auditContext, connectionId }, {}, timer.elapsed());

    res.json({ success: true, message: 'Token refreshed successfully' });

  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/connectors/wise/connections/:connectionId
 * Disconnect a Wise connection
 */
router.delete('/connections/:connectionId', async (req: AuthenticatedRequest, res: Response) => {
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

    // Delete from our database
    await secureCredentialManager.deleteConnection(connectionId, userId, auditContext);

    res.json({
      success: true,
      message: 'Connection disconnected successfully',
    });
  } catch (error: any) {
    console.error('Error disconnecting:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================================
// WEBHOOKS (signature verified)
// =============================================================================

/**
 * POST /api/connectors/wise/webhook
 * Handle Wise webhooks
 * SECURITY: Signature verified in production
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const timer = auditService.createTimer();
  
  try {
    const signature = req.headers['x-signature-sha256'] as string;
    const rawBody = req.body.toString();

    // Verify in production
    if (process.env.NODE_ENV === 'production') {
      if (!WISE_WEBHOOK_SECRET) {
        console.error('⚠️ WISE_WEBHOOK_SECRET not configured');
        return res.status(500).json({ success: false, error: 'Webhook not configured' });
      }

      if (!signature) {
        await auditService.securityAlert({
          userId: 'system',
          ipAddress: req.ip,
        }, 'missing_webhook_signature', { connector: 'wise' });
        return res.status(401).json({ success: false, error: 'Missing signature' });
      }

      if (!verifyWiseSignature(rawBody, signature, WISE_WEBHOOK_SECRET)) {
        await auditService.securityAlert({
          userId: 'system',
          ipAddress: req.ip,
        }, 'invalid_webhook_signature', { connector: 'wise' });
        return res.status(401).json({ success: false, error: 'Invalid signature' });
      }
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event_type;

    console.log(`📥 Wise webhook received: ${eventType}`);

    await auditService.log('webhook_receive', 'success', {
      userId: 'system',
      connectorId: 'wise',
    }, {
      eventType,
    }, timer.elapsed());

    // Handle events
    switch (eventType) {
      case 'transfers#state-change':
        console.log('💸 Wise transfer state changed:', payload.data?.current_state);
        break;
      case 'balances#credit':
        console.log('💰 Wise balance credited:', payload.data?.currency);
        break;
      case 'balances#update':
        console.log('📊 Wise balance updated');
        break;
      default:
        console.log('📬 Unhandled Wise event:', eventType);
    }

    res.json({ success: true });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

export default router;

