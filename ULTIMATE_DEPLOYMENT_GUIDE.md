# 🚀 AI2 Enterprise Platform - Ultimate Deployment Guide

## 🎯 Complete Setup & Deployment Instructions

This guide provides comprehensive, step-by-step instructions for deploying the AI2 Enterprise Platform in any configuration.

## 📋 Pre-Deployment Checklist

### System Requirements
- ✅ **Node.js**: Version 18.0 or higher
- ✅ **npm**: Version 9.0 or higher  
- ✅ **Git**: Latest version
- ✅ **PowerShell**: For Windows users
- ✅ **Memory**: Minimum 4GB RAM recommended
- ✅ **Storage**: Minimum 10GB free space

### Port Availability Check
Ensure these ports are available:
- ✅ **3001**: Core App
- ✅ **3002**: AI Modules
- ✅ **3003**: Connectors  
- ✅ **3004**: Analytics
- ✅ **3005**: Notifications
- ✅ **3010**: Subscription Service

### Verify Port Availability (Windows)
```powershell
# Check if ports are free
netstat -an | findstr ":3001"
netstat -an | findstr ":3002"
netstat -an | findstr ":3003"
netstat -an | findstr ":3004"
netstat -an | findstr ":3005"
netstat -an | findstr ":3010"

# No output means ports are available
```

### Verify Port Availability (Linux/Mac)
```bash
# Check if ports are free
sudo lsof -i :3001
sudo lsof -i :3002
sudo lsof -i :3003
sudo lsof -i :3004
sudo lsof -i :3005
sudo lsof -i :3010

# No output means ports are available
```

## 🔽 Step 1: Download and Setup

### Clone Repository
```bash
# Clone the repository
git clone <repository-url>
cd embracingearthspace

# Verify structure
ls -la
# Should see: shared/, ai2-core-app/, ai2-ai-modules/, etc.
```

### Install Dependencies
```bash
# Install root dependencies
npm install

# This will automatically trigger:
# - Shared package build
# - All package dependencies installation
```

### Verify Installation
```bash
# Check if all packages have node_modules
ls shared/node_modules/
ls ai2-core-app/node_modules/
ls ai2-ai-modules/node_modules/
ls ai2-connectors/node_modules/
ls ai2-analytics/node_modules/
ls ai2-notifications/node_modules/
ls ai2-subscription-service/node_modules/
```

## 🔨 Step 2: Build All Packages

### Complete Build Process
```bash
# Build all packages in correct order
npm run build:all

# This executes:
# 1. npm run build:shared      (builds shared utilities)
# 2. npm run build:modules     (builds all service modules)
# 3. npm run build:core        (builds core app)
```

### Verify Build Success
```bash
# Check build outputs
ls shared/dist/
ls ai2-core-app/dist/
ls ai2-ai-modules/dist/
ls ai2-connectors/dist/
ls ai2-analytics/dist/
ls ai2-notifications/dist/
ls ai2-subscription-service/dist/

# Each should contain compiled JavaScript files
```

### Build Troubleshooting
If builds fail:

```bash
# Clean and rebuild
npm run clean:all
npm run build:all

# Or build packages individually
npm run build:shared
npm run build:core
npm run build:ai
npm run build:connectors
npm run build:analytics
npm run build:notifications
npm run build:subscription
```

## 🚀 Step 3: Deployment Options

### Option 1: 🏠 Core Only Deployment (Free)

**Use Case**: Personal financial tracking, basic features only

```bash
# Method 1: Using npm script
npm run start:core:standalone

# Method 2: Manual start
cd ai2-core-app
npm start
```

**Services Started**: 
- ✅ Core App (Port 3001)

**Features Available**:
- ✅ Transaction management
- ✅ Category organization
- ✅ CSV import/export
- ✅ Basic dashboard
- ❌ AI features disabled

**Verification**:
```bash
# Check core app health
curl http://localhost:3001/health

# Should return: {"status":"healthy","service":"core-app",...}
```

### Option 2: 💡 AI-Enhanced Deployment (Free)

**Use Case**: Personal use with intelligent categorization

```bash
# Start core and AI services
npm run start:core &
npm run start:ai &

# Wait for services to start
sleep 10

# Verify both services
curl http://localhost:3001/health
curl http://localhost:3002/health
```

