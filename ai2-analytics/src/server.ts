import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.ANALYTICS_PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'analytics',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: {
      advancedReporting: process.env.ENABLE_ADVANCED_REPORTING === 'true',
      exports: process.env.ENABLE_EXPORTS === 'true',
      insights: process.env.ENABLE_INSIGHTS === 'true'
    }
  });
});

// Analytics endpoints
app.get('/api/analytics/status', (req, res) => {
  res.json({
    service: 'Analytics',
    status: 'active',
    capabilities: [
      'advanced-reporting',
      'exports',
      'insights',
      'data-visualization'
    ],
    version: '1.0.0'
  });
});

app.post('/api/analytics/generate-report', async (req, res) => {
  try {
    const { reportType, dateRange, filters } = req.body;
    
    // Mock report generation
    const report = {
      id: `report_${Date.now()}`,
      type: reportType,
      dateRange,
      generatedAt: new Date().toISOString(),
      data: {
        totalTransactions: 1250,
        totalAmount: 45678.90,
        categories: [
          { name: 'Food & Dining', count: 45, amount: 1250.00 },
          { name: 'Transportation', count: 32, amount: 890.50 },
          { name: 'Shopping', count: 28, amount: 2100.75 }
        ],
        trends: {
          monthlyGrowth: 12.5,
          topCategory: 'Food & Dining',
          averageTransaction: 36.54
        }
      }
    };

    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Report generation failed',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/analytics/export-data', async (req, res) => {
  try {
    const { format, dataType, filters } = req.body;
    
    // Mock data export
    const exportResult = {
      id: `export_${Date.now()}`,
      format,
      dataType,
      status: 'completed',
      downloadUrl: `/api/analytics/downloads/export_${Date.now()}.${format}`,
      recordCount: 1250,
      fileSize: '2.5MB'
    };

    res.json({
      success: true,
      data: exportResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Data export failed',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/analytics/insights', async (req, res) => {
  try {
    const insights = {
      spendingTrends: {
        monthlyGrowth: 8.5,
        topSpendingCategory: 'Food & Dining',
        unusualExpenses: [
          { description: 'Large purchase at Electronics Store', amount: 899.99, date: '2025-07-01' }
        ]
      },
      savingsOpportunities: [
        { category: 'Food & Dining', potentialSavings: 200.00, suggestion: 'Consider meal planning' },
        { category: 'Transportation', potentialSavings: 150.00, suggestion: 'Use public transport more' }
      ],
      taxDeductions: [
        { category: 'Business Expenses', amount: 1250.00, deductible: true },
        { category: 'Home Office', amount: 450.00, deductible: true }
      ]
    };

    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Insights generation failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`📊 Analytics Service running on port ${PORT}`);
    console.log(`📈 Advanced Reporting: ${process.env.ENABLE_ADVANCED_REPORTING === 'true' ? 'Enabled' : 'Disabled'}`);
    console.log(`📤 Exports: ${process.env.ENABLE_EXPORTS === 'true' ? 'Enabled' : 'Disabled'}`);
  });
}

export default app; 