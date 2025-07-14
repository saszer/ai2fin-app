const axios = require('axios');

/**
 * 🧪 COMPREHENSIVE AI SYSTEM TEST
 * 
 * This script tests all AI endpoints and functionality to identify:
 * 1. Which endpoints are working
 * 2. Which are returning errors
 * 3. What the current capabilities are
 * 4. What needs to be fixed
 */

const AI_MODULES_URL = 'http://localhost:3002';
const CORE_APP_URL = 'http://localhost:3001';

const testTransaction = {
  description: 'Office supplies from Officeworks',
  amount: 125.50,
  type: 'debit',
  merchant: 'Officeworks',
  date: new Date().toISOString()
};

const testUser = {
  id: 'test-user-123',
  businessType: 'SOLE_TRADER',
  industry: 'Software Development',
  countryCode: 'AU',
  profession: 'Software Developer'
};

async function testEndpoint(url, method, data, description) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`📍 ${method} ${url}`);
  
  try {
    const config = {
      method,
      url,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ SUCCESS (${response.status})`);
    console.log(`📊 Response:`, JSON.stringify(response.data, null, 2));
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    console.log(`❌ FAILED`);
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📊 Error:`, JSON.stringify(error.response.data, null, 2));
      return { success: false, error: error.response.data, status: error.response.status };
    } else {
      console.log(`📊 Network Error:`, error.message);
      return { success: false, error: error.message, status: 'NETWORK_ERROR' };
    }
  }
}

async function runComprehensiveTests() {
  console.log('🚀 STARTING COMPREHENSIVE AI SYSTEM TEST');
  console.log('==========================================');
  
  const results = [];
  
  // Test 1: AI Modules Health Check
  results.push(await testEndpoint(
    `${AI_MODULES_URL}/health`,
    'GET',
    null,
    'AI Modules Health Check'
  ));
  
  // Test 2: Direct Classify Endpoint
  results.push(await testEndpoint(
    `${AI_MODULES_URL}/api/classify`,
    'POST',
    testTransaction,
    'Direct Classification Endpoint'
  ));
  
  // Test 3: Simple Analysis Endpoint
  results.push(await testEndpoint(
    `${AI_MODULES_URL}/api/simple/analyze`,
    'POST',
    {
      transactions: [testTransaction],
      userProfile: testUser,
      options: {
        includeTaxAnalysis: true,
        includeBillDetection: true
      }
    },
    'Simple Analysis Endpoint'
  ));
  
  // Test 4: Orchestration Endpoint
  results.push(await testEndpoint(
    `${AI_MODULES_URL}/api/ai/orchestrate`,
    'POST',
    {
      workflow: 'fullTransactionAnalysis',
      userId: testUser.id,
      data: {
        transactions: [testTransaction],
        userProfile: testUser
      }
    },
    'Orchestration Endpoint'
  ));
  
  // Test 5: Core App AI Endpoint
  results.push(await testEndpoint(
    `${CORE_APP_URL}/api/ai/classify-transaction?description=${encodeURIComponent(testTransaction.description)}&amount=${testTransaction.amount}`,
    'GET',
    null,
    'Core App Classification Proxy'
  ));
  
  // Test 6: Service Discovery from Core App
  results.push(await testEndpoint(
    `${CORE_APP_URL}/api/services/status`,
    'GET',
    null,
    'Service Discovery Status'
  ));
  
  // Generate comprehensive report
  console.log('\n\n📊 COMPREHENSIVE TEST RESULTS');
  console.log('=====================================');
  
  const summary = {
    totalTests: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    networkErrors: results.filter(r => r.status === 'NETWORK_ERROR').length,
    serverErrors: results.filter(r => r.status >= 500).length,
    clientErrors: results.filter(r => r.status >= 400 && r.status < 500).length
  };
  
  console.log(`📈 Summary: ${summary.passed}/${summary.totalTests} tests passed`);
  console.log(`🔴 Failed: ${summary.failed}`);
  console.log(`🌐 Network Errors: ${summary.networkErrors}`);
  console.log(`🔥 Server Errors: ${summary.serverErrors}`);
  console.log(`⚠️  Client Errors: ${summary.clientErrors}`);
  
  // Detailed analysis
  console.log('\n🔍 DETAILED ANALYSIS:');
  
  results.forEach((result, index) => {
    const testNames = [
      'Health Check',
      'Direct Classification',
      'Simple Analysis',
      'Orchestration',
      'Core App Proxy',
      'Service Discovery'
    ];
    
    console.log(`\n${index + 1}. ${testNames[index]}: ${result.success ? '✅ WORKING' : '❌ BROKEN'}`);
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
      console.log(`   Status: ${result.status}`);
    }
  });
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (summary.networkErrors > 0) {
    console.log('🔧 Some services are not running - check if all services are started');
  }
  
  if (summary.serverErrors > 0) {
    console.log('🔧 Server errors detected - check logs for implementation issues');
  }
  
  if (summary.clientErrors > 0) {
    console.log('🔧 Client errors detected - check request formats and required fields');
  }
  
  // Architecture analysis
  console.log('\n🏗️ ARCHITECTURE ANALYSIS:');
  
  const healthWorking = results[0].success;
  const classifyWorking = results[1].success;
  const simpleWorking = results[2].success;
  const orchestrationWorking = results[3].success;
  const proxyWorking = results[4].success;
  
  if (healthWorking && !classifyWorking) {
    console.log('🔧 AI service is running but classify endpoint is broken');
  }
  
  if (healthWorking && classifyWorking && !orchestrationWorking) {
    console.log('🔧 Basic AI works but orchestration is broken - complex workflows failing');
  }
  
  if (!proxyWorking) {
    console.log('🔧 Core app proxy is broken - service discovery issues');
  }
  
  return { summary, results };
}

// Run the tests
runComprehensiveTests()
  .then(testResults => {
    console.log('\n🎯 TEST COMPLETED');
    process.exit(testResults.summary.failed === 0 ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 TEST RUNNER FAILED:', error);
    process.exit(1);
  }); 