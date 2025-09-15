import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import exportRoutes from './routes/exports';

const app = express();
const PORT = process.env.ANALYTICS_PORT || 3004;
// embracingearth.space - CF Origin Lock configuration (env-driven)
const ORIGIN_LOCK_ENABLED = process.env.ENFORCE_CF_ORIGIN_LOCK === 'true';
const ORIGIN_HEADER_NAME = (process.env.ORIGIN_HEADER_NAME || 'x-origin-auth').toLowerCase();
const ORIGIN_SHARED_SECRET = process.env.ORIGIN_SHARED_SECRET || '';

// 🔧 CORS Configuration - Production Security
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];
    
    // Allow requests with no origin (mobile apps, etc.) - but log them
    if (!origin) {
      console.log('🔍 Analytics CORS: No origin request - allowing but logging');
      return callback(null, true);
    }
    
    // Handle trailing slashes and normalize origins
    const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    const isAllowed = allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes(origin);
    
    if (isAllowed) {
      console.log('✅ Analytics CORS: Origin allowed -', origin);
      callback(null, true);
    } else {
      console.log('❌ Analytics CORS: Origin blocked -', origin);
      console.log('🔍 Allowed origins:', allowedOrigins);
      callback(new Error('CORS: Origin not allowed'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

// Middleware
// CF Origin Lock - ensure requests arrive via Cloudflare by validating a secret header
if (ORIGIN_LOCK_ENABLED && ORIGIN_SHARED_SECRET) {
  app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development') return next();
    const received = String(req.headers[ORIGIN_HEADER_NAME] || '');
    if (received !== ORIGIN_SHARED_SECRET) {
      console.warn('🔒 Analytics origin lock rejection', {
        path: req.originalUrl,
        remoteAddress: req.ip,
        headerPresent: Boolean(req.headers[ORIGIN_HEADER_NAME]),
        headerName: ORIGIN_HEADER_NAME
      });
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  });
  console.log('🔒 Analytics: Cloudflare Origin Lock enabled', { headerName: ORIGIN_HEADER_NAME });
} else {
  console.log('🔒 Analytics: Cloudflare Origin Lock disabled', { reason: ORIGIN_LOCK_ENABLED ? 'missing_shared_secret' : 'enforcement_flag_off' });
}
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limit request body size

// 📝 HTTP Request Logging Middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'unknown';

  console.log(`📊 Analytics ${method} ${url} - ${ip} - ${userAgent}`);

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`📊 Analytics ${method} ${url} - ${res.statusCode} (${duration}ms)`);
  });

  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'analytics',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: {
      advancedReporting: process.env.ENABLE_ADVANCED_REPORTING === 'true',
      exports: true, // CRITICAL FIX: Always enable exports for ATO functionality
      insights: process.env.ENABLE_INSIGHTS === 'true',
      atoExports: true // embracingearth.space - ATO myDeductions export support
    }
  });
});

// Analytics endpoints
app.get('/api/analytics/status', (req, res) => {
  res.json({
    service: 'Analytics',
    status: 'active',
    capabilities: [
      'advanced-reporting',
      'exports',
      'insights',
      'data-visualization',
      'ato-exports' // embracingearth.space - ATO myDeductions export support
    ],
    version: '1.0.0'
  });
});

// Export routes
app.use(exportRoutes);

app.post('/api/analytics/generate-report', async (req, res) => {
  try {
    const { reportType, dateRange, filters } = req.body;
    
    // Mock report generation
    const report = {
      id: `report_${Date.now()}`,
      type: reportType,
      dateRange,
      generatedAt: new Date().toISOString(),
      data: {
        totalTransactions: 1250,
        totalAmount: 45678.90,
        categories: [
          { name: 'Food & Dining', count: 45, amount: 1250.00 },
          { name: 'Transportation', count: 32, amount: 890.50 },
          { name: 'Shopping', count: 28, amount: 2100.75 }
        ],
        trends: {
          monthlyGrowth: 12.5,
          topCategory: 'Food & Dining',
          averageTransaction: 36.54
        }
      }
    };

    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Report generation failed',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/analytics/export-data', async (req, res) => {
  try {
    const { format, dataType, filters } = req.body;
    
    // Mock data export
    const exportResult = {
      id: `export_${Date.now()}`,
      format,
      dataType,
      status: 'completed',
      downloadUrl: `/api/analytics/downloads/export_${Date.now()}.${format}`,
      recordCount: 1250,
      fileSize: '2.5MB'
    };

    res.json({
      success: true,
      data: exportResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Data export failed',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/analytics/insights', async (req, res) => {
  try {
    const insights = {
      spendingTrends: {
        monthlyGrowth: 8.5,
        topSpendingCategory: 'Food & Dining',
        unusualExpenses: [
          { description: 'Large purchase at Electronics Store', amount: 899.99, date: '2025-07-01' }
        ]
      },
      savingsOpportunities: [
        { category: 'Food & Dining', potentialSavings: 200.00, suggestion: 'Consider meal planning' },
        { category: 'Transportation', potentialSavings: 150.00, suggestion: 'Use public transport more' }
      ],
      taxDeductions: [
        { category: 'Business Expenses', amount: 1250.00, deductible: true },
        { category: 'Home Office', amount: 450.00, deductible: true }
      ]
    };

    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Insights generation failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
if (require.main === module) {
  // Use 0.0.0.0 for production to allow external connections, but rely on CORS for security
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
  app.listen(Number(PORT), host, () => {
    console.log(`📊 Analytics Service running on port ${PORT} (${host})`);
    console.log(`📈 Advanced Reporting: ${process.env.ENABLE_ADVANCED_REPORTING === 'true' ? 'Enabled' : 'Disabled'}`);
    console.log(`📤 Exports: ${process.env.ENABLE_EXPORTS === 'true' ? 'Enabled' : 'Disabled'}`);
    console.log(`🏢 ATO Exports: Enabled`); // embracingearth.space - ATO myDeductions export support
    console.log(`🛡️ CORS Security: ${process.env.NODE_ENV === 'production' ? 'Production Mode' : 'Development Mode'}`);
  });
}

export default app; 