# AI2 Enterprise Platform - Comprehensive Architecture Documentation

## Executive Summary

The AI2 Enterprise Platform is a sophisticated, enterprise-grade financial management system built on a microservices architecture. This documentation serves as the definitive guide for AI development, providing comprehensive insights into system architecture, module connections, development patterns, and best practices to ensure enterprise-grade quality and performance.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Service Architecture](#service-architecture)
3. [Database Architecture](#database-architecture)
4. [Shared Library System](#shared-library-system)
5. [Build and Deployment](#build-and-deployment)
6. [Development Guidelines](#development-guidelines)
7. [Enterprise Considerations](#enterprise-considerations)
8. [AI Development Rules](#ai-development-rules)

---

## Architecture Overview

### System Philosophy

The AI2 Enterprise Platform follows these core architectural principles:

1. **Microservices Architecture**: Loosely coupled, independently deployable services
2. **AI-First Design**: Deep integration of AI capabilities throughout the system
3. **Enterprise Scalability**: Designed to scale from startup to enterprise
4. **Feature Flag Driven**: Flexible deployment configurations
5. **Database-Centric**: Comprehensive data model with strong relationships
6. **Type Safety**: Full TypeScript implementation with strict typing

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI2 Enterprise Platform                  │
├─────────────────────────────────────────────────────────────┤
│                     Frontend Layer                          │
│                    (React/Next.js)                          │
├─────────────────────────────────────────────────────────────┤
│                      API Gateway                            │
│                   (ai2-core-app)                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │ AI Modules  │ │ Connectors  │ │ Analytics   │ │ Notifs │ │
│  │   :3002     │ │   :3003     │ │   :3004     │ │ :3005  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            Subscription Service (:3010)                 │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Shared Library                           │
│                    (@ai2/shared)                            │
├─────────────────────────────────────────────────────────────┤
│                    Database Layer                           │
│                (SQLite/PostgreSQL)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Service Architecture

### 1. Core App (ai2-core-app) - Port 3001

**Role**: Main application orchestrator, API gateway, and database management

**Key Responsibilities**:
- User authentication and authorization
- Database operations (Prisma ORM)
- Service discovery and orchestration
- Transaction and expense management
- CSV import/export functionality
- Health monitoring and process management

**Critical Components**:
```typescript
// Service structure
src/
├── server.ts              // Main entry point
├── database/
│   ├── prisma.ts         // Database connection
│   └── operations.ts     // Database operations
├── routes/
│   ├── auth.ts          // Authentication routes
│   ├── transactions.ts  // Transaction management
│   ├── bills.ts         // Bill management
│   └── ai.ts            // AI service proxy
├── middleware/
│   ├── auth.ts          // JWT authentication
│   ├── rateLimit.ts     // Rate limiting
│   └── validation.ts    // Input validation
└── services/
    ├── serviceDiscovery.ts // Service registry
    └── healthCheck.ts     // Health monitoring
```

**Database Schema Management**:
- **Prisma ORM**: Type-safe database operations
- **Migration Management**: Automated schema evolution
- **Performance Optimization**: Strategic indexing and query optimization
- **Relationship Management**: Complex entity relationships

**Service Discovery Pattern**:
```typescript
// Service discovery implementation
export class ServiceDiscovery {
  private services: Map<string, ServiceInfo> = new Map();
  
  async checkAllServices(): Promise<ServiceStatus[]> {
    // Health check all registered services
    // Implement failover and load balancing
    // Return service availability status
  }
}
```

### 2. AI Modules (ai2-ai-modules) - Port 3002

**Role**: AI-powered financial analysis and automation

**Multi-Agent Architecture**:
```typescript
// AI service factory pattern
AIOrchestrator
├── TransactionClassificationAgent
├── TaxDeductionAnalysisAgent
├── RecurringPatternDetectionAgent
├── AnomalyDetectionAgent
└── InsightsGenerationAgent
```

**Key Features**:
- **OpenAI Integration**: GPT-4 powered transaction analysis
- **Batch Processing**: High-volume transaction processing
- **Confidence Scoring**: AI analysis confidence metrics
- **Fallback Mechanisms**: Mock responses for API failures
- **Country-Specific Rules**: Pluggable tax law implementations

**AI Analysis Pipeline**:
```typescript
interface AIAnalysisResult {
  category: string;
  confidence: number;
  taxDeductible: boolean;
  reasoning: string;
  businessUsePercentage: number;
  aiAnalyzedAt: Date;
}
```

### 3. Subscription Service (ai2-subscription-service) - Port 3010

**Role**: Billing, subscription management, and feature gating

**Subscription Tiers**:
- **FREE_TRIAL**: 1-day trial, 10 AI tokens
- **LITE**: $11/month, 100 tokens, basic features
- **PRO**: $22/month, 500 tokens, advanced features
- **ELITE**: $44/month, 2000 tokens, enterprise features

**Key Components**:
```typescript
// Subscription management
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: PlanLimits;
  tokenAllocation: number;
}
```

### 4. Analytics Service (ai2-analytics) - Port 3004

**Role**: Advanced reporting and data analytics

**Key Features**:
- Custom financial report generation
- Multi-format exports (CSV, PDF, Excel)
- Spending trend analysis
- Tax optimization insights
- Real-time dashboard data

### 5. Connectors Service (ai2-connectors) - Port 3003

**Role**: External system integrations

**Integration Framework**:
- Bank feed integration (extensible provider system)
- Email transaction extraction
- Third-party API connectors
- Real-time data synchronization

### 6. Notifications Service (ai2-notifications) - Port 3005

**Role**: Multi-channel communication system

**Notification Channels**:
- Email notifications
- SMS alerts
- Push notifications
- Webhook integrations

---

## Database Architecture

### Entity Relationship Overview

```
User (Central Hub)
├── Expenses (1:N)
├── Bills (1:N)
├── BankTransactions (1:N)
├── Categories (1:N)
├── TaxDeductions (1:N)
├── CSVUploads (1:N)
└── UserActivity (1:N)

BankTransaction
├── → Expense (1:1 optional)
├── → BillOccurrence (1:1 optional)
├── → Category (N:1 optional)
└── → Email (N:M)

BillPattern
└── BillOccurrence (1:N)
    └── → BankTransaction (1:1 optional)
```

### Core Database Entities

#### 1. User Entity
```sql
-- Central user management
CREATE TABLE User (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  businessName TEXT,
  businessType TEXT,
  profession TEXT,
  industry TEXT,
  aiProfile TEXT,  -- JSON user profile
  
  -- Localization
  countryCode TEXT DEFAULT 'AU',
  currency TEXT DEFAULT 'AUD',
  
  -- Preferences
  defaultConversionMode TEXT DEFAULT 'expense',
  defaultViewMode TEXT DEFAULT 'list',
  
  -- Integration flags
  gmailConnected BOOLEAN DEFAULT false,
  bankConnected BOOLEAN DEFAULT false,
  
  -- Audit fields
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Transaction Management
```sql
-- Primary transaction entity
CREATE TABLE BankTransaction (
  id TEXT PRIMARY KEY,
  transactionId TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  date DATETIME NOT NULL,
  
  -- Enhanced categorization
  primaryType TEXT DEFAULT 'expense',
  secondaryType TEXT,
  
  -- Recurring bill system
  isRecurringBill BOOLEAN DEFAULT false,
  billFrequency TEXT,
  baseRecurringAmount REAL,
  
  -- AI analysis
  aiTaxAnalysis TEXT,  -- JSON analysis
  aiSuggestedTaxDeductible BOOLEAN,
  aiConfidence REAL,
  aiReasoning TEXT,
  classificationSource TEXT DEFAULT 'unknown',
  classificationConfidence REAL DEFAULT 0.0,
  
  -- Audit
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);
```

#### 3. AI Analysis Storage
```sql
-- Consistent AI analysis pattern
aiTaxAnalysis TEXT,        -- JSON: Complete analysis
aiSuggestedTaxDeductible BOOLEAN,  -- AI suggestion
aiConfidence REAL,         -- Confidence score (0-1)
aiReasoning TEXT,          -- Human-readable reasoning
aiAnalyzedAt DATETIME,     -- Analysis timestamp
userOverrideAI BOOLEAN DEFAULT false,  -- User override flag
```

### Performance Optimizations

#### 1. Strategic Indexing
```sql
-- High-performance indexes
CREATE INDEX idx_user_email ON User(email);
CREATE INDEX idx_transaction_user_date ON BankTransaction(userId, date);
CREATE INDEX idx_transaction_recurring ON BankTransaction(isRecurringBill);
CREATE INDEX idx_bill_pattern_frequency ON BillPattern(frequency);
CREATE INDEX idx_user_activity_entity ON UserActivity(userId, entityType);
```

#### 2. Query Optimization Patterns
- **Composite indexes** for common query patterns
- **Partial indexes** for filtered queries
- **JSON field indexing** for AI analysis results
- **Foreign key optimization** for relationship queries

---

## Shared Library System

### Architecture Overview

The `@ai2/shared` library provides the foundation for type safety, configuration management, and common utilities across all microservices.

### Type System

#### 1. Core Domain Types
```typescript
// User and authentication
export interface User {
  id: string;
  email: string;
  businessName?: string;
  businessType?: string;
  profession?: string;
  aiProfile?: string;
  subscriptionInfo?: SubscriptionInfo;
}

// Transaction types
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  primaryType: 'expense' | 'income' | 'transfer';
  secondaryType?: 'bill' | 'one-time' | 'capital';
  aiAnalysis?: AIAnalysisResult;
}

// AI analysis result
export interface AIAnalysisResult {
  category: string;
  confidence: number;
  taxDeductible: boolean;
  reasoning: string;
  businessUsePercentage: number;
  analyzedAt: Date;
}
```

#### 2. API Response Types
```typescript
// Standardized API responses
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
```

### Configuration Management

#### 1. Feature Flag System
```typescript
export interface FeatureFlags {
  enableAI: boolean;
  enableSubscription: boolean;
  enableAnalytics: boolean;
  enableConnectors: boolean;
  enableNotifications: boolean;
  enableAdvancedReporting: boolean;
}

export class FeatureFlagManager {
  static getConfiguration(deploymentType: DeploymentType): FeatureFlags {
    switch (deploymentType) {
      case 'CORE_ONLY':
        return { enableAI: false, enableSubscription: false, ... };
      case 'PREMIUM':
        return { enableAI: true, enableSubscription: true, ... };
      case 'ENTERPRISE':
        return { /* all features enabled */ };
    }
  }
}
```

#### 2. Business Model Configuration
```typescript
export interface BusinessModel {
  type: 'CORE' | 'PREMIUM' | 'ENTERPRISE';
  features: string[];
  limits: PlanLimits;
  pricing: PricingConfig;
}
```

### Security Middleware

#### 1. Authentication System
```typescript
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // JWT token validation
  // Role-based access control
  // Audit logging
  // Rate limiting
};

export const validateAPIKey = (req: Request, res: Response, next: NextFunction) => {
  // API key validation for service-to-service communication
  // Token-based access control
  // Usage tracking
};
```

#### 2. Input Validation
```typescript
export const validateInput = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Input validation with Joi
    // XSS protection
    // SQL injection prevention
    // Business rule validation
  };
};
```

### Utilities Library

#### 1. Data Transformation
```typescript
export const formatCurrency = (amount: number, currency: string = 'AUD'): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  // Generic grouping utility
};
```

#### 2. Async Operations
```typescript
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  // Retry mechanism with exponential backoff
};

export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> => {
  // Promise timeout handling
};
```

---

## Build and Deployment

### Build System

#### 1. NPM Workspaces Configuration
```json
{
  "workspaces": [
    "shared",
    "ai2-core-app",
    "ai2-ai-modules",
    "ai2-connectors",
    "ai2-analytics",
    "ai2-notifications",
    "ai2-subscription-service"
  ]
}
```

#### 2. Build Dependencies
```bash
# Build order (critical for dependency resolution)
1. npm run build:shared     # Build shared library first
2. npm run build:modules    # Build all services in parallel
3. npm run build:core       # Build core application
```

#### 3. TypeScript Configuration
```json
// Composite build configuration
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "paths": {
      "@ai2/shared/*": ["../shared/src/*"]
    }
  },
  "references": [
    { "path": "../shared" }
  ]
}
```

### Deployment Configurations

#### 1. Scaling Phases
```typescript
export enum ScalingPhase {
  DEVELOPMENT = 'development',
  CLUSTER = 'cluster',
  DATABASE = 'database',
  ENTERPRISE = 'enterprise'
}

