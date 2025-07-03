# 🤖 AI2 AI Modules Package

## Overview

The AI2 AI Modules package provides enterprise-grade artificial intelligence services for financial transaction analysis, categorization, tax deduction analysis, and intelligent insights.

## Features

### 🧠 Core AI Capabilities
- **Transaction Categorization**: AI-powered automatic categorization of financial transactions
- **Tax Deduction Analysis**: Intelligent identification of tax-deductible expenses
- **Smart Insights**: Automated financial insights and recommendations
- **Batch Processing**: High-performance batch analysis of multiple transactions
- **Learning System**: Continuous improvement through user feedback

### 🏗️ Architecture
- **Multi-Agent System**: Specialized AI agents for different tasks
- **Service-Oriented**: Independent microservice architecture
- **Scalable**: Designed for millions of transactions
- **Cost-Optimized**: Token-based usage tracking and optimization

## Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key (or other AI provider)
- AI2 Shared package

### Installation
```bash
cd ai2-ai-modules
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

### Transaction Analysis
```
POST /api/ai/analyze-transaction
{
  "description": "Starbucks coffee",
  "amount": -5.50,
  "date": "2024-01-15"
}
```

### Batch Analysis
```
POST /api/ai/batch-analyze
{
  "transactions": [
    {
      "id": "txn_123",
      "description": "Office supplies",
      "amount": -125.00,
      "date": "2024-01-15"
    }
  ]
}
```

### AI Status
```
GET /api/ai/status
```

## Configuration

### Environment Variables
```bash
AI_PORT=3002
OPENAI_API_KEY=your_openai_key
AI_MODEL=gpt-4
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.1
```

### Feature Flags
The AI modules respect the following feature flags from the shared package:
- `ENABLE_AI`: Master AI feature toggle
- `ENABLE_AI_CATEGORIES`: Transaction categorization
- `ENABLE_AI_TAX_DEDUCTION`: Tax analysis
- `ENABLE_AI_INSIGHTS`: Financial insights
- `ENABLE_AI_REPORTING`: Advanced reporting

## Business Models

### Premium Tier
- AI categorization included
- Tax deduction analysis
- Basic insights

### Enterprise Tier
- All AI features enabled
- Advanced reporting
- Custom AI model training
- Priority processing

## Integration

### With Core App
The AI modules integrate seamlessly with the core financial platform:
- Automatic transaction analysis on import
- Real-time categorization suggestions
- Tax optimization recommendations

### With Subscription Service
- Token-based usage tracking
- Usage-based billing
- Rate limiting per subscription tier

## Development

### Project Structure
```
src/
├── services/
│   ├── BaseAIService.ts          # Base AI service class
│   ├── OpenAIService.ts          # OpenAI integration
│   ├── TaxDeductionAIService.ts  # Tax analysis service
│   ├── CategoriesAIAgent.ts      # Categorization agent
│   ├── TransactionClassificationAIAgent.ts
│   ├── AIOrchestrator.ts         # Multi-agent orchestration
│   └── AIServiceFactory.ts       # Service factory
├── agents/                       # AI agent implementations
├── types/                        # AI-specific types
├── utils/                        # AI utilities
└── server.ts                     # Express server
```

### Adding New AI Features
1. Extend `BaseAIService` class
2. Implement required abstract methods
3. Add to `AIServiceFactory`
4. Update feature flags
5. Add API endpoints

## Monitoring

### Health Metrics
- Service uptime
- Response times
- Error rates
- Token usage
- Cost tracking

### Logging
- Request/response logging
- Error tracking
- Performance metrics
- Usage analytics

## Security

- API key management
- Rate limiting
- Input validation
- Error sanitization
- Audit logging

## Performance

### Optimization Features
- Request batching
- Token usage optimization
- Caching strategies
- Parallel processing
- Cost monitoring

### Scaling
- Horizontal scaling ready
- Load balancing support
- Database optimization
- Memory management

## Troubleshooting

### Common Issues
1. **API Key Issues**: Verify OpenAI API key configuration
2. **Rate Limiting**: Check usage limits and upgrade plan
3. **Performance**: Monitor token usage and optimize prompts
4. **Integration**: Verify feature flags and service connectivity

### Debug Mode
```bash
DEBUG=ai2:ai:* npm run dev
```

## License

Proprietary - AI2 Enterprise Platform

---

*Built for enterprise AI • Scalable for millions of users • Optimized for financial intelligence* 