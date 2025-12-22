// --- 📦 BASIQ ROUTES ---
// embracingearth.space - Basiq OAuth consent flow and webhook endpoints
// Architecture: Handles user consent, OAuth callbacks, and real-time webhooks
// Docs: https://api.basiq.io/docs

import express, { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { webhookProcessor } from '../services/WebhookProcessor';
import crypto from 'crypto';

const router = express.Router();

// --- BASIQ API CONFIGURATION ---
const BASIQ_API_BASE = process.env.BASIQ_ENVIRONMENT === 'production' 
  ? 'https://au-api.basiq.io'
  : 'https://au-api.basiq.io'; // Same URL, different API key behavior

/**
 * Get Basiq access token using API key
 * Architecture: Server-side token generation, never expose API key to client
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
    const error = await response.text();
    console.error('Basiq token error:', error);
    throw new Error('Failed to get Basiq access token');
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

/**
 * POST /api/connectors/basiq/consent
 * Create Basiq user and return consent UI URL for bank connection
 * Architecture: User clicks "Connect Bank" → We create Basiq user → Return consent URL → User selects bank → OAuth flow
 */
router.post('/consent', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { redirectUri } = req.body;
    if (!redirectUri) {
      return res.status(400).json({ success: false, error: 'redirectUri is required' });
    }

    // Get access token
    const accessToken = await getBasiqAccessToken();

    // Step 1: Create or get existing Basiq user for this platform user
    // In production, store basiqUserId in your database
    const userEmail = req.user?.email || `user-${userId}@ai2platform.local`;
    
    const createUserResponse = await fetch(`${BASIQ_API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'basiq-version': '3.0'
      },
      body: JSON.stringify({
        email: userEmail,
        mobile: req.user?.phone || undefined // Optional
      })
    });

    let basiqUserId: string;
    
    if (createUserResponse.ok) {
      const userData = await createUserResponse.json() as { id: string };
      basiqUserId = userData.id;
      console.log(`✅ Created Basiq user: ${basiqUserId}`);
    } else {
      // Parse error response
      const errorText = await createUserResponse.text();
      console.warn('Basiq user creation response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        const errorCode = errorJson.data?.[0]?.code;
        
        // Handle specific error cases
        if (errorCode === 'access-denied') {
          // API key doesn't have user creation permissions
          // Check Basiq Dashboard → API Keys → Ensure correct scopes are enabled
          console.error('❌ Basiq API key lacks user creation permissions. Check Basiq Dashboard.');
          return res.status(403).json({
            success: false,
            error: 'Basiq API key configuration issue. Please contact support.',
            details: process.env.NODE_ENV === 'development' 
              ? 'API key needs user creation permissions in Basiq Dashboard' 
              : undefined
          });
        }
        
        if (errorCode === 'invalid-credentials') {
          console.error('❌ Basiq API key is invalid or expired');
          return res.status(401).json({
            success: false,
            error: 'Basiq configuration error. Please contact support.'
          });
        }
      } catch (e) {
        // JSON parse failed, continue with fallback
      }
      
      // Fallback: Try to use existing user or generate demo ID
      // In production, we should look up existing basiqUserId from our database
      console.warn('⚠️ User creation failed, attempting fallback...');
      basiqUserId = `temp-${crypto.createHash('md5').update(userId).digest('hex').substring(0, 12)}`;
    }

    // Step 2: Create consent link for user to connect their bank
    // Basiq Consent UI handles bank selection and authentication
    const consentResponse = await fetch(`${BASIQ_API_BASE}/users/${basiqUserId}/auth_link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'basiq-version': '3.0'
      },
      body: JSON.stringify({
        mobile: req.user?.phone || undefined,
        email: userEmail,
        // Redirect back to our app after consent
        redirectUrl: redirectUri
      })
    });

    if (!consentResponse.ok) {
      const error = await consentResponse.text();
      console.error('Basiq consent link error:', error);
      
      // Fallback: Use direct Basiq consent URL format
      const consentUrl = `https://consent.basiq.io/home?userId=${basiqUserId}&token=${accessToken}&redirectUrl=${encodeURIComponent(redirectUri)}`;
      
      return res.json({
        success: true,
        consentUrl,
        basiqUserId,
        message: 'Consent URL generated (fallback mode)'
      });
    }

    const consentData = await consentResponse.json() as { links?: { self?: string }; url?: string };
    const consentUrl = consentData.url || consentData.links?.self;

    if (!consentUrl) {
      console.error('No consent URL in response:', consentData);
      return res.status(500).json({ success: false, error: 'Failed to generate consent URL' });
    }

    console.log(`✅ Generated Basiq consent URL for user: ${userId}`);

    res.json({
      success: true,
      consentUrl,
      basiqUserId,
      message: 'Redirect user to consentUrl to connect their bank'
    });

  } catch (error: any) {
    console.error('Basiq consent error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create consent session' 
    });
  }
});