export const getScalingConfig = (phase: ScalingPhase): ScalingConfig => {
  switch (phase) {
    case ScalingPhase.DEVELOPMENT:
      return {
        workers: 1,
        memoryLimit: '512MB',
        rateLimit: 100,
        database: 'sqlite'
      };
    case ScalingPhase.ENTERPRISE:
      return {
        workers: 'auto',
        memoryLimit: '2GB',
        rateLimit: 'unlimited',
        database: 'postgresql',
        redis: true,
        loadBalancer: true
      };
  }
};
```

#### 2. Environment Management
```bash
# Core features
ENABLE_AI=true
ENABLE_SUBSCRIPTION=true
ENABLE_ANALYTICS=true
ENABLE_CONNECTORS=true
ENABLE_NOTIFICATIONS=true

# Scaling configuration
SCALING_PHASE=enterprise
CLUSTER_WORKERS=8
MEMORY_LIMIT=8192

# Database configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/ai2
DATABASE_READ_REPLICAS=postgresql://...

# AI configuration
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4
```

### Docker Configuration

#### 1. Multi-Stage Build
```dockerfile
FROM node:18-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY . .
RUN npm run build:all

FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

#### 2. Docker Compose
```yaml
version: '3.8'
services:
  core-app:
    build: .
    ports:
      - "3001:3001"
    depends_on:
      - database
      - redis
    environment:
      - NODE_ENV=production
      - SCALING_PHASE=enterprise
  
  database:
    image: postgres:15
    environment:
      POSTGRES_DB: ai2
      POSTGRES_USER: ai2user
      POSTGRES_PASSWORD: secure_password
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

---

## Development Guidelines

### Code Quality Standards

#### 1. TypeScript Best Practices
```typescript
// Always use strict type definitions
interface TransactionCreate {
  readonly description: string;
  readonly amount: number;
  readonly date: Date;
  readonly userId: string;
}

