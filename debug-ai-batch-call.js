const axios = require('axios');

async function testBatchCall() {
  console.log('🧪 Testing exact batch call that backend makes...');
  
  try {
    // Mimic exactly what IntelligentCategorizationService.processBulkAIBatch sends
    const testTransactions = [
      {
        id: 'tx-1',
        description: 'Gas Station Purchase',
        amount: -45.20,
        merchant: 'Shell Station',
        date: new Date().toISOString(),
        type: 'debit'
      },
      {
        id: 'tx-2', 
        description: 'Grocery Store',
        amount: -125.50,
        merchant: 'Woolworths',
        date: new Date().toISOString(),
        type: 'debit'
      }
    ];

    const payload = {
      transactions: testTransactions,
      analysisType: 'batch',
      userPreferences: {
        businessType: 'Individual',
        industry: 'General',
        countryCode: 'AU',
        selectedCategories: []
      }
    };

    console.log('📤 Sending payload to AI modules:', JSON.stringify(payload, null, 2));

    const startTime = Date.now();
    const response = await axios.post('http://localhost:3002/api/classify', payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const responseTime = Date.now() - startTime;
    console.log(`⏱️ Response time: ${responseTime}ms`);
    console.log('✅ Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));

    // Check what type of response we got
    if (response.data.mock) {
      console.log('❌ Still getting MOCK response from AI modules!');
    } else if (response.data.results) {
      console.log('🎉 Got batch results:', response.data.results.length);
      response.data.results.forEach((result, i) => {
        console.log(`Result ${i+1}:`, {
          category: result.classification?.category,
          confidence: result.classification?.confidence,
          reasoning: result.classification?.reasoning?.substring(0, 50) + '...',
          openai_calls: result.openai_calls || 0
        });
      });
    } else {
      console.log('🤔 Unexpected response format');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📊 Error Response:', error.response.data);
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 AI modules service not running or not accessible');
    }
  }
}

testBatchCall(); 