// --- 📦 BASIQ WEBHOOK ROUTES ---
// embracingearth.space - Basiq webhook endpoints for real-time transaction updates
// Architecture: Handles Basiq webhook events and processes transactions in real-time

import express, { Request, Response, NextFunction } from 'express';
import { webhookProcessor } from '../services/WebhookProcessor';
import crypto from 'crypto';

const router = express.Router();

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

