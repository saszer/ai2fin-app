# AI2 Subscription System

A complete, scalable subscription and billing system for the AI2 Enterprise Platform, powered by GoCardless for secure payment processing.

## 🏗️ Architecture

### Microservices Structure
```
ai2-core-app/          # Main application (port 3001)
├── Frontend (React)   # User interface
├── API Gateway        # Routes requests to microservices
└── Database (SQLite)  # Shared database

ai2-subscription-service/  # Subscription microservice (port 3010)
├── GoCardless Integration
├── Subscription Management
├── Payment Processing
└── Webhook Handling
```

### Database Schema
- **Subscription**: User subscription details and GoCardless IDs
- **SubscriptionPlan**: Available plans and pricing
- **SubscriptionPayment**: Payment history and tracking

## 🚀 Quick Start

### 1. Environment Setup

#### Core App (ai2-core-app)
```bash
# Database URL should point to the core app's database
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your_jwt_secret_here"
```

#### Subscription Service (ai2-subscription-service)
```bash
# Copy the environment template
cp env.subscription .env

# Configure GoCardless (get from GoCardless dashboard)
GOCARDLESS_ACCESS_TOKEN="your_gocardless_access_token"
GOCARDLESS_ENVIRONMENT="sandbox"  # or "live" for production
GOCARDLESS_WEBHOOK_SECRET="your_webhook_secret"

# Database should point to core app's database
DATABASE_URL="file:../ai2-core-app/prisma/dev.db"
JWT_SECRET="your_jwt_secret_here"
```

### 2. Start the System

#### Option A: Automated Startup
```powershell
# Run the startup script
.\start-subscription-system.ps1
```

#### Option B: Manual Startup
```bash
# Terminal 1: Start subscription service
cd ai2-subscription-service
npm install
npm run build
npm start

# Terminal 2: Start core app
cd ai2-core-app
npm install
npm run build
npm start

# Terminal 3: Start frontend (if needed)
cd ai2-core-app/client
npm start
```

### 3. Access the System
- **Frontend**: http://localhost:3000
- **Core API**: http://localhost:3001
- **Subscription API**: http://localhost:3010
- **Subscription Page**: http://localhost:3000/#/subscription

## 💳 GoCardless Integration

### Features
- **Direct Debit**: Secure bank-to-bank payments
- **Mobile App Support**: In-app browser with Apple Pay/Google Pay
- **Webhook Processing**: Real-time payment status updates
- **Retry Logic**: Automatic retry for failed payments (max 5 attempts)
- **Trial Period**: 3-day free trial for new subscriptions

### Setup Process
1. **Customer Creation**: Creates GoCardless customer record
2. **Mandate Setup**: Bank authorization for recurring payments
3. **Subscription Creation**: Sets up recurring billing
4. **Payment Processing**: Handles monthly payments automatically

### Webhook Events
- `subscriptions.created` - New subscription created
- `subscriptions.cancelled` - Subscription cancelled
- `payments.confirmed` - Payment successful
- `payments.failed` - Payment failed (triggers retry)

## 📊 Subscription Plans

### Current Plan: AI2 Premium
- **Price**: $23 AUD/month
- **Trial**: 3 days free
- **Features**:
  - All transactions management
  - Reports and trends
  - Categories management
  - ATO export
  - Travel expenses
  - Pattern analysis
  - Smart categorization
  - Tax analysis

### Free Features
- Patterns page
- Travel expenses page
- Personalize page

### Subscription-Required Features
- All transactions
- Reports and trends
- Categories management
- ATO export
- Pattern analysis
- Smart categorization
- Tax analysis
- Emails
- AI assistant

## 🔐 Security Features

### Authentication
- JWT-based authentication
- Token validation on all endpoints
- Secure token transmission

### Payment Security
- GoCardless PCI DSS compliance
- Bank-level security for direct debits
- No credit card data stored locally
- Webhook signature verification

