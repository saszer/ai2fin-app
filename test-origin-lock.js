#!/usr/bin/env node
/**
 * Test Origin Lock Implementation
 * embracingearth.space - Test if Origin Lock is working in production
 */

const https = require('https');
const http = require('http');

// Test configuration
const TEST_CONFIG = {
  // Production endpoints
  api: 'https://api.ai2fin.com',
  subscription: 'https://subscription.ai2fin.com',
  
  // Test paths
  healthPath: '/health',
  apiPath: '/api/health',
  
  // Expected Origin Lock header
  originHeaderName: 'x-origin-auth',
  testSecret: 'test-secret-value'
};

/**
 * Make HTTP request with custom headers
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Origin-Lock-Test/1.0',
        ...options.headers
      },
      timeout: 10000
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Test Origin Lock functionality
 */
async function testOriginLock() {
  console.log('🔒 Testing Origin Lock Implementation');
  console.log('=====================================\n');
  
  const tests = [
    {
      name: 'Health Check (should work - bypassed)',
      url: `${TEST_CONFIG.api}${TEST_CONFIG.healthPath}`,
      headers: {},
      expectedStatus: 200
    },
    {
      name: 'API Health (should work - bypassed)', 
      url: `${TEST_CONFIG.api}${TEST_CONFIG.apiPath}`,
      headers: {},
      expectedStatus: 200
    },
    {
      name: 'Direct API Access (should be blocked)',
      url: `${TEST_CONFIG.api}/api/core/status`,
      headers: {},
      expectedStatus: 403
    },
    {
      name: 'Direct API Access with wrong header (should be blocked)',
      url: `${TEST_CONFIG.api}/api/core/status`,
      headers: { [TEST_CONFIG.originHeaderName]: 'wrong-secret' },
      expectedStatus: 403
    },
    {
      name: 'Direct API Access with correct header (should work)',
      url: `${TEST_CONFIG.api}/api/core/status`,
      headers: { [TEST_CONFIG.originHeaderName]: TEST_CONFIG.testSecret },
      expectedStatus: 200
    },
    {
      name: 'Subscription Service (should be blocked)',
      url: `${TEST_CONFIG.subscription}/health`,
      headers: {},
      expectedStatus: 403
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`🧪 Testing: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const response = await makeRequest(test.url, { headers: test.headers });
      
      const success = response.statusCode === test.expectedStatus;
      const status = success ? '✅ PASS' : '❌ FAIL';
      
      console.log(`   Status: ${response.statusCode} (expected: ${test.expectedStatus}) ${status}`);
      
      if (response.statusCode === 403) {
        console.log(`   🔒 Origin Lock is working - request blocked`);
      } else if (response.statusCode === 200) {
        console.log(`   ✅ Request allowed`);
      }
      
      if (response.data) {
        try {
          const jsonData = JSON.parse(response.data);
          if (jsonData.error) {
            console.log(`   Error: ${jsonData.error}`);
          }
        } catch (e) {
          // Not JSON, ignore
        }
      }
      
      console.log('');
      
      if (success) {
        passed++;
      } else {
        failed++;
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      console.log('');
      failed++;
    }
  }
  
  console.log('📊 Test Results');
  console.log('===============');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Origin Lock is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Origin Lock may not be properly configured.');
  }
  
  return { passed, failed };
}

/**
 * Test specific scenario: What happens when CF rule is disabled
 */
async function testCloudflareRuleDisabled() {
  console.log('\n🔍 Testing Cloudflare Rule Disabled Scenario');
  console.log('============================================\n');
  
  console.log('This test simulates what happens when the Cloudflare');
  console.log('Request Header Transform Rule is disabled:\n');
  
  const testUrl = `${TEST_CONFIG.api}/api/core/status`;
  
  try {
    console.log(`🧪 Testing direct access to: ${testUrl}`);
    console.log('   (No Origin Lock header - simulating disabled CF rule)');
    
    const response = await makeRequest(testUrl);
    
    console.log(`   Status: ${response.statusCode}`);
    
    if (response.statusCode === 403) {
      console.log('   🔒 SUCCESS: Origin Lock is working!');
      console.log('   ✅ Direct access is blocked even without CF rule');
      console.log('   ✅ Your backend is properly protected');
    } else if (response.statusCode === 200) {
      console.log('   ⚠️  WARNING: Origin Lock is NOT working!');
      console.log('   ❌ Direct access is allowed without proper header');
      console.log('   ❌ Your backend is NOT protected');
    } else {
      console.log(`   ❓ Unexpected status: ${response.statusCode}`);
    }
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
}

// Run tests
async function main() {
  try {
    await testOriginLock();
    await testCloudflareRuleDisabled();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testOriginLock, testCloudflareRuleDisabled };
