const axios = require('axios');

async function testOrchestrationDebug() {
  const baseURL = 'http://localhost:3002';
  
  console.log('🔍 Debugging orchestration endpoint...');
  
  const testPayload = {
    workflow: 'fullTransactionAnalysis',
    userId: 'test-user-debug',
    data: {
      transactions: [
        {
          id: 'debug-tx-1',
          description: 'Test Transaction Debug',
          amount: 25.99,
          date: new Date().toISOString(),
          type: 'expense'
        }
      ]
    }
  };

  try {
    console.log('📤 Sending request to /api/ai/orchestrate...');
    console.log('📊 Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await axios.post(`${baseURL}/api/ai/orchestrate`, testPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ SUCCESS!');
    console.log('📨 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ FAILED!');
    console.error('🔍 Error details:');
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📋 Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('🔗 Headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error('📡 No response received');
      console.error('🔍 Request details:', error.request);
    } else {
      console.error('⚠️  Error:', error.message);
    }
  }
}

testOrchestrationDebug().catch(console.error); 