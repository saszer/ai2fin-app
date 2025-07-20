// Debug AI agent initialization in BatchProcessingEngine

async function debugAIAgent() {
  console.log('🔍 Debugging AI Agent Initialization...');
  
  try {
    console.log('\n1️⃣ Testing AI Config Creation...');
    
    // Test the getAIConfig function (same as in ai-batch-optimized.ts)
    const getAIConfig = () => ({
      provider: 'openai',
      model: process.env.AI_MODEL || 'gpt-4',
      apiKey: process.env.OPENAI_API_KEY || '',
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
      countryCode: process.env.AI_COUNTRY_CODE || 'AU',
      language: process.env.AI_LANGUAGE || 'en'
    });
    
    const config = getAIConfig();
    console.log('Config created:');
    console.log('- Provider:', config.provider);
    console.log('- Model:', config.model);
    console.log('- API Key present:', !!config.apiKey);
    console.log('- API Key length:', config.apiKey.length);
    console.log('- API Key starts with:', config.apiKey.substring(0, 10) + '...');
    
    console.log('\n2️⃣ Testing Environment Variables...');
    console.log('- AI_MODEL:', process.env.AI_MODEL || 'not set');
    console.log('- OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
    console.log('- OPENAI_API_KEY length:', (process.env.OPENAI_API_KEY || '').length);
    
    console.log('\n3️⃣ Testing BatchProcessingEngine with Debug...');
    
    // Make direct call to test what's happening
    const response = await fetch('http://localhost:3002/api/optimized/analyze-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactions: [{
          id: 'test-123',
          description: 'TEST UNIQUE TRANSACTION FOR AI CALL',
          amount: -99.99,
          merchant: 'UNIQUE_MERCHANT_FOR_TESTING',
          date: new Date().toISOString(),
          type: 'debit'
        }],
        selectedCategories: ['Travel', 'Fuel & Transport', 'Business Expenses'],
        options: {
          enableCategorization: true,  // This should trigger AI mode
          batchSize: 1,
          confidenceThreshold: 0.8
        },
        userProfile: {
          businessType: 'BUSINESS',
          industry: 'TECHNOLOGY',
          countryCode: 'AU'
        }
      })
    });

    const data = await response.json();
    
    console.log('\n📊 BatchProcessingEngine Debug Response:');
    console.log('Success:', data.success);
    console.log('Total processed:', data.totalTransactions);
    console.log('Processed with AI:', data.processedWithAI);
    console.log('Processed with reference:', data.processedWithReferenceData);
    console.log('Total cost:', data.totalCost);
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      console.log('\n🎯 Result Analysis:');
      console.log('Source:', result.source);
      console.log('Category:', result.category);
      console.log('Confidence:', result.confidence);
      console.log('Reasoning:', result.reasoning);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugAIAgent(); 