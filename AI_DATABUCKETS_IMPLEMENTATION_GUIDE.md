# AI DataBuckets Implementation Guide

## Overview

The AI DataBuckets feature provides comprehensive AI-powered analysis of transaction data uploaded via CSV files. It orchestrates multiple AI agents to perform categorization, classification, tax analysis, and bill pattern detection.

## Architecture

### 1. Frontend Components

#### DataBucketCard Component
- **Location**: `ai2-core-app/client/src/components/DataBucketCard.tsx`
- **Purpose**: UI component that displays data buckets and triggers AI analysis
- **Key Features**:
  - Shows transaction count and date range
  - "Run AI Analysis" button triggers comprehensive analysis
  - Real-time progress indicators
  - Displays analysis results with insights and recommendations

#### BankTransactions Page
- **Location**: `ai2-core-app/client/src/pages/BankTransactions.tsx`
- **Purpose**: Main page that manages data buckets
- **Integration**: Uses DataBucketCard components and handles CSV uploads

### 2. Core App Backend

#### DataBuckets Route
- **Location**: `ai2-core-app/src/routes/databuckets.ts`
- **Endpoint**: `POST /api/databuckets/:uploadId/analyze`
- **Purpose**: Orchestrates AI analysis workflow
- **Flow**:
  1. Validates upload and fetches transactions
  2. Builds user profile context
  3. Calls AI modules service or falls back to core AI
  4. Processes and saves results to database
  5. Returns structured analysis response

#### Core AI Service
- **Location**: `ai2-core-app/src/lib/ai.ts`
- **Purpose**: Provides fallback AI capabilities when AI modules are offline
- **Features**:
  - Transaction categorization and classification
  - Tax deductibility analysis
  - Bills connection and pattern detection

### 3. AI Modules Microservice

#### AI Orchestrator
- **Location**: `ai2-ai-modules/src/services/AIOrchestrator.ts`
- **Purpose**: Manages and coordinates multiple AI agents
- **Workflows**:
  - `fullTransactionAnalysis`: Complete analysis workflow
  - `bulkProcessing`: Efficient batch processing
  - `smartCategorization`: Pattern-based category creation

#### AI Agents

1. **CategoriesAIAgent**
   - Assigns smart categories to transactions
   - Learns from user patterns
   - Suggests optimal category structure

2. **TransactionClassificationAIAgent**
   - Classifies transactions (expense/income/transfer)
   - Determines expense types (bill/one-time/capital)
   - Detects recurring patterns

3. **TaxDeductionAIService**
   - Analyzes tax deductibility based on country laws
   - Calculates business use percentages
   - Identifies documentation requirements

4. **BillsConnectorAI** (in Core App)
   - Detects recurring bill patterns
   - Links transactions to existing bills
   - Suggests new bill creation

## Data Flow

```
1. User clicks "Run AI Analysis" in DataBucket
   ↓
2. Frontend calls POST /api/databuckets/:uploadId/analyze
   ↓
3. Core App fetches transactions and user profile
   ↓
4. Core App checks if AI Modules service is online
   ↓
5a. If online: Calls AI Modules /api/ai/orchestrate
    → AI Orchestrator executes fullTransactionAnalysis workflow
    → Each agent processes transactions in sequence/parallel
   ↓
5b. If offline: Uses Core AI fallback services
   ↓
6. Results are processed and saved to database
   ↓
7. Frontend receives and displays comprehensive results
```

## Analysis Results Structure

```typescript
{
  categorization: {
    processed: number,
    total: number,
    categories: { [category: string]: count }
  },
  classification: {
    expenses: number,
    income: number,
    transfers: number,
    bills: number,
    oneTimeExpenses: number,
    capitalExpenses: number
  },
  recurrence: {
    recurring: number,
    nonRecurring: number,
    weekly: number,
    monthly: number,
    quarterly: number,
    yearly: number,
    adhoc: number
  },
  taxAnalysis: {
    deductible: number,
    nonDeductible: number,
    partiallyDeductible: number,
    totalPotentialDeduction: number,
    requiresDocumentation: number
  },
  billDetection: {
    newBillsDetected: number,
    recurringPatternsFound: number,
    linkedToBills: number,
    suggestions: Array<BillSuggestion>
  },
  confidence: number,
  insights: string[],
  recommendations: string[]
}
```

## Database Updates

When AI analysis completes, the following fields are updated:

### BankTransaction Table
- `aiClassified`: Set to true
- `aiCategory`: Assigned category
- `aiConfidence`: Confidence score
- `aiClassifiedAt`: Timestamp
- `aiTaxDeductible`: Tax deductibility flag
- `aiBusinessPercentage`: Business use percentage

### CSVUpload Table
- `aiAnalysisCount`: Incremented
- `lastAiAnalysis`: Current timestamp
- `aiConfidence`: Average confidence score

## Configuration

### Environment Variables
```env
# AI Modules Service
AI_SERVICE_URL=http://localhost:3002
OPENAI_API_KEY=your-api-key

# AI Configuration
AI_MODEL=gpt-4
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
AI_COUNTRY_CODE=AU
```

### Service Discovery
The system uses service discovery to determine if AI modules are available:
- Online: Uses full AI orchestration
- Offline: Falls back to core AI services

## Testing

### Manual Testing
1. Upload a CSV file to create a data bucket
2. Click "Run AI Analysis" on the data bucket card
3. Observe progress indicators
4. Review analysis results and insights

### Mock Mode
When `OPENAI_API_KEY` is not configured:
- AI modules return intelligent mock responses
- Mock data simulates real analysis patterns
- Useful for development and testing

## Performance Considerations

1. **Batch Processing**: Transactions are analyzed in batches for efficiency
2. **Progress Indicators**: UI shows real-time progress through analysis steps
3. **Caching**: Service instances are cached to avoid recreation
4. **Error Handling**: Graceful fallback to core AI if modules fail

## Future Enhancements

1. **Real-time Analysis**: Analyze transactions as they're imported
2. **Learning Feedback**: Allow users to correct AI decisions
3. **Custom Rules**: User-defined categorization rules
4. **Export Reports**: Generate tax reports from analysis
5. **Scheduled Analysis**: Automatic periodic analysis
6. **Multi-currency Support**: Handle international transactions

## Troubleshooting

### AI Modules Offline
- Check if AI modules service is running on port 3002
- Verify OPENAI_API_KEY is configured
- System will use fallback AI services automatically

### Slow Analysis
- Large transaction sets may take time
- Consider reducing batch size
- Check AI service response times

### Incorrect Classifications
- Review user profile settings
- Ensure transaction descriptions are clear
- Provide feedback for AI learning 