// Use discriminated unions for type safety
type AIAnalysisStatus = 
  | { status: 'pending' }
  | { status: 'completed'; result: AIAnalysisResult }
  | { status: 'failed'; error: string };

// Implement proper error handling
class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}
```

#### 2. Database Operation Patterns
```typescript
// Always use transactions for multi-table operations
export const createTransactionWithAI = async (
  data: TransactionCreate,
  prisma: PrismaClient
): Promise<Transaction> => {
  return await prisma.$transaction(async (tx) => {
    const transaction = await tx.bankTransaction.create({
      data: {
        ...data,
        classificationSource: 'ai',
        aiAnalyzedAt: new Date()
      }
    });
    
    // Create AI analysis record
    await tx.aiLearningFeedback.create({
      data: {
        transactionId: transaction.id,
        userId: data.userId,
        originalAnalysis: JSON.stringify(aiResult)
      }
    });
    
    return transaction;
  });
};
```

#### 3. Service Communication Patterns
```typescript
// Implement circuit breaker for external services
export class AIServiceClient {
  private circuitBreaker = new CircuitBreaker(this.callAIService, {
    timeout: 30000,
    errorThresholdPercentage: 50,
    resetTimeout: 60000
  });

  async analyzeTransaction(transaction: Transaction): Promise<AIAnalysisResult> {
    try {
      return await this.circuitBreaker.fire(transaction);
    } catch (error) {
      // Fallback to rule-based analysis
      return this.fallbackAnalysis(transaction);
    }
  }
}
```

### Testing Strategy

#### 1. Unit Testing
```typescript
// Test AI analysis functions
describe('AIAnalysisService', () => {
  it('should correctly categorize restaurant expenses', async () => {
    const transaction = {
      description: 'McDonald\'s Restaurant',
      amount: 15.50,
      date: new Date()
    };
    
    const result = await aiService.analyzeTransaction(transaction);
    
    expect(result.category).toBe('Meals & Entertainment');
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.taxDeductible).toBe(true);
  });
});
```

#### 2. Integration Testing
```typescript
// Test service-to-service communication
describe('Service Integration', () => {
  it('should handle AI service failure gracefully', async () => {
    // Mock AI service failure
    mockAIService.mockImplementation(() => {
      throw new Error('AI service unavailable');
    });
    
    const response = await request(app)
      .post('/api/transactions/analyze')
      .send(transactionData);
    
    expect(response.status).toBe(200);
    expect(response.body.data.analysis).toBeDefined();
    expect(response.body.data.analysis.source).toBe('fallback');
  });
});
```

### Error Handling Patterns

#### 1. Standardized Error Responses
```typescript
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errorResponse: APIResponse<null> = {
    success: false,
    error: error.message,
    timestamp: new Date(),
    data: null
  };
  
  if (error instanceof AIServiceError) {
    res.status(503).json({
      ...errorResponse,
      retryable: error.retryable
    });
  } else {
    res.status(500).json(errorResponse);
  }
};
```

#### 2. Graceful Degradation
```typescript
export const withFallback = async <T>(
  primaryOperation: () => Promise<T>,
  fallbackOperation: () => Promise<T>
): Promise<T> => {
  try {
    return await primaryOperation();
  } catch (error) {
    logger.warn('Primary operation failed, using fallback', { error });
    return await fallbackOperation();
  }
};
```

---

## Enterprise Considerations

### Performance Optimization

#### 1. Database Performance
```sql
-- Index optimization for common queries
CREATE INDEX CONCURRENTLY idx_transactions_user_date 
ON bank_transactions(user_id, date DESC);

