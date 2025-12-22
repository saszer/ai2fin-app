// --- 📦 BASIQ ROUTES (SECURE) ---
// embracingearth.space - Secure Basiq integration with encrypted credential storage
// All access tokens stored encrypted, never exposed to client

import express, { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { secureCredentialManager } from '../core/SecureCredentialManager';
import { auditService, AuditContext } from '../services/AuditService';
import { transactionEnrichmentService } from '../services/TransactionEnrichmentService';
import crypto from 'crypto';

const router = express.Router();

// --- BASIQ API CONFIGURATION ---
const BASIQ_API_BASE = process.env.BASIQ_ENVIRONMENT === 'production' 
  ? 'https://au-api.basiq.io'
  : 'https://au-api.basiq.io';

const BASIQ_WEBHOOK_SECRET = process.env.BASIQ_WEBHOOK_SECRET;

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
 * Get Basiq access token using API key
 * SECURITY: Server-side only, API key never exposed to client
 */
async function getBasiqAccessToken(): Promise<string> {
  const apiKey = process.env.BASIQ_API_KEY;
  if (!apiKey) {
    throw new Error('BASIQ_API_KEY not configured');
  }

  const response = await fetch(`${BASIQ_API_BASE}/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'basiq-version': '3.0'
    },
    body: 'scope=SERVER_ACCESS'
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Basiq token error:', errorText);
    throw new Error(`Failed to get Basiq access token: ${response.status}`);
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

/**
 * Verify Basiq webhook signature
 * SECURITY: HMAC-SHA256 verification with timing-safe comparison
 */
function verifyBasiqSignature(
  webhookId: string,
  webhookTimestamp: string,
  payload: string,
  webhookSignature: string,
  secret: string
): boolean {
  try {
    let secretBytes: Buffer;
    if (secret.startsWith('whsec_')) {
      secretBytes = Buffer.from(secret.split('_')[1], 'base64');
    } else {
      secretBytes = Buffer.from(secret, 'base64');
    }

    const signedContent = `${webhookId}.${webhookTimestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secretBytes)
      .update(signedContent)
      .digest('base64');

    const signatures = webhookSignature.split(' ');
    for (const sig of signatures) {
      const signatureHash = sig.includes(',') ? sig.split(',')[1] : sig;
      try {
        if (crypto.timingSafeEqual(
          Buffer.from(expectedSignature),
          Buffer.from(signatureHash)
        )) {
          return true;
        }
      } catch {
        continue;
      }
    }
    return false;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Verify timestamp to prevent replay attacks (5 minute tolerance)
 */
function verifyTimestamp(webhookTimestamp: string): boolean {
  try {
    const timestamp = parseInt(webhookTimestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    return Math.abs(now - timestamp) <= 300;
  } catch {
    return false;
  }
}

// =============================================================================
// STATUS & CONFIGURATION
// =============================================================================

/**
 * GET /api/connectors/basiq/status
 * Check if Basiq is configured
 */
router.get('/status', async (req: AuthenticatedRequest, res: Response) => {
  const apiKey = process.env.BASIQ_API_KEY;
  const isConfigured = !!apiKey && apiKey !== 'your_api_key';
  
  res.json({
    success: true,
    configured: isConfigured,
    environment: process.env.BASIQ_ENVIRONMENT || 'sandbox',
    message: isConfigured ? 'Basiq is configured and ready' : 'Basiq API key not configured'
  });
});

// =============================================================================
// BASIQ CONSENT FLOW
// =============================================================================

/**
 * POST /api/connectors/basiq/consent
 * Create Basiq user and return consent UI URL
 * SECURITY: No credentials exposed to client
 */
router.post('/consent', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const auditContext = getAuditContext(req);
  const timer = auditService.createTimer();
  
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { redirectUri, mobile } = req.body;
    if (!redirectUri) {
      return res.status(400).json({ success: false, error: 'redirectUri is required' });
    }
    if (!mobile) {
      return res.status(400).json({ 
        success: false, 
        error: 'Mobile number required for Basiq bank verification' 
      });
    }

    const accessToken = await getBasiqAccessToken();
    const userEmail = req.user?.email || `user-${userId}@ai2platform.local`;

    console.log('👤 Creating Basiq user...');
    
    // Create Basiq user
    const createUserResponse = await fetch(`${BASIQ_API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'basiq-version': '3.0'
      },
      body: JSON.stringify({ email: userEmail, mobile })
    });

    let basiqUserId: string;
    
    if (createUserResponse.ok) {
      const userData = await createUserResponse.json() as { id: string };
      basiqUserId = userData.id;
      console.log(`✅ Created Basiq user: ${basiqUserId}`);
    } else {
      const errorText = await createUserResponse.text();
      console.error('❌ Basiq user creation failed:', errorText);
      
      await auditService.failure('connect', auditContext, 'Basiq user creation failed', {
        step: 'user_create',
      }, timer.elapsed());
      
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create Basiq user. Check API configuration.' 
      });
    }

    // Create consent link
    const consentResponse = await fetch(`${BASIQ_API_BASE}/users/${basiqUserId}/auth_link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'basiq-version': '3.0'
      },
      body: JSON.stringify({
        mobile,
        email: userEmail,
        redirectUrl: redirectUri
      })
    });

    if (!consentResponse.ok) {
      const errorText = await consentResponse.text();
      console.error('❌ Basiq auth_link creation failed:', errorText);
      
      await auditService.failure('connect', auditContext, 'Basiq consent link creation failed', {
        step: 'auth_link_create',
        basiqUserId,
      }, timer.elapsed());
      
      return res.status(500).json({ success: false, error: 'Failed to generate consent URL' });
    }

    const consentData = await consentResponse.json() as { links?: { public?: string; self?: string }; url?: string };
    const consentUrl = consentData.links?.public || consentData.url || consentData.links?.self;

    if (!consentUrl) {
      return res.status(500).json({ success: false, error: 'No consent URL in response' });
    }

    // Store basiqUserId temporarily for callback (will be replaced with proper connection on callback)
    // SECURITY: No access tokens stored yet - they come after consent
    await secureCredentialManager.createConnection(
      userId,
      'basiq',
      'bank',
      { basiqUserId },  // Only store basiqUserId, not access token
      {},  // No additional options - status defaults to 'connected'
      auditContext
    );

    console.log(`✅ Generated Basiq consent URL for user: ${userId}`);

    res.json({
      success: true,
      consentUrl,
      basiqUserId,
      message: 'Redirect user to consentUrl to connect their bank'
    });

  } catch (error: any) {
    console.error('Basiq consent error:', error);
    await auditService.failure('connect', auditContext, error, { step: 'consent' }, timer.elapsed());
    res.status(500).json({ success: false, error: error.message || 'Failed to create consent session' });
  }
});

