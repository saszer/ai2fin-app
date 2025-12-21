// --- 📦 CONNECTORS SERVICE SERVER ---
// embracingearth.space - Main server entry point for connectors service

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

const app = express();
const httpServer = createServer(app);
const PORT = process.env.CONNECTORS_PORT || 3003;

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
    instructions: 'Run: fly secrets get JWT_SECRET -a ai2-core-api and compare with connectors service'
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

// Start server
if (require.main === module) {
  httpServer.listen(PORT, () => {
    console.log(`🔌 Connectors Service running on port ${PORT}`);
    console.log(`📊 Bank Feed: ${process.env.ENABLE_BANK_FEED === 'true' ? 'Enabled' : 'Disabled'}`);
    console.log(`📧 Email Connector: ${process.env.ENABLE_EMAIL_CONNECTOR === 'true' ? 'Enabled' : 'Disabled'}`);
    console.log(`⚡ WebSocket Server: Enabled (Socket.io)`);
    console.log(`🔔 Real-time Transactions: Enabled`);
  });
}

export { httpServer, io };

export default app; 