CREATE INDEX CONCURRENTLY idx_ai_analysis_confidence 
ON bank_transactions(ai_confidence DESC) 
WHERE ai_confidence IS NOT NULL;

-- Partial index for recurring bills
CREATE INDEX CONCURRENTLY idx_recurring_bills 
ON bank_transactions(bill_frequency, next_due_date) 
WHERE is_recurring_bill = true;
```

#### 2. Caching Strategy
```typescript
// Redis caching for AI analysis results
export class AIAnalysisCache {
  private redis: Redis;
  
  async getCachedAnalysis(transactionHash: string): Promise<AIAnalysisResult | null> {
    const cached = await this.redis.get(`ai:analysis:${transactionHash}`);
    return cached ? JSON.parse(cached) : null;
  }
  
  async setCachedAnalysis(
    transactionHash: string, 
    result: AIAnalysisResult
  ): Promise<void> {
    await this.redis.setex(
      `ai:analysis:${transactionHash}`,
      3600, // 1 hour cache
      JSON.stringify(result)
    );
  }
}
```

#### 3. Rate Limiting
```typescript
// Advanced rate limiting with different tiers
export const createRateLimiter = (tier: SubscriptionTier) => {
  const limits = {
    FREE_TRIAL: { requests: 100, window: 3600 },
    LITE: { requests: 1000, window: 3600 },
    PRO: { requests: 5000, window: 3600 },
    ELITE: { requests: 20000, window: 3600 }
  };
  
  return rateLimit({
    windowMs: limits[tier].window * 1000,
    max: limits[tier].requests,
    message: `Rate limit exceeded for ${tier} tier`
  });
};
```

### Security Implementation

#### 1. Authentication & Authorization
```typescript
// JWT with role-based access control
export const authorize = (requiredRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      
      if (!hasRole(decoded.role, requiredRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};
```

#### 2. Data Encryption
```typescript
// Sensitive data encryption
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;
  
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('ai2-platform'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
}
```

### Monitoring and Observability

#### 1. Health Monitoring
```typescript
// Comprehensive health checks
export class HealthChecker {
  async checkSystemHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkAIService(),
      this.checkExternalAPIs()
    ]);
    
    return {
      status: checks.every(check => check.status === 'fulfilled') ? 'healthy' : 'degraded',
      checks: checks.map(this.formatCheck),
      timestamp: new Date()
    };
  }
}
```

#### 2. Performance Monitoring
```typescript
// Performance metrics collection
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    
    // Log performance metrics
    metrics.histogram('http_request_duration_ms', duration, {
      method: req.method,
      route: req.route?.path,
      status_code: res.statusCode
    });
  });
  
  next();
};
```

---

## AI Development Rules

### Core Principles

#### 1. **Feature Preservation Rule**
```typescript
// CRITICAL: Always preserve existing functionality
// Before implementing new features, ensure all existing tests pass
// Implement feature flags for new functionality