**Services Started**:
- ✅ Core App (Port 3001)
- ✅ AI Modules (Port 3002)

**Features Available**:
- ✅ Everything in Core Only
- ✅ AI transaction categorization
- ✅ Tax deduction analysis
- ✅ Spending insights

### Option 3: 📊 Premium Deployment ($29.99/month)

**Use Case**: Small business with advanced analytics needs

```bash
# Start premium services
npm run start:premium

# This starts: Core + AI + Analytics + Notifications
```

**Services Started**:
- ✅ Core App (Port 3001)
- ✅ AI Modules (Port 3002)
- ✅ Analytics (Port 3004)
- ✅ Notifications (Port 3005)

**Features Available**:
- ✅ Everything in AI-Enhanced
- ✅ Advanced reporting
- ✅ Data export (CSV, Excel, PDF)
- ✅ Business insights
- ✅ Email notifications

### Option 4: 🔗 Connected Business ($49.99/month)

**Use Case**: Business with bank integrations and external data sources

```bash
# Start connected business services
npm run start:core &
npm run start:ai &
npm run start:connectors &
npm run start:analytics &
npm run start:notifications &

# Wait for all services
sleep 15
```

**Services Started**:
- ✅ Core App (Port 3001)
- ✅ AI Modules (Port 3002)
- ✅ Connectors (Port 3003)
- ✅ Analytics (Port 3004)
- ✅ Notifications (Port 3005)

**Features Available**:
- ✅ Everything in Premium
- ✅ Bank feed integration
- ✅ Email financial data extraction
- ✅ Third-party API connections

### Option 5: 🏢 Full Enterprise ($99.99/month)

**Use Case**: Large organization with complete platform needs

```bash
# Start all services
npm run start:all

# This starts all 6 services
```

**Services Started**:
- ✅ Core App (Port 3001)
- ✅ AI Modules (Port 3002)
- ✅ Connectors (Port 3003)
- ✅ Analytics (Port 3004)
- ✅ Notifications (Port 3005)
- ✅ Subscription Service (Port 3010)

**Features Available**:
- ✅ Everything in Connected Business
- ✅ Enterprise billing management
- ✅ Multi-tenant support
- ✅ Advanced subscription plans
- ✅ Usage tracking and analytics

## 🔍 Step 4: Verify Deployment

### Comprehensive Health Check
```bash
# Run complete health check
.\health-check-all-services.ps1

# Expected output:
# Healthy Services: X / X
# Platform Health: 100%
# STATUS: ALL SYSTEMS OPERATIONAL
```

### Manual Service Verification

#### Check Individual Services
```bash
# Core App
curl http://localhost:3001/health
curl http://localhost:3001/api/core/status

# AI Modules  
curl http://localhost:3002/health
curl http://localhost:3002/api/ai/status

# Connectors
curl http://localhost:3003/health
curl http://localhost:3003/api/connectors/status

# Analytics
curl http://localhost:3004/health
curl http://localhost:3004/api/analytics/status

# Notifications
curl http://localhost:3005/health
curl http://localhost:3005/api/notifications/status

# Subscription Service
curl http://localhost:3010/health
curl http://localhost:3010/api/subscription/status
```

#### Test Key Functionality

**Test Transaction Creation**:
```bash
# Create a test transaction
curl -X POST http://localhost:3001/api/core/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Test Coffee Purchase",
    "amount": -5.50,
    "date": "2025-07-03",
    "category": "Food & Dining"
  }'
```

**Test AI Analysis** (if AI service is running):
```bash
# Analyze a transaction with AI
curl -X POST http://localhost:3002/api/ai/analyze-transaction \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Amazon AWS Services",
    "amount": -125.50,
    "date": "2025-07-03"
  }'
```

**Test Dashboard Data**:
```bash
# Get dashboard information
curl http://localhost:3001/api/core/dashboard
```

## 🌐 Step 5: Access the Platform

### Web Interface (If Available)
```
Primary Application: http://localhost:3001
AI Service Dashboard: http://localhost:3002
Analytics Dashboard: http://localhost:3004
```

### API Endpoints

