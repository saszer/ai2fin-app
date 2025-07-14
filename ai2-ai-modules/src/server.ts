import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { featureFlags } from './shared-mock';
import aiRoutes from './routes/ai-routes-working';

const app = express();
const PORT = process.env.AI_PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Mount AI routes
app.use('/api/ai', aiRoutes);

// Add direct classify endpoint for backward compatibility
app.post('/api/classify', async (req, res) => {
  try {
    const { description, amount, type, merchant, category } = req.body;
    
    if (!description || amount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: description, amount',
        timestamp: new Date().toISOString()
      });
    }

    // Mock classification response for now (until OpenAI is configured)
    const mockResponse = {
      success: true,
      classification: {
        category: 'Business Expense',
        subcategory: 'Office Supplies',
        confidence: 0.85,
        reasoning: 'Based on transaction description and amount pattern',
        isTaxDeductible: amount > 50,
        businessUsePercentage: amount > 100 ? 100 : 50,
        primaryType: type === 'credit' ? 'income' : 'expense',
        secondaryType: description.toLowerCase().includes('bill') || 
                     description.toLowerCase().includes('subscription') ? 'bill' : 'one-time expense'
      },
      timestamp: new Date().toISOString()
    };

    res.json(mockResponse);
  } catch (error) {
    console.error('Classification error:', error);
    res.status(500).json({
      success: false,
      error: 'Classification failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-modules',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: {
      aiEnabled: featureFlags.isFeatureEnabled('enableAI'),
      categorization: featureFlags.isFeatureEnabled('enableAICategories'),
      taxDeduction: featureFlags.isFeatureEnabled('enableAITaxDeduction'),
      insights: featureFlags.isFeatureEnabled('enableAIInsights')
    }
  });
});

// Legacy Basic AI endpoints (MOCK DATA - for backward compatibility)
app.post('/api/ai/analyze-transaction-mock', async (req, res) => {
  try {
    const { description, amount, date } = req.body;
    
    // Simple mock analysis for backward compatibility
    const analysis = {
      category: 'Uncategorized [MOCK DATA]',
      confidence: 0.8,
      reasoning: '🤖 AI analysis placeholder - This is mock data. Use real AI endpoints for actual analysis.',
      suggestions: ['🚨 MOCK: Consider categorizing this transaction', '⚙️ Configure OpenAI API key for real AI'],
      isTaxDeductible: false,
      taxDeductibilityReasoning: '📝 MOCK: Insufficient information - real tax analysis available with proper configuration',
      businessUsePercentage: 0,
      incomeClassification: 'expense',
      incomeReasoning: '🔢 MOCK: Negative amount indicates expense - basic rule-based analysis',
      mock_data: true,
      upgrade_notice: 'This is legacy mock data. Use /api/ai/analyze-transaction for real AI processing.'
    };

    res.json({
      success: true,
      data: analysis,
      mock: true,
      message: '🚨 MOCK RESPONSE: Configure OPENAI_API_KEY environment variable for real AI analysis',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Mock AI analysis failed',
      mock: true,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/ai/batch-analyze-mock', async (req, res) => {
  try {
    const { transactions } = req.body;
    
    const results = transactions.map((t: any) => ({
      id: t.id,
      analysis: {
        category: 'Uncategorized [MOCK DATA]',
        confidence: 0.8,
        reasoning: '🤖 MOCK: Batch AI analysis placeholder - Configure OpenAI API for real processing',
        mock_data: true
      }
    }));

    res.json({
      success: true,
      data: { results, processed: transactions.length },
      mock: true,
      message: '🚨 MOCK RESPONSE: This is simulated batch processing. Use /api/ai/batch-analyze for real AI.',
      upgrade_notice: 'Configure OPENAI_API_KEY environment variable for real batch AI analysis',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Mock batch AI analysis failed',
      mock: true,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/ai/status', (req, res) => {
  res.json({
    service: 'AI Modules',
    status: 'active',
    capabilities: [
      'transaction-analysis',
      'batch-processing',
      'categorization',
      'tax-deduction-analysis'
    ],
    version: '1.0.0'
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🤖 AI Modules Service running on port ${PORT}`);
    console.log(`📊 AI Features enabled: ${featureFlags.isAIEnabled()}`);
  });
}

export default app; 