// Example: Adding new AI analysis
export const enhancedAIAnalysis = async (transaction: Transaction) => {
  // Check feature flag
  if (!featureFlags.enableEnhancedAI) {
    return await legacyAIAnalysis(transaction);
  }
  
  try {
    const result = await newAIAnalysis(transaction);
    // Validate result matches expected format
    validateAIResult(result);
    return result;
  } catch (error) {
    // Fallback to legacy analysis
    logger.warn('Enhanced AI failed, using legacy', { error });
    return await legacyAIAnalysis(transaction);
  }
};
```

#### 2. **Database Integrity Rule**
```typescript
// CRITICAL: Always use transactions for related operations
// Never modify schema without proper migrations
// Always validate data before database operations

export const safeDataOperation = async (data: any, prisma: PrismaClient) => {
  // Validate input
  const validatedData = validateSchema(data);
  
  // Use transaction for atomicity
  return await prisma.$transaction(async (tx) => {
    // Perform all related operations
    const result = await tx.someTable.create({ data: validatedData });
    
    // Update related records
    await tx.relatedTable.update({
      where: { id: result.relatedId },
      data: { status: 'updated' }
    });
    
    return result;
  });
};
```

#### 3. **Type Safety Rule**
```typescript
// CRITICAL: Always use TypeScript strictly
// Never use 'any' type
// Always define interfaces for data structures

