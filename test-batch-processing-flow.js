// Use native fetch in Node.js 18+

async function testBatchProcessingFlow() {
  console.log('🔍 Testing Complete Smart Categorization Flow...');
  
  const testData = {
    transactions: [{
      id: 'test-123',
      description: 'BP SERVICE STATION FUEL',
      amount: -85.50,
      merchant: 'BP',
      date: new Date().toISOString(),
      type: 'debit'
    }],
    selectedCategories: ['Travel', 'Fuel & Transport', 'Business Expenses'],
    options: {
      enableCategorization: true,
      batchSize: 1,
      confidenceThreshold: 0.8
    },
    userProfile: {
      businessType: 'BUSINESS',
      industry: 'TECHNOLOGY',
      countryCode: 'AU'
    }
  };

  try {
    console.log('\n1️⃣ Testing AI Modules Server Status...');
    const healthResponse = await fetch('http://localhost:3002/health');
    if (healthResponse.ok) {
      console.log('✅ AI Modules server is running');
    } else {
      console.log('❌ AI Modules server not responding');
      return;
    }

    console.log('\n2️⃣ Testing BatchProcessingEngine Endpoint...');
    const response = await fetch('http://localhost:3002/api/optimized/analyze-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const data = await response.json();
    
    console.log('\n📊 BatchProcessingEngine Response:');
    console.log('================================');
    console.log('Success:', data.success);
    console.log('Mock mode:', data.mock);
    console.log('OpenAI calls:', data.openaiDetails?.totalCalls || 0);
    console.log('Results:', data.results?.length || 0);
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      console.log('\n🎯 First Result Analysis:');
      console.log('Source:', result.source || 'unknown');
      console.log('Category:', result.category);
      console.log('Confidence:', result.confidence);
      console.log('Reasoning:', result.reasoning);
    }

    console.log('\n3️⃣ Testing Core App Smart Categorization...');
    const token = 'test-token'; // You may need to get a real token
    
    const coreResponse = await fetch('http://localhost:3001/api/intelligent-categorization/classify-batch', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        transactions: testData.transactions,
        selectedCategories: testData.selectedCategories
      })
    });

    if (coreResponse.ok) {
      const coreData = await coreResponse.json();
      console.log('\n📊 Core App Response:');
      console.log('Success:', coreData.success);
      console.log('AI calls used:', coreData.summary?.aiCallsUsed || 0);
      console.log('Cache hits:', coreData.summary?.cacheHits || 0);
    } else {
      console.log('❌ Core app endpoint failed:', coreResponse.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBatchProcessingFlow(); 