#### Core App Endpoints
```
Base URL: http://localhost:3001

GET  /health                     # Service health
GET  /api/core/status           # Service status
GET  /api/core/transactions     # List transactions
POST /api/core/transactions     # Create transaction
GET  /api/core/categories       # List categories
POST /api/core/csv-import       # Import CSV
GET  /api/core/dashboard        # Dashboard data
```

#### AI Modules Endpoints
```
Base URL: http://localhost:3002

GET  /health                           # Service health
GET  /api/ai/status                   # AI service status
POST /api/ai/analyze-transaction      # Analyze single transaction
POST /api/ai/batch-analyze           # Batch analysis
GET  /api/ai/insights                # Business insights
```

## 🔧 Step 6: Configuration

### Environment Configuration

#### Basic Configuration
Create `.env` file in root directory:
```bash
# Core Configuration
NODE_ENV=production
LOG_LEVEL=info

# Service Ports (optional, uses defaults)
CORE_PORT=3001
AI_PORT=3002
CONNECTORS_PORT=3003
ANALYTICS_PORT=3004
NOTIFICATIONS_PORT=3005
SUBSCRIPTION_PORT=3010

# Feature Flags
ENABLE_AI=true
ENABLE_SUBSCRIPTION=true
ENABLE_ANALYTICS=true
ENABLE_CONNECTORS=true
ENABLE_NOTIFICATIONS=true
```

#### AI Configuration (Optional)
```bash
# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key
AI_MODEL=gpt-4
AI_TIMEOUT=30000
AI_BATCH_SIZE=100

# AI Features
ENABLE_AI_CATEGORIES=true
ENABLE_AI_TAX_DEDUCTION=true
ENABLE_AI_INSIGHTS=true
ENABLE_AI_LEARNING=true
```

#### Database Configuration (Production)
```bash
# Database (SQLite for development, PostgreSQL for production)
DATABASE_URL=sqlite://./ai2.db
# or for production:
# DATABASE_URL=postgresql://username:password@localhost:5432/ai2

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379
```

### Security Configuration
```bash
# Security Settings
JWT_SECRET=your_jwt_secret_here
API_RATE_LIMIT=1000
SESSION_TIMEOUT=3600
ENABLE_CORS=true
CORS_ORIGIN=http://localhost:3000
```

## 🔄 Step 7: Process Management

### Using npm Scripts
```bash
# Start all services
npm run start:all

# Start specific combinations
npm run start:premium
npm run start:core:standalone

# Stop all services (Ctrl+C in the terminal)
```

### Using PM2 (Production)
```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'ai2-core',
      cwd: './ai2-core-app',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: 3001 }
    },
    {
      name: 'ai2-ai-modules',
      cwd: './ai2-ai-modules',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: 3002 }
    },
    {
      name: 'ai2-connectors',
      cwd: './ai2-connectors',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: 3003 }
    },
    {
      name: 'ai2-analytics',
      cwd: './ai2-analytics',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: 3004 }
    },
    {
      name: 'ai2-notifications',
      cwd: './ai2-notifications',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: 3005 }
    },
    {
      name: 'ai2-subscription',
      cwd: './ai2-subscription-service',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: 3010 }
    }
  ]
};
EOF

# Start all services with PM2
pm2 start ecosystem.config.js

# Monitor services
pm2 status
pm2 logs
pm2 monit
```

### Using Docker
```dockerfile
# Create Dockerfile
cat > Dockerfile << EOF
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY ai2-core-app/package*.json ./ai2-core-app/
COPY ai2-ai-modules/package*.json ./ai2-ai-modules/
COPY ai2-connectors/package*.json ./ai2-connectors/
COPY ai2-analytics/package*.json ./ai2-analytics/
COPY ai2-notifications/package*.json ./ai2-notifications/
COPY ai2-subscription-service/package*.json ./ai2-subscription-service/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build all packages
RUN npm run build:all

# Expose ports
EXPOSE 3001 3002 3003 3004 3005 3010

# Start all services
CMD ["npm", "run", "start:all"]
EOF

# Build and run Docker container
docker build -t ai2-platform .
docker run -p 3001:3001 -p 3002:3002 -p 3003:3003 -p 3004:3004 -p 3005:3005 -p 3010:3010 ai2-platform
```

## 📊 Step 8: Monitoring and Maintenance

### Real-time Monitoring
```bash
# Continuous health monitoring
while true; do
  echo "=== Health Check $(date) ==="
  .\health-check-all-services.ps1
  sleep 60
done
```

