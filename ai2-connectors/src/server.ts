// --- 📦 CONNECTORS SERVICE SERVER ---
// embracingearth.space - Main server entry point for connectors service
// SECURITY: All credentials stored encrypted (AES-256-GCM), full audit logging

// Load environment variables FIRST - before any other imports
import 'dotenv/config';

// CRITICAL: Import Sentry instrumentation FIRST, before any other imports
// embracingearth.space - Enterprise error tracking and monitoring
require('../instrument.js');

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { authenticateToken, serviceAuth } from './middleware/auth';
import { sanitizeInput } from './middleware/validation';
import connectorsRouter from './routes/connectors';
import { realtimeTransactionService } from './services/RealtimeTransactionService';
import './connectors/registerConnectors'; // Register all connectors on startup

// Initialize Prisma for secure credential storage
import { prisma } from './lib/prisma';
// 🔒 Wazuh Security Monitoring - embracingearth.space
import { wazuhRequestLogger, wazuhSecurityMiddleware, logSecurityEvent, wazuhLogger } from './utils/wazuh-logger';

const app = express();
const httpServer = createServer(app);
const PORT = parseInt(process.env.CONNECTORS_PORT || '3003', 10);

// Initialize Socket.io for real-time updates
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io'
});

// Initialize real-time transaction service
realtimeTransactionService.initialize(io);
// embracingearth.space - CF Origin Lock configuration (env-driven)
const ORIGIN_LOCK_ENABLED = process.env.ENFORCE_CF_ORIGIN_LOCK === 'true';
const ORIGIN_HEADER_NAME = (process.env.ORIGIN_HEADER_NAME || 'x-origin-auth').toLowerCase();
const ORIGIN_SHARED_SECRET = process.env.ORIGIN_SHARED_SECRET || '';

// Security validation
if (!process.env.JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET not configured for connectors service');
  process.exit(1);
}

// Credential encryption validation
if (!process.env.CREDENTIAL_ENCRYPTION_KEY) {
  console.warn('⚠️ CREDENTIAL_ENCRYPTION_KEY not set - credentials will use fallback encryption (dev only)');
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: CREDENTIAL_ENCRYPTION_KEY required in production');
    process.exit(1);
  }
} else if (process.env.CREDENTIAL_ENCRYPTION_KEY.length < 32) {
  console.error('CRITICAL: CREDENTIAL_ENCRYPTION_KEY must be at least 32 characters');
  process.exit(1);
} else {
  console.log('✅ Credential encryption key configured');
}

// Database validation
if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL not set - secure credential storage unavailable');
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: DATABASE_URL required in production for secure credential storage');
    process.exit(1);
  }
} else {
  console.log('✅ Database configured for secure credential storage');
}

// Middleware
// CF Origin Lock - ensure requests arrive via Cloudflare by validating a secret header
if (ORIGIN_LOCK_ENABLED && ORIGIN_SHARED_SECRET) {
  app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development') return next();
    const received = String(req.headers[ORIGIN_HEADER_NAME] || '');
    if (received !== ORIGIN_SHARED_SECRET) {
      console.warn('🔒 Connectors origin lock rejection', {
        path: req.originalUrl,
        remoteAddress: req.ip,
        headerPresent: Boolean(req.headers[ORIGIN_HEADER_NAME]),
        headerName: ORIGIN_HEADER_NAME
      });
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  });
  console.log('🔒 Connectors: Cloudflare Origin Lock enabled', { headerName: ORIGIN_HEADER_NAME });
} else {
  console.log('🔒 Connectors: Cloudflare Origin Lock disabled', { reason: ORIGIN_LOCK_ENABLED ? 'missing_shared_secret' : 'enforcement_flag_off' });
}
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limit request size for security
app.use(sanitizeInput); // Sanitize all inputs

// 🔒 Wazuh Security Monitoring - embracingearth.space
app.use(wazuhSecurityMiddleware); // Detect SQL injection, XSS, path traversal
app.use(wazuhRequestLogger);       // Log all API access to Wazuh
wazuhLogger.info('SERVER_START', { port: PORT, environment: process.env.NODE_ENV });

