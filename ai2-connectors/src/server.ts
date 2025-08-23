import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authenticateToken, serviceAuth } from './middleware/auth';

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
app.use(express.json());

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

// Basic connector endpoints
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

app.post('/api/connectors/bank/connect', authenticateToken, async (req, res) => {
  try {
    const { bankName, credentials } = req.body;
    
    // Mock bank connection
    const connection = {
      id: `bank_${Date.now()}`,
      bankName,
      status: 'connected',
      lastSync: new Date().toISOString(),
      accounts: [
        { id: 'acc_1', name: 'Checking Account', balance: 5000.00 },
        { id: 'acc_2', name: 'Savings Account', balance: 15000.00 }
      ]
    };

    res.json({
      success: true,
      data: connection,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Bank connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/connectors/email/connect', async (req, res) => {
  try {
    const { emailProvider, credentials } = req.body;
    
    // Mock email connection
    const connection = {
      id: `email_${Date.now()}`,
      provider: emailProvider,
      status: 'connected',
      lastSync: new Date().toISOString(),
      emailsProcessed: 0
    };

    res.json({
      success: true,
      data: connection,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Email connection failed',
      timestamp: new Date().toISOString()
    });
  }
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