const axios = require('axios');

// Test configuration
const AI_MODULES_BASE_URL = 'http://localhost:3002';
const TEST_USER_ID = 'cmd30zpi3000kp9iwwcj0w66b';

// Test transaction data
const testTransactions = [
  {
    id: 'tx-1',
    description: 'Microsoft Office 365 Subscription',
    amount: -15.99,
    date: '2025-01-14',
    merchant: 'Microsoft'
  },
  {
    id: 'tx-2',
    description: 'Coffee Shop Purchase',
    amount: -4.50,
    date: '2025-01-14',
    merchant: 'Starbucks'
  }
];

const testUserProfile = {
  businessType: 'SOLE_TRADER',
  industry: 'SOFTWARE_SERVICES',
  countryCode: 'AU',
  profession: 'Software Developer'
};

async function testCORSConfiguration() {
  console.log('\n🔍 Testing CORS Configuration...');
  
  try {
    // Test OPTIONS request (preflight)
    const optionsResponse = await axios.options(`${AI_MODULES_BASE_URL}/health`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log('✅ OPTIONS (preflight) request successful');
    console.log('📋 CORS Headers:', {
      'Access-Control-Allow-Origin': optionsResponse.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': optionsResponse.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': optionsResponse.headers['access-control-allow-headers']
    });
    
    return true;
  } catch (error) {
    console.error('❌ CORS test failed:', error.response?.status, error.response?.statusText);
    return false;
  }
}

async function testHealthEndpoint() {
  console.log('\n🏥 Testing Health Endpoint...');
  
  try {
    const response = await axios.get(`${AI_MODULES_BASE_URL}/health`, {
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('✅ Health endpoint working');
    console.log('📊 Response:', {
      status: response.data.status,
      service: response.data.service,
      features: response.data.features,
      apiKeyConfigured: response.data.apiKeyConfigured
    });
    
    return true;
  } catch (error) {
    console.error('❌ Health endpoint failed:', error.response?.status, error.response?.statusText);
    return false;
  }
}

async function testUserSpecificAnalyzeEndpoint() {
  console.log('\n🎯 Testing User-Specific Analyze Endpoint...');
  
  try {
    const response = await axios.post(`${AI_MODULES_BASE_URL}/${TEST_USER_ID}/analyze`, {
      transactions: testTransactions,
      userProfile: testUserProfile,
      options: {
        analysisType: 'comprehensive'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('✅ User-specific analyze endpoint working');
    console.log('📊 Response Summary:', {
      success: response.data.success,
      userId: response.data.userId,
      totalProcessed: response.data.summary.totalProcessed,
      avgConfidence: response.data.summary.avgConfidence,
      taxDeductibleCount: response.data.summary.taxDeductibleCount
    });
    
    // Show first result as example
    if (response.data.results && response.data.results.length > 0) {
      const firstResult = response.data.results[0];
      console.log('📋 First Transaction Analysis:', {
        transactionId: firstResult.transactionId,
        category: firstResult.category,
        confidence: firstResult.confidence,
        isTaxDeductible: firstResult.isTaxDeductible,
        reasoning: firstResult.reasoning.substring(0, 100) + '...'
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ User-specific analyze endpoint failed:', error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.error('📋 Error details:', error.response.data);
    }
    return false;
  }
}

async function testStandardClassifyEndpoint() {
  console.log('\n🔍 Testing Standard Classify Endpoint...');
  
  try {
    const response = await axios.post(`${AI_MODULES_BASE_URL}/api/classify`, {
      description: 'Microsoft Office 365 Subscription',
      amount: -15.99,
      type: 'expense',
      merchant: 'Microsoft'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('✅ Standard classify endpoint working');
    console.log('📊 Classification Result:', {
      success: response.data.success,
      category: response.data.classification?.category,
      confidence: response.data.classification?.confidence,
      isTaxDeductible: response.data.classification?.isTaxDeductible
    });
    
    return true;
  } catch (error) {
    console.error('❌ Standard classify endpoint failed:', error.response?.status, error.response?.statusText);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting AI Modules CORS & Analyze Endpoint Tests');
  console.log('=' .repeat(60));
  
  const results = {
    cors: await testCORSConfiguration(),
    health: await testHealthEndpoint(),
    userAnalyze: await testUserSpecificAnalyzeEndpoint(),
    classify: await testStandardClassifyEndpoint()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('=' .repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.toUpperCase()}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  console.log('\n🎯 Overall Result:');
  console.log(`${allPassed ? '✅' : '❌'} ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🎉 AI Modules service is ready for production!');
    console.log('✅ CORS configuration fixed');
    console.log('✅ User-specific analyze endpoint working');
    console.log('✅ Standard endpoints working');
    console.log('✅ Service discovery health check working');
  } else {
    console.log('\n🔧 Issues to resolve:');
    Object.entries(results).forEach(([test, passed]) => {
      if (!passed) {
        console.log(`❌ Fix ${test} endpoint`);
      }
    });
  }
  
  return allPassed;
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests }; 