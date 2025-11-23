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
 */
function verifyBasiqSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    // Basiq sends signature in format: sha256=<hash>
    const signatureHash = signature.replace('sha256=', '');
    
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signatureHash)
    );
  } catch (error) {
    console.error('Signature verification error:', error);
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
    const signature = req.headers['x-basiq-signature'] as string;
    const webhookSecret = process.env.BASIQ_WEBHOOK_SECRET || '';

    // Security: Require webhook secret in production
    if (process.env.NODE_ENV === 'production' && !webhookSecret) {
      console.error('⚠️ BASIQ_WEBHOOK_SECRET not configured in production');
      return res.status(500).json({ success: false, error: 'Webhook not configured' });
    }

    // Verify webhook signature (required in production)
    if (webhookSecret) {
      if (!signature) {
        console.warn('⚠️ Missing Basiq webhook signature');
        return res.status(401).json({ success: false, error: 'Missing webhook signature' });
      }

      const isValid = verifyBasiqSignature(rawBody, signature, webhookSecret);
      
      if (!isValid) {
        console.warn('⚠️ Invalid Basiq webhook signature', {
          ip: req.ip,
          userAgent: req.headers['user-agent']
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

    const { event, data } = payload;

    // Security: Validate required fields
    if (!event || !data) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    console.log(`📨 Basiq webhook received: ${event}`);

    // Handle different webhook event types
    switch (event) {
      case 'transaction.created':
      case 'transaction.updated':
        // Process transaction webhook
        const result = await webhookProcessor.processWebhook({
          eventType: event,
          connectorId: 'basiq',
          data: {
            transaction: data.transaction,
            account: data.account,
            connectionId: data.connectionId || data.connection?.id
          },
          userId: data.userId,
          connectionId: data.connectionId || data.connection?.id,
          timestamp: new Date().toISOString()
        });

        if (result.success && result.transaction) {
          console.log(`✅ Processed Basiq transaction: ${result.transaction.transactionId}`);
        } else {
          console.warn('⚠️ Failed to process Basiq transaction webhook');
        }
        break;

      case 'connection.created':
      case 'connection.updated':
        console.log('Basiq connection updated:', data);
        // TODO: Update connection status in database
        break;

      case 'connection.deleted':
        console.log('Basiq connection deleted:', data);
        // TODO: Mark connection as disconnected
        break;

      case 'job.completed':
        // Job completed (e.g., account sync)
        console.log('Basiq job completed:', data);
        // TODO: Handle job completion
        break;

      default:
        console.log('Unhandled Basiq webhook event:', event, data);
    }

    res.json({ success: true, message: 'Webhook received' });
  } catch (error: any) {
    console.error('Error processing Basiq webhook:', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

export default router;

