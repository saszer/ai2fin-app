// --- 📦 AUDIT SERVICE ---
// embracingearth.space - Comprehensive audit logging for connector operations
// All sensitive operations logged for compliance (GDPR, SOC 2, PCI DSS)

import { prisma } from '../lib/prisma';

export type AuditAction = 
  | 'connect'
  | 'disconnect' 
  | 'sync'
  | 'sync_complete'
  | 'token_exchange'
  | 'token_refresh'
  | 'credential_store'
  | 'credential_access'
  | 'credential_delete'
  | 'account_list'
  | 'transaction_fetch'
  | 'webhook_receive'
  | 'error'
  | 'security_alert';

export type AuditStatus = 'success' | 'failure' | 'pending';

export interface AuditContext {
  userId: string;
  connectionId?: string;
  connectorId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditDetails {
  [key: string]: any;
}

/**
 * Audit Service - Enterprise-grade audit logging
 * 
 * Security Features:
 * - All credential operations logged (without storing credentials)
 * - Request context captured (IP, user agent)
 * - Timing tracked for performance analysis
 * - Error details logged for debugging
 * - Designed for SOC 2 / GDPR compliance
 */
class AuditService {
  private static instance: AuditService;

  private constructor() {}

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Log an audit event
   */
  async log(
    action: AuditAction,
    status: AuditStatus,
    context: AuditContext,
    details?: AuditDetails,
    durationMs?: number
  ): Promise<string> {
    const startTime = Date.now();
    
    try {
      // Sanitize details - remove any sensitive fields
      const sanitizedDetails = details ? this.sanitizeDetails(details) : null;
      
      const auditLog = await prisma.connectorAuditLog.create({
        data: {
          connectionId: context.connectionId,
          userId: context.userId,
          action,
          status,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent ? context.userAgent.substring(0, 500) : null,
          details: sanitizedDetails ? JSON.stringify(sanitizedDetails) : null,
          durationMs,
        },
      });

      // Log to console for real-time monitoring
      const logLevel = status === 'failure' ? '❌' : status === 'success' ? '✅' : '⏳';
      console.log(`📋 AUDIT ${logLevel} [${action}] user=${context.userId} conn=${context.connectionId || 'N/A'} ${durationMs ? `(${durationMs}ms)` : ''}`);

      return auditLog.id;
    } catch (error) {
      // Don't let audit failures break the main flow
      console.error('⚠️ Audit log failed:', error);
      return 'audit-failed';
    }
  }

  /**
   * Log a successful operation
   */
  async success(
    action: AuditAction,
    context: AuditContext,
    details?: AuditDetails,
    durationMs?: number
  ): Promise<string> {
    return this.log(action, 'success', context, details, durationMs);
  }

  /**
   * Log a failed operation
   */
  async failure(
    action: AuditAction,
    context: AuditContext,
    error: Error | string,
    details?: AuditDetails,
    durationMs?: number
  ): Promise<string> {
    const errorMessage = error instanceof Error ? error.message : error;
    
    return this.log(action, 'failure', context, {
      ...details,
      error: errorMessage,
    }, durationMs);
  }

  /**
   * Log a security alert
   */
  async securityAlert(
    context: AuditContext,
    alertType: string,
    details: AuditDetails
  ): Promise<string> {
    console.warn(`🚨 SECURITY ALERT: ${alertType}`, { userId: context.userId, ip: context.ipAddress });
    
    return this.log('security_alert', 'failure', context, {
      alertType,
      ...details,
    });
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(userId: string, options?: {
    limit?: number;
    offset?: number;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { userId };
    
    if (options?.action) {
      where.action = options.action;
    }
    
    if (options?.startDate || options?.endDate) {
      where.timestamp = {};
      if (options.startDate) where.timestamp.gte = options.startDate;
      if (options.endDate) where.timestamp.lte = options.endDate;
    }

    return prisma.connectorAuditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    });
  }

  /**
   * Get audit logs for a connection
   */
  async getConnectionAuditLogs(connectionId: string, limit = 50) {
    return prisma.connectorAuditLog.findMany({
      where: { connectionId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Sanitize details to remove sensitive information
   */
  private sanitizeDetails(details: AuditDetails): AuditDetails {
    const sensitiveFields = [
      'password', 'secret', 'token', 'accessToken', 'refreshToken',
      'apiKey', 'key', 'credential', 'auth', 'bearer', 'authorization',
      'access_token', 'refresh_token', 'api_key', 'client_secret'
    ];
    
    const sanitized: AuditDetails = {};
    
    for (const [key, value] of Object.entries(details)) {
      const lowerKey = key.toLowerCase();
      
      // Check if this field is sensitive
      if (sensitiveFields.some(f => lowerKey.includes(f))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeDetails(value as AuditDetails);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Create a timed operation wrapper
   */
  createTimer(): { elapsed: () => number } {
    const start = Date.now();
    return {
      elapsed: () => Date.now() - start,
    };
  }
}

export const auditService = AuditService.getInstance();
export default auditService;

