// --- 📦 APIDECK VAULT ROUTES ---
// embracingearth.space - Routes for Apideck Vault OAuth flow and webhook handling
// Architecture: Handles OAuth session creation, callbacks, and webhook notifications

import express, { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { apideckVaultService } from '../services/ApideckVaultService';
import { connectorRegistry } from '../core/ConnectorRegistry';
import { secureCredentialManager } from '../core/SecureCredentialManager';
import { ConnectorCredentials } from '../types/connector';
import { webhookProcessor } from '../services/WebhookProcessor';

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
    // Construct user name from firstName/lastName or fallback to email
    const userName = req.user?.firstName && req.user?.lastName
      ? `${req.user.firstName} ${req.user.lastName}`
      : req.user?.firstName || req.user?.email || 'User';
    
    const session = await apideckVaultService.createSession({
      consumerId,
      redirectUri: finalRedirectUri,
      consumerMetadata: consumerMetadata || {
        account_name: req.user?.email || 'User',
        user_name: userName
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

      // Store credentials securely using SecureCredentialManager
      await secureCredentialManager.createConnection(
        userId,
        connectorConnection.connectorId || 'apideck',
        connectorConnection.connectorType || 'accounting',
        credentials,
        {
          accounts: connectorConnection.accounts || [],
          settings: { autoSync: true, syncInterval: 60 },
        },
        { userId, connectorId: 'apideck' }
      );

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
router.post('/webhook', express.raw({ type: 'application/json', limit: '1mb' }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Security: Validate request size
    if (req.body && req.body.length > 1024 * 1024) { // 1MB limit
      return res.status(413).json({ success: false, error: 'Payload too large' });
    }

    // Get raw body for signature verification
    const rawBody = typeof req.body === 'string' ? req.body : req.body.toString();
    
    // Parse payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Invalid JSON in Apideck webhook:', parseError);
      return res.status(400).json({ success: false, error: 'Invalid JSON payload' });
    }

    // Security: Validate payload structure
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid payload format' });
    }

    // Verify webhook signature if Apideck provides it
    const signature = req.headers['x-apideck-signature'] as string;
    const webhookSecret = process.env.APIDECK_WEBHOOK_SECRET || '';

    // Security: Require webhook secret in production
    if (process.env.NODE_ENV === 'production' && !webhookSecret) {
      console.error('⚠️ APIDECK_WEBHOOK_SECRET not configured in production');
      return res.status(500).json({ success: false, error: 'Webhook not configured' });
    }
    
    if (webhookSecret) {
      if (!signature) {
        console.warn('⚠️ Missing Apideck webhook signature');
        return res.status(401).json({ success: false, error: 'Missing webhook signature' });
      }

      const isValid = apideckVaultService.verifyWebhookSignature(rawBody, signature, webhookSecret);
      
      if (!isValid) {
        console.warn('⚠️ Invalid Apideck webhook signature', {
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
        return res.status(401).json({ success: false, error: 'Invalid webhook signature' });
      }
    } else if (process.env.NODE_ENV === 'production') {
      // In production, signature is required
      return res.status(401).json({ success: false, error: 'Webhook signature required' });
    }

    const { event_type, data } = payload;

    // Security: Validate required fields
    if (!event_type || !data) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Handle different webhook event types
    switch (event_type) {
      case 'vault.connection.created':
      case 'vault.connection.updated':
        // Connection was created or updated
        console.log('Apideck connection updated:', data);
        if (data.connection_id && data.consumer_id) {
          try {
            // Find connection by Apideck connection ID
            const connections = await secureCredentialManager.getUserConnections(data.consumer_id);
            const connection = connections.find(c => 
              c.metadata && (c.metadata as any).apideckConnectionId === data.connection_id
            );
            if (connection) {
              await secureCredentialManager.updateConnectionStatus(
                connection.id,
                data.consumer_id,
                'connected'
              );
            }
          } catch (err) {
            console.error('Failed to update Apideck connection status:', err);
          }
        }
        break;

      case 'vault.connection.deleted':
        // Connection was deleted
        console.log('Apideck connection deleted:', data);
        if (data.connection_id && data.consumer_id) {
          try {
            const connections = await secureCredentialManager.getUserConnections(data.consumer_id);
            const connection = connections.find(c => 
              c.metadata && (c.metadata as any).apideckConnectionId === data.connection_id
            );
            if (connection) {
              await secureCredentialManager.deleteConnection(
                connection.id,
                data.consumer_id,
                { userId: data.consumer_id, connectorId: 'apideck' }
              );
            }
          } catch (err) {
            console.error('Failed to delete Apideck connection:', err);
          }
        }
        break;

      case 'vault.connection.callable':
        // Connection is now callable (ready to use)
        console.log('Apideck connection is callable:', data);
        if (data.connection_id && data.consumer_id) {
          try {
            const connections = await secureCredentialManager.getUserConnections(data.consumer_id);
            const connection = connections.find(c => 
              c.metadata && (c.metadata as any).apideckConnectionId === data.connection_id
            );
            if (connection) {
              await secureCredentialManager.updateConnectionStatus(
                connection.id,
                data.consumer_id,
                'connected'
              );
            }
          } catch (err) {
            console.error('Failed to update Apideck connection status:', err);
          }
        }
        break;

      case 'vault.connection.invalid_credentials':
        // Connection credentials are invalid
        console.log('Apideck connection invalid credentials:', data);
        if (data.connection_id && data.consumer_id) {
          try {
            const connections = await secureCredentialManager.getUserConnections(data.consumer_id);
            const connection = connections.find(c => 
              c.metadata && (c.metadata as any).apideckConnectionId === data.connection_id
            );
            if (connection) {
              await secureCredentialManager.updateConnectionStatus(
                connection.id,
                data.consumer_id,
                'error',
                'Invalid credentials - reconnect required'
              );
            }
          } catch (err) {
            console.error('Failed to update Apideck connection error status:', err);
          }
        }
        break;

      case 'accounting.transaction.created':
      case 'accounting.transaction.updated':
        // Real-time transaction event
        console.log(`📨 Apideck transaction webhook: ${event_type}`);
        
        try {
          const result = await webhookProcessor.processWebhook({
            eventType: event_type,
            connectorId: 'apideck',
            data: {
              transaction: data.transaction || data,
              account: data.account,
              connectionId: data.connectionId || data.connection?.id
            },
            userId: data.consumerId || data.userId,
            connectionId: data.connectionId || data.connection?.id,
            timestamp: new Date().toISOString()
          });

          if (result.success && result.transaction) {
            console.log(`✅ Processed Apideck transaction: ${result.transaction.transactionId}`);
          } else {
            console.warn('⚠️ Failed to process Apideck transaction webhook');
          }
        } catch (error: any) {
          console.error('Error processing Apideck transaction webhook:', error);
        }
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

    // Delete from secure credential manager
    await secureCredentialManager.deleteConnection(
      connectionId,
      userId,
      { userId, connectorId: 'apideck' }
    );

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