// CRITICAL: Sentry request handler must be BEFORE routes to capture request context
// embracingearth.space - Enterprise error tracking
// Sentry v8 handles request isolation automatically via AsyncLocalStorage
// No need for explicit requestHandler or tracingHandler middleware in v8

// Rate limiting for webhook endpoints (security: prevent DDoS)
// Architecture: User/connection-based rate limiting (not IP-based) for scalability
// Problem: IP-based limiting fails when 10,000 users share same IP (connector service)
// Solution: Rate limit by connectionId or userId from webhook payload
if (process.env.NODE_ENV === 'production') {
  try {
    const rateLimit = require('express-rate-limit');

    // Connection-based rate limiting (scalable for shared IPs)
    const webhookLimiter = rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 100, // 100 requests per minute per connection
      message: 'Too many webhook requests, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
      // Key generator: Use connectionId from payload, fallback to IP
      keyGenerator: (req: any) => {
        // Try to extract connectionId from webhook payload
        const body = req.body || {};
        const connectionId = body.data?.connectionId || body.connectionId || body.data?.connection?.id;

        if (connectionId) {
          return `connection:${connectionId}`; // Rate limit per connection
        }

        // Fallback: Use IP + user agent for unknown connections
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || 'unknown';
        return `ip:${ip}:${userAgent}`;
      },
      // Skip rate limiting for valid service-to-service calls
      skip: (req: any) => {
        const serviceSecret = req.headers['x-service-secret'];
        return serviceSecret === process.env.SERVICE_SECRET;
      }
    });

    // Apply to webhook endpoints
    app.use('/api/connectors/*/webhook', webhookLimiter);
    console.log('🔒 Connection-based rate limiting enabled for webhook endpoints');
  } catch (e) {
    console.warn('⚠️ express-rate-limit not installed - rate limiting disabled');
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'connectors',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: {
      bankFeed: process.env.ENABLE_BANK_FEED === 'true',
      emailConnector: process.env.ENABLE_EMAIL_CONNECTOR === 'true',
      apiConnector: process.env.ENABLE_API_CONNECTOR === 'true'
    }
  });
});

// Diagnostic endpoint for JWT_SECRET configuration (does not expose secret value)
app.get('/api/connectors/diagnostic/jwt-config', (req, res) => {
  const jwtSecret = process.env.JWT_SECRET;
  res.json({
    jwtSecretConfigured: !!jwtSecret,
    jwtSecretLength: jwtSecret ? jwtSecret.length : 0,
    jwtSecretHash: jwtSecret ? require('crypto').createHash('sha256').update(jwtSecret).digest('hex').substring(0, 16) : null,
    message: jwtSecret
      ? 'JWT_SECRET is configured. Compare the hash with core app to verify they match.'
      : 'CRITICAL: JWT_SECRET is not configured!',
    instructions: 'Compare the JWT_SECRET hash between core app and connectors service to verify they match'
  });
});

// Connector API routes (matches core app expectations)
// Routes are prefixed with /api/connectors
app.use('/api/connectors', authenticateToken, connectorsRouter);

// Apideck Vault routes (OAuth flow and webhooks)
// Note: Webhook endpoint is public (no auth) but verifies signature
import { default as apideckRouter } from './routes/apideck';
// Webhook endpoint should be accessible without auth (but with signature verification)
app.post('/api/connectors/apideck/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  // Skip auth middleware for webhook
  apideckRouter(req, res, next);
});
// Other Apideck routes require authentication
app.use('/api/connectors/apideck', authenticateToken, apideckRouter);

// Basiq routes (OAuth consent flow + webhooks)
// embracingearth.space - Basiq integration
import { default as basiqRouter } from './routes/basiq';
// Webhook endpoint is public (with signature verification)
app.post('/api/connectors/basiq/webhook', basiqRouter);
// Consent and OAuth endpoints require authentication
app.use('/api/connectors/basiq', authenticateToken, basiqRouter);

