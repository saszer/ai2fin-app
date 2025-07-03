# AI2 Enterprise Platform 🏢

## 🚀 Overview

AI2 Enterprise Platform is a comprehensive, modular financial management system designed for enterprise-scale deployment. The platform leverages artificial intelligence to provide intelligent transaction categorization, tax deduction analysis, advanced analytics, and automated financial insights.

## 🏗️ Architecture

The platform follows a **microservices architecture** with 7 independent, scalable services:

```
AI2 Enterprise Platform
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

### 3. 🏢 **Enterprise** (Full Platform)
**Services**: All 6 services  
**Use Case**: Complete enterprise solution  
**Resources**: High (6 services)

```bash
npm run start:all
```

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

# AI Configuration
OPENAI_API_KEY=your_openai_key
AI_MODEL=gpt-4

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ai2
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

---

**AI2 Enterprise Platform** - Intelligent Financial Management at Scale 🚀 