### Log Monitoring
```bash
# Monitor logs (if using PM2)
pm2 logs

# Monitor specific service
pm2 logs ai2-core

# Monitor system resources
pm2 monit
```

### Performance Monitoring
```bash
# Check service response times
time curl http://localhost:3001/health
time curl http://localhost:3002/health

# Monitor memory usage
ps aux | grep node

# Monitor disk usage
df -h
```

## 🔧 Troubleshooting Guide

### Common Issues and Solutions

#### Port Already in Use
```bash
# Find process using port
netstat -tulpn | grep :3001

# Kill process
kill -9 <PID>

# Or use different port
export CORE_PORT=3011
npm run start:core
```

#### Build Failures
```bash
# Clean and rebuild
npm run clean:all
npm install
npm run build:all

# Check Node.js version
node --version  # Should be 18+
npm --version   # Should be 9+
```

#### Service Won't Start
```bash
# Check logs
npm run start:core 2>&1 | tee core.log

# Check dependencies
cd ai2-core-app
npm list

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Memory Issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run start:all

# Monitor memory usage
top | grep node
```

#### AI Service Issues
```bash
# Check OpenAI API key
echo $OPENAI_API_KEY

# Test AI service separately
cd ai2-ai-modules
npm start

# Check AI service logs
tail -f ai-modules.log
```

### Recovery Procedures

#### Service Recovery
```bash
# Restart specific service
pm2 restart ai2-core

# Restart all services
pm2 restart all

# Reload services with zero downtime
pm2 reload all
```

#### Database Recovery
```bash
# Backup database
cp ai2.db ai2.db.backup

# Reset database (development only)
rm ai2.db
npm run db:migrate
npm run db:seed
```

## 🎯 Success Verification

### Final Verification Checklist

#### ✅ All Services Running
```bash
# Should return "STATUS: ALL SYSTEMS OPERATIONAL"
.\health-check-all-services.ps1
```

#### ✅ API Endpoints Responding
```bash
# Test core endpoints
curl http://localhost:3001/api/core/status

# Test AI endpoints (if enabled)
curl http://localhost:3002/api/ai/status

# Test all endpoints
for port in 3001 3002 3003 3004 3005 3010; do
  echo "Testing port $port..."
  curl -f http://localhost:$port/health || echo "Port $port not responding"
done
```

#### ✅ Functional Testing
```bash
# Create transaction
curl -X POST http://localhost:3001/api/core/transactions \
  -H "Content-Type: application/json" \
  -d '{"description":"Test","amount":-10,"date":"2025-07-03"}'

# Get transactions
curl http://localhost:3001/api/core/transactions

# Test AI analysis (if enabled)
curl -X POST http://localhost:3002/api/ai/analyze-transaction \
  -H "Content-Type: application/json" \
  -d '{"description":"Coffee shop","amount":-5.50,"date":"2025-07-03"}'
```

#### ✅ Performance Check
```bash
# Response time should be < 500ms
time curl http://localhost:3001/api/core/transactions

# Memory usage should be reasonable
ps aux | grep node | awk '{print $4 "%", $11}' | sort -nr
```

## 🎉 Deployment Complete!

### Success Confirmation

If all checks pass, you should see:
- ✅ All services responding to health checks
- ✅ API endpoints returning valid JSON
- ✅ No error messages in logs
- ✅ Reasonable response times (<500ms)
- ✅ Stable memory usage

### Next Steps

1. **Configure External Integrations** (optional):
   - Set up OpenAI API for enhanced AI features
   - Configure email service for notifications
   - Set up payment processor for subscriptions

2. **Production Hardening** (recommended):
   - Set up HTTPS/SSL certificates
   - Configure production database
   - Set up monitoring and alerting
   - Implement backup procedures

3. **User Onboarding**:
   - Create initial user accounts
   - Import existing financial data
   - Configure categories and preferences

### Support Resources

- **Documentation**: See individual service README files
- **API Reference**: Check `/api/docs` endpoints (if available)
- **Community**: GitHub Issues and Discussions
- **Enterprise Support**: Contact for enterprise-level support

---

**🎯 SUCCESS!** Your AI2 Enterprise Platform is now fully deployed and operational! 🚀 