// Good: Strict typing
interface AIAnalysisRequest {
  readonly transaction: Transaction;
  readonly userId: string;
  readonly analysisType: 'categorization' | 'tax' | 'insights';
}

// Bad: Using 'any'
// const analyzeTransaction = (data: any) => { ... }

// Good: Proper typing
const analyzeTransaction = (request: AIAnalysisRequest): Promise<AIAnalysisResult> => {
  // Implementation with type safety
};
```

#### 4. **Error Handling Rule**
```typescript
// CRITICAL: Always implement proper error handling
// Never let errors crash the service
// Always provide meaningful error messages

export const robustOperation = async (input: any): Promise<Result<Success, Error>> => {
  try {
    // Validate input
    const validInput = validateInput(input);
    
    // Perform operation
    const result = await performOperation(validInput);
    
    // Validate result
    validateResult(result);
    
    return { success: true, data: result };
  } catch (error) {
    // Log error for debugging
    logger.error('Operation failed', { error, input });
    
    // Return structured error
    return {
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: 'Unable to process request',
        retryable: error instanceof RetryableError
      }
    };
  }
};
```

### Implementation Guidelines

#### 1. **Service Integration Pattern**
```typescript
// When adding new services or features:

// 1. Update shared types
interface NewFeatureRequest {
  // Define strict interface
}

