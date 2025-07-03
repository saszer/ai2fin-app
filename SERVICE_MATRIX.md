# 🎛️ AI2 Enterprise Platform - Service Matrix

## 🎯 Service Combinations Matrix

This matrix shows which services can run together and their optimal combinations for different use cases.

## 📊 Complete Service Matrix

| Scenario | Core | AI | Connectors | Analytics | Notifications | Subscription | Use Case | Cost |
|----------|------|----|-----------|-----------|--------------|-----------| ---------|------|
| **Minimal** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | Basic financial tracking | Free |
| **AI-Enhanced** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Smart categorization | Free |
| **Analytics Plus** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | Business insights | Free |
| **Connected** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | Bank integration | Free |
| **Notified** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | Alert system | Free |
| **Premium** | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | Small business | $29.99/mo |
| **Connected Premium** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Integrated business | $49.99/mo |
| **Enterprise** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Full platform | $99.99/mo |

## 🚀 Deployment Scenarios

### 1. 🏠 Personal/Hobby Use
**Services**: Core App only
**Command**: `npm run start:core:standalone`
**Resources**: 512MB RAM, 1 vCPU
**Features**:
- ✅ Transaction management
- ✅ Basic categories  
- ✅ CSV import/export
- ✅ Simple dashboard
- ❌ AI features
- ❌ Integrations
- ❌ Advanced analytics

```bash
# Start minimal setup
npm run start:core:standalone

# Environment variables
export ENABLE_AI=false
export ENABLE_SUBSCRIPTION=false
export ENABLE_ANALYTICS=false
export ENABLE_CONNECTORS=false
export ENABLE_NOTIFICATIONS=false
```

### 2. 💡 AI-Enhanced Personal
**Services**: Core App + AI Modules
**Command**: `npm run start:core && npm run start:ai`
**Resources**: 1GB RAM, 2 vCPU
**Features**:
- ✅ Everything in Personal
- ✅ AI transaction categorization
- ✅ Tax deduction analysis
- ✅ Spending insights
- ❌ Bank integrations
- ❌ Advanced reporting

```bash
# Start AI-enhanced setup
npm run start:core &
npm run start:ai &

# Environment variables
export ENABLE_AI=true
export ENABLE_AI_CATEGORIES=true
export ENABLE_AI_TAX_DEDUCTION=true
export ENABLE_AI_INSIGHTS=true
```

### 3. 📊 Business Analytics
**Services**: Core App + AI Modules + Analytics
**Command**: `npm run start:premium`
**Resources**: 2GB RAM, 2 vCPU
**Features**:
- ✅ Everything in AI-Enhanced
- ✅ Advanced reporting
- ✅ Data export (CSV, Excel, PDF)
- ✅ Trend analysis
- ✅ Business KPIs
- ❌ Bank feeds
- ❌ Email processing

```bash
# Start premium setup
npm run start:premium

# Environment variables
export ENABLE_AI=true
export ENABLE_ANALYTICS=true
export ENABLE_ADVANCED_REPORTING=true
export ENABLE_EXPORTS=true
```

### 4. 🔗 Connected Business
**Services**: Core + AI + Connectors + Analytics + Notifications
**Resources**: 4GB RAM, 4 vCPU
**Features**:
- ✅ Everything in Business Analytics
- ✅ Bank feed integration
- ✅ Email financial data extraction
- ✅ Multi-channel notifications
- ✅ Real-time alerts
- ❌ Subscription management

```bash
# Start connected business setup
npm run start:core &
npm run start:ai &
npm run start:connectors &
npm run start:analytics &
npm run start:notifications &

# Environment variables
export ENABLE_BANK_FEED=true
export ENABLE_EMAIL_CONNECTOR=true
export ENABLE_NOTIFICATIONS=true
export ENABLE_EMAIL_NOTIFICATIONS=true
export ENABLE_SMS_NOTIFICATIONS=true
```

### 5. 🏢 Full Enterprise
**Services**: All services
**Command**: `npm run start:all`
**Resources**: 8GB RAM, 8 vCPU
**Features**:
- ✅ Everything in Connected Business
- ✅ Subscription management
- ✅ Multi-tenant support
- ✅ Enterprise billing
- ✅ Advanced security
- ✅ Priority support

```bash
# Start full enterprise setup
npm run start:all

# Environment variables
export ENABLE_SUBSCRIPTION=true
export ENABLE_BILLING=true
export ENABLE_USAGE_TRACKING=true
export ENABLE_MULTI_TENANT=true
export ENABLE_ENTERPRISE_FEATURES=true
```

## 🔧 Service Dependencies

