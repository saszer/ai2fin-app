// --- 📦 CONNECTORS SERVICE SERVER ---
// embracingearth.space - Main server entry point for connectors service

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authenticateToken, serviceAuth } from './middleware/auth';
import { sanitizeInput } from './middleware/validation';
import connectorsRouter from './routes/connectors';
import './connectors/registerConnectors'; // Register all connectors on startup

const app = express();
const PORT = process.env.CONNECTORS_PORT || 3003;
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

// Connector API routes (matches core app expectations)
// Routes are prefixed with /api/connectors
app.use('/api/connectors', authenticateToken, connectorsRouter);

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
  app.listen(PORT, () => {
    console.log(`🔌 Connectors Service running on port ${PORT}`);
    console.log(`📊 Bank Feed: ${process.env.ENABLE_BANK_FEED === 'true' ? 'Enabled' : 'Disabled'}`);
    console.log(`📧 Email Connector: ${process.env.ENABLE_EMAIL_CONNECTOR === 'true' ? 'Enabled' : 'Disabled'}`);
  });
}

export default app; 