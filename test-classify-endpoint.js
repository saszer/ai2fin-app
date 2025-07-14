const axios = require('axios');

async function testClassifyEndpoint() {
  const baseURL = 'http://localhost:3002';
  
  console.log('🧪 Testing /api/classify endpoint...');
  
  const testTransaction = {
    description: 'Adobe Creative Cloud Subscription',
    amount: 52.99,
    type: 'expense'
  };

  try {
    const response = await axios.post(`${baseURL}/api/classify`, testTransaction, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ /api/classify endpoint responded successfully');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ /api/classify endpoint failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error:', error.message);
    }
    return null;
  }
}

async function testOrchestrationEndpoint() {
  const baseURL = 'http://localhost:3002';
  
  console.log('🧪 Testing /api/ai/orchestrate endpoint...');
  
  const testPayload = {
    workflow: 'fullTransactionAnalysis',
    userId: 'test-user',
    data: {
      transactions: [
        {
          id: 'test-1',
          description: 'Adobe Creative Cloud Subscription',
          amount: 52.99,
          date: '2025-01-14',
          type: 'expense'
        }
      ],
      userPreferences: {
        businessType: 'SOLE_TRADER',
        countryCode: 'AU',
        industry: 'SOFTWARE_SERVICES'
      }
    }
  };

  try {
    const response = await axios.post(`${baseURL}/api/ai/orchestrate`, testPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ /api/ai/orchestrate endpoint responded successfully');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ /api/ai/orchestrate endpoint failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error:', error.message);
    }
    return null;
  }
}

async function runTests() {
  console.log('🚀 AI2 AI Modules Endpoint Tests\n');
  
  // Test 1: /api/classify
  const classifyResult = await testClassifyEndpoint();
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 2: /api/ai/orchestrate
  const orchestrateResult = await testOrchestrationEndpoint();
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Summary
  console.log('📊 Test Summary:');
  console.log(`/api/classify: ${classifyResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`/api/ai/orchestrate: ${orchestrateResult ? '✅ PASS' : '❌ FAIL'}`);
  
  if (classifyResult && orchestrateResult) {
    console.log('\n🎉 All tests passed! AI system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

runTests().catch(console.error); 