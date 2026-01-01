/**
 * Wazuh Security Monitoring Integration for Fly.io Apps
 * Sends security events and logs to Wazuh Manager via syslog
 * embracingearth.space
 * 
 * ARCHITECTURE NOTE:
 * Alpine Linux (used in all our Fly.io apps) doesn't support native Wazuh agents.
 * Instead, we use Winston with syslog transport to forward logs to Wazuh Manager.
 * The Wazuh Manager receives these as syslog events and processes them through decoders.
 */

import winston from 'winston';

// Wazuh Manager address (Fly.io internal network via 6PN)
const WAZUH_HOST = process.env.WAZUH_HOST || 'ai2-wazuh.internal';
const WAZUH_SYSLOG_PORT = parseInt(process.env.WAZUH_SYSLOG_PORT || '514');
const APP_NAME = process.env.FLY_APP_NAME || process.env.APP_NAME || 'ai2-connectors';
const FLY_REGION = process.env.FLY_REGION || 'local';
const FLY_MACHINE_ID = process.env.FLY_MACHINE_ID || 'unknown';

// Syslog transport setup (only in production, only if WAZUH_HOST is set)
let syslogTransport: winston.transport | null = null;

if (process.env.NODE_ENV === 'production' && WAZUH_HOST !== 'disabled') {
  try {
    // Dynamic import of syslog transport (side-effect import)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('winston-syslog');
    
    // Get Syslog transport from winston.transports after import
    const { Syslog } = winston.transports as any;
    
    if (Syslog) {
      syslogTransport = new Syslog({
        host: WAZUH_HOST,
        port: WAZUH_SYSLOG_PORT,
        protocol: 'udp4',
        facility: 'local0',
        app_name: APP_NAME,
        eol: '\n',
      });
      console.log(`[Wazuh] Syslog transport configured -> ${WAZUH_HOST}:${WAZUH_SYSLOG_PORT}`);
    }
  } catch (err) {
    console.warn('[Wazuh] Syslog transport not available, logging to console only');
  }
}

// Create Wazuh-integrated logger
const transports: winston.transport[] = [
  // Console always enabled for debugging
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

if (syslogTransport) {
  transports.push(syslogTransport);
}

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
    environment: process.env.NODE_ENV || 'development'
  },
  transports
});

// Security event types for Wazuh rules matching
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
 * Log security events to Wazuh
 * These events trigger Wazuh rules for alerting/SIEM
 */
export function logSecurityEvent(event: SecurityEvent): void {
  const level = event.severity === 'critical' ? 'error' : 
                event.severity === 'high' ? 'warn' : 'info';
  
  wazuhLogger.log(level, 'SECURITY_EVENT', {
    security_event: true,
    event_type: event.type,
    ...event,
    ts: new Date().toISOString()
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
    user_agent: userAgent
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
    ...context
  });
}

/**
 * Express middleware for automatic API logging
 * Usage: app.use(wazuhRequestLogger)
 */
export function wazuhRequestLogger(req: any, res: any, next: () => void): void {
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
        threshold_ms: 5000
      });
    }
  });
  
  next();
}

/**
 * Middleware to detect suspicious activity patterns
 * Usage: app.use(wazuhSecurityMiddleware)
 */
export function wazuhSecurityMiddleware(req: any, res: any, next: () => void): void {
  const url = req.url || '';
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  
  // SQL injection patterns
  if (/(?:union\s+select|select\s+\*\s+from|insert\s+into|update\s+\w+\s+set|delete\s+from|drop\s+table)/i.test(url)) {
    logSecurityEvent({
      type: 'suspicious_activity',
      action: 'sql_injection_attempt',
      ip,
      details: { url: url.substring(0, 500) },
      severity: 'critical'
    });
  }
  
  // XSS patterns
  if (/<script|javascript:|onerror\s*=|onload\s*=/i.test(url)) {
    logSecurityEvent({
      type: 'suspicious_activity',
      action: 'xss_attempt',
      ip,
      details: { url: url.substring(0, 500) },
      severity: 'high'
    });
  }
  
  // Path traversal
  if (/\.\.[\/\\]/.test(url)) {
    logSecurityEvent({
      type: 'suspicious_activity',
      action: 'path_traversal_attempt',
      ip,
      details: { url: url.substring(0, 500) },
      severity: 'high'
    });
  }
  
  next();
}

export default wazuhLogger;