// 2. Implement service with health checks
export class NewFeatureService {
  async healthCheck(): Promise<HealthStatus> {
    // Implement health checking
  }
  
  async processRequest(request: NewFeatureRequest): Promise<Result> {
    // Implement with error handling
  }
}

// 3. Register with service discovery
serviceRegistry.register('new-feature', {
  port: 3006,
  healthEndpoint: '/health',
  capabilities: ['feature1', 'feature2']
});

// 4. Update feature flags
featureFlags.enableNewFeature = process.env.ENABLE_NEW_FEATURE === 'true';
```

#### 2. **Database Schema Evolution**
```sql
-- When modifying database schema:

-- 1. Create migration file
-- migrations/001_add_new_feature.sql

-- 2. Add new columns with defaults
ALTER TABLE transactions 
ADD COLUMN new_feature_data TEXT DEFAULT NULL;

-- 3. Create new tables with proper indexes
CREATE TABLE new_feature_table (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_new_feature_user ON new_feature_table(user_id);

-- 4. Update Prisma schema
model NewFeature {
  id        String   @id @default(cuid())
  userId    String
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}
```

#### 3. **AI Analysis Extension**
```typescript
// When extending AI capabilities:

// 1. Extend AI result interface
interface ExtendedAIResult extends AIAnalysisResult {
  newInsight: string;
  advancedMetrics: AdvancedMetrics;
}

// 2. Implement with backward compatibility
export const extendedAIAnalysis = async (
  transaction: Transaction
): Promise<ExtendedAIResult> => {
  // Get base analysis
  const baseResult = await baseAIAnalysis(transaction);
  
  // Add new insights
  const newInsight = await generateNewInsight(transaction);
  const advancedMetrics = await calculateAdvancedMetrics(transaction);
  
  return {
    ...baseResult,
    newInsight,
    advancedMetrics
  };
};

// 3. Update database schema for new fields
-- ALTER TABLE transactions ADD COLUMN extended_ai_analysis TEXT;
```

### Performance Guidelines

#### 1. **Query Optimization**
```typescript
// Always optimize database queries
// Use proper indexing
// Implement pagination

export const getTransactionsOptimized = async (
  userId: string,
  filters: TransactionFilters,
  pagination: PaginationParams
): Promise<PaginatedResponse<Transaction>> => {
  // Use indexed queries
  const transactions = await prisma.bankTransaction.findMany({
    where: {
      userId, // Indexed field first
      date: {
        gte: filters.startDate,
        lte: filters.endDate
      },
      category: filters.category ? { in: filters.category } : undefined
    },
    orderBy: [
      { date: 'desc' }, // Use indexed field for sorting
      { id: 'desc' }    // Secondary sort for consistency
    ],
    skip: pagination.offset,
    take: pagination.limit,
    include: {
      category_rel: true,
      user: {
        select: { id: true, email: true } // Select only needed fields
      }
    }
  });
  
  // Get count efficiently
  const total = await prisma.bankTransaction.count({
    where: { userId, /* same filters */ }
  });
  
  return {
    data: transactions,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      hasMore: total > pagination.offset + pagination.limit
    }
  };
};
```

#### 2. **Caching Strategy**
```typescript
// Implement intelligent caching
export class SmartCache {
  private cache = new Map<string, CacheEntry>();
  
  async get<T>(key: string, fetcher: () => Promise<T>, ttl: number = 3600): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl * 1000) {
      return cached.data;
    }
    
    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
  
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

### Security Guidelines

