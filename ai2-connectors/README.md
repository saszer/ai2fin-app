# 🔗 AI2 Connectors - Integration Services

## Overview

The AI2 Connectors package provides enterprise-grade integrations with banks, email providers, and third-party financial services. It enables automatic transaction import and real-time financial data synchronization.

## Features

### 🏦 Bank Integrations
- **Multi-bank Support**: Connect to multiple bank accounts
- **Real-time Sync**: Automatic transaction synchronization
- **Secure Authentication**: OAuth2 and API key management
- **Transaction Parsing**: Intelligent transaction data extraction
- **Balance Tracking**: Real-time account balance monitoring

### 📧 Email Integrations
- **Receipt Processing**: Extract transaction data from email receipts
- **Invoice Parsing**: Automatic invoice data extraction
- **Multi-provider Support**: Gmail, Outlook, Yahoo, and more
- **Smart Filtering**: Intelligent email categorization
- **Batch Processing**: Bulk email processing capabilities

### 🔌 API Integrations
- **Third-party Services**: Integration with financial APIs
- **Webhook Support**: Real-time data synchronization
- **Rate Limiting**: Intelligent API usage management
- **Error Handling**: Robust error recovery and retry logic
- **Data Validation**: Comprehensive data integrity checks

## Quick Start

### Prerequisites
- Node.js 18+
- Bank API credentials
- Email service credentials
- AI2 Shared package

### Installation
```bash
cd ai2-connectors
npm install
npm run build
```

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Bank Connections
```
GET /api/connectors/banks
POST /api/connectors/banks
DELETE /api/connectors/banks/:id
```

### Email Connections
```
GET /api/connectors/email
POST /api/connectors/email
DELETE /api/connectors/email/:id
```

### Transaction Sync
```
POST /api/connectors/sync
GET /api/connectors/status
```

## Configuration

### Environment Variables
```bash
CONNECTORS_PORT=3005
BANK_API_KEY=your_bank_api_key
EMAIL_CLIENT_ID=your_email_client_id
EMAIL_CLIENT_SECRET=your_email_client_secret
WEBHOOK_SECRET=your_webhook_secret
```

### Feature Flags
The connectors respect the following feature flags:
- `ENABLE_BANK_FEED`: Bank integration features
- `ENABLE_EMAIL_CONNECTOR`: Email integration features
- `ENABLE_API_CONNECTOR`: Third-party API integrations

## Business Models

### Enterprise Tier
- All bank integrations
- Email receipt processing
- Advanced API integrations
- Priority support

### Premium Tier
- Basic bank connections
- Email integration
- Standard API support

## Integration

### With Core App
- Automatic transaction import
- Real-time balance updates
- Receipt data extraction

### With AI Modules
- Enhanced transaction categorization
- Receipt data analysis
- Intelligent data validation

## Security

- OAuth2 authentication
- API key encryption
- Data encryption in transit
- Secure credential storage
- Audit logging

## Performance

- Connection pooling
- Rate limiting
- Caching strategies
- Batch processing
- Error recovery

## License

Proprietary - AI2 Enterprise Platform

---

*Enterprise-grade integrations • Secure and scalable • Powering financial automation* 