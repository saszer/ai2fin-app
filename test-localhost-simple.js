/**
 * Simple Localhost Testing (No Dependencies)
 * Tests the exact same endpoints that are failing in production
 * embracingearth.space - Local Development Testing
 */

const http = require('http');
const https = require('https');

console.log('🧪 SIMPLE LOCALHOST TESTING');
console.log('===========================');

const BASE_URL = 'http://localhost:3001';
const SUBSCRIPTION_URL = 'http://localhost:3010';

let authToken = null;
let sessionCookies = null;
let csrfToken = null;

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
        'User-Agent': 'AI2-Localhost-Test/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            data: parsedData,
            rawData: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            data: null,
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.data) {
      req.write(JSON.stringify(options.data));
    }
    
    req.end();
  });
}

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🔍 Testing: ${name}`);
  console.log(`   URL: ${url}`);
  console.log(`   Method: ${options.method || 'GET'}`);
  
  try {
    const response = await makeRequest(url, options);
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status < 400) {
      console.log(`✅ ${name} - SUCCESS`);
      if (response.data) {
        console.log(`   Response keys:`, Object.keys(response.data));
      }
    } else {
      console.log(`❌ ${name} - FAILED`);
      console.log(`   Error:`, response.data || response.rawData);
    }
    
    return {
      name,
      success: response.status < 400,
      status: response.status,
      response
    };
    
  } catch (error) {
    console.log(`❌ ${name} - ERROR: ${error.message}`);
    return {
      name,
      success: false,
      status: 'ERROR',
      error: error.message
    };
  }
}

async function runTests() {
  console.log('\n📋 STEP 1: Service Health Checks');
  console.log('=================================');
  
  const healthTests = [
    { name: 'Core Service Health', url: `${BASE_URL}/health` },
    { name: 'Subscription Service Health', url: `${SUBSCRIPTION_URL}/health` }
  ];
  
  const healthResults = [];
  for (const test of healthTests) {
    const result = await testEndpoint(test.name, test.url);
    healthResults.push(result);
  }
  
  console.log('\n📋 STEP 2: Public Endpoints');
  console.log('============================');
  
  const publicTests = [
    { name: 'API Version', url: `${BASE_URL}/api/version` },
    { name: 'System Metrics', url: `${BASE_URL}/api/system/metrics` }
  ];
  
  const publicResults = [];
  for (const test of publicTests) {
    const result = await testEndpoint(test.name, test.url);
    publicResults.push(result);
  }
  
  console.log('\n📋 STEP 3: Authentication Test');
  console.log('===============================');
  
  const loginResult = await testEndpoint(
    'Enterprise Login', 
    `${BASE_URL}/api/enterprise-auth/login`,
    {
      method: 'POST',
      data: {
        email: process.env.TEST_EMAIL || 'test@example.com',
        password: process.env.TEST_PASSWORD || 'testpass123'
      }
    }
  );
  
  // Extract auth tokens if login successful
  if (loginResult.success && loginResult.response.data) {
    if (loginResult.response.data.token) {
      authToken = loginResult.response.data.token;
      console.log(`   ✅ JWT Token extracted: ${authToken.substring(0, 30)}...`);
    }
    
    const setCookies = loginResult.response.headers['set-cookie'];
    if (setCookies) {
      sessionCookies = setCookies;
      console.log(`   ✅ Session cookies extracted: ${setCookies.length} cookies`);
      
      // Extract CSRF token
      const csrfCookie = setCookies.find(cookie => cookie.includes('ai2_csrf'));
      if (csrfCookie) {
        const match = csrfCookie.match(/ai2_csrf=([^;]+)/);
        if (match) {
          csrfToken = match[1];
          console.log(`   ✅ CSRF Token extracted: ${csrfToken.substring(0, 20)}...`);
        }
      }
    }
  }
  
  console.log('\n📋 STEP 4: Subscription Endpoints (Production Failing Ones)');
  console.log('===========================================================');
  
  if (!authToken) {
    console.log('❌ No auth token available, skipping subscription tests');
    return;
  }
  
  const subscriptionTests = [
    {
      name: 'Subscription Status',
      url: `${SUBSCRIPTION_URL}/api/subscription/status`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    },
    {
      name: 'Subscription Status (Force Refresh)',
      url: `${SUBSCRIPTION_URL}/api/subscription/status?force=true`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Force-Refresh': '1',
        'Cache-Control': 'no-cache'
      }
    },
    {
      name: 'Subscription Sync User',
      url: `${SUBSCRIPTION_URL}/api/subscription/sync-user`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
      },
      data: {}
    }
  ];
  
  const subscriptionResults = [];
  for (const test of subscriptionTests) {
    const result = await testEndpoint(test.name, test.url, test);
    subscriptionResults.push(result);
  }
  
  console.log('\n📊 FINAL SUMMARY');
  console.log('================');
  
  console.log('\n🏥 Service Health:');
  healthResults.forEach(result => {
    console.log(`   ${result.name}: ${result.success ? '✅' : '❌'} (${result.status})`);
  });
  
  console.log('\n🔓 Public Endpoints:');
  publicResults.forEach(result => {
    console.log(`   ${result.name}: ${result.success ? '✅' : '❌'} (${result.status})`);
  });
  
  console.log(`\n🔐 Authentication: ${loginResult.success ? '✅' : '❌'} (${loginResult.status})`);
  
  console.log('\n💳 Subscription Endpoints (Production Failing):');
  subscriptionResults.forEach(result => {
    console.log(`   ${result.name}: ${result.success ? '✅' : '❌'} (${result.status})`);
  });
  
  // Analysis
  const allFailed = subscriptionResults.filter(r => !r.success);
  const authFailed = subscriptionResults.filter(r => r.status === 401 || r.status === 403);
  
  if (allFailed.length === 0) {
    console.log('\n✅ ALL LOCALHOST TESTS PASSED!');
    console.log('   The issue is likely production-specific (deployment, env vars, or network)');
  } else {
    console.log(`\n🚨 ${allFailed.length} LOCALHOST TESTS FAILED:`);
    allFailed.forEach(result => {
      console.log(`   • ${result.name}: ${result.status}`);
    });
    
    if (authFailed.length > 0) {
      console.log('\n   🔍 Authentication/Authorization issues detected locally');
      console.log('   This suggests the problem exists in our code, not just production');
    }
  }
  
  console.log('\n🎯 NEXT STEPS:');
  if (allFailed.length === 0) {
    console.log('   1. Check production environment variables');
    console.log('   2. Verify production deployment status');
    console.log('   3. Check production service logs');
    console.log('   4. Test production with service authentication');
  } else {
    console.log('   1. Fix localhost authentication issues first');
    console.log('   2. Debug JWT token validation');
    console.log('   3. Check CSRF token implementation');
    console.log('   4. Verify service-to-service communication');
  }
}

runTests().catch(console.error);