#### 1. **Input Validation**
```typescript
// Always validate and sanitize input
import Joi from 'joi';

const transactionSchema = Joi.object({
  description: Joi.string().trim().max(500).required(),
  amount: Joi.number().precision(2).required(),
  date: Joi.date().max('now').required(),
  categoryId: Joi.string().uuid().optional()
});

export const validateTransaction = (data: any): Transaction => {
  const { error, value } = transactionSchema.validate(data, {
    stripUnknown: true,
    abortEarly: false
  });
  
  if (error) {
    throw new ValidationError(error.details.map(d => d.message));
  }
  
  return value;
};
```

#### 2. **Authorization Checks**
```typescript
// Always verify user permissions
export const checkResourceOwnership = async (
  userId: string,
  resourceId: string,
  resourceType: string
): Promise<boolean> => {
  const resource = await prisma[resourceType].findUnique({
    where: { id: resourceId },
    select: { userId: true }
  });
  
  return resource?.userId === userId;
};

// Use in routes
export const getTransaction = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  
  // Check ownership
  if (!await checkResourceOwnership(userId, id, 'bankTransaction')) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Proceed with operation
  const transaction = await prisma.bankTransaction.findUnique({
    where: { id }
  });
  
  res.json({ data: transaction });
};
```

### Code Review Checklist

#### Before Submitting Code:
1. ✅ **All existing tests pass**
2. ✅ **New functionality has tests**
3. ✅ **TypeScript compilation succeeds**
4. ✅ **No database schema changes without migrations**
5. ✅ **Proper error handling implemented**
6. ✅ **Input validation added**
7. ✅ **Authorization checks in place**
8. ✅ **Performance impact assessed**
9. ✅ **Feature flags implemented for new features**
10. ✅ **Documentation updated**

### Deployment Safety

#### 1. **Feature Flag Implementation**
```typescript
// Always use feature flags for new functionality
export const newFeatureHandler = async (req: Request, res: Response) => {
  if (!featureFlags.enableNewFeature) {
    return res.status(404).json({ error: 'Feature not available' });
  }
  
  try {
    const result = await newFeatureService.process(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('New feature failed', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

#### 2. **Database Migration Safety**
```typescript
// Always implement reversible migrations
export const migration = {
  up: async (prisma: PrismaClient) => {
    // Add new functionality
    await prisma.$executeRaw`
      ALTER TABLE transactions 
      ADD COLUMN new_field TEXT DEFAULT NULL;
    `;
  },
  
  down: async (prisma: PrismaClient) => {
    // Remove changes if needed
    await prisma.$executeRaw`
      ALTER TABLE transactions 
      DROP COLUMN new_field;
    `;
  }
};
```

---

## Conclusion

This comprehensive architecture documentation provides the foundation for maintaining and extending the AI2 Enterprise Platform. By following these guidelines, developers can ensure:

1. **Feature preservation** - New functionality doesn't break existing features
2. **Enterprise quality** - Code meets enterprise standards for reliability and performance
3. **Scalability** - System can grow from startup to enterprise scale
4. **Security** - Proper authentication, authorization, and data protection
5. **Maintainability** - Clean, well-documented, and testable code

The platform's microservices architecture, comprehensive type system, and robust deployment configurations provide a solid foundation for building enterprise-grade financial management solutions with integrated AI capabilities.

Remember: **Always prioritize stability and user experience over feature velocity. A working system is better than a broken system with more features.**

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "Analyze project structure and service dependencies", "status": "completed", "priority": "high"}, {"id": "2", "content": "Study shared utilities and types", "status": "completed", "priority": "high"}, {"id": "3", "content": "Examine each service's implementation", "status": "completed", "priority": "high"}, {"id": "4", "content": "Analyze database schema and relationships", "status": "completed", "priority": "high"}, {"id": "5", "content": "Study build and deployment configuration", "status": "completed", "priority": "medium"}, {"id": "6", "content": "Create comprehensive architecture documentation", "status": "completed", "priority": "high"}]