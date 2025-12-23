// --- 📦 SECURE CREDENTIAL MANAGER ---
// embracingearth.space - Enterprise-grade credential storage with AES-256-GCM encryption
// All credentials encrypted before database write - NEVER stored plaintext

import * as crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { auditService, AuditContext } from '../services/AuditService';
import { ConnectorCredentials, ConnectorAccount, ConnectorSettings, ConnectionStatus } from '../types/connector';

const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY;
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

export interface SecureConnection {
  id: string;
  userId: string;
  connectorId: string;
  connectorType: string;
  status: ConnectionStatus;
  institutionId?: string;
  institutionName?: string;
  accounts: ConnectorAccount[];
  lastSync?: Date;
  lastError?: string;
  settings: ConnectorSettings;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>; // Connection-specific metadata
}

/**
 * Secure Credential Manager - Database-backed credential storage with encryption
 * 
 * Security Architecture:
 * - All credentials encrypted with AES-256-GCM before database write
 * - Encryption key from environment variable (never in code)
 * - Per-connection isolation (userId + connectorId + institutionId)
 * - Full audit trail for all credential operations
 * - No credentials in logs, responses, or memory longer than necessary
 * 
 * Compliance:
 * - SOC 2 Type II ready
 * - GDPR compliant (data minimization, right to erasure)
 * - PCI DSS compliant for credential storage
 */
class SecureCredentialManager {
  private static instance: SecureCredentialManager;
  private encryptionKey: Buffer | null = null;
  
  // Rate limiting for credential access (prevent brute force)
  private credentialAccessAttempts: Map<string, { count: number; resetAt: number }> = new Map();
  private readonly MAX_CREDENTIAL_ACCESS_PER_MINUTE = 30;

  private constructor() {
    this.validateEncryptionKey();
    
    // Cleanup stale rate limit entries every 5 minutes
    setInterval(() => this.cleanupRateLimits(), 5 * 60 * 1000);
  }
  
  /**
   * Check rate limit for credential access
   */
  private checkCredentialRateLimit(userId: string): boolean {
    const now = Date.now();
    const key = `cred:${userId}`;
    const entry = this.credentialAccessAttempts.get(key);
    
    if (!entry || now > entry.resetAt) {
      this.credentialAccessAttempts.set(key, { count: 1, resetAt: now + 60000 });
      return true;
    }
    
    if (entry.count >= this.MAX_CREDENTIAL_ACCESS_PER_MINUTE) {
      console.warn(`🚨 Rate limit exceeded for credential access: ${userId}`);
      return false;
    }
    
    entry.count++;
    return true;
  }
  
  private cleanupRateLimits(): void {
    const now = Date.now();
    for (const [key, entry] of this.credentialAccessAttempts.entries()) {
      if (now > entry.resetAt) {
        this.credentialAccessAttempts.delete(key);
      }
    }
  }

  static getInstance(): SecureCredentialManager {
    if (!SecureCredentialManager.instance) {
      SecureCredentialManager.instance = new SecureCredentialManager();
    }
    return SecureCredentialManager.instance;
  }

  /**
   * Validate encryption key on initialization
   */
  private validateEncryptionKey(): void {
    if (!ENCRYPTION_KEY) {
      console.error('❌ CRITICAL: CREDENTIAL_ENCRYPTION_KEY not set!');
      if (process.env.NODE_ENV === 'production') {
        throw new Error('CREDENTIAL_ENCRYPTION_KEY must be set in production');
      }
      console.warn('⚠️ Using insecure fallback key (development only)');
    } else if (ENCRYPTION_KEY.length < 32) {
      throw new Error('CREDENTIAL_ENCRYPTION_KEY must be at least 32 characters');
    }
  }

  /**
   * Get encryption key (derived from env var)
   */
  private getEncryptionKey(): Buffer {
    if (this.encryptionKey) return this.encryptionKey;
    
    const keySource = ENCRYPTION_KEY || (
      process.env.NODE_ENV !== 'production' 
        ? 'dev-only-insecure-key-do-not-use-in-prod' 
        : null
    );
    
    if (!keySource) {
      throw new Error('No encryption key available');
    }
    
    // Derive a proper 32-byte key using scrypt
    this.encryptionKey = crypto.scryptSync(keySource, 'ai2-connectors-salt-v1', 32);
    return this.encryptionKey;
  }