// Wise routes (OAuth flow + API)
// embracingearth.space - Wise integration
import { default as wiseRouter } from './routes/wise';
// Webhook endpoint is public (with signature verification)
app.post('/api/connectors/wise/webhook', wiseRouter);
// OAuth and API endpoints require authentication (except callback which is GET)
app.get('/api/connectors/wise/callback', wiseRouter); // OAuth callback doesn't have user token
app.use('/api/connectors/wise', authenticateToken, wiseRouter);

// Plaid routes (Link flow + API)
// embracingearth.space - Plaid integration for US/UK/Canada/EU banks
import { default as plaidRouter } from './routes/plaid';
// Webhook endpoint is public
app.post('/api/connectors/plaid/webhook', plaidRouter);
// Link token and exchange endpoints require authentication
app.use('/api/connectors/plaid', authenticateToken, plaidRouter);

// Legacy endpoints (for backward compatibility)
app.get('/api/connectors/status', (req, res) => {
  res.json({
    service: 'Connectors',
    status: 'active',
    capabilities: [
      'bank-feed',
      'email-extraction',
      'api-integration'
    ],
    version: '1.0.0'
  });
});

// Sentry test endpoint - for verifying error tracking
// embracingearth.space - Test endpoint to verify Sentry integration
app.get('/api/test/sentry', (req, res) => {
  const Sentry = require('../instrument.js');

  try {
    // Intentional error to test Sentry
    // @ts-ignore - This is an intentional error for testing Sentry
    foo(); // This function doesn't exist, will throw ReferenceError
  } catch (e) {
    Sentry.captureException(e);
    res.json({
      success: true,
      message: 'Error captured and sent to Sentry',
      error: e.message,
      timestamp: new Date().toISOString(),
      note: 'Check your Sentry dashboard to verify the error was received'
    });
  }
});

// CRITICAL: Sentry error handler must be set up AFTER all routes but BEFORE other error handlers
// embracingearth.space - Enterprise error tracking
// Sentry v8: Error handling is automatic via expressIntegration, but we can add custom error tracking
const Sentry = require('../instrument.js');
// In v8, error tracking happens automatically via expressIntegration
// We just need to ensure errors are captured
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Capture error in Sentry
  Sentry.captureException(err);
  next(err);
});

// Custom error handler (after Sentry)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Use existing error handling
  if (res.headersSent) {
    return next(err);
  }

  // Return error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

/**
 * Validate database schema - ensure required tables exist
 * CRITICAL: Prevents runtime errors when migrations haven't been run
 * embracingearth.space - Enterprise-grade startup validation
 */
/**
 * Validate database schema - ensure required tables exist
 * CRITICAL: Prevents runtime errors when migrations haven't been run
 * embracingearth.space - Enterprise-grade startup validation
 * 
 * ARCHITECTURE NOTE: We test both raw SQL and Prisma client queries
 * because Prisma can return different error formats than raw queries
 */
async function validateDatabaseSchema(): Promise<void> {
  try {
    // Test 1: Raw SQL query (catches PostgreSQL errors)
    try {
      await prisma.$queryRaw`SELECT 1 FROM connector_connections LIMIT 1`;
    } catch (rawErr: any) {
      const rawErrorMsg = String(rawErr?.message || '');
      if (rawErrorMsg.includes('does not exist') || rawErrorMsg.includes('relation')) {
        throw new Error(`Table connector_connections does not exist: ${rawErrorMsg}`);
      }
      // If it's a different error, continue to Prisma client test
    }

    // Test 2: Prisma client query (catches Prisma-specific errors)
    // This is what the actual code uses, so we need to validate it works
    try {
      await prisma.connectorConnection.findMany({ take: 1 });
    } catch (prismaErr: any) {
      const prismaErrorMsg = String(prismaErr?.message || '');
      const prismaErrorCode = String(prismaErr?.code || '');

      // Prisma error codes for missing table
      if (
        prismaErrorMsg.includes('does not exist') ||
        prismaErrorMsg.includes('connector_connections') ||
        prismaErrorCode === 'P2021' || // Table does not exist
        prismaErrorCode === 'P1001'    // Can't reach database server (but also check message)
      ) {
        throw new Error(`Prisma: Table connector_connections does not exist: ${prismaErrorMsg}`);
      }
      // If it's a different Prisma error, re-throw it
      throw prismaErr;
    }

    console.log('✅ Database schema validated - connector_connections table exists');
  } catch (err: any) {
    // Check if error is due to missing table
    const errorMessage = String(err?.message || '');
    const errorCode = String(err?.code || '');
    const isMissingTable =
      errorMessage.includes('does not exist') ||
      errorMessage.includes('relation') ||
      errorMessage.includes('table') ||
      errorMessage.includes('connector_connections') ||
      errorCode === '42P01' || // PostgreSQL: relation does not exist
      errorCode === 'P2021';    // Prisma: table does not exist

    if (isMissingTable) {
      console.error('❌ CRITICAL: Database schema not migrated!');
      console.error('   Required table "connector_connections" does not exist.');
      console.error('   Error:', errorMessage);
      console.error('   Error Code:', errorCode);
      console.error('');
      console.error('   SOLUTIONS:');
      console.error('   1. Run migrations: npx prisma migrate deploy');
      console.error('   2. Or push schema: npx prisma db push --accept-data-loss');
      console.error('   3. Check release command in fly.toml - migrations should run automatically');
      console.error('');

      if (process.env.NODE_ENV === 'production') {
        // In production, try to auto-fix using db push as last resort
        // This is safer than crashing, but migrations should have run in release command
        console.error('   ⚠️  Production mode: Attempting auto-fix with db push...');
        try {
          const { execSync } = require('child_process');
          execSync('npx prisma db push --accept-data-loss --skip-generate', {
            stdio: 'inherit',
            env: process.env,
            timeout: 30000 // 30 second timeout
          });
          console.log('   ✅ Auto-fix successful - schema pushed to database');
          // Retry validation
          await prisma.connectorConnection.findMany({ take: 1 });
          console.log('   ✅ Database schema validated after auto-fix');
          return; // Success - exit function
        } catch (autoFixErr: any) {
          console.error('   ❌ Auto-fix failed:', autoFixErr.message);
          console.error('   Production requires migrations - exiting to prevent runtime errors');
          console.error('   Check release command logs: fly logs -a ai2-connectors');
          process.exit(1);
        }
      } else {
        console.warn('   ⚠️  Development mode: Continuing with limited functionality');
        console.warn('   ⚠️  Some endpoints will return 500 errors until migrations are run');
      }
    } else {
      // Other database errors (connection, permissions, etc.)
      console.error('❌ Database validation error:', errorMessage);
      throw err;
    }
  }
}

// Start server
if (require.main === module) {
  // Test database connection and schema on startup
  prisma.$connect()
    .then(async () => {
      console.log('✅ Database connected - secure credential storage ready');

      // Validate schema before starting server
      await validateDatabaseSchema();

      httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`🔌 Connectors Service running on port ${PORT}`);
        console.log(`🔐 Secure Credential Storage: ${process.env.DATABASE_URL ? 'Enabled (AES-256-GCM)' : 'Disabled'}`);
        console.log(`📊 Bank Feed: ${process.env.ENABLE_BANK_FEED === 'true' ? 'Enabled' : 'Disabled'}`);
        console.log(`📧 Email Connector: ${process.env.ENABLE_EMAIL_CONNECTOR === 'true' ? 'Enabled' : 'Disabled'}`);
        console.log(`⚡ WebSocket Server: Enabled (Socket.io)`);
        console.log(`🔔 Real-time Transactions: Enabled`);
        console.log(`📋 Audit Logging: Enabled`);
      });
    })
    .catch((err: Error) => {
      console.error('❌ Database connection failed:', err.message);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
      // In development, start without DB (limited functionality)
      console.warn('⚠️ Starting without database - secure credential storage unavailable');
      httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`🔌 Connectors Service running on port ${PORT} (limited mode)`);
      });
    });
}

export { httpServer, io };

export default app; 