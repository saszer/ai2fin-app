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
app.use(express.json({ limit: '50mb' })); // Increased limit for large datasets (2K+ transactions)

// ENTERPRISE RATE LIMITING: Optimized for large datasets
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

const analyticsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes for large datasets
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health',
  // ENTERPRISE OPTIMIZATION: More lenient for export endpoints
  keyGenerator: (req) => {
    // Different limits for different endpoint types
    if (req.path.includes('/export/')) {
      return `export:${ipKeyGenerator(req)}`; // Separate bucket for exports
    }
    return ipKeyGenerator(req); // Default bucket for other requests
  }
});

// ENTERPRISE EXPORT RATE LIMITING: Special limits for export endpoints
const exportRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 export requests per 15 minutes per IP
  message: {
    success: false,
    error: 'Too many export requests. Please wait before trying again.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health'
});

// 🚨 EMERGENCY REQUEST DEDUPLICATION: Prevent duplicate calls
const requestCache = new Map();
const REQUEST_CACHE_TTL = 30000; // 30 seconds cache for duplicate requests

// ENTERPRISE CONCURRENT REQUEST LIMITING: Prevent server overload
const activeRequests = new Map();
const MAX_CONCURRENT_EXPORTS = 2; // DRASTICALLY REDUCED: 2 concurrent exports (was 5)

// 🚨 EMERGENCY DEDUPLICATION MIDDLEWARE: Prevent duplicate requests
const deduplicationMiddleware = (req: any, res: any, next: any) => {
  const userId = req.headers['x-user-id'] || req.ip;
  const requestKey = `${req.method}-${req.path}-${userId}-${JSON.stringify(req.body)}`;
  const now = Date.now();
  
  // Check if this exact request was made recently
  if (requestCache.has(requestKey)) {
    const cached = requestCache.get(requestKey);
    if (now - cached.timestamp < REQUEST_CACHE_TTL) {
      console.log('🚨 DUPLICATE REQUEST BLOCKED:', requestKey);
      return res.status(429).json({
        success: false,
        error: 'Duplicate request detected - please wait before retrying',
        retryAfter: Math.ceil((REQUEST_CACHE_TTL - (now - cached.timestamp)) / 1000)
      });
    }
  }
  
  // Cache this request
  requestCache.set(requestKey, { timestamp: now });
  
  // Clean old cache entries
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > REQUEST_CACHE_TTL) {
      requestCache.delete(key);
    }
  }
  
  next();
};

const concurrentLimitMiddleware = (req: any, res: any, next: any) => {
  const userId = req.headers['x-user-id'] || req.ip;
  const requestKey = `${userId}-${Date.now()}`;
  
  // Check if user has too many active requests
  const userActiveRequests = Array.from(activeRequests.keys()).filter(key => key.startsWith(userId));
  if (userActiveRequests.length >= MAX_CONCURRENT_EXPORTS) {
    return res.status(429).json({
      success: false,
      error: 'Too many concurrent export requests. Please wait for current exports to complete.',
      retryAfter: '30 seconds'
    });
  }
  
  // Track this request
  activeRequests.set(requestKey, { startTime: Date.now(), userId });
  
  // Clean up when request completes
  res.on('finish', () => {
    activeRequests.delete(requestKey);
  });
  
  res.on('close', () => {
    activeRequests.delete(requestKey);
  });
  
  next();
};

// Apply rate limiting to analytics endpoints
app.use('/api/analytics', analyticsRateLimit);

// Apply export-specific rate limiting to export endpoints
app.use('/api/analytics/export', exportRateLimit);

// Apply concurrent limiting to export endpoints
app.use('/api/analytics/export', concurrentLimitMiddleware);

// ENTERPRISE CACHING: Advanced memory management with LRU and TTL
interface CacheEntry {
  data: any;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

class EnterpriseCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100; // Increased for better performance
  private readonly CLEANUP_INTERVAL = 2 * 60 * 1000; // 2 minutes
  private cleanupTimer: NodeJS.Timeout;

  constructor() {
    // Periodic cleanup to prevent memory leaks
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Remove expired entries
    entries.forEach(([key, entry]) => {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    });

    // If still over limit, remove least recently used entries
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const sortedEntries = entries
        .filter(([key]) => this.cache.has(key))
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const toRemove = sortedEntries.slice(0, Math.floor(this.MAX_CACHE_SIZE / 2));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }

    console.log(`🧹 Cache cleanup: ${this.cache.size} entries remaining`);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = now;
    return entry.data;
  }

  set(key: string, data: any): void {
    // Cleanup before adding new entry
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    });
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      avgAccessCount: entries.reduce((sum, e) => sum + e.accessCount, 0) / entries.length || 0,
      oldestEntry: Math.min(...entries.map(e => e.timestamp)),
      newestEntry: Math.max(...entries.map(e => e.timestamp))
    };
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
  }
}

const enterpriseCache = new EnterpriseCache();

// Legacy compatibility functions
const getCacheKey = (req: any) => {
  const { startDate, endDate, page, pageSize } = req.body;
  return `preview:${startDate}:${endDate}:${page}:${pageSize}`;
};

const getCachedData = (key: string) => enterpriseCache.get(key);
const setCachedData = (key: string, data: any) => enterpriseCache.set(key, data);

// ENTERPRISE MEMORY CLEANUP: Handled by EnterpriseCache class automatically

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

// ENTERPRISE HEALTH CHECK: Comprehensive monitoring
app.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
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
    },
    // ENTERPRISE METRICS
    performance: {
      uptime: Math.floor(uptime),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      },
      cache: enterpriseCache.getStats()
    },
    // ENTERPRISE CAPABILITIES
    capabilities: {
      pagination: true,
      caching: true,
      rateLimiting: true,
      largeDatasets: true,
      streaming: true
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

// CRITICAL FIX: Add missing /api/analytics/health endpoint for production service discovery
app.get('/api/analytics/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
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
    },
    // ENTERPRISE METRICS
    performance: {
      uptime: Math.floor(uptime),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      },
      cache: enterpriseCache.getStats()
    },
    // ENTERPRISE CAPABILITIES
    capabilities: {
      pagination: true,
      caching: true,
      rateLimiting: true,
      largeDatasets: true,
      streaming: true
    }
  });
});

// Make cache functions available to routes
app.locals.getCachedData = getCachedData;
app.locals.setCachedData = setCachedData;

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
  const server = app.listen(Number(PORT), host, () => {
    console.log(`📊 Analytics Service running on port ${PORT} (${host})`);
    console.log(`📈 Advanced Reporting: ${process.env.ENABLE_ADVANCED_REPORTING === 'true' ? 'Enabled' : 'Disabled'}`);
    console.log(`📤 Exports: Enabled`); // CRITICAL: Always enabled for ATO functionality
    console.log(`🏢 ATO Exports: Enabled`); // embracingearth.space - ATO myDeductions export support
    console.log(`🛡️ CORS Security: ${process.env.NODE_ENV === 'production' ? 'Production Mode' : 'Development Mode'}`);
    console.log(`⚡ Performance: Optimized for large datasets (2K+ transactions)`);
  });

  // Set longer timeouts for large dataset processing
  server.timeout = 120000; // 2 minutes for large exports
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000; // 66 seconds
}

export default app; 