### Dependency Graph
```
Core App (Required)
├── Can run standalone ✅
├── Required by: Analytics
└── Enhanced by: AI Modules, Connectors, Notifications

AI Modules (Optional)
├── Can run standalone ✅
├── Enhanced by: Core App data
└── Enhances: Analytics insights

Connectors (Optional)
├── Can run standalone ✅
├── Enhanced by: Core App for data storage
└── Provides: External data sources

Analytics (Optional)
├── Requires: Core App ❌
├── Enhanced by: AI Modules
└── Provides: Business intelligence

Notifications (Optional)
├── Can run standalone ✅
├── Enhanced by: All services for events
└── Provides: Multi-channel alerts

Subscription (Optional)
├── Can run standalone ✅
├── Enhanced by: Core App for billing data
└── Provides: Enterprise billing
```

### Service Communication Matrix

| From ↓ / To → | Core | AI | Connectors | Analytics | Notifications | Subscription |
|---------------|------|----|-----------|-----------|--------------|-----------| 
| **Core** | - | HTTP | HTTP | HTTP | HTTP | HTTP |
| **AI** | HTTP | - | - | HTTP | HTTP | - |
| **Connectors** | HTTP | HTTP | - | - | HTTP | - |
| **Analytics** | HTTP | HTTP | - | - | HTTP | - |
| **Notifications** | - | - | - | - | - | HTTP |
| **Subscription** | HTTP | - | - | HTTP | HTTP | - |

## 🎯 Use Case Scenarios

### Scenario 1: Freelancer/Consultant
**Profile**: Individual professional tracking business expenses
**Services**: Core + AI
**Monthly Transactions**: <1,000
**Key Features**: AI categorization, tax deduction analysis
**Cost**: Free

**Configuration**:
```json
{
  "deployment": "ai-enhanced",
  "services": ["core", "ai"],
  "features": {
    "aiCategories": true,
    "taxAnalysis": true,
    "basicReporting": true
  }
}
```

### Scenario 2: Small Business (10-50 employees)
**Profile**: Growing business with multiple revenue streams
**Services**: Core + AI + Analytics + Notifications
**Monthly Transactions**: 1,000-10,000
**Key Features**: Advanced reporting, automated alerts
**Cost**: $29.99/month

**Configuration**:
```json
{
  "deployment": "premium",
  "services": ["core", "ai", "analytics", "notifications"],
  "features": {
    "advancedReporting": true,
    "emailNotifications": true,
    "dataExport": true,
    "businessInsights": true
  }
}
```

### Scenario 3: Mid-size Company (50-500 employees)
**Profile**: Established business with multiple bank accounts
**Services**: Core + AI + Connectors + Analytics + Notifications
**Monthly Transactions**: 10,000-100,000
**Key Features**: Bank feed integration, email processing
**Cost**: $49.99/month

**Configuration**:
```json
{
  "deployment": "connected-premium",
  "services": ["core", "ai", "connectors", "analytics", "notifications"],
  "features": {
    "bankFeed": true,
    "emailConnector": true,
    "realtimeSync": true,
    "advancedAlerts": true
  }
}
```

### Scenario 4: Enterprise (500+ employees)
**Profile**: Large corporation with complex financial operations
**Services**: All services
**Monthly Transactions**: 100,000+
**Key Features**: Multi-tenant, enterprise billing, priority support
**Cost**: $99.99/month + usage-based pricing

**Configuration**:
```json
{
  "deployment": "enterprise",
  "services": ["core", "ai", "connectors", "analytics", "notifications", "subscription"],
  "features": {
    "multiTenant": true,
    "enterpriseBilling": true,
    "customIntegrations": true,
    "prioritySupport": true,
    "ssoIntegration": true
  }
}
```

## 🔧 Configuration Templates

### Template 1: Development Environment
```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug

# Service Ports
CORE_PORT=3001
AI_PORT=3002
CONNECTORS_PORT=3003
ANALYTICS_PORT=3004
NOTIFICATIONS_PORT=3005
SUBSCRIPTION_PORT=3010

# Features (All enabled for testing)
ENABLE_AI=true
ENABLE_SUBSCRIPTION=true
ENABLE_ANALYTICS=true
ENABLE_CONNECTORS=true
ENABLE_NOTIFICATIONS=true

# Development Database
DATABASE_URL=sqlite://./dev.db
REDIS_URL=redis://localhost:6379

# Mock External Services
MOCK_BANK_APIS=true
MOCK_EMAIL_SERVICE=true
MOCK_PAYMENT_PROCESSOR=true
```

### Template 2: Production Core-Only
```bash
# .env.production.core
NODE_ENV=production
LOG_LEVEL=warn

# Service Ports
CORE_PORT=3001

# Features (Core only)
ENABLE_AI=false
ENABLE_SUBSCRIPTION=false
ENABLE_ANALYTICS=false
ENABLE_CONNECTORS=false
ENABLE_NOTIFICATIONS=false

# Production Database
DATABASE_URL=postgresql://user:pass@prod-db:5432/ai2_core
REDIS_URL=redis://prod-redis:6379

# Security
JWT_SECRET=your_jwt_secret_here
API_RATE_LIMIT=1000
SESSION_TIMEOUT=3600
```