/**
 * GET /api/connectors/basiq/callback
 * Handle callback after user completes Basiq consent
 * SECURITY: Stores connection securely after successful consent
 */
router.get('/callback', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId: basiqUserId, jobId, success: consentSuccess } = req.query;

    if (!consentSuccess || consentSuccess === 'false') {
      console.warn('Basiq consent cancelled:', req.query);
      return res.redirect('/connectors?status=cancelled&provider=basiq');
    }

    if (!basiqUserId) {
      return res.redirect('/connectors?status=error&provider=basiq&message=Missing user ID');
    }

    const accessToken = await getBasiqAccessToken();

    // Fetch user's connections
    const connectionsResponse = await fetch(`${BASIQ_API_BASE}/users/${basiqUserId}/connections`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'basiq-version': '3.0'
      }
    });

    if (!connectionsResponse.ok) {
      console.error('Failed to fetch Basiq connections');
      return res.redirect('/connectors?status=error&provider=basiq&message=Failed to fetch connections');
    }

    const connectionsData = await connectionsResponse.json() as { 
      data?: Array<{ id: string; status: string; institution?: { shortName?: string; id?: string } }> 
    };
    const connections = connectionsData.data || [];

    console.log(`✅ Basiq callback: ${connections.length} connections for user ${basiqUserId}`);

    // Note: In production, look up platform userId from basiqUserId mapping
    // For now, redirect to success page
    res.redirect(`/connectors?status=success&provider=basiq&accounts=${connections.length}`);

  } catch (error: any) {
    console.error('Basiq callback error:', error);
    res.redirect('/connectors?status=error&provider=basiq&message=Callback processing failed');
  }
});

// =============================================================================
// CONNECTION MANAGEMENT (using connectionId)
// =============================================================================

/**
 * GET /api/connectors/basiq/connections
 * List all Basiq connections for the user
 */
router.get('/connections', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const connections = await secureCredentialManager.getUserConnections(userId);
    const basiqConnections = connections.filter(c => c.connectorId === 'basiq');

    res.json({
      success: true,
      connections: basiqConnections.map(c => ({
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
 * GET /api/connectors/basiq/connections/:connectionId/accounts
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

    // Get credentials (basiqUserId)
    const credentials = await secureCredentialManager.getCredentials(connectionId, userId, auditContext);
    const basiqUserId = credentials.basiqUserId as string;
    
    if (!basiqUserId) {
      return res.status(400).json({ success: false, error: 'Invalid connection credentials' });
    }

    const accessToken = await getBasiqAccessToken();

    const response = await fetch(`${BASIQ_API_BASE}/users/${basiqUserId}/accounts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'basiq-version': '3.0'
      }
    });

    if (!response.ok) {
      await secureCredentialManager.updateConnectionStatus(connectionId, userId, 'error', 'Failed to fetch accounts');
      return res.status(500).json({ success: false, error: 'Failed to fetch accounts' });
    }

    const data = await response.json() as { data?: any[] };
    const accounts = (data.data || []).map((acc: any) => ({
      id: acc.id,
      name: acc.name || acc.accountNumber,
      type: acc.class?.toLowerCase() || 'account',
      balance: acc.balance?.available || acc.balance?.current || 0,
      currency: acc.currency || 'AUD',
      institution: acc.institution?.shortName || 'Bank',
      accountNumber: acc.accountNumber ? `****${acc.accountNumber.slice(-4)}` : undefined
    }));

    await secureCredentialManager.updateAccounts(connectionId, userId, accounts);
    await auditService.success('account_list', { ...auditContext, connectionId }, { accountCount: accounts.length });

    res.json({ success: true, accounts });

  } catch (error: any) {
    console.error('Basiq accounts error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch accounts' });
  }
});

/**
 * GET /api/connectors/basiq/connections/:connectionId/transactions
 * Fetch transactions for a connection
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
    const { accountId, fromDate, toDate, limit = '100' } = req.query;
    
    const connection = await secureCredentialManager.getConnection(connectionId, userId);
    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    const credentials = await secureCredentialManager.getCredentials(connectionId, userId, auditContext);
    const basiqUserId = credentials.basiqUserId as string;
    
    if (!basiqUserId) {
      return res.status(400).json({ success: false, error: 'Invalid connection credentials' });
    }

    const accessToken = await getBasiqAccessToken();

    const params = new URLSearchParams();
    if (accountId) params.append('filter[account.id]', accountId as string);
    if (fromDate) params.append('filter[transaction.postDate][gte]', fromDate as string);
    if (toDate) params.append('filter[transaction.postDate][lte]', toDate as string);
    params.append('limit', limit as string);

    const response = await fetch(
      `${BASIQ_API_BASE}/users/${basiqUserId}/transactions?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'basiq-version': '3.0'
        }
      }
    );

    if (!response.ok) {
      await secureCredentialManager.updateConnectionStatus(connectionId, userId, 'error', 'Failed to fetch transactions');
      await auditService.failure('transaction_fetch', { ...auditContext, connectionId }, 'Basiq API error', {}, timer.elapsed());
      return res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
    }

    const data = await response.json() as { data?: any[] };
    // Map transactions using enrichment service for consistent schema
    // Basiq has its own enrichment data (enrich.merchant, enrich.category)
    const transactions = (data.data || []).map((tx: any) => 
      transactionEnrichmentService.mapBasiqTransaction(tx)
    );
    
    console.log(`✅ Mapped ${transactions.length} Basiq transactions with enrichment data`);

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
    console.error('Basiq transactions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

/**
 * DELETE /api/connectors/basiq/connections/:connectionId
 * Disconnect a Basiq connection
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
 * POST /api/connectors/basiq/webhook
 * Handle Basiq webhooks
 * SECURITY: Signature verified in production
 */
router.post('/webhook', express.raw({ type: 'application/json', limit: '1mb' }), async (req: Request, res: Response) => {
  const timer = auditService.createTimer();
  
  try {
    const rawBody = req.body.toString();
    
    const webhookId = req.headers['webhook-id'] as string;
    const webhookTimestamp = req.headers['webhook-timestamp'] as string;
    const webhookSignature = req.headers['webhook-signature'] as string;

    // Verify in production
    if (process.env.NODE_ENV === 'production') {
      if (!BASIQ_WEBHOOK_SECRET) {
        console.error('⚠️ BASIQ_WEBHOOK_SECRET not configured');
        return res.status(500).json({ success: false, error: 'Webhook not configured' });
      }

      if (!webhookId || !webhookTimestamp || !webhookSignature) {
        await auditService.securityAlert({
          userId: 'system',
          ipAddress: req.ip,
        }, 'missing_webhook_headers', { connector: 'basiq' });
        return res.status(401).json({ success: false, error: 'Missing webhook headers' });
      }

      if (!verifyTimestamp(webhookTimestamp)) {
        await auditService.securityAlert({
          userId: 'system',
          ipAddress: req.ip,
        }, 'webhook_timestamp_invalid', { connector: 'basiq' });
        return res.status(401).json({ success: false, error: 'Webhook timestamp invalid' });
      }

      if (!verifyBasiqSignature(webhookId, webhookTimestamp, rawBody, webhookSignature, BASIQ_WEBHOOK_SECRET)) {
        await auditService.securityAlert({
          userId: 'system',
          ipAddress: req.ip,
        }, 'invalid_webhook_signature', { connector: 'basiq' });
        return res.status(401).json({ success: false, error: 'Invalid signature' });
      }
    }

    const payload = JSON.parse(rawBody);
    const eventTypeId = payload.eventTypeId || payload.event;

    console.log(`📥 Basiq webhook received: ${eventTypeId}`);

    await auditService.log('webhook_receive', 'success', {
      userId: 'system',
      connectorId: 'basiq',
    }, {
      eventType: eventTypeId,
      webhookId,
    }, timer.elapsed());

    // Handle events
    switch (eventTypeId) {
      case 'transactions.updated':
        console.log('📊 Basiq transactions updated');
        break;
      case 'connection.created':
      case 'connection.deleted':
      case 'connection.invalidated':
        console.log(`🔗 Basiq connection ${eventTypeId}`);
        break;
      default:
        console.log('📬 Unhandled Basiq event:', eventTypeId);
    }

    res.json({ success: true, message: 'Webhook received' });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

export default router;
