// Test the TaxDeductionAIService specifically
console.log('🧪 Testing TaxDeductionAIService');
console.log('=================================');

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'ai2-ai-modules', '.env') });

console.log('🔑 OpenAI API Key:', process.env.OPENAI_API_KEY ? 'CONFIGURED' : 'NOT CONFIGURED');

async function testTaxService() {
  try {
    // Try to import the TaxDeductionAIService
    const { TaxDeductionAIService } = require('./ai2-ai-modules/dist/services/TaxDeductionAIService');
    
    // Create a service instance
    const config = {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.7,
      countryCode: 'AU'
    };
    
    console.log('🚀 Creating TaxDeductionAIService instance...');
    const taxService = new TaxDeductionAIService(config);
    
    console.log('✅ Service created successfully');
    
    // Test the analyzeTaxDeductibility method
    console.log('📊 Testing analyzeTaxDeductibility...');
    
    const userProfile = {
      countryCode: 'AU',
      businessType: 'SOLE_TRADER',
      industry: 'Technology',
      occupation: 'Software Developer',
      taxResidency: 'AU'
    };
    
    const result = await taxService.analyzeTaxDeductibility(
      'Adobe Creative Cloud Subscription',
      -59.99,
      new Date('2024-01-15'),
      'Software',
      userProfile,
      'expense'
    );
    
    console.log('✅ Tax analysis completed successfully');
    console.log('📋 Results:', {
      isTaxDeductible: result.isTaxDeductible,
      confidence: result.confidence,
      businessUsePercentage: result.businessUsePercentage,
      category: result.category,
      taxCategory: result.taxCategory
    });
    
    // Check if logs were created
    const fs = require('fs');
    const logFile = path.join(__dirname, 'ai2-ai-modules', 'logs', 'api-requests.log');
    
    if (fs.existsSync(logFile)) {
      const logContent = fs.readFileSync(logFile, 'utf8');
      const lines = logContent.split('\n').filter(line => line.trim());
      
      console.log(`📝 Log file now has ${lines.length} entries`);
      
      if (lines.length > 1) {
        const lastEntry = JSON.parse(lines[lines.length - 1]);
        console.log('📊 Last log entry:', {
          service: lastEntry.service,
          method: lastEntry.method,
          success: lastEntry.response?.success,
          tokensUsed: lastEntry.response?.tokensUsed,
          processingTime: lastEntry.response?.processingTimeMs
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

testTaxService().catch(console.error); 