/**
 * GET /api/connectors/basiq/callback
 * Handle callback after user completes Basiq consent flow
 * Architecture: Basiq redirects here after bank connection → We fetch accounts → Store connection
 */
router.get('/callback', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId: basiqUserId, jobId, success: consentSuccess } = req.query;

    if (!consentSuccess || consentSuccess === 'false') {
      console.warn('Basiq consent was not completed:', req.query);
      return res.redirect('/connectors?status=cancelled');
    }

    if (!basiqUserId) {
      console.error('Missing basiqUserId in callback');
      return res.redirect('/connectors?status=error&message=Missing user ID');
    }

    // Get access token
    const accessToken = await getBasiqAccessToken();

    // Fetch user's connections/accounts
    const connectionsResponse = await fetch(`${BASIQ_API_BASE}/users/${basiqUserId}/connections`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'basiq-version': '3.0'
      }
    });

    if (!connectionsResponse.ok) {
      console.error('Failed to fetch Basiq connections:', await connectionsResponse.text());
      return res.redirect('/connectors?status=error&message=Failed to fetch connections');
    }

    const connectionsData = await connectionsResponse.json() as { data?: Array<{ id: string; status: string; institution?: { shortName?: string } }> };
    const connections = connectionsData.data || [];

    console.log(`✅ Basiq callback: ${connections.length} connections for user ${basiqUserId}`);

    // TODO: Store connection in database
    // For now, redirect to success page
    res.redirect(`/connectors?status=success&provider=basiq&accounts=${connections.length}`);

  } catch (error: any) {
    console.error('Basiq callback error:', error);
    res.redirect('/connectors?status=error&message=Callback processing failed');
  }
});

/**
 * GET /api/connectors/basiq/accounts
 * Fetch accounts for connected Basiq user
 */
