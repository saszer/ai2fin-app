// --- 📦 WISE ROUTES ---
// embracingearth.space - Wise OAuth flow and API endpoints
// Documentation: https://api-docs.wise.com/

import express, { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { WiseConnector } from '../connectors/WiseConnector';
import crypto from 'crypto';

const router = express.Router();
const wiseConnector = new WiseConnector();

// Store OAuth state tokens temporarily (use Redis in production)
const stateTokens = new Map<string, { userId: string; redirectUri: string; createdAt: number }>();

// Clean up old state tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of stateTokens.entries()) {
    if (now - value.createdAt > 600000) { // 10 minutes
      stateTokens.delete(key);
    }
  }
}, 60000);

/**
 * POST /api/connectors/wise/authorize
 * Initiate Wise OAuth flow - returns authorization URL
 */
router.post('/authorize', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { redirectUri } = req.body;
    if (!redirectUri) {
      return res.status(400).json({ success: false, error: 'redirectUri is required' });
    }

    // Check if Wise is configured
    if (!process.env.WISE_CLIENT_ID || !process.env.WISE_CLIENT_SECRET) {
      return res.status(503).json({ 
        success: false, 
        error: 'Wise integration not configured',
        message: 'Contact support to enable Wise integration'
      });
    }

    // Generate state token for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    stateTokens.set(state, { 
      userId, 
      redirectUri,
      createdAt: Date.now() 
    });

    // Build callback URL (our endpoint that handles the OAuth callback)
    const callbackUri = `${process.env.CONNECTORS_URL || 'https://connectors.ai2fin.com'}/api/connectors/wise/callback`;
    
    // Get authorization URL from Wise
    const authUrl = wiseConnector.getAuthorizationUrl(callbackUri, state);

    console.log(`✅ Generated Wise OAuth URL for user: ${userId}`);

    res.json({
      success: true,
      authUrl,
      message: 'Redirect user to authUrl to authorize Wise access'
    });

  } catch (error: any) {
    console.error('Wise authorize error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to initiate OAuth flow' 
    });
  }
});

/**
 * GET /api/connectors/wise/callback
 * Handle OAuth callback from Wise
 */
router.get('/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Handle OAuth errors
    if (error) {
      console.error('Wise OAuth error:', error, error_description);
      return res.redirect(`/connectors?status=error&provider=wise&message=${encodeURIComponent(error_description as string || error as string)}`);
    }

    if (!code || !state) {
      return res.redirect('/connectors?status=error&provider=wise&message=Missing authorization code');
    }

    // Validate state token
    const stateData = stateTokens.get(state as string);
    if (!stateData) {
      console.error('Invalid OAuth state token');
      return res.redirect('/connectors?status=error&provider=wise&message=Invalid state token');
    }

    // Delete used state token
    stateTokens.delete(state as string);

    // Exchange code for tokens
    const callbackUri = `${process.env.CONNECTORS_URL || 'https://connectors.ai2fin.com'}/api/connectors/wise/callback`;
    
    const tokens = await wiseConnector.exchangeCodeForToken(code as string, callbackUri);

    console.log(`✅ Wise OAuth successful for user: ${stateData.userId}`);

    // TODO: Store tokens securely in database
    // For now, redirect with success
    // In production: Create connection record with encrypted tokens

    // Get account count for display
    try {
      const connection = await wiseConnector.connect(
        stateData.userId,
        { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
      );
      const accountCount = connection.accounts.length;
      
      res.redirect(`/connectors?status=success&provider=wise&accounts=${accountCount}`);
    } catch (connErr) {
      console.error('Failed to fetch Wise accounts after OAuth:', connErr);
      res.redirect('/connectors?status=success&provider=wise');
    }

  } catch (error: any) {
    console.error('Wise callback error:', error);
    res.redirect(`/connectors?status=error&provider=wise&message=${encodeURIComponent(error.message || 'Callback failed')}`);
  }
});

/**
 * GET /api/connectors/wise/accounts
 * Get Wise accounts for authenticated user
 */
router.get('/accounts', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // TODO: Get stored access token from database
    const accessToken = req.headers['x-wise-token'] as string;
    if (!accessToken) {
      return res.status(400).json({ success: false, error: 'Access token required' });
    }

    const accounts = await wiseConnector.getAccounts('', { accessToken });

    res.json({ success: true, accounts });

  } catch (error: any) {
    console.error('Wise accounts error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch accounts' });
  }
});

/**
 * GET /api/connectors/wise/transactions
 * Get Wise transactions for authenticated user
 */
router.get('/transactions', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { accountId, fromDate, toDate, limit = '100' } = req.query;
    
    // TODO: Get stored access token from database
    const accessToken = req.headers['x-wise-token'] as string;
    if (!accessToken) {
      return res.status(400).json({ success: false, error: 'Access token required' });
    }

    if (!accountId) {
      return res.status(400).json({ success: false, error: 'accountId is required' });
    }

    const filter = {
      dateFrom: fromDate ? new Date(fromDate as string) : undefined,
      dateTo: toDate ? new Date(toDate as string) : undefined,
      limit: parseInt(limit as string, 10)
    };

    const transactions = await wiseConnector.getTransactions(
      '',
      accountId as string,
      { accessToken },
      filter
    );

    res.json({ success: true, transactions, count: transactions.length });

  } catch (error: any) {
    console.error('Wise transactions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

/**
 * POST /api/connectors/wise/webhook
 * Handle Wise webhook notifications
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-signature-sha256'] as string;
    const rawBody = req.body.toString();

    // Verify webhook signature (if secret is configured)
    const webhookSecret = process.env.WISE_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.warn('Invalid Wise webhook signature');
        return res.status(401).json({ success: false, error: 'Invalid signature' });
      }
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event_type;

    console.log(`📨 Wise webhook received: ${eventType}`);

    // Handle different event types
    switch (eventType) {
      case 'transfers#state-change':
        console.log('Transfer state changed:', payload.data);
        // TODO: Update transaction status
        break;

      case 'balances#credit':
        console.log('Balance credited:', payload.data);
        // TODO: Process incoming payment
        break;

      case 'balances#update':
        console.log('Balance updated:', payload.data);
        // TODO: Sync balance
        break;

      default:
        console.log('Unhandled Wise webhook event:', eventType);
    }

    res.json({ success: true });

  } catch (error: any) {
    console.error('Wise webhook error:', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

export default router;