  /**
   * Encrypt credentials using AES-256-GCM
   */
  private encrypt(plaintext: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encryptedData (all hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt credentials
   */
  private decrypt(encryptedData: string): string {
    const key = this.getEncryptionKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // ==========================================================================
  // CONNECTION MANAGEMENT
  // ==========================================================================

  /**
   * Create a new connection with encrypted credentials
   */
  async createConnection(
    userId: string,
    connectorId: string,
    connectorType: string,
    credentials: ConnectorCredentials,
    options: {
      institutionId?: string;
      institutionName?: string;
      accounts?: ConnectorAccount[];
      settings?: ConnectorSettings;
      expiresAt?: Date;
    },
    auditContext: AuditContext
  ): Promise<SecureConnection> {
    const timer = auditService.createTimer();
    
    try {
      // Encrypt credentials
      const encryptedCredentials = this.encrypt(JSON.stringify(credentials));
      
      // Create connection in database
      const connection = await prisma.connectorConnection.create({
        data: {
          userId,
          connectorId,
          connectorType,
          status: 'connected',
          institutionId: options.institutionId,
          institutionName: options.institutionName,
          encryptedCredentials,
          accounts: options.accounts ? JSON.stringify(options.accounts) : null,
          settings: options.settings ? JSON.stringify(options.settings) : null,
          expiresAt: options.expiresAt,
        },
      });

      // Audit log (no credentials in log)
      await auditService.success('connect', {
        ...auditContext,
        connectionId: connection.id,
        connectorId,
      }, {
        institutionId: options.institutionId,
        institutionName: options.institutionName,
        accountCount: options.accounts?.length || 0,
      }, timer.elapsed());

      console.log(`✅ Connection created: ${connection.id} for user ${userId} (${connectorId})`);
      
      return this.toSecureConnection(connection);
    } catch (error: any) {
      await auditService.failure('connect', auditContext, error, {
        connectorId,
        institutionId: options.institutionId,
      }, timer.elapsed());
      throw error;
    }
  }

  /**
   * Get a connection by ID (credentials NOT included)
   * SECURITY: Validates connectionId format to prevent injection
   */
  async getConnection(connectionId: string, userId: string): Promise<SecureConnection | null> {
    // Validate connectionId format (cuid format: 25 alphanumeric chars)
    if (!connectionId || !/^[a-z0-9]{20,30}$/i.test(connectionId)) {
      console.warn('⚠️ Invalid connectionId format attempted:', { connectionId: connectionId?.substring(0, 10) });
      return null;
    }
    
    const connection = await prisma.connectorConnection.findFirst({
      where: { id: connectionId, userId },
    });
    
    if (!connection) return null;
    return this.toSecureConnection(connection);
  }

  /**
   * Get all connections for a user (credentials NOT included)
   */
  async getUserConnections(userId: string): Promise<SecureConnection[]> {
    const connections = await prisma.connectorConnection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    
    return connections.map(c => this.toSecureConnection(c));
  }

  /**
   * Get credentials for a connection (SENSITIVE - audit logged + rate limited)
   * SECURITY: Rate limited to prevent brute force attacks
   */
  async getCredentials(
    connectionId: string,
    userId: string,
    auditContext: AuditContext
  ): Promise<ConnectorCredentials> {
    const timer = auditService.createTimer();
    
    // Rate limit check
    if (!this.checkCredentialRateLimit(userId)) {
      await auditService.securityAlert(auditContext, 'rate_limit_exceeded', {
        connectionId,
        action: 'credential_access',
      });
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    try {
      // Validate connectionId format
      if (!connectionId || !/^[a-z0-9]{20,30}$/i.test(connectionId)) {
        throw new Error('Invalid connection ID format');
      }
      
      const connection = await prisma.connectorConnection.findFirst({
        where: { id: connectionId, userId },
      });
      
      if (!connection) {
        throw new Error(`Connection not found: ${connectionId}`);
      }
      
      if (!connection.encryptedCredentials) {
        throw new Error('No credentials stored for this connection');
      }
      
      // Decrypt credentials
      const credentials = JSON.parse(this.decrypt(connection.encryptedCredentials));
      
      // Audit log credential access (sensitive operation)
      await auditService.success('credential_access', {
        ...auditContext,
        connectionId,
      }, {
        connectorId: connection.connectorId,
        reason: auditContext.userAgent?.includes('sync') ? 'sync' : 'api_request',
      }, timer.elapsed());
      
      return credentials;
    } catch (error: any) {
      await auditService.failure('credential_access', {
        ...auditContext,
        connectionId,
      }, error, {}, timer.elapsed());
      throw error;
    }
  }

  /**
   * Update connection credentials
   */
  async updateCredentials(
    connectionId: string,
    userId: string,
    credentials: ConnectorCredentials,
    auditContext: AuditContext
  ): Promise<void> {
    const timer = auditService.createTimer();
    
    try {
      const encryptedCredentials = this.encrypt(JSON.stringify(credentials));
      
      await prisma.connectorConnection.updateMany({
        where: { id: connectionId, userId },
        data: { 
          encryptedCredentials,
          updatedAt: new Date(),
        },
      });
      
      await auditService.success('credential_store', {
        ...auditContext,
        connectionId,
      }, {
        action: 'update',
      }, timer.elapsed());
      
      console.log(`✅ Credentials updated for connection: ${connectionId}`);
    } catch (error: any) {
      await auditService.failure('credential_store', {
        ...auditContext,
        connectionId,
      }, error, {}, timer.elapsed());
      throw error;
    }
  }

  /**
   * Update connection status
   */
  async updateConnectionStatus(
    connectionId: string,
    userId: string,
    status: ConnectionStatus,
    error?: string
  ): Promise<void> {
    await prisma.connectorConnection.updateMany({
      where: { id: connectionId, userId },
      data: {
        status,
        lastError: error || null,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Update connection accounts
   */
  async updateAccounts(
    connectionId: string,
    userId: string,
    accounts: ConnectorAccount[]
  ): Promise<void> {
    await prisma.connectorConnection.updateMany({
      where: { id: connectionId, userId },
      data: {
        accounts: JSON.stringify(accounts),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Record successful sync
   */
  async recordSync(
    connectionId: string,
    userId: string,
    stats: {
      totalTransactions: number;
      newTransactions: number;
      skippedTransactions: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<void> {
    await prisma.connectorConnection.updateMany({
      where: { id: connectionId, userId },
      data: {
        lastSync: new Date(),
        status: 'connected',
        lastError: null,
        syncCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    // Record in sync history
    await prisma.connectorSyncHistory.create({
      data: {
        connectionId,
        userId,
        syncType: 'manual',
        status: 'success',
        totalTransactions: stats.totalTransactions,
        newTransactions: stats.newTransactions,
        skippedTransactions: stats.skippedTransactions,
        syncStartDate: stats.startDate,
        syncEndDate: stats.endDate,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Delete a connection and all associated data
   */
  async deleteConnection(
    connectionId: string,
    userId: string,
    auditContext: AuditContext
  ): Promise<void> {
    const timer = auditService.createTimer();
    
    try {
      // Get connection info for audit log
      const connection = await prisma.connectorConnection.findFirst({
        where: { id: connectionId, userId },
      });
      
      if (!connection) {
        throw new Error(`Connection not found: ${connectionId}`);
      }
      
      // Delete connection (cascade will delete related audit logs due to SetNull)
      await prisma.connectorConnection.deleteMany({
        where: { id: connectionId, userId },
      });
      
      // Audit log
      await auditService.success('disconnect', auditContext, {
        connectionId,
        connectorId: connection.connectorId,
        institutionId: connection.institutionId,
      }, timer.elapsed());
      
      console.log(`✅ Connection deleted: ${connectionId}`);
    } catch (error: any) {
      await auditService.failure('disconnect', {
        ...auditContext,
        connectionId,
      }, error, {}, timer.elapsed());
      throw error;
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Convert database model to SecureConnection (no credentials)
   */
  private toSecureConnection(connection: any): SecureConnection {
    return {
      id: connection.id,
      userId: connection.userId,
      connectorId: connection.connectorId,
      connectorType: connection.connectorType,
      status: connection.status as ConnectionStatus,
      institutionId: connection.institutionId,
      institutionName: connection.institutionName,
      accounts: connection.accounts ? JSON.parse(connection.accounts) : [],
      lastSync: connection.lastSync,
      lastError: connection.lastError,
      settings: connection.settings ? JSON.parse(connection.settings) : {},
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
      expiresAt: connection.expiresAt,
    };
  }

  /**
   * Mask sensitive credential fields for logging
   */
  maskCredentials(credentials: ConnectorCredentials): Record<string, any> {
    const sensitiveFields = ['password', 'secret', 'token', 'key', 'apiKey', 'accessToken', 'refreshToken', 'access_token', 'refresh_token'];
    const masked: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(credentials)) {
      if (sensitiveFields.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
        masked[key] = '***MASKED***';
      } else {
        masked[key] = value;
      }
    }
    
    return masked;
  }
}

export const secureCredentialManager = SecureCredentialManager.getInstance();
export default secureCredentialManager;

