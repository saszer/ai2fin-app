// Comprehensive Authentication Test Suite
// embracingearth.space - enterprise auth testing for CI/CD
const http = require('http');
const { URL } = require('url');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@embracingearth.space',
  password: process.env.TEST_USER_PASSWORD || 'TestPass123!'
};

let testResults = { passed: 0, failed: 0, tests: [] };

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}${details ? ': ' + details : ''}`);
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ 
            status: res.statusCode, 
            data: jsonData, 
            headers: res.headers,
            cookies: res.headers['set-cookie'] || []
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            data: data, 
            headers: res.headers,
            cookies: res.headers['set-cookie'] || []
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testHealthAndBasics() {
  console.log('\n🔍 Testing Basic Health & Endpoints...');
  
  // Health check
  try {
    const health = await makeRequest(`${BASE_URL}/health`);
    logTest('Backend Health', health.status === 200, `Status: ${health.status}`);
  } catch (e) {
    logTest('Backend Health', false, e.message);
  }
  
  // Test /api/auth/me without auth
  try {
    const me = await makeRequest(`${BASE_URL}/api/auth/me`);
    logTest('/api/auth/me (no auth)', 
      me.status === 200 && me.data.authenticated === false,
      `Status: ${me.status}, Auth: ${me.data?.authenticated}`
    );
  } catch (e) {
    logTest('/api/auth/me (no auth)', false, e.message);
  }
  
  // Test protected endpoint without auth
  try {
    const permissions = await makeRequest(`${BASE_URL}/api/user/permissions`);
    logTest('/api/user/permissions (no auth)', 
      permissions.status === 401,
      `Status: ${permissions.status}`
    );
  } catch (e) {
    logTest('/api/user/permissions (no auth)', false, e.message);
  }
}

async function testBearerTokenAuth() {
  console.log('\n🎫 Testing Bearer Token Authentication...');
  
  try {
    // Login and get token
    const login = await makeRequest(`${BASE_URL}/api/oidc/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: TEST_USER
    });
    
    if (login.status === 200 && login.data.token) {
      const token = login.data.token;
      logTest('OIDC Login & Token', true, 'Token received');
      
      // Test Bearer token with /api/auth/me
      const meWithToken = await makeRequest(`${BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      logTest('Bearer /api/auth/me', 
        meWithToken.status === 200 && meWithToken.data.authenticated === true,
        `Status: ${meWithToken.status}, Auth: ${meWithToken.data?.authenticated}`
      );
      
      // Test Bearer token with protected endpoint
      const permissions = await makeRequest(`${BASE_URL}/api/user/permissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      logTest('Bearer /api/user/permissions', 
        permissions.status === 200,
        `Status: ${permissions.status}`
      );
      
      // Test data endpoints
      const endpoints = [
        '/api/bank/transactions',
        '/api/user/profile',
        '/api/subscription/status'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await makeRequest(`${BASE_URL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          logTest(`Bearer ${endpoint}`, 
            response.status === 200 || response.status === 404,
            `Status: ${response.status}`
          );
        } catch (e) {
          logTest(`Bearer ${endpoint}`, false, e.message);
        }
      }
      
      return token;
    } else {
      logTest('OIDC Login & Token', false, `Status: ${login.status}, Error: ${JSON.stringify(login.data)}`);
      return null;
    }
  } catch (e) {
    logTest('OIDC Login & Token', false, e.message);
    return null;
  }
}

async function testCookieAuth() {
  console.log('\n🍪 Testing Cookie Authentication...');
  
  try {
    // Login and check for cookies
    const login = await makeRequest(`${BASE_URL}/api/oidc/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: TEST_USER
    });
    
    if (login.status === 200) {
      logTest('Cookie Login Request', true, 'Login successful');
      
      // Check for BFF cookies
      const hasSessionCookie = login.cookies.some(cookie => cookie.includes('ai2_sess'));
      const hasCSRFCookie = login.cookies.some(cookie => cookie.includes('ai2_csrf'));
      
      logTest('Session Cookie Set', hasSessionCookie, 
        hasSessionCookie ? 'ai2_sess cookie found' : 'No ai2_sess cookie'
      );
      logTest('CSRF Cookie Set', hasCSRFCookie, 
        hasCSRFCookie ? 'ai2_csrf cookie found' : 'No ai2_csrf cookie'
      );
      
      if (hasSessionCookie && hasCSRFCookie) {
        // Extract cookies for subsequent requests
        const sessionCookie = login.cookies.find(c => c.includes('ai2_sess'));
        const csrfCookie = login.cookies.find(c => c.includes('ai2_csrf'));
        
        // Extract CSRF token from cookie
        const csrfMatch = csrfCookie.match(/ai2_csrf=([^;]+)/);
        const csrfToken = csrfMatch ? csrfMatch[1] : '';
        
        // Test authenticated request with cookies
        const meResponse = await makeRequest(`${BASE_URL}/api/auth/me`, {
          headers: { 
            'Cookie': `${sessionCookie}; ${csrfCookie}`,
            'x-csrf-token': csrfToken
          }
        });
        logTest('Cookie /api/auth/me', 
          meResponse.status === 200 && meResponse.data.authenticated === true,
          `Status: ${meResponse.status}, Auth: ${meResponse.data?.authenticated}`
        );
        
        // Test protected endpoint with cookies
        const permissions = await makeRequest(`${BASE_URL}/api/user/permissions`, {
          headers: { 
            'Cookie': `${sessionCookie}; ${csrfCookie}`,
            'x-csrf-token': csrfToken
          }
        });
        logTest('Cookie /api/user/permissions', 
          permissions.status === 200,
          `Status: ${permissions.status}`
        );
      }
    } else {
      logTest('Cookie Login Request', false, `Status: ${login.status}`);
    }
  } catch (e) {
    logTest('Cookie Authentication', false, e.message);
  }
}