### API Security
- Rate limiting on subscription endpoints
- CORS protection
- Input validation
- Audit logging

## 📡 API Endpoints

### Subscription Management
```http
GET    /api/subscription/plans          # Get available plans
GET    /api/subscription/status         # Get user subscription status
POST   /api/subscription/create         # Create new subscription
POST   /api/subscription/cancel         # Cancel subscription
POST   /api/subscription/reactivate     # Reactivate cancelled subscription
GET    /api/subscription/payments       # Get payment history
GET    /api/subscription/feature/:feature # Check feature access
```

### Webhook Endpoint
```http
POST   /api/subscription/webhook        # GoCardless webhook handler
```

### Admin Endpoints
```http
GET    /api/subscription/statistics     # Get subscription statistics
POST   /api/subscription/init-plans     # Initialize default plans
```

## 🔧 Development

### Database Migrations
```bash
# Core app
cd ai2-core-app
npx prisma migrate dev --name add-subscription-models

# Subscription service
cd ai2-subscription-service
npx prisma migrate dev
```

### Testing
```bash
# Test subscription service
cd ai2-subscription-service
npm test

# Test core app
cd ai2-core-app
npm test
```

### Environment Variables

#### Core App
```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your_jwt_secret"
SUBSCRIPTION_SERVICE_URL="http://localhost:3010"
```

#### Subscription Service
```env
DATABASE_URL="file:../ai2-core-app/prisma/dev.db"
JWT_SECRET="your_jwt_secret"
GOCARDLESS_ACCESS_TOKEN="your_gocardless_token"
GOCARDLESS_ENVIRONMENT="sandbox"
GOCARDLESS_WEBHOOK_SECRET="your_webhook_secret"
SUBSCRIPTION_PORT=3010
```

## 🚀 Production Deployment

### GoCardless Production Setup
1. Switch `GOCARDLESS_ENVIRONMENT` to `"live"`
2. Update `GOCARDLESS_ACCESS_TOKEN` with production token
3. Configure webhook URL in GoCardless dashboard
4. Set up proper SSL certificates

### Database Migration
```bash
# Use PostgreSQL for production
DATABASE_URL="postgresql://user:password@localhost:5432/ai2_production"

# Run migrations
npx prisma migrate deploy
```

### Environment Configuration
```env
NODE_ENV=production
GOCARDLESS_ENVIRONMENT=live
SUBSCRIPTION_SERVICE_URL=https://your-domain.com:3010
```

## 📈 Monitoring & Analytics

### Health Checks
- **Core App**: `GET /health`
- **Subscription Service**: `GET /health`

### Metrics
- Subscription conversion rates
- Payment success rates
- Feature usage analytics
- Revenue tracking

### Logging
- Payment processing logs
- Webhook event logs
- Error tracking
- Audit trails

## 🔄 Future Enhancements

### Planned Features
- Multiple pricing tiers
- Usage-based billing
- Promotional codes
- Referral system
- Advanced analytics dashboard
- Email notifications
- Mobile app integration

### Scalability Improvements
- Separate subscription database
- Redis caching
- Load balancing
- Microservice communication via message queues

## 🆘 Troubleshooting

### Common Issues

#### Subscription Service Not Starting
```bash
# Check if port 3010 is available
netstat -an | findstr :3010

# Kill existing processes
taskkill /F /IM node.exe
```

#### GoCardless Integration Issues
```bash
# Verify environment variables
echo $GOCARDLESS_ACCESS_TOKEN
echo $GOCARDLESS_ENVIRONMENT

# Check webhook configuration
curl -X POST http://localhost:3010/api/subscription/webhook
```

#### Database Connection Issues
```bash
# Verify database path
ls -la ai2-core-app/prisma/dev.db

# Reset database if needed
rm ai2-core-app/prisma/dev.db
npx prisma migrate reset
```

### Support
For technical support or questions about the subscription system, please refer to the main AI2 documentation or contact the development team.

---

**Built with ❤️ for embracingearth.space** 