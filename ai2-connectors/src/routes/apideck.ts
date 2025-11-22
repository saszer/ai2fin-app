// --- 📦 APIDECK VAULT ROUTES ---
// embracingearth.space - Routes for Apideck Vault OAuth flow and webhook handling
// Architecture: Handles OAuth session creation, callbacks, and webhook notifications

import express, { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { apideckVaultService } from '../services/ApideckVaultService';
import { connectorRegistry } from '../core/ConnectorRegistry';
import { credentialManager } from '../core/CredentialManager';
import { ConnectorCredentials } from '../types/connector';

const router = express.Router();

/**
 * POST /api/connectors/apideck/vault/session
 * Create a Vault session for OAuth flow
 * Architecture: Returns Vault URL that frontend redirects user to
 */
router.post('/vault/session', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { serviceId, redirectUri, consumerMetadata, theme } = req.body;

    if (!serviceId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Service ID is required (e.g., quickbooks, xero, netsuite)' 
      });
    }

    // Use user ID as consumer ID (Apideck consumer concept)
    const consumerId = userId;

    // Build redirect URI if not provided
    const finalRedirectUri = redirectUri || 
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/connectors/apideck/callback`;

    // Create Vault session
    const session = await apideckVaultService.createSession({
      consumerId,
      redirectUri: finalRedirectUri,
      consumerMetadata: consumerMetadata || {
        account_name: req.user?.email || 'User',
        user_name: req.user?.name || 'User'
      },
      theme: theme || {
        vault_name: 'AI2 Financial',
        primary_color: '#286efa',
        sidepanel_text_color: '#FFFFFF'
      }
    });

    // Get Vault URL for redirect
    const vaultUrl = apideckVaultService.getVaultUrl(session.session_token);

    res.json({
      success: true,
      session: {
        sessionId: session.session_id,
        sessionToken: session.session_token,
        vaultUrl,
        consumerId: session.consumer.id
      },
      message: 'Vault session created successfully'
    });
  } catch (error: any) {
    console.error('Error creating Vault session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create Vault session'
    });
  }
});

/**
 * GET /api/connectors/apideck/vault/callback
 * Handle OAuth callback from Apideck Vault
 * Architecture: Called after user authorizes connection in Vault
 */
router.get('/vault/callback', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { session_id, state, service_id } = req.query;

    if (!session_id || !service_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Session ID and Service ID are required' 
      });
    }

    // Get connection from Vault
    const connection = await apideckVaultService.getConnection(userId, service_id as string);

    if (!connection) {
      return res.status(404).json({ 
        success: false, 
        error: 'Connection not found. Please try connecting again.' 
      });
    }

    // Check connection state
    if (connection.state !== 'callable' && connection.state !== 'authorized') {
      return res.status(400).json({ 
        success: false, 
        error: `Connection is not ready. State: ${connection.state}` 
      });
    }

    // Store connection credentials
    const credentials: ConnectorCredentials = {
      serviceId: service_id as string,
      consumerId: userId,
      connectionId: connection.id
    };

    // Get connector
    const connector = connectorRegistry.getConnector('apideck');
    if (!connector) {
      return res.status(500).json({ 
        success: false, 
        error: 'Apideck connector not found' 
      });
    }

    // Validate and connect
    try {
      const connectorConnection = await connector.connect(userId, credentials, {
        autoSync: true,
        syncInterval: 60
      });

      // Store credentials securely
      await credentialManager.storeCredentials(connectorConnection.id, userId, credentials);

      // Redirect to frontend success page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/connectors?connected=apideck&connectionId=${connectorConnection.id}`);
    } catch (error: any) {
      console.error('Error connecting Apideck:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/connectors?error=${encodeURIComponent(error.message)}`);
    }
  } catch (error: any) {
    console.error('Error in Vault callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/connectors?error=${encodeURIComponent(error.message || 'Connection failed')}`);
  }
});

/**
 * POST /api/connectors/apideck/webhook
 * Handle webhook notifications from Apideck
 * Architecture: Receives real-time updates about connection status changes
 * Note: This endpoint should be publicly accessible (no auth) but verify webhook signature
 */
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify webhook signature if Apideck provides it
    const signature = req.headers['x-apideck-signature'] as string;
    const webhookSecret = process.env.APIDECK_WEBHOOK_SECRET || '';
    
    if (webhookSecret && signature) {
      const payload = JSON.stringify(req.body);
      const isValid = apideckVaultService.verifyWebhookSignature(payload, signature, webhookSecret);
      
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid webhook signature' });
      }
    }

    const { event_type, data } = req.body;

    // Handle different webhook event types
    switch (event_type) {
      case 'vault.connection.created':
      case 'vault.connection.updated':
        // Connection was created or updated
        console.log('Apideck connection updated:', data);
        // TODO: Update connection status in database
        break;

      case 'vault.connection.deleted':
        // Connection was deleted
        console.log('Apideck connection deleted:', data);
        // TODO: Mark connection as disconnected in database
        break;

      case 'vault.connection.callable':
        // Connection is now callable (ready to use)
        console.log('Apideck connection is callable:', data);
        // TODO: Update connection status to 'connected'
        break;

      case 'vault.connection.invalid_credentials':
        // Connection credentials are invalid
        console.log('Apideck connection invalid credentials:', data);
        // TODO: Mark connection as error, notify user
        break;

      default:
        console.log('Unhandled Apideck webhook event:', event_type, data);
    }

    res.json({ success: true, message: 'Webhook received' });
  } catch (error: any) {
    console.error('Error processing Apideck webhook:', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

/**
 * GET /api/connectors/apideck/connections
 * Get all Apideck connections for authenticated user
 * Architecture: Lists all connected accounting platforms via Apideck
 */
router.get('/connections', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const connections = await apideckVaultService.getConnections(userId);

    res.json({
      success: true,
      connections: connections.map(conn => ({
        id: conn.id,
        serviceId: conn.service_id,
        state: conn.state,
        settings: conn.settings,
        metadata: conn.metadata,
        createdAt: conn.created_at,
        updatedAt: conn.updated_at
      }))
    });
  } catch (error: any) {
    console.error('Error fetching Apideck connections:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch connections'
    });
  }
});

/**
 * DELETE /api/connectors/apideck/connections/:connectionId
 * Delete an Apideck connection
 * Architecture: Revokes OAuth connection and removes from Vault
 */
router.delete('/connections/:connectionId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { connectionId } = req.params;

    await apideckVaultService.deleteConnection(userId, connectionId);

    // Also delete from credential manager
    await credentialManager.deleteCredentials(connectionId, userId);

    res.json({
      success: true,
      message: 'Connection deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting Apideck connection:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete connection'
    });
  }
});

export default router;