async function testRefreshScenario(token) {
  console.log('\n🔄 Testing Page Refresh Scenario...');
  
  if (!token) {
    console.log('   Skipping refresh test - no token available');
    return;
  }
  
  try {
    const refreshAuth = await makeRequest(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    logTest('Page Refresh Auth', 
      refreshAuth.status === 200 && refreshAuth.data.authenticated === true,
      `Status: ${refreshAuth.status}, Auth: ${refreshAuth.data?.authenticated}`
    );
    
    if (refreshAuth.data.user) {
      logTest('User Data on Refresh', 
        refreshAuth.data.user.email === TEST_USER.email,
        `Email: ${refreshAuth.data.user.email}`
      );
    }
  } catch (e) {
    logTest('Page Refresh Auth', false, e.message);
  }
}

async function testCORSHeaders() {
  console.log('\n🔄 Testing CORS Configuration...');
  
  try {
    const corsTest = await makeRequest(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    const corsHeaders = corsTest.headers;
    logTest('CORS Headers Present', 
      corsHeaders['access-control-allow-origin'] !== undefined,
      `Origin: ${corsHeaders['access-control-allow-origin']}`
    );
    
    logTest('CORS Credentials Allowed', 
      corsHeaders['access-control-allow-credentials'] === 'true',
      `Credentials: ${corsHeaders['access-control-allow-credentials']}`
    );
  } catch (e) {
    logTest('CORS Configuration', false, e.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Authentication Tests');
  console.log('==============================================');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Test user: ${TEST_USER.email}`);
  console.log('==============================================');
  
  await testHealthAndBasics();
  const token = await testBearerTokenAuth();
  await testCookieAuth();
  await testRefreshScenario(token);
  await testCORSHeaders();
  
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests.filter(t => !t.passed).forEach(test => {
      console.log(`   - ${test.name}: ${test.details}`);
    });
  }
  
  console.log('\n🔍 Key Findings:');
  console.log('- Bearer token authentication working:', testResults.tests.find(t => t.name === 'Bearer /api/auth/me')?.passed ? '✅' : '❌');
  console.log('- Cookie authentication working:', testResults.tests.find(t => t.name === 'Cookie /api/auth/me')?.passed ? '✅' : '❌');
  console.log('- Page refresh scenario working:', testResults.tests.find(t => t.name === 'Page Refresh Auth')?.passed ? '✅' : '❌');
  console.log('- CORS properly configured:', testResults.tests.find(t => t.name === 'CORS Headers Present')?.passed ? '✅' : '❌');
  
  // Export results for CI/CD
  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    testUser: TEST_USER.email,
    summary: {
      total: testResults.passed + testResults.failed,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)
    },
    tests: testResults.tests
  };
  
  // Write results to file for CI/CD
  const fs = require('fs');
  fs.writeFileSync('auth-test-results.json', JSON.stringify(results, null, 2));
  
  return testResults.failed === 0;
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, testResults };


