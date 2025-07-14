const axios = require('axios');

/**
 * 🧪 COMPREHENSIVE AI SYSTEM DIAGNOSTIC
 * 
 * This script tests all AI endpoints to identify what's working and what's broken.
 * Based on the logs, we need to diagnose:
 * 1. 404 errors on /api/classify
 * 2. "Unknown task type: categorizeTransaction" errors
 * 3. Service connectivity issues
 * 4. Which endpoints actually exist vs which are being called
 */

const AI_MODULES_URL = 'http://localhost:3002';

const testTransaction = {
  description: 'Office supplies from Officeworks',
  amount: 125.50,
  type: 'debit',
  merchant: 'Officeworks',
  date: new Date().toISOString()
};

const testUserProfile = {
  businessType: 'SOLE_TRADER',
  industry: 'Software Development',
  countryCode: 'AU',
  profession: 'Software Developer'
};

async function testEndpoint(url, method, data, description) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`📍 ${method} ${url}`);
  
  try {
    const response = await axios({
      method,
      url,
      data,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ SUCCESS - Status: ${response.status}`);
    console.log(`📊 Response:`, JSON.stringify(response.data, null, 2));
    return { success: true, status: response.status, data: response.data };
    
  } catch (error) {
    console.log(`❌ FAILED - Status: ${error.response?.status || 'NO_RESPONSE'}`);
    console.log(`🚨 Error:`, error.response?.data || error.message);
    return { 
      success: false, 
      status: error.response?.status, 
      error: error.response?.data || error.message 
    };
  }
}

async function runDiagnostics() {
  console.log('🔍 STARTING AI SYSTEM COMPREHENSIVE DIAGNOSTICS');
  console.log('='.repeat(60));
  
  const results = [];
  
  // Test 1: Health Check
  results.push(await testEndpoint(
    `${AI_MODULES_URL}/health`,
    'GET',
    null,
    'Health Check'
  ));
  
  // Test 2: The problematic /api/classify endpoint (404 in logs)
  results.push(await testEndpoint(
    `${AI_MODULES_URL}/api/classify`,
    'POST',
    {
      description: testTransaction.description,
      amount: testTransaction.amount,
      type: testTransaction.type
    },
    'Direct Classification (BROKEN in logs)'
  ));
  
  // Test 3: Check if /classify exists without /api prefix
  results.push(await testEndpoint(
    `${AI_MODULES_URL}/classify`,
    'POST',
    {
      description: testTransaction.description,
      amount: testTransaction.amount,
      type: testTransaction.type
    },
    'Classification without /api prefix'
  ));
  
  // Test 4: AI Orchestration (has "categorizeTransaction" errors)
  results.push(await testEndpoint(
    `${AI_MODULES_URL}/api/ai/orchestrate`,
    'POST',
    {
      workflow: 'fullTransactionAnalysis',
      userId: 'test-user',
      data: {
        transactions: [testTransaction],
        userProfile: testUserProfile
      }
    },
    'AI Orchestration (HAS ERRORS in logs)'
  ));
  
  // Test 5: Simple Analysis endpoint (created but never tested)
  results.push(await testEndpoint(
    `${AI_MODULES_URL}/api/simple/analyze`,
    'POST',
    {
      transactions: [testTransaction],
      userProfile: testUserProfile,
      options: {
        includeTaxAnalysis: true,
        includeBillDetection: true,
        includeRecurringPatterns: true
      }
    },
    'Simple Analysis (NEW endpoint)'
  ));
  
  // Test 6: Individual AI agents
  results.push(await testEndpoint(
    `${AI_MODULES_URL}/api/ai/categorize`,
    'POST',
    {
      description: testTransaction.description,
      amount: testTransaction.amount
    },
    'Categories AI Agent'
  ));
  
  results.push(await testEndpoint(
    `${AI_MODULES_URL}/api/ai/classify-transaction`,
    'POST',
    {
      description: testTransaction.description,
      amount: testTransaction.amount,
      userProfile: testUserProfile
    },
    'Transaction Classification Agent'
  ));
  
  results.push(await testEndpoint(
    `${AI_MODULES_URL}/api/ai/analyze-tax`,
    'POST',
    {
      description: testTransaction.description,
      amount: testTransaction.amount,
      userProfile: testUserProfile
    },
    'Tax Analysis Agent'
  ));
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));
  
  const working = results.filter(r => r.success);
  const broken = results.filter(r => !r.success);
  
  console.log(`✅ Working Endpoints: ${working.length}`);
  console.log(`❌ Broken Endpoints: ${broken.length}`);
  
  if (broken.length > 0) {
    console.log('\n🚨 BROKEN ENDPOINTS:');
    broken.forEach((result, index) => {
      console.log(`${index + 1}. Status ${result.status}: ${result.error}`);
    });
  }
  
  if (working.length > 0) {
    console.log('\n✅ WORKING ENDPOINTS:');
    working.forEach((result, index) => {
      console.log(`${index + 1}. Status ${result.status}: ${JSON.stringify(result.data?.success || result.data?.message || 'OK')}`);
    });
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  if (broken.some(r => r.error?.includes?.('Cannot POST /api/classify'))) {
    console.log('1. The /api/classify route is not mounted - fix routing');
  }
  if (broken.some(r => r.error?.includes?.('categorizeTransaction'))) {
    console.log('2. Fix "categorizeTransaction" task type in orchestrator');
  }
  if (broken.some(r => r.status === 404)) {
    console.log('3. Multiple routes are missing - review route mounting');
  }
  if (working.length === 0) {
    console.log('4. 🚨 CRITICAL: No endpoints working - complete system rebuild needed');
  }
}

// Wait a bit for the service to start, then run diagnostics
setTimeout(() => {
  runDiagnostics().catch(console.error);
}, 3000); 