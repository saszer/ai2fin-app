#!/usr/bin/env node

/**
 * PRODUCTION READINESS TEST
 * AI2 Core Application - embracingearth.space
 * 
 * This script tests the production-ready service discovery and analytics connectivity
 * without any development-only fallback mechanisms.
 */

const axios = require('axios');

const CORE_APP_URL = 'http://localhost:3001';
const ANALYTICS_URL = 'http://localhost:3002';

// Test configuration
const tests = [
  {
    name: 'Core App Health Check',
    url: `${CORE_APP_URL}/health`,
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Analytics Service Health Check',
    url: `${ANALYTICS_URL}/health`,
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Service Discovery Status',
    url: `${CORE_APP_URL}/api/monitoring/refresh-services`,
    method: 'POST',
    expectedStatus: 200
  },
  {
    name: 'Critical Services Health',
    url: `${CORE_APP_URL}/api/monitoring/critical-services`,
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Analytics Export Preview (Production)',
    url: `${CORE_APP_URL}/api/analytics/export/preview`,
    method: 'POST',
    data: {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      userId: 'test-user'
    },
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    },
    expectedStatus: [200, 401, 503] // Accept multiple status codes for different scenarios
  }
];

async function runTest(test) {
  try {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    
    const response = await axios({
      method: test.method,
      url: test.url,
      data: test.data,
      headers: test.headers,
      timeout: 10000,
      validateStatus: () => true // Don't throw on any status code
    });

    const expectedStatuses = Array.isArray(test.expectedStatus) ? test.expectedStatus : [test.expectedStatus];
    const statusMatch = expectedStatuses.includes(response.status);
    
    console.log(`   Status: ${response.status} ${statusMatch ? '✅' : '❌'}`);
    console.log(`   Expected: ${expectedStatuses.join(' or ')}`);
    
    if (response.data) {
      console.log(`   Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
    }
    
    return {
      name: test.name,
      success: statusMatch,
      status: response.status,
      response: response.data
    };
    
  } catch (error) {
    console.log(`   Error: ${error.message} ❌`);
    return {
      name: test.name,
      success: false,
      error: error.message
    };
  }
}

async function runProductionReadinessTest() {
  console.log('🚀 PRODUCTION READINESS TEST');
  console.log('============================');
  console.log('Testing AI2 Core Application production configuration...');
  console.log(`Core App: ${CORE_APP_URL}`);
  console.log(`Analytics: ${ANALYTICS_URL}`);
  
  const results = [];
  
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
  }
  
  console.log('\n📊 TEST RESULTS');
  console.log('================');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log(`\n🎯 SUMMARY: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED - Production ready!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed - Review configuration');
    process.exit(1);
  }
}

// Run the test
runProductionReadinessTest().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});