### Template 3: Production Enterprise
```bash
# .env.production.enterprise
NODE_ENV=production
LOG_LEVEL=info

# Service Ports
CORE_PORT=3001
AI_PORT=3002
CONNECTORS_PORT=3003
ANALYTICS_PORT=3004
NOTIFICATIONS_PORT=3005
SUBSCRIPTION_PORT=3010

# Features (All enabled)
ENABLE_AI=true
ENABLE_SUBSCRIPTION=true
ENABLE_ANALYTICS=true
ENABLE_CONNECTORS=true
ENABLE_NOTIFICATIONS=true

# AI Configuration
OPENAI_API_KEY=your_openai_key
AI_MODEL=gpt-4
AI_BATCH_SIZE=1000

# Database Cluster
DATABASE_URL=postgresql://user:pass@prod-cluster:5432/ai2_enterprise
DATABASE_READ_REPLICAS=db-read-1:5432,db-read-2:5432
REDIS_CLUSTER=redis-1:6379,redis-2:6379,redis-3:6379

# External Integrations
STRIPE_SECRET_KEY=sk_live_...
TWILIO_ACCOUNT_SID=your_twilio_sid
SENDGRID_API_KEY=your_sendgrid_key

# Security
JWT_SECRET=your_production_jwt_secret
API_RATE_LIMIT=10000
ENABLE_2FA=true
ENABLE_AUDIT_LOG=true
```

## 🚀 Quick Start Commands

### Start Specific Combinations

```bash
# Core only
npm run start:core:standalone

# Core + AI
npm run start:core &
npm run start:ai &

# Premium (Core + AI + Analytics)
npm run start:premium

# Connected (Core + AI + Connectors + Analytics + Notifications)
npm run start:core &
npm run start:ai &
npm run start:connectors &
npm run start:analytics &
npm run start:notifications &

# Enterprise (All services)
npm run start:all
```

### Build Specific Combinations

```bash
# Build core only
npm run build:core

# Build AI stack
npm run build:shared && npm run build:ai

# Build premium stack
npm run build:shared && npm run build:core && npm run build:ai && npm run build:analytics

# Build all
npm run build:all
```

### Health Check Combinations

```bash
# Check core only
curl http://localhost:3001/health

# Check AI stack
curl http://localhost:3001/health && curl http://localhost:3002/health

# Check all services
.\health-check-all-services.ps1
```

## 📊 Resource Requirements

### Minimum Requirements by Deployment

| Deployment | RAM | CPU | Storage | Network |
|------------|-----|-----|---------|---------|
| **Core Only** | 512MB | 1 vCPU | 5GB | 100 Mbps |
| **AI Enhanced** | 1GB | 2 vCPU | 10GB | 200 Mbps |
| **Premium** | 2GB | 2 vCPU | 20GB | 500 Mbps |
| **Connected** | 4GB | 4 vCPU | 50GB | 1 Gbps |
| **Enterprise** | 8GB | 8 vCPU | 100GB | 2 Gbps |

### Recommended Production Requirements

| Deployment | RAM | CPU | Storage | Load Balancer | Database |
|------------|-----|-----|---------|---------------|----------|
| **Core Only** | 2GB | 2 vCPU | 20GB | Optional | PostgreSQL |
| **AI Enhanced** | 4GB | 4 vCPU | 50GB | Recommended | PostgreSQL + Redis |
| **Premium** | 8GB | 6 vCPU | 100GB | Required | PostgreSQL + Redis |
| **Connected** | 16GB | 8 vCPU | 200GB | Required | PostgreSQL Cluster + Redis |
| **Enterprise** | 32GB | 16 vCPU | 500GB | Required | PostgreSQL HA + Redis Cluster |

## 🔍 Monitoring by Deployment

### Core Monitoring
- **Metrics**: Response time, error rate, memory usage
- **Alerts**: Service down, high error rate
- **Dashboards**: Basic performance metrics

### AI Enhanced Monitoring
- **Metrics**: + AI accuracy, model inference time
- **Alerts**: + AI service down, accuracy drop
- **Dashboards**: + AI performance metrics

### Premium Monitoring  
- **Metrics**: + Analytics processing time, report generation
- **Alerts**: + Analytics failure, report timeout
- **Dashboards**: + Business intelligence metrics

### Enterprise Monitoring
- **Metrics**: + All service metrics, cross-service latency
- **Alerts**: + Comprehensive alerting, cascade failure detection
- **Dashboards**: + Full platform observability

---

**AI2 Service Matrix** - Choose Your Perfect Configuration 🎛️ 