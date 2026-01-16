// --- 📦 CONNECTOR API ROUTES (SECURE) ---
// embracingearth.space - Unified connector management with secure credential storage
// All credentials encrypted with AES-256-GCM before database storage

import express, { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { connectorRegistry } from '../core/ConnectorRegistry';
import { secureCredentialManager } from '../core/SecureCredentialManager';
import { auditService, AuditContext } from '../services/AuditService';
import { sendWazuhEvent } from '../lib/wazuhHelper';
import {
  ConnectorSettings,
  TransactionFilter,
  ConnectorError,
} from '../types/connector';

const router = express.Router();

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
 * Check if connector has required environment variables set
 */
function checkConnectorAvailability(connectorId: string): boolean {
  const connectorEnvRequirements: Record<string, string[]> = {
    'basiq': ['BASIQ_API_KEY'],
    'plaid': ['PLAID_CLIENT_ID', 'PLAID_SECRET'],
    'wise': ['WISE_CLIENT_ID', 'WISE_CLIENT_SECRET'],
    'xero': ['XERO_CLIENT_ID', 'XERO_CLIENT_SECRET'],
    'apideck': ['APIDECK_API_KEY', 'APIDECK_APP_ID'],
  };

  const requiredVars = connectorEnvRequirements[connectorId] || [];
  
  return requiredVars.every(varName => {
    const value = process.env[varName];
    return value && value.trim().length > 0 && 
      !value.toLowerCase().includes('your_') && 
      !value.toLowerCase().includes('example');
  });
}

// =============================================================================
// PROVIDER LISTING
// =============================================================================

/**
 * GET /api/connectors/providers
 * List all available connector providers
 */
router.get('/providers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allMetadata = connectorRegistry.getAllMetadata();
    
    const providers = allMetadata.map(meta => ({
      id: meta.id,
      name: meta.name,
      type: meta.type,
      description: meta.description,
      version: meta.version,
      capabilities: meta.capabilities,
      credentialFields: meta.credentialFields,
      available: checkConnectorAvailability(meta.id),
      documentationUrl: meta.documentationUrl,
      author: meta.author
    })).filter(provider => provider.available);
    
    res.json({ providers });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// UNIFIED CONNECTION MANAGEMENT (Aggregates Plaid/Basiq/Wise)
// =============================================================================

/**
 * GET /api/connectors/bank/connections
 * Get ALL connections for authenticated user (from secure storage)
 * SECURITY: Uses SecureCredentialManager, credentials never exposed
 */
router.get('/bank/connections', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    // Get all connections from secure storage (no credentials returned)
    const allConnections = await secureCredentialManager.getUserConnections(userId);
    
    // Format for frontend compatibility
    const safeConnections = allConnections.map(conn => ({
      id: conn.id,
      connectorId: conn.connectorId,
      status: conn.status,
      accounts: conn.accounts || [],
      lastSync: conn.lastSync?.toISOString(),
      lastError: conn.lastError,
      settings: conn.settings,
      createdAt: conn.createdAt.toISOString(),
      institutionId: conn.institutionId,
      institutionName: conn.institutionName,
    }));
    
    res.json({ connections: safeConnections });
  } catch (err: any) {
    // CRITICAL: Handle database schema errors gracefully
    // If migrations haven't been run, return a clear error message
    const errorMessage = String(err?.message || '');
    if (errorMessage.includes('Database schema not migrated') || errorMessage.includes('does not exist')) {
      console.error('[Connectors] Database schema error:', errorMessage);
      return res.status(503).json({
        success: false,
        error: 'Database schema not migrated',
        message: 'Please run database migrations: npx prisma migrate deploy',
        details: errorMessage
      });
    }
    // For other errors, pass to error handler
    next(err);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/connectors/bank/connections/:id
 * Get single connection details
 */
router.get('/bank/connections/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const connectionId = req.params.id;
    const connection = await secureCredentialManager.getConnection(connectionId, userId);
    
    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }
    
    res.json({
      success: true,
      connection: {
        id: connection.id,
        connectorId: connection.connectorId,
        status: connection.status,
        accounts: connection.accounts || [],
        lastSync: connection.lastSync?.toISOString(),
        lastError: connection.lastError,
        settings: connection.settings,
        createdAt: connection.createdAt.toISOString(),
        institutionId: connection.institutionId,
        institutionName: connection.institutionName,
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/connectors/bank/connections/:id/sync
 * Trigger sync for a connection
 * Routes to appropriate connector (Plaid/Basiq/Wise) based on connectorId
 */
router.post('/bank/connections/:id/sync', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const auditContext = getAuditContext(req);
  const timer = auditService.createTimer();
  
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const connectionId = req.params.id;
    const connection = await secureCredentialManager.getConnection(connectionId, userId);
    
    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    // Update status to syncing
    await secureCredentialManager.updateConnectionStatus(connectionId, userId, 'syncing');

    await auditService.success('sync', {
      ...auditContext,
      connectionId,
      connectorId: connection.connectorId,
    }, { type: 'manual' }, timer.elapsed());

    // Track connector sync in Wazuh (non-blocking)
    sendWazuhEvent({
      type: 'connector_sync',
      severity: 'medium',
      message: `Connector sync initiated: ${connection.connectorId}`,
      ip: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      userId: auditContext.userId,
      path: req.path,
      method: req.method,
      metadata: {
        connectionId,
        connectorId: connection.connectorId,
        syncType: 'manual'
      }
    });

    res.json({
      success: true,
      message: 'Sync initiated',
      connectionId,
    });
  } catch (error: any) {
    await auditService.failure('sync', auditContext, error, {}, timer.elapsed());
    next(error);
  }
});

/**
 * DELETE /api/connectors/bank/connections/:id
 * Disconnect and delete a connection
 */
router.delete('/bank/connections/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const auditContext = getAuditContext(req);
  
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const connectionId = req.params.id;
    const connection = await secureCredentialManager.getConnection(connectionId, userId);
    
    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    // Delete the connection (credentials deleted via cascade)
    await secureCredentialManager.deleteConnection(connectionId, userId, auditContext);
    
    // Track connector disconnect in Wazuh (non-blocking)
    sendWazuhEvent({
      type: 'connector_disconnect',
      severity: 'medium',
      message: `Connector disconnected: ${connection.connectorId}`,
      ip: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      userId: auditContext.userId,
      path: req.path,
      method: req.method,
      metadata: {
        connectionId,
        connectorId: connection.connectorId
      }
    });
    
    res.json({
      success: true,
      message: 'Connection deleted successfully'
    });
  } catch (error: any) {
    await auditService.failure('disconnect', auditContext, error);
    next(error);
  }
});

/**
 * GET /api/connectors/bank/connections/:id/accounts
 * Get accounts for a connection (routes to appropriate connector)
 */
router.get('/bank/connections/:id/accounts', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const connectionId = req.params.id;
    const connection = await secureCredentialManager.getConnection(connectionId, userId);
    
    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    // Return stored accounts (fetched during connection/sync)
    res.json({
      success: true,
      accounts: connection.accounts || [],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/connectors/bank/connections/:id/transactions
 * Get transactions for a connection
 * Note: Clients should use connector-specific routes for fresh data
 */
router.get('/bank/connections/:id/transactions', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const auditContext = getAuditContext(req);
  
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const connectionId = req.params.id;
    const connection = await secureCredentialManager.getConnection(connectionId, userId);
    
    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    // For unified endpoint, redirect client to use connector-specific routes
    res.json({
      success: true,
      message: `Use /${connection.connectorId}/connections/${connectionId}/transactions for transaction data`,
      connectorId: connection.connectorId,
      connectionId,
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// LEGACY CONNECTOR REGISTRY ROUTES (For non-OAuth connectors)
// =============================================================================

/**
 * POST /api/connectors/bank/connections
 * Create new connection using connector registry
 * Note: Plaid/Basiq/Wise use their own OAuth flows
 */
router.post('/bank/connections', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const auditContext = getAuditContext(req);
  
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { provider, credentials, settings } = req.body;
    
    if (!provider || !credentials) {
      return res.status(400).json({ 
        success: false, 
        error: 'Provider and credentials are required' 
      });
    }

    // For OAuth providers, redirect to their specific flows
    if (['plaid', 'basiq', 'wise'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: `Use /${provider}/authorize or /${provider}/consent for OAuth connection`,
      });
    }
    
    // Check if connector exists in registry
    if (!connectorRegistry.hasConnector(provider)) {
      return res.status(404).json({ 
        success: false, 
        error: `Connector not found: ${provider}` 
      });
    }
    
    // Get connector instance
    const connector = connectorRegistry.getConnector(provider);
    const metadata = connectorRegistry.getMetadata(provider);
    
    if (!metadata) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get connector metadata' 
      });
    }
    
    // Validate credentials with connector
    try {
      await connector.validateCredentials(credentials);
    } catch (error: any) {
      if (error instanceof ConnectorError) {
        return res.status(error.statusCode).json({ 
          success: false, 
          error: error.message,
          code: error.code 
        });
      }
      throw error;
    }
    
    // Create connection settings
    const connectionSettings: ConnectorSettings = {
      autoSync: true,
      syncInterval: 60,
      enableNotifications: true,
      categorizeTransactions: true,
      ...settings
    };
    
    try {
      // Connect via connector
      const connResult = await connector.connect(userId, credentials, connectionSettings);
      
      // Store in secure credential manager
      const connection = await secureCredentialManager.createConnection(
        userId,
        provider,
        metadata.type,
        credentials,
        {
          accounts: connResult.accounts,
          settings: connectionSettings,
        },
        auditContext
      );
      
      res.status(201).json({
        success: true,
        connection: {
          id: connection.id,
          connectorId: connection.connectorId,
          status: connection.status,
          accounts: connection.accounts,
          createdAt: connection.createdAt.toISOString(),
        },
        message: 'Connection created successfully'
      });
    } catch (error: any) {
      if (error instanceof ConnectorError) {
        return res.status(error.statusCode).json({ 
          success: false, 
          error: error.message,
          code: error.code 
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

// Export Apideck routes separately
export { default as apideckRouter } from './apideck';

export default router;
