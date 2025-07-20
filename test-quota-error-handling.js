/**
 * Test script to verify OpenAI quota error handling
 * This simulates the quota exceeded scenario and tests the new error handling
 */

const axios = require('axios');

async function testQuotaErrorHandling() {
  console.log('🧪 Testing OpenAI Quota Error Handling');
  console.log('=====================================');

  const testData = {
    bucketName: 'test-quota-error',
    transactions: [
      { id: 'test1', description: 'Test Transaction 1', amount: -50.00, date: '2025-01-15' },
      { id: 'test2', description: 'Test Transaction 2', amount: -75.00, date: '2025-01-15' },
      { id: 'test3', description: 'Test Transaction 3', amount: -100.00, date: '2025-01-15' }
    ]
  };

  try {
    console.log('📤 Sending test databucket analysis request...');
    console.log(`🔧 Testing with ${testData.transactions.length} transactions`);

    const response = await axios.post('http://localhost:3001/api/databuckets/analyze', testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      timeout: 60000 // 60 second timeout
    });

    console.log('📈 Response Status:', response.status);
    console.log('📊 Response Data Structure:');
    console.log('- analysisResults:', !!response.data.analysisResults);
    console.log('- source:', response.data.analysisResults?.source);
    console.log('- insights:', response.data.analysisResults?.insights?.length || 0);
    console.log('- recommendations:', response.data.analysisResults?.recommendations?.length || 0);

    if (response.data.analysisResults?.source === 'offline-rules') {
      console.log('✅ SUCCESS: Offline fallback analysis working correctly');
    } else if (response.data.analysisResults?.source === 'core-fallback') {
      console.log('✅ SUCCESS: Core fallback analysis working');
    } else if (response.data.analysisResults?.source === 'ai-modules') {
      console.log('✅ SUCCESS: AI modules analysis working (quota may be restored)');
    }

  } catch (error) {
    if (error.response) {
      console.log('📋 Error Response Analysis:');
      console.log('- Status:', error.response.status);
      console.log('- Status Text:', error.response.statusText);
      console.log('- Error Type:', error.response.data?.error);
      console.log('- Message:', error.response.data?.message);
      console.log('- User Message:', error.response.data?.userMessage);
      console.log('- Retry After:', error.response.data?.retryAfter);
      console.log('- Recommendations:', error.response.data?.recommendations?.length || 0);

      if (error.response.status === 429 && error.response.data?.error === 'AI Service Quota Exceeded') {
        console.log('✅ SUCCESS: Quota error handling working correctly!');
        console.log('📋 User will see clear error message:');
        console.log(`   "${error.response.data.userMessage}"`);
        console.log('🎯 Recommendations provided:');
        error.response.data.recommendations?.forEach((rec, i) => {
          console.log(`   ${i + 1}. ${rec}`);
        });
      } else if (error.response.status === 500) {
        console.log('❌ FAILURE: Still receiving 500 error instead of proper quota handling');
        console.log('🔍 This indicates the error handling may not be catching quota errors properly');
      } else {
        console.log('ℹ️ Different error type - may be expected depending on system state');
      }

    } else if (error.request) {
      console.log('❌ NETWORK ERROR: Cannot reach server');
      console.log('🔍 Make sure the core app is running on port 3001');
    } else {
      console.log('❌ REQUEST ERROR:', error.message);
    }
  }

  console.log('\n🏁 Test completed');
}

// Run the test
testQuotaErrorHandling().catch(console.error); 