router.get('/accounts', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { basiqUserId } = req.query;
    if (!basiqUserId) {
      return res.status(400).json({ success: false, error: 'basiqUserId is required' });
    }

    const accessToken = await getBasiqAccessToken();

    const response = await fetch(`${BASIQ_API_BASE}/users/${basiqUserId}/accounts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'basiq-version': '3.0'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to fetch Basiq accounts:', error);
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

    res.json({ success: true, accounts });

  } catch (error: any) {
    console.error('Basiq accounts error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch accounts' });
  }
});

/**
 * GET /api/connectors/basiq/transactions
 * Fetch transactions for a Basiq account
 */
router.get('/transactions', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { basiqUserId, accountId, fromDate, toDate, limit = '100' } = req.query;
    
    if (!basiqUserId) {
      return res.status(400).json({ success: false, error: 'basiqUserId is required' });
    }

    const accessToken = await getBasiqAccessToken();

    // Build query params
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
      const error = await response.text();
      console.error('Failed to fetch Basiq transactions:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
    }

    const data = await response.json() as { data?: any[] };
    const transactions = (data.data || []).map((tx: any) => ({
      id: tx.id,
      date: tx.postDate || tx.transactionDate,
      description: tx.description,
      amount: parseFloat(tx.amount || '0'),
      type: tx.direction?.toLowerCase() === 'credit' ? 'credit' : 'debit',
      category: tx.enrich?.category?.anzsic?.division?.title || tx.subClass?.title,
      merchant: tx.enrich?.merchant?.businessName,
      balance: tx.balance,
      accountId: tx.account?.id
    }));

    res.json({ success: true, transactions, count: transactions.length });

  } catch (error: any) {
    console.error('Basiq transactions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

/**
 * Verify Basiq webhook signature
 * Architecture: HMAC-SHA256 signature verification for security
 * Reference: https://api.basiq.io/docs/webhooks-security
 * 
 * Basiq uses:
 * - Headers: webhook-id, webhook-timestamp, webhook-signature
 * - Signed content: `${webhook_id}.${webhook_timestamp}.${payload}`
 * - Secret format: whsec_<base64_string> (need to base64 decode the part after whsec_)
 * - Signature format: v1,<base64_signature> (space-delimited list)
 */
function verifyBasiqSignature(
  webhookId: string,
  webhookTimestamp: string,
  payload: string,
  webhookSignature: string,
  secret: string
): boolean {
  try {
    // Extract base64 part from secret (format: whsec_<base64_string>)
    let secretBytes: Buffer;
    if (secret.startsWith('whsec_')) {
      const base64Part = secret.split('_')[1];
      secretBytes = Buffer.from(base64Part, 'base64');
    } else {
      // Fallback: assume secret is already the base64 string
      secretBytes = Buffer.from(secret, 'base64');
    }

    // Construct signed content: id.timestamp.payload
    const signedContent = `${webhookId}.${webhookTimestamp}.${payload}`;

    // Calculate expected signature using HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', secretBytes)
      .update(signedContent)
      .digest('base64');

    // Parse webhook-signature header (format: v1,<signature> or space-delimited list)
    const signatures = webhookSignature.split(' ');
    
    // Check if any signature matches
    for (const sig of signatures) {
      // Remove version prefix (e.g., "v1,")
      const signatureHash = sig.includes(',') ? sig.split(',')[1] : sig;
      
      // Constant-time comparison to prevent timing attacks
      if (crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signatureHash)
      )) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Verify webhook timestamp to prevent replay attacks
 * Basiq recommends rejecting webhooks with timestamp > 5 minutes old/future
 */
function verifyTimestamp(webhookTimestamp: string, toleranceSeconds: number = 300): boolean {
  try {
    const timestamp = parseInt(webhookTimestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    const diff = Math.abs(now - timestamp);
    
    return diff <= toleranceSeconds; // 5 minutes default
  } catch (error) {
    console.error('Timestamp verification error:', error);
    return false;
  }
}

/**
 * POST /api/connectors/basiq/webhook
 * Handle webhook notifications from Basiq
 * Architecture: Receives real-time transaction events from Basiq
 * Note: This endpoint is public (no auth) but verifies webhook signature
 */
router.post('/webhook', express.raw({ type: 'application/json', limit: '1mb' }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Security: Validate request size
    if (req.body && req.body.length > 1024 * 1024) { // 1MB limit
      return res.status(413).json({ success: false, error: 'Payload too large' });
    }

    // Get raw body for signature verification
    const rawBody = req.body.toString();
    
    // Basiq webhook headers (per https://api.basiq.io/docs/webhooks-security)
    const webhookId = req.headers['webhook-id'] as string;
    const webhookTimestamp = req.headers['webhook-timestamp'] as string;
    const webhookSignature = req.headers['webhook-signature'] as string;
    const webhookSecret = process.env.BASIQ_WEBHOOK_SECRET || '';

    // Security: Require webhook secret in production
    if (process.env.NODE_ENV === 'production' && !webhookSecret) {
      console.error('⚠️ BASIQ_WEBHOOK_SECRET not configured in production');
      return res.status(500).json({ success: false, error: 'Webhook not configured' });
    }

    // Verify webhook signature (required in production)
    if (webhookSecret) {
      // Check required headers
      if (!webhookId || !webhookTimestamp || !webhookSignature) {
        console.warn('⚠️ Missing Basiq webhook headers', {
          hasId: !!webhookId,
          hasTimestamp: !!webhookTimestamp,
          hasSignature: !!webhookSignature
        });
        return res.status(401).json({ success: false, error: 'Missing webhook headers' });
      }

      // Verify timestamp (prevent replay attacks)
      if (!verifyTimestamp(webhookTimestamp)) {
        console.warn('⚠️ Basiq webhook timestamp out of tolerance', {
          timestamp: webhookTimestamp,
          current: Math.floor(Date.now() / 1000)
        });
        return res.status(401).json({ success: false, error: 'Webhook timestamp invalid' });
      }

      // Verify signature
      const isValid = verifyBasiqSignature(
        webhookId,
        webhookTimestamp,
        rawBody,
        webhookSignature,
        webhookSecret
      );
      
      if (!isValid) {
        console.warn('⚠️ Invalid Basiq webhook signature', {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          webhookId
        });
        return res.status(401).json({ success: false, error: 'Invalid webhook signature' });
      }
    } else if (process.env.NODE_ENV === 'production') {
      // In production, signature is required
      return res.status(401).json({ success: false, error: 'Webhook signature required' });
    }

    // Parse webhook payload with error handling
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Invalid JSON in Basiq webhook:', parseError);
      return res.status(400).json({ success: false, error: 'Invalid JSON payload' });
    }

    // Security: Validate payload structure
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid payload format' });
    }

    // Basiq webhook payload format (per API docs)
    // Payload contains: eventTypeId, eventId, links, and potentially data
    const eventTypeId = payload.eventTypeId || payload.event;
    const eventId = payload.eventId;
    const eventData = payload.data || payload;

    // Security: Validate required fields
    if (!eventTypeId) {
      return res.status(400).json({ success: false, error: 'Missing eventTypeId' });
    }

    console.log(`📨 Basiq webhook received: ${eventTypeId} (eventId: ${eventId})`);

    // Handle different webhook event types (using actual Basiq event names)
    switch (eventTypeId) {
      case 'transactions.updated':
        // Process transaction updates
        // Note: Basiq sends event with links to actual transaction data
        // You may need to fetch transaction details using the links provided
        const result = await webhookProcessor.processWebhook({
          eventType: eventTypeId,
          connectorId: 'basiq',
          data: {
            transaction: eventData.transaction,
            account: eventData.account,
            connectionId: eventData.connectionId || eventData.connection?.id,
            links: payload.links // Basiq provides links to fetch full data
          },
          userId: eventData.userId,
          connectionId: eventData.connectionId || eventData.connection?.id,
          timestamp: new Date().toISOString()
        });

        if (result.success && result.transaction) {
          console.log(`✅ Processed Basiq transaction: ${result.transaction.transactionId}`);
        } else {
          console.warn('⚠️ Failed to process Basiq transaction webhook');
        }
        break;

      case 'connection.created':
        console.log('Basiq connection created:', eventData);
        // TODO: Update connection status in database
        // TODO: Fetch connection details from payload.links.eventEntity if needed
        break;

      case 'connection.deleted':
        console.log('Basiq connection deleted:', eventData);
        // TODO: Mark connection as disconnected in database
        break;

      case 'connection.invalidated':
      case 'connection.activated':
        console.log(`Basiq connection ${eventTypeId}:`, eventData);
        // TODO: Update connection status in database
        break;

      case 'account.updated':
        console.log('Basiq account updated:', eventData);
        // TODO: Update account information in database
        break;

      case 'user.created':
      case 'user.updated':
      case 'user.deleted':
        console.log(`Basiq user ${eventTypeId}:`, eventData);
        // TODO: Handle user events if needed
        break;

      case 'consent.created':
      case 'consent.updated':
      case 'consent.revoked':
      case 'consent.reminder':
      case 'consent.warning':
      case 'consent.expired':
        console.log(`Basiq consent ${eventTypeId}:`, eventData);
        // TODO: Handle consent events if needed
        break;

      default:
        console.log('Unhandled Basiq webhook event:', eventTypeId, eventData);
    }

    res.json({ success: true, message: 'Webhook received' });
  } catch (error: any) {
    console.error('Error processing Basiq webhook:', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

export default router;

