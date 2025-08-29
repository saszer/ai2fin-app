/**
 * Production Error Debugging Script
 * Tests the exact endpoints failing in production
 * embracingearth.space - Production Issue Investigation
 */

const https = require('https');

console.log('🔍 PRODUCTION ERROR DEBUGGING');
console.log('============================');

// Production endpoints from screenshot
const PROD_ENDPOINTS = [
  {
    name: 'Subscription Status',
    url: 'https://api.ai2fin.com/api/subscription/status',
    method: 'GET',
    expectedError: '401 Unauthorized'
  },
  {
    name: 'Subscription Sync User', 
    url: 'https://api.ai2fin.com/api/subscription/sync-user',
    method: 'POST',
    expectedError: '403 Forbidden'
  },
  {
    name: 'System Metrics',
    url: 'https://api.ai2fin.com/api/system/metrics', 
    method: 'GET',
    expectedError: '404 Not Found'
  }
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);
    console.log(`   Method: ${endpoint.method}`);
    
    const url = new URL(endpoint.url);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: endpoint.method,
      headers: {
        'User-Agent': 'AI2-Production-Debug/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`   Headers:`, Object.keys(res.headers));
        
        if (res.headers['content-type']?.includes('application/json')) {
          try {
            const parsed = JSON.parse(data);
            console.log(`   Response:`, parsed);
          } catch (e) {
            console.log(`   Raw Response:`, data.substring(0, 200));
          }
        } else {
          console.log(`   Raw Response:`, data.substring(0, 200));
        }
        
        const matches = res.statusCode.toString() === endpoint.expectedError.split(' ')[0];
        console.log(`   Expected: ${endpoint.expectedError} - ${matches ? '✅ MATCHES' : '❌ DIFFERENT'}`);
        
        resolve({
          endpoint: endpoint.name,
          status: res.statusCode,
          expected: endpoint.expectedError,
          matches
        });
      });
    });

    req.on('error', (error) => {
      console.log(`   Error: ${error.message}`);
      resolve({
        endpoint: endpoint.name,
        status: 'ERROR',
        expected: endpoint.expectedError,
        matches: false,
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      console.log(`   Timeout after 10 seconds`);
      req.destroy();
      resolve({
        endpoint: endpoint.name,
        status: 'TIMEOUT',
        expected: endpoint.expectedError,
        matches: false
      });
    });

    if (endpoint.method === 'POST') {
      req.write(JSON.stringify({}));
    }
    
    req.end();
  });
}

async function debugProduction() {
  console.log('\n📊 TESTING PRODUCTION ENDPOINTS');
  console.log('================================');
  
  const results = [];
  
  for (const endpoint of PROD_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📋 SUMMARY');
  console.log('==========');
  
  results.forEach(result => {
    const status = result.matches ? '✅' : '❌';
    console.log(`${status} ${result.endpoint}: ${result.status} (expected ${result.expected})`);
  });
  
  console.log('\n🔧 ANALYSIS');
  console.log('===========');
  
  const authErrors = results.filter(r => r.status === 401 || r.status === 403);
  const notFoundErrors = results.filter(r => r.status === 404);
  
  if (authErrors.length > 0) {
    console.log('\n🚨 AUTHENTICATION/AUTHORIZATION ISSUES:');
    authErrors.forEach(error => {
      console.log(`   • ${error.endpoint}: ${error.status}`);
    });
    
    console.log('\n   Possible causes:');
    console.log('   - JWT token expired or invalid');
    console.log('   - CSRF token missing or mismatched');
    console.log('   - Cookie authentication failing');
    console.log('   - Service-to-service auth misconfigured');
    console.log('   - User session expired');
  }
  
  if (notFoundErrors.length > 0) {
    console.log('\n🚨 ROUTING/ENDPOINT ISSUES:');
    notFoundErrors.forEach(error => {
      console.log(`   • ${error.endpoint}: ${error.status}`);
    });
    
    console.log('\n   Possible causes:');
    console.log('   - Endpoint not deployed or misconfigured');
    console.log('   - Load balancer routing issues');
    console.log('   - Service not running');
    console.log('   - API gateway configuration');
  }
  
  console.log('\n🎯 RECOMMENDED ACTIONS:');
  console.log('======================');
  
  if (authErrors.length > 0) {
    console.log('\n1. CHECK AUTHENTICATION:');
    console.log('   - Verify JWT_SECRET matches between services');
    console.log('   - Check CSRF token generation/validation');
    console.log('   - Confirm cookie settings (SameSite, Secure, Domain)');
    console.log('   - Test with fresh login');
  }
  
  if (notFoundErrors.length > 0) {
    console.log('\n2. CHECK SERVICE DEPLOYMENT:');
    console.log('   - Verify all services are running');
    console.log('   - Check load balancer configuration');
    console.log('   - Confirm API routes are properly mounted');
  }
  
  console.log('\n3. IMMEDIATE DEBUGGING:');
  console.log('   - Check production logs for detailed errors');
  console.log('   - Test with service authentication tokens');
  console.log('   - Verify environment variables are loaded');
  console.log('   - Check database connectivity');
}

debugProduction().catch(console.error);
