// --- 📦 CONNECTOR API ROUTES ---
// embracingearth.space - RESTful API endpoints for connector management
// Matches core app expectations for bank feed integration

import express, { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { connectorRegistry } from '../core/ConnectorRegistry';
import { credentialManager } from '../core/CredentialManager';
import {
  ConnectorCredentials,
  ConnectorSettings,
  TransactionFilter,
  ConnectorError,
  ConnectorErrorCode
} from '../types/connector';

const router = express.Router();

/**
 * Connection storage (in-memory for now)
 * TODO: In production, use database for connection persistence
 * Architecture: This stores connection metadata, actual credentials are in CredentialManager
 */
interface StoredConnection {
  id: string;
  connectorId: string;
  userId: string;
  status: string;
  accounts: any[];
  lastSync?: string;
  lastError?: string;
  settings: ConnectorSettings;
  createdAt: string;
  updatedAt: string;
}

const connections: Map<string, StoredConnection> = new Map();

/**
 * Get connection by ID (exported for webhook processor)
 * Architecture: Allows webhook processor to find connections
 */
export function getConnectionById(connectionId: string): StoredConnection | undefined {
  return connections.get(connectionId);
}

/**
 * Get connections by user ID (exported for webhook processor)
 * Architecture: Allows webhook processor to find user connections
 */
export function getConnectionsByUserId(userId: string): StoredConnection[] {
  return Array.from(connections.values()).filter(conn => conn.userId === userId);
}

// Helper to generate connection ID
function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if connector has required environment variables set
 */
function checkConnectorAvailability(connectorId: string): boolean {
  // Map connector IDs to required environment variables
  const connectorEnvRequirements: Record<string, string[]> = {
    'basiq': ['BASIQ_API_KEY'],
    'xero': ['XERO_CLIENT_ID', 'XERO_CLIENT_SECRET'],
    'apideck': ['APIDECK_API_KEY', 'APIDECK_APP_ID'],
    'example-bank-api': [], // Example connector, no real env vars needed
    'sms-upi-indian': [] // SMS UPI can work without env vars
  };

  const requiredVars = connectorEnvRequirements[connectorId] || [];
  
  // Check if all required environment variables are set
  return requiredVars.every(varName => {
    const value = process.env[varName];
    return value && value.trim().length > 0 && !value.toLowerCase().includes('your_') && !value.toLowerCase().includes('example');
  });
}

/**
 * GET /api/connectors/providers
 * List all available connector providers with availability status
 * Matches core app expectation: GET /api/bank-feed/providers
 * Only returns connectors that have required environment variables set
 */
router.get('/providers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allMetadata = connectorRegistry.getAllMetadata();
    
    // Filter and map providers with availability status
    const providers = allMetadata
      .map(meta => {
        const isAvailable = checkConnectorAvailability(meta.id);
        return {
          id: meta.id,
          name: meta.name,
          type: meta.type,
          description: meta.description,
          version: meta.version,
          capabilities: meta.capabilities,
          credentialFields: meta.credentialFields,
          available: isAvailable, // Whether env vars are configured
          documentationUrl: meta.documentationUrl,
          author: meta.author
        };
      })
      .filter(provider => provider.available); // Only show available connectors
    
    res.json({ providers });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/connectors/bank/connections
 * Get all connections for authenticated user
 * Matches core app expectation: GET /api/bank-feed/connections
 */
router.get('/bank/connections', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    // Filter connections by user
    const userConnections = Array.from(connections.values())
      .filter(conn => conn.userId === userId);
    
    // Remove sensitive data from response
    const safeConnections = userConnections.map(conn => ({
      id: conn.id,
      connectorId: conn.connectorId,
      status: conn.status,
      accounts: conn.accounts,
      lastSync: conn.lastSync,
      lastError: conn.lastError,
      settings: conn.settings,
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt
    }));
    
    res.json({ connections: safeConnections });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/connectors/bank/connections
 * Create new bank connection
 * Matches core app expectation: POST /api/bank-feed/connections
 */
router.post('/bank/connections', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    
    // Check if connector exists
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
    
    // Validate credentials structure
    try {
      credentialManager.validateCredentials(
        credentials,
        metadata.credentialFields.filter(f => f.required).map(f => f.name)
      );
    } catch (error: any) {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
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
    
    // Create connection
    const connectionId = generateConnectionId();
    const connectionSettings: ConnectorSettings = {
      autoSync: true,
      syncInterval: 60,
      enableNotifications: true,
      categorizeTransactions: true,
      ...settings
    };
    
    try {
      const connection = await connector.connect(userId, credentials, connectionSettings);
      
      // Store credentials securely
      await credentialManager.storeCredentials(connectionId, userId, credentials);
      
      // Store connection metadata
      const storedConnection: StoredConnection = {
        id: connectionId,
        connectorId: provider,
        userId,
        status: connection.status,
        accounts: connection.accounts,
        lastSync: connection.lastSync ? new Date(connection.lastSync).toISOString() : undefined,
        lastError: connection.lastError,
        settings: connectionSettings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      connections.set(connectionId, storedConnection);
      
      // Remove sensitive data from response
      const safeConnection = {
        id: storedConnection.id,
        connectorId: storedConnection.connectorId,
        status: storedConnection.status,
        accounts: storedConnection.accounts,
        lastSync: storedConnection.lastSync,
        settings: storedConnection.settings,
        createdAt: storedConnection.createdAt
      };
      
      res.status(201).json({
        success: true,
        connection: safeConnection,
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

/**
 * POST /api/connectors/bank/connections/:id/sync
 * Sync transactions for a connection
 * Matches core app expectation: POST /api/bank-feed/connections/:id/sync
 */
router.post('/bank/connections/:id/sync', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const connectionId = req.params.id;
    const storedConnection = connections.get(connectionId);
    
    if (!storedConnection || storedConnection.userId !== userId) {
      return res.status(404).json({ 
        success: false, 
        error: 'Connection not found' 
      });
    }
    
    // Get connector
    const connector = connectorRegistry.getConnector(storedConnection.connectorId);
    
    // Get credentials
    const credentials = await credentialManager.getCredentials(connectionId, userId);
    
    // Get filter from query params
    const filter: TransactionFilter = {};
    if (req.query.dateFrom) {
      filter.dateFrom = new Date(req.query.dateFrom as string);
    }
    if (req.query.dateTo) {
      filter.dateTo = new Date(req.query.dateTo as string);
    }
    if (req.query.accountIds) {
      filter.accountIds = (req.query.accountIds as string).split(',');
    }
    
    // Sync transactions
    try {
      const syncResult = await connector.sync(connectionId, credentials, filter);
      
      // Update connection lastSync
      storedConnection.lastSync = new Date().toISOString();
      storedConnection.lastError = undefined;
      storedConnection.updatedAt = new Date().toISOString();
      connections.set(connectionId, storedConnection);
      
      res.json({
        success: true,
        sync: syncResult,
        message: 'Sync completed successfully'
      });
    } catch (error: any) {
      // Update connection with error
      storedConnection.lastError = error.message;
      storedConnection.status = 'error';
      storedConnection.updatedAt = new Date().toISOString();
      connections.set(connectionId, storedConnection);
      
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

/**
 * GET /api/connectors/bank/connections/:id/accounts/:accountId/transactions
 * Get transactions for a specific account
 * Matches core app expectation: GET /api/bank-feed/connections/:id/accounts/:accountId/transactions
 */
router.get('/bank/connections/:id/accounts/:accountId/transactions', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const connectionId = req.params.id;
    const accountId = req.params.accountId;
    
    const storedConnection = connections.get(connectionId);
    
    if (!storedConnection || storedConnection.userId !== userId) {
      return res.status(404).json({ 
        success: false, 
        error: 'Connection not found' 
      });
    }
    
    // Get connector
    const connector = connectorRegistry.getConnector(storedConnection.connectorId);
    
    // Get credentials
    const credentials = await credentialManager.getCredentials(connectionId, userId);
    
    // Build filter from query params
    const filter: TransactionFilter = {};
    if (req.query.dateFrom) {
      filter.dateFrom = new Date(req.query.dateFrom as string);
    }
    if (req.query.dateTo) {
      filter.dateTo = new Date(req.query.dateTo as string);
    }
    if (req.query.amountMin) {
      filter.amountMin = parseFloat(req.query.amountMin as string);
    }
    if (req.query.amountMax) {
      filter.amountMax = parseFloat(req.query.amountMax as string);
    }
    if (req.query.limit) {
      // Note: limit is handled by connector
      filter.limit = parseInt(req.query.limit as string, 10);
    }
    
    // Get transactions
    try {
      const transactions = await connector.getTransactions(
        connectionId,
        accountId,
        credentials,
        filter
      );
      
      res.json({
        success: true,
        transactions,
        count: transactions.length
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

/**
 * DELETE /api/connectors/bank/connections/:id
 * Disconnect and delete a connection
 * Matches core app expectation: DELETE /api/bank-feed/connections/:id
 */
router.delete('/bank/connections/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const connectionId = req.params.id;
    const storedConnection = connections.get(connectionId);
    
    if (!storedConnection || storedConnection.userId !== userId) {
      return res.status(404).json({ 
        success: false, 
        error: 'Connection not found' 
      });
    }
    
    // Get connector
    const connector = connectorRegistry.getConnector(storedConnection.connectorId);
    
    // Get credentials for disconnection
    const credentials = await credentialManager.getCredentials(connectionId, userId);
    
    // Disconnect
    try {
      await connector.disconnect(connectionId, credentials);
    } catch (error: any) {
      // Log but continue with deletion
      console.error(`Error disconnecting connector: ${error.message}`);
    }
    
    // Delete credentials
    await credentialManager.deleteCredentials(connectionId, userId);
    
    // Delete connection
    connections.delete(connectionId);
    
    res.json({
      success: true,
      message: 'Connection deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Export Apideck routes separately (will be mounted in server.ts)
export { default as apideckRouter } from './apideck';

export default router;


