/**
 * Security Logger — ai2-connectors service
 * embracingearth.space
 *
 * ARCHITECTURE:
 *   Structured JSON logs → stdout → Fly.io log drain → Grafana Cloud Loki
 *   Previously used Winston syslog transport to self-hosted Wazuh Manager.
 *   Migrated to stdout-only for $0 cost and zero ops burden.
 *
 * MIGRATION NOTE:
 *   - Removed winston-syslog dependency (no longer needed)
 *   - Removed process-level error handler overrides (were for Wazuh DNS errors)
 *   - All exported functions preserved for backward compatibility
 *   - Same function signatures — no callers need updating
 *
 * IMPORTANT: Do NOT remove this file or rename exports.
 * Multiple files import { wazuhLogger, logSecurityEvent, wazuhRequestLogger } from here.
 */

import winston from 'winston';

const APP_NAME = process.env.FLY_APP_NAME || process.env.APP_NAME || 'ai2-connectors';
const FLY_REGION = process.env.FLY_REGION || 'local';
const FLY_MACHINE_ID = process.env.FLY_MACHINE_ID || 'unknown';

// ─── Logger: Console-only (Fly.io captures stdout automatically) ─────

export const wazuhLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: APP_NAME,
    region: FLY_REGION,
    machine: FLY_MACHINE_ID,
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'production'
          ? winston.format.json() // Structured JSON in prod for Grafana
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            ),
    }),
  ],
  exceptionHandlers: [
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

// ─── Security event types ────────────────────────────────────────────

export type SecurityEventType =
  | 'auth_success'
  | 'auth_failure'
  | 'access_denied'
  | 'data_access'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'input_validation_failed'
  | 'api_error'
  | 'server_start'
  | 'server_stop'
  | 'bank_connection_success'
  | 'bank_connection_failed'
  | 'credential_access'
  | 'webhook_received';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEvent {
  type: SecurityEventType;
  action: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
  severity?: SecuritySeverity;
}

/**
 * Log security events — structured JSON to stdout.
 * Grafana Loki filters on _security_event: true
 */
export function logSecurityEvent(event: SecurityEvent): void {
  const level =
    event.severity === 'critical'
      ? 'error'
      : event.severity === 'high'
        ? 'warn'
        : 'info';

  wazuhLogger.log(level, 'SECURITY_EVENT', {
    _security_event: true,
    event_type: event.type,
    ...event,
    ts: new Date().toISOString(),
  });
}

/**
 * Log API access for monitoring and audit trails
 */
export function logAPIAccess(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  ip?: string,
  userId?: string,
  userAgent?: string
): void {
  wazuhLogger.info('API_ACCESS', {
    api_access: true,
    method,
    path,
    status: statusCode,
    duration_ms: durationMs,
    ip,
    user_id: userId,
    user_agent: userAgent,
  });
}

/**
 * Log application errors
 */
export function logError(error: Error, context?: Record<string, any>): void {
  wazuhLogger.error('APP_ERROR', {
    error: true,
    message: error.message,
    stack: error.stack,
    ...context,
  });
}

/**
 * Express middleware for automatic API logging
 */
export function wazuhRequestLogger(
  req: any,
  res: any,
  next: () => void
): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Skip health check endpoints (too noisy)
    if (req.path === '/health' || req.path === '/health/db') {
      return;
    }

    logAPIAccess(
      req.method,
      req.path,
      res.statusCode,
      duration,
      req.ip || req.connection?.remoteAddress,
      req.user?.id || req.userId,
      req.get?.('user-agent')
    );

    // Log slow requests as warnings
    if (duration > 5000) {
      wazuhLogger.warn('SLOW_REQUEST', {
        method: req.method,
        path: req.path,
        duration_ms: duration,
        threshold_ms: 5000,
      });
    }
  });

  next();
}

/**
 * Middleware to detect suspicious activity patterns
 */
export function wazuhSecurityMiddleware(
  req: any,
  res: any,
  next: () => void
): void {
  const url = req.url || '';
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';

  // SQL injection patterns
  if (
    /(?:union\s+select|select\s+\*\s+from|insert\s+into|update\s+\w+\s+set|delete\s+from|drop\s+table)/i.test(
      url
    )
  ) {
    logSecurityEvent({
      type: 'suspicious_activity',
      action: 'sql_injection_attempt',
      ip,
      details: { url: url.substring(0, 500) },
      severity: 'critical',
    });
  }

  // XSS patterns
  if (/<script|javascript:|onerror\s*=|onload\s*=/i.test(url)) {
    logSecurityEvent({
      type: 'suspicious_activity',
      action: 'xss_attempt',
      ip,
      details: { url: url.substring(0, 500) },
      severity: 'high',
    });
  }

  // Path traversal
  if (/\.\.[\/\\]/.test(url)) {
    logSecurityEvent({
      type: 'suspicious_activity',
      action: 'path_traversal_attempt',
      ip,
      details: { url: url.substring(0, 500) },
      severity: 'high',
    });
  }

  next();
}

export default wazuhLogger;
