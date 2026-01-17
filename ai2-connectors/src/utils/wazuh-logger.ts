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
// CRITICAL: Graceful error handling to prevent app crashes when Wazuh is unavailable
// embracingearth.space - Enterprise-grade resilience
let syslogTransport: winston.transport | null = null;
let wazuhAvailable = false;

// CRITICAL FIX: Wrap syslog transport creation in defensive error handling
// The winston-syslog library can emit errors during DNS lookup that crash the app
// We need to catch these at multiple levels and prevent unhandled error events
// ARCHITECTURE: We create the transport but immediately remove it if it errors
// This prevents Winston's DerivedLogger from crashing on unhandled error events
if (process.env.NODE_ENV === 'production' && WAZUH_HOST !== 'disabled') {
  try {
    // Dynamic import of syslog transport (side-effect import)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('winston-syslog');
    
    // Get Syslog transport from winston.transports after import
    const { Syslog } = winston.transports as any;
    
    if (Syslog) {
      // CRITICAL: Create transport with error handling BEFORE it can emit errors
      // Wrap in try-catch to catch synchronous errors during construction
      try {
        syslogTransport = new Syslog({
          host: WAZUH_HOST,
          port: WAZUH_SYSLOG_PORT,
          protocol: 'udp4',
          facility: 'local0',
          app_name: APP_NAME,
          eol: '\n',
          // CRITICAL: Add error handler IMMEDIATELY after creation
          // This must be done synchronously before any async operations
        });
        
        // CRITICAL: Attach error handler IMMEDIATELY - before any operations
        // This prevents unhandled error events from propagating to Winston's DerivedLogger
        // ARCHITECTURE: If transport errors, we remove it from the logger to prevent crashes
        syslogTransport.on('error', (error: Error) => {
          // Log to console only (don't try to log to Wazuh if it's down!)
          const errorCode = (error as any).code;
          const errorHostname = (error as any).hostname;
          
          // Only log once per error type to avoid spam
          if (!wazuhAvailable || errorCode === 'ENOTFOUND' || errorCode === 'ECONNREFUSED') {
            console.warn('[Wazuh] Syslog transport error (non-fatal):', {
              message: error.message,
              code: errorCode,
              hostname: errorHostname,
              note: 'App continues running with console logging only. Wazuh transport disabled.'
            });
          }
          
          wazuhAvailable = false;
          
          // CRITICAL: Remove transport from logger if it's causing errors
          // This prevents Winston from re-emitting the error and crashing
          if (syslogTransport && wazuhLogger) {
            try {
              wazuhLogger.remove(syslogTransport);
              syslogTransport = null;
              console.warn('[Wazuh] Removed failing syslog transport to prevent app crashes');
            } catch (removeErr) {
              // Ignore errors during removal
            }
          }
        });
        
        // Monitor connection success (optional, for debugging)
        syslogTransport.on('logged', () => {
          if (!wazuhAvailable) {
            wazuhAvailable = true;
            console.log(`[Wazuh] Syslog transport connected -> ${WAZUH_HOST}:${WAZUH_SYSLOG_PORT}`);
          }
        });
        
        console.log(`[Wazuh] Syslog transport configured -> ${WAZUH_HOST}:${WAZUH_SYSLOG_PORT}`);
        wazuhAvailable = true; // Optimistically assume it will work
      } catch (transportError: any) {
        // Catch errors during transport creation (e.g., invalid config)
        console.warn('[Wazuh] Failed to create syslog transport:', transportError.message);
        syslogTransport = null;
        wazuhAvailable = false;
      }
    }
  } catch (err) {
    console.warn('[Wazuh] Syslog transport not available, logging to console only:', (err as Error).message);
    syslogTransport = null;
    wazuhAvailable = false;
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
  transports,
  // CRITICAL: Handle logger-level errors gracefully
  // This catches any unhandled transport errors that might escape
  exceptionHandlers: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// CRITICAL: Catch any unhandled errors from the logger itself
// This is a final safety net to prevent app crashes
// ARCHITECTURE: If logger errors, remove the failing transport and continue
wazuhLogger.on('error', (error: Error) => {
  // Log to console only - don't try to use logger that's failing
  const errorCode = (error as any).code;
  const isWazuhError = errorCode === 'ENOTFOUND' || errorCode === 'ECONNREFUSED' || 
                       (error.message && error.message.includes('ai2-wazuh'));
  
  if (isWazuhError) {
    console.warn('[Wazuh Logger] Transport error (non-fatal):', {
      message: error.message,
      code: errorCode,
      note: 'App continues running - Wazuh logging disabled'
    });
    
    // CRITICAL: Remove failing transport to prevent repeated errors
    if (syslogTransport) {
      try {
        wazuhLogger.remove(syslogTransport);
        syslogTransport = null;
        wazuhAvailable = false;
        console.warn('[Wazuh] Removed failing transport from logger');
      } catch (removeErr) {
        // Ignore removal errors
      }
    }
  } else {
    // For non-Wazuh errors, log but don't remove transport
    console.error('[Wazuh Logger] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      note: 'This may indicate a different issue'
    });
  }
});

// CRITICAL: Process-level error handler for Winston transport errors
// This is the absolute last line of defense against unhandled errors
// embracingearth.space - Enterprise-grade error resilience
// ARCHITECTURE: We suppress Wazuh DNS errors at process level to prevent crashes
const originalUnhandledRejection = process.listeners('unhandledRejection');
process.removeAllListeners('unhandledRejection');
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  // Check if this is a Wazuh-related error
  if (reason && typeof reason === 'object') {
    const error = reason as Error;
    const errorCode = (error as any).code;
    if ((errorCode === 'ENOTFOUND' || errorCode === 'ECONNREFUSED') && 
        error.message && error.message.includes('ai2-wazuh')) {
      console.warn('[Wazuh] Suppressed unhandled rejection (non-fatal):', error.message);
      return; // Suppress - don't crash the app
    }
  }
  // Call original handlers for non-Wazuh errors
  originalUnhandledRejection.forEach(handler => {
    try {
      handler(reason, promise);
    } catch (e) {
      // Ignore handler errors
    }
  });
});

// CRITICAL: Handle uncaught exceptions from transport layer
// ARCHITECTURE: We suppress Wazuh DNS errors but let other exceptions propagate
// Type for uncaughtException handler: (error: Error, origin: string) => void
type UncaughtExceptionHandler = (error: Error, origin: string) => void;
const originalUncaughtException = process.listeners('uncaughtException') as UncaughtExceptionHandler[];
process.removeAllListeners('uncaughtException');
process.on('uncaughtException', (error: Error, origin: string) => {
  // Check if this is a Wazuh DNS/connection error
  const errorCode = (error as any).code;
  if ((errorCode === 'ENOTFOUND' || errorCode === 'ECONNREFUSED') && 
      error.message && error.message.includes('ai2-wazuh')) {
    console.warn('[Wazuh] Suppressed uncaught exception (non-fatal):', error.message);
    // Remove transport if it exists
    if (syslogTransport && wazuhLogger) {
      try {
        wazuhLogger.remove(syslogTransport);
        syslogTransport = null;
        wazuhAvailable = false;
      } catch (e) {
        // Ignore
      }
    }
    return; // Don't exit - just log and continue
  }
  // For other uncaught exceptions, call original handlers
  // ARCHITECTURE: uncaughtException handlers receive (error: Error, origin: string)
  originalUncaughtException.forEach(handler => {
    try {
      handler(error, origin);
    } catch (e) {
      // Ignore handler errors
    }
  });
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
