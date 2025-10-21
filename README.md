# AI2 Financial Platform 🚀

> **⚠️ COMMERCIAL SOFTWARE:** This software requires a paid license for any usage. Source code is visible for transparency and evaluation only.  
> **[Get License](https://ai2fin.com/pricing)** | **[30-Day Evaluation](https://ai2fin.com)**

## 🚀 Overview

AI2 Financial Platform is a comprehensive, modular financial management system built with enterprise-grade architecture. Designed for individuals, businesses, and developers, AI2 combines intelligent automation with powerful customization to transform how you manage finances.

**Licensing:** Source-visible commercial software. The source code is publicly available for transparency, security auditing, and evaluation, but **all usage requires a valid paid license**.

### Core Features

**Transaction Management**
- Smart categorization with AI-powered insights
- Bulk CSV import/export for seamless data migration
- Custom categories and automated rules
- Advanced filtering and search capabilities

**Analytics & Reporting**
- Real-time dashboards and visualizations
- Tax deduction analysis and optimization
- Spending patterns and trend analysis
- Customizable reports for any period

**Integrations & Automation**
- Bank feed connections for automatic sync
- Email processing for receipt extraction
- Multi-channel notifications (email, SMS, push)
- Webhook support for custom workflows

**Built for Scale**
- Microservices architecture for flexibility
- Self-hosting or managed cloud options
- Full API access for custom integrations
- Team collaboration and multi-user support

## 🏗️ Architecture

The platform follows a **microservices architecture** with 7 independent, scalable services:

```
AI2 Financial Platform
├── 📦 @ai2/shared              # Shared utilities, types, and configurations
├── 🏠 @ai2/core-app            # Main application server (Port 3001)
├── 🤖 @ai2/ai-modules          # AI-powered financial intelligence (Port 3002)
├── 🔌 @ai2/connectors          # External service integrations (Port 3003)
├── 📊 @ai2/analytics           # Advanced reporting and insights (Port 3004)
├── 🔔 @ai2/notifications       # Multi-channel notifications (Port 3005)
└── 💳 @ai2/subscription-service # Billing and subscription management (Port 3010)
```

## 📋 Table of Contents

- [Platform Services](#-platform-services)
- [Service Matrix](#-service-matrix)
- [AI Modules Deep Dive](#-ai-modules-deep-dive)
- [Quick Start](#-quick-start)
- [Deployment Models](#-deployment-models)
- [Production Deployment](#-production-deployment)
- [Performance & Scaling](#-performance--scaling)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Configuration](#-configuration)
- [Monitoring](#-monitoring)

## 🎯 Platform Services

### 🏠 Core App (`@ai2/core-app`)
**Port:** 3001 | **Essential:** Yes | **Dependencies:** None

The foundation of the platform providing:
- 💰 **Transaction Management**: Create, read, update, delete transactions
- 🏷️ **Category Management**: Organize transactions with custom categories
- 📁 **CSV Import/Export**: Bulk transaction processing
- 📊 **Dashboard**: Overview and basic analytics
- 👤 **User Management**: Authentication and user profiles

**Key Endpoints:**
- `GET /api/core/transactions` - Retrieve transactions
- `POST /api/core/transactions` - Create new transaction
- `GET /api/core/categories` - Get categories
- `POST /api/core/csv-import` - Import CSV data
- `GET /api/core/dashboard` - Dashboard data

### 🤖 AI Modules (`@ai2/ai-modules`)
**Port:** 3002 | **Essential:** No | **Dependencies:** None

Multi-agent AI system providing:
- 🔍 **Transaction Analysis**: Intelligent categorization
- 🏢 **Business Intelligence**: Expense pattern recognition
- 💼 **Tax Analysis**: Deduction identification and optimization
- 📈 **Predictive Insights**: Spending forecasts and recommendations
- 🔄 **Batch Processing**: High-volume transaction analysis

**AI Agents:**
- **Classification Agent**: Categorizes transactions using ML
- **Tax Agent**: Identifies tax-deductible expenses
- **Insights Agent**: Generates spending insights and recommendations
- **Learning Agent**: Improves accuracy based on user feedback

### 🔌 Connectors (`@ai2/connectors`)
**Port:** 3003 | **Essential:** No | **Dependencies:** None

External service integration hub:
- 🏦 **Bank Feed Integration**: Real-time bank data synchronization
- 📧 **Email Processing**: Extract financial data from emails
- 🔗 **API Connectors**: Third-party service integrations
- 🔄 **Data Synchronization**: Multi-source data consolidation

### 📊 Analytics (`@ai2/analytics`)
**Port:** 3004 | **Essential:** No | **Dependencies:** Core App

Advanced reporting and business intelligence:
- 📈 **Advanced Reports**: Detailed financial analysis
- 📤 **Data Export**: Multiple format exports (CSV, PDF, Excel)
- 🎯 **Business Insights**: Revenue and expense analysis
- 📊 **Data Visualization**: Charts and graphs
- 🔍 **Trend Analysis**: Historical pattern recognition

### 🔔 Notifications (`@ai2/notifications`)
**Port:** 3005 | **Essential:** No | **Dependencies:** None

Multi-channel notification system:
- 📧 **Email Notifications**: Transaction alerts and reports
- 📱 **SMS Notifications**: Critical alerts and reminders
- 📲 **Push Notifications**: Real-time mobile alerts
- 📝 **Template Management**: Customizable notification templates
- 🔗 **Webhook Support**: External system notifications

### 💳 Subscription Service (`@ai2/subscription-service`)
**Port:** 3010 | **Essential:** No | **Dependencies:** None

Enterprise billing and subscription management:
- 💰 **Billing Management**: Automated invoicing and payments
- 📋 **Subscription Plans**: Tiered service offerings
- 📊 **Usage Tracking**: Service utilization monitoring
- 💳 **Payment Processing**: Secure payment handling
- 📈 **Revenue Analytics**: Subscription business metrics

## 🎛️ Service Matrix

| Service | Required | Can Run Alone | Best With | Scales With |
|---------|----------|---------------|-----------|-------------|
| **Core App** | ✅ | ✅ | All Services | Users |
| **AI Modules** | ❌ | ✅ | Core, Analytics | Transactions |
| **Connectors** | ❌ | ✅ | Core, AI | Integrations |
| **Analytics** | ❌ | ❌ | Core, AI | Data Volume |
| **Notifications** | ❌ | ✅ | All Services | Events |
| **Subscription** | ❌ | ✅ | Core | Customers |

### 🔄 Service Dependencies

```mermaid
graph TB
    A[Core App] --> B[Analytics]
    A --> C[AI Modules]
    A --> D[Connectors]
    A --> E[Notifications]
    A --> F[Subscription Service]
    
    C --> E
    D --> C
    B --> E
    F --> E
```

## 🤖 AI Modules Deep Dive

### Multi-Agent Architecture

The AI Modules service implements a **multi-agent system** with specialized AI agents:

```
AI Modules Service (Port 3002)
├── 🧠 AI Orchestrator           # Coordinates all AI agents
├── 🔍 Classification Agent      # Transaction categorization
├── 💼 Tax Deduction Agent      # Tax optimization analysis
├── 📊 Insights Agent           # Business intelligence
├── 🎯 Learning Agent           # Continuous improvement
└── 🔄 Batch Processing Engine  # High-volume processing
```

#### 🧠 AI Orchestrator
- **Purpose**: Coordinates multiple AI agents and manages workflows
- **Capabilities**: Request routing, result aggregation, error handling
- **Endpoints**: `/api/ai/orchestrate`, `/api/ai/status`

#### 🔍 Classification Agent
- **Purpose**: Intelligent transaction categorization
- **ML Models**: Natural language processing, pattern recognition
- **Accuracy**: >85% with continuous learning
- **Endpoints**: `/api/ai/analyze-transaction`, `/api/ai/batch-analyze`

#### 💼 Tax Deduction Agent
- **Purpose**: Identifies tax-deductible expenses
- **Features**: Multi-jurisdiction support, real-time tax law updates
- **Compliance**: Follows local tax regulations
- **Endpoints**: `/api/ai/tax-analysis`, `/api/ai/deduction-suggestions`

#### 📊 Insights Agent
- **Purpose**: Generates actionable business insights
- **Analytics**: Spending patterns, budget recommendations, anomaly detection
- **Forecasting**: Predictive expense modeling
- **Endpoints**: `/api/ai/insights`, `/api/ai/recommendations`

#### 🎯 Learning Agent
- **Purpose**: Improves AI accuracy through user feedback
- **ML Pipeline**: Continuous model retraining
- **Personalization**: User-specific classification improvements
- **Endpoints**: `/api/ai/feedback`, `/api/ai/learn`

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd embracingearthspace

# Install dependencies
npm install

# Build all packages
npm run build:all
```

### Start All Services

```bash
# Option 1: Start all services
npm run start:all

# Option 2: Use our custom script
.\start-all-services.ps1

# Option 3: Start specific deployment
npm run start:premium  # Full platform
npm run start:core:standalone  # Core only
```

### Health Check

```bash
# Check all services
.\health-check-all-services.ps1

# Or use the npm script
npm run health:check
```

## 🎛️ Deployment Models

### 1. 🏠 **Core Only** (Standalone)
**Services**: Core App only  
**Use Case**: Basic financial management  
**Resources**: Minimal (1 service)

```bash
npm run start:core:standalone
```

### 2. 💼 **Premium** (AI-Enhanced)
**Services**: Core + AI Modules + Analytics  
**Use Case**: Intelligent financial management  
**Resources**: Medium (3 services)

```bash
npm run start:premium
```

### 3. 🏢 **Full Stack** (Complete Platform)
**Services**: All 6 services  
**Use Case**: Complete solution with all features  
**Resources**: High (6 services)

```bash
npm run start:all
```

## 🚀 Production Deployment

### Infrastructure Overview

- **Runtime**: Fly.io (stateless services with global distribution)
- **Database**: GCP Cloud SQL (PostgreSQL with automatic backups)
- **Storage**: Google Cloud Storage (for file uploads)
- **CDN/WAF**: Cloudflare (DDoS protection and caching)
- **Monitoring**: Prometheus + Grafana + Uptime Kuma
- **CI/CD**: GitHub Actions with automated deployments

### Quick Deployment Guide

1. **Setup Infrastructure**
   ```bash
   # Run the automated setup script
   chmod +x setup-deployment.sh
   ./setup-deployment.sh
   ```

2. **Configure Secrets** (GitHub Repository Settings)
   - `FLY_API_TOKEN` - From `flyctl auth token`
   - `GCP_PROJECT_ID` - Your GCP project ID
   - `OPENAI_API_KEY` - For AI services
   - `DATABASE_URL` - PostgreSQL connection string

3. **Deploy to Production**
   ```bash
   # Deploy to staging first
   npm run deploy:staging
   
   # Then deploy to production
   npm run deploy:production
   ```

### Production URLs
- **Application**: `https://app.ai2fin.com`
- **Status Page**: `https://status.ai2fin.com`
- **API**: `https://api.ai2fin.com/

For detailed deployment instructions, see [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

## ⚡ Performance & Scaling

### Cluster Mode Configuration

The platform includes production-grade cluster mode for maximum performance:

```bash
# Development mode (no clustering)
npm run start:core:standalone

# Cluster mode (4 workers)
CLUSTER_MODE=true npm start

# High-performance mode (8 workers + all optimizations)
npm run start:enterprise
```

### Scaling Phases

1. **Phase 1: Node.js Clustering** (Current)
   - 4-8 worker processes per instance
   - In-memory session management
   - Basic rate limiting

2. **Phase 2: Database Scaling** (With PostgreSQL + Redis)
   - Connection pooling
   - Redis caching layer
   - Advanced rate limiting

3. **Phase 3: Cloud Scale** (Full Multi-Region)
   - Multi-region deployment on Fly.io
   - Auto-scaling based on load
   - Global load balancing

### Performance Recommendations

**For Fly.io Deployment:**
- Use **single-process mode** per Fly.io instance (no clustering)
- Let Fly.io handle horizontal scaling across regions
- Enable autoscaling: `flyctl autoscale balanced min=2 max=10`

**For Self-Hosted/VPS:**
- Use **cluster mode** with 4-8 workers
- Enable all CPU cores for maximum throughput
- Monitor memory usage (4GB recommended per instance)

## 📚 API Documentation

### Core Endpoints

| Service | Base URL | Health Check | Documentation |
|---------|----------|--------------|---------------|
| Core App | `http://localhost:3001` | `/health` | [Core API](./ai2-core-app/README.md) |
| AI Modules | `http://localhost:3002` | `/health` | [AI API](./ai2-ai-modules/README.md) |
| Connectors | `http://localhost:3003` | `/health` | [Connectors API](./ai2-connectors/README.md) |
| Analytics | `http://localhost:3004` | `/health` | [Analytics API](./ai2-analytics/README.md) |
| Notifications | `http://localhost:3005` | `/health` | [Notifications API](./ai2-notifications/README.md) |
| Subscription | `http://localhost:3010` | `/health` | [Subscription API](./ai2-subscription-service/README.md) |

### Example API Calls

```bash
# Health check all services
curl http://localhost:3001/health
curl http://localhost:3002/health

# AI transaction analysis
curl -X POST http://localhost:3002/api/ai/analyze-transaction \
  -H "Content-Type: application/json" \
  -d '{"description":"Coffee shop","amount":-5.50,"date":"2025-07-03"}'

# Get transactions
curl http://localhost:3001/api/core/transactions?limit=10

# Get subscription plans
curl http://localhost:3010/api/subscription/plans
```

## 🛠️ Development

### Build System

```bash
# Build all packages
npm run build:all

# Build specific packages
npm run build:shared     # Shared utilities
npm run build:core       # Core app
npm run build:ai         # AI modules
npm run build:connectors # Connectors
npm run build:analytics  # Analytics
npm run build:notifications # Notifications
npm run build:subscription # Subscription service
```

### Testing

```bash
# Test all packages
npm run test:all

# Test specific packages
npm run test:core
npm run test:ai
npm run test:modules
```

### Linting

```bash
# Lint all packages
npm run lint:all

# Lint specific packages
npm run lint:core
npm run lint:modules
```

### Cleaning

```bash
# Clean all build artifacts
npm run clean:all

# Clean specific packages
npm run clean:core
npm run clean:modules
```

## ⚙️ Configuration

### Environment Variables

```bash
# Core Features
ENABLE_AI=true
ENABLE_SUBSCRIPTION=true
ENABLE_ANALYTICS=true
ENABLE_CONNECTORS=true
ENABLE_NOTIFICATIONS=true

# Service Ports
CORE_PORT=3001
AI_PORT=3002
CONNECTORS_PORT=3003
ANALYTICS_PORT=3004
NOTIFICATIONS_PORT=3005
SUBSCRIPTION_PORT=3010

# Performance Settings
CLUSTER_MODE=true          # Enable cluster mode
CLUSTER_WORKERS=4          # Number of worker processes
MEMORY_LIMIT=4096         # Memory limit per worker (MB)

# AI Configuration
OPENAI_API_KEY=your_openai_key
AI_MODEL=gpt-4

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ai2

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Production URLs
BRAND_URL=https://ai2fin.com
```

### Feature Flags

The platform uses feature flags for flexible deployment:

```typescript
// Available feature flags
{
  enableAI: boolean,
  enableSubscription: boolean,
  enableAnalytics: boolean,
  enableConnectors: boolean,
  enableNotifications: boolean,
  enableAdvancedReporting: boolean,
  enableBankFeed: boolean,
  enableEmailNotifications: boolean
}
```

## 📊 Monitoring

### Health Monitoring

All services provide health endpoints:

```bash
# Individual service health
GET /health

# Platform-wide health check
npm run health:check
```

### Production Monitoring Stack

- **Status Page**: Public uptime monitoring at `status.ai2fin.com`
- **Metrics**: Prometheus + Grafana dashboards
- **Alerts**: Configurable alerts for downtime, high CPU, memory issues
- **Logs**: Centralized logging with search capabilities

### Logging

Centralized logging with Winston:
- **Levels**: error, warn, info, debug
- **Formats**: JSON, structured
- **Outputs**: Console, file, external systems

### Metrics

Key performance indicators:
- **Response Times**: API endpoint performance
- **Throughput**: Requests per second
- **Error Rates**: Service reliability
- **AI Accuracy**: ML model performance
- **Resource Usage**: CPU, memory, disk

## 🔧 Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 3001-3005, 3010 are available
2. **Build Errors**: Run `npm run clean:all && npm run build:all`
3. **Service Dependencies**: Check service startup order
4. **AI Service Issues**: Verify OpenAI API key configuration

### Debug Mode

```bash
# Start services in debug mode
DEBUG=* npm run start:all

# Individual service debugging
DEBUG=ai2:* npm run start:ai
```

### Production Troubleshooting

```bash
# Check Fly.io logs
flyctl logs --app ai2-production

# SSH into container
flyctl ssh console --app ai2-production

# Check database connectivity
psql $DATABASE_URL -c "SELECT 1;"
```

## 📜 Licensing & Purchase

### Commercial License Required

**AI2 Financial Platform is commercial software.** The source code is publicly visible for transparency and evaluation, but **all usage requires a valid paid license**.

### Why Source-Visible?

We believe in transparency while maintaining sustainability:
- 🔍 **Security Auditing** - Verify security and privacy practices
- 🔐 **Trust** - See exactly what the software does
- 📋 **Compliance** - Audit for regulatory requirements
- 🎯 **Evaluation** - Assess technical fit before purchasing

### License Options

Visit **[ai2fin.com/pricing](https://ai2fin.com/pricing)** for:
- 👤 **Personal License** - For individuals
- 💼 **Business License** - For companies
- 🏢 **Enterprise License** - For large organizations
- 👨‍💻 **Developer License** - For development teams
- 🖥️ **Self-Hosted License** - Deploy on your infrastructure

### Evaluation Period

- ✅ **30-day evaluation** for assessment purposes
- ✅ View and test all features
- ✅ No credit card required for trial
- ⚠️ Must purchase license after 30 days for continued use

### Purchase & Support

**Get Licensed:** [ai2fin.com/pricing](https://ai2fin.com/pricing)  
**Sales Inquiries:** hi@ai2fin.com  
**Support:** Available to licensed users

## 🤝 Contributing

We welcome contributions from licensed users and contributors! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Note:** By contributing, you grant AI2 Financial Platform rights to use your contribution under our commercial license. Contributors may be eligible for licensing benefits.

**Ways to contribute:**
- 🐛 Report bugs and issues
- 💡 Suggest new features
- 🔧 Submit code improvements
- 📚 Improve documentation

## 📞 Support

- **Community**: [GitHub Discussions](../../discussions) - Ask questions and share ideas
- **Issues**: Create [GitHub issues](../../issues) for bugs and features
- **Documentation**: See individual service READMEs
- **Email**: hi@ai2fin.com
- **Status Page**: https://status.ai2fin.com

---

**AI2 Financial Platform** - Professional Financial Intelligence 🚀  
*Commercial Software • Source-Visible • Enterprise Ready*

💼 **Get Licensed:** [ai2fin.com/pricing](https://ai2fin.com/pricing) | 📧 **Contact:** hi@ai2fin.com | 📊 **Status:** [status.ai2fin.com](https://status.ai2fin.com)

---

© 2025 AI2 Financial Platform. All rights reserved. This is proprietary commercial software.