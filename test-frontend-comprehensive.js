#!/usr/bin/env node

/**
 * Comprehensive Frontend Authentication & Data Loading Test
 * Tests all auth flows, cookie/bearer token handling, and data loading
 * embracingearth.space - enterprise auth testing suite
 */

const axios = require('axios');
const { JSDOM } = require('jsdom');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}${details ? ': ' + details : ''}`);
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

// Create axios instances for different scenarios
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true, // Important for cookie auth
  validateStatus: () => true // Don't throw on 4xx/5xx
});

const frontendClient = axios.create({
  baseURL: FRONTEND_URL,
  timeout: 10000,
  validateStatus: () => true
});

async function testBackendHealth() {
  console.log('\n🔍 Testing Backend Health...');
  
  try {
    const response = await apiClient.get('/health');
    logTest('Backend Health Check', response.status === 200, `Status: ${response.status}`);
    
    if (response.data) {
      console.log('   Health Data:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    logTest('Backend Health Check', false, error.message);
  }
}

async function testAuthEndpoints() {
  console.log('\n🔐 Testing Authentication Endpoints...');
  
  // Test /api/auth/me without auth
  try {
    const meResponse = await apiClient.get('/api/auth/me');
    logTest('GET /api/auth/me (unauthenticated)', 
      meResponse.status === 200 && meResponse.data.authenticated === false,
      `Status: ${meResponse.status}, Auth: ${meResponse.data?.authenticated}`
    );
  } catch (error) {
    logTest('GET /api/auth/me (unauthenticated)', false, error.message);
  }

  // Test protected endpoint without auth
  try {
    const protectedResponse = await apiClient.get('/api/user/permissions');
    logTest('GET /api/user/permissions (unauthenticated)', 
      protectedResponse.status === 401,
      `Status: ${protectedResponse.status}`
    );
  } catch (error) {
    logTest('GET /api/user/permissions (unauthenticated)', false, error.message);
  }
}

async function testBearerTokenAuth() {
  console.log('\n🎫 Testing Bearer Token Authentication...');
  
  // First, try to login and get a token
  try {
    const loginResponse = await apiClient.post('/api/auth/login', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (loginResponse.status === 200 && loginResponse.data.token) {
      const token = loginResponse.data.token;
      logTest('Login and Token Generation', true, 'Token received');
      
      // Test Bearer token with /api/auth/me
      const bearerClient = axios.create({
        baseURL: BASE_URL,
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        validateStatus: () => true
      });
      
      const meResponse = await bearerClient.get('/api/auth/me');
      logTest('Bearer Token /api/auth/me', 
        meResponse.status === 200 && meResponse.data.authenticated === true,
        `Status: ${meResponse.status}, Auth: ${meResponse.data?.authenticated}`
      );
      
      // Test Bearer token with protected endpoint
      const permissionsResponse = await bearerClient.get('/api/user/permissions');
      logTest('Bearer Token /api/user/permissions', 
        permissionsResponse.status === 200,
        `Status: ${permissionsResponse.status}`
      );
      
      return token;
    } else {
      logTest('Login and Token Generation', false, `Status: ${loginResponse.status}`);
      return null;
    }
  } catch (error) {
    logTest('Login and Token Generation', false, error.message);
    return null;
  }
}

async function testCookieAuth() {
  console.log('\n🍪 Testing Cookie Authentication...');
  
  // Create a client that preserves cookies
  const cookieClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    withCredentials: true,
    validateStatus: () => true
  });
  
  try {
    const loginResponse = await cookieClient.post('/api/auth/login', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (loginResponse.status === 200) {
      logTest('Cookie Login', true, 'Login successful');
      
      // Check if cookies were set
      const cookies = loginResponse.headers['set-cookie'];
      const hasSessionCookie = cookies?.some(cookie => cookie.includes('ai2_sess'));
      const hasCSRFCookie = cookies?.some(cookie => cookie.includes('ai2_csrf'));
      
      logTest('Session Cookie Set', hasSessionCookie, hasSessionCookie ? 'ai2_sess cookie found' : 'No ai2_sess cookie');
      logTest('CSRF Cookie Set', hasCSRFCookie, hasCSRFCookie ? 'ai2_csrf cookie found' : 'No ai2_csrf cookie');
      
      // Test authenticated request with cookies
      const meResponse = await cookieClient.get('/api/auth/me');
      logTest('Cookie Auth /api/auth/me', 
        meResponse.status === 200 && meResponse.data.authenticated === true,
        `Status: ${meResponse.status}, Auth: ${meResponse.data?.authenticated}`
      );
      
      // Test protected endpoint with cookies
      const permissionsResponse = await cookieClient.get('/api/user/permissions');
      logTest('Cookie Auth /api/user/permissions', 
        permissionsResponse.status === 200,
        `Status: ${permissionsResponse.status}`
      );
      
    } else {
      logTest('Cookie Login', false, `Status: ${loginResponse.status}`);
    }
  } catch (error) {
    logTest('Cookie Login', false, error.message);
  }
}

async function testDataEndpoints(token) {
  console.log('\n📊 Testing Data Loading Endpoints...');
  
  if (!token) {
    console.log('   Skipping data tests - no valid token');
    return;
  }
  
  const authClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
      'Authorization': `Bearer ${token}`
    },
    validateStatus: () => true
  });
  
  // Test various data endpoints
  const endpoints = [
    '/api/bank/transactions',
    '/api/bank/csv-uploads',
    '/api/user/profile',
    '/api/system/metrics',
    '/api/subscription/status'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await authClient.get(endpoint);
      logTest(`Data Endpoint ${endpoint}`, 
        response.status === 200 || response.status === 404, // 404 is acceptable for some endpoints
        `Status: ${response.status}`
      );
    } catch (error) {
      logTest(`Data Endpoint ${endpoint}`, false, error.message);
    }
  }
}

async function testFrontendAccess() {
  console.log('\n🌐 Testing Frontend Access...');
  
  try {
    const response = await frontendClient.get('/');
    logTest('Frontend Root Access', 
      response.status === 200,
      `Status: ${response.status}`
    );
    
    // Check if it's actually serving the React app
    if (response.data && typeof response.data === 'string') {
      const hasReactRoot = response.data.includes('root') || response.data.includes('React');
      logTest('Frontend React App', hasReactRoot, hasReactRoot ? 'React app detected' : 'No React app found');
    }
  } catch (error) {
    logTest('Frontend Root Access', false, error.message);
  }
}

async function testCORSHeaders() {
  console.log('\n🔄 Testing CORS Configuration...');
  
  try {
    const response = await apiClient.options('/api/auth/me', {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,content-type'
      }
    });
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-credentials': response.headers['access-control-allow-credentials'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers']
    };
    
    logTest('CORS Preflight', response.status === 200 || response.status === 204, `Status: ${response.status}`);
    logTest('CORS Allow Origin', corsHeaders['access-control-allow-origin'] === 'http://localhost:3000', corsHeaders['access-control-allow-origin']);
    logTest('CORS Allow Credentials', corsHeaders['access-control-allow-credentials'] === 'true', corsHeaders['access-control-allow-credentials']);
    
    console.log('   CORS Headers:', corsHeaders);
  } catch (error) {
    logTest('CORS Configuration', false, error.message);
  }
}

async function testLocalStorageSimulation() {
  console.log('\n💾 Testing LocalStorage Token Persistence Simulation...');
  
  // Simulate what happens in the browser
  const token = await testBearerTokenAuth();
  
  if (token) {
    // Simulate storing token in localStorage
    console.log('   Simulating localStorage.setItem("token", token)');
    
    // Simulate page refresh - new request with stored token
    const refreshClient = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      validateStatus: () => true
    });
    
    const meResponse = await refreshClient.get('/api/auth/me');
    logTest('Token Persistence After Refresh', 
      meResponse.status === 200 && meResponse.data.authenticated === true,
      `Status: ${meResponse.status}, Auth: ${meResponse.data?.authenticated}`
    );
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Frontend Authentication Tests');
  console.log('================================================');
  
  await testBackendHealth();
  await testAuthEndpoints();
  await testCORSHeaders();
  
  const token = await testBearerTokenAuth();
  await testCookieAuth();
  await testDataEndpoints(token);
  await testLocalStorageSimulation();
  await testFrontendAccess();
  
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
  console.log('- Check if Bearer tokens work across page refresh');
  console.log('- Verify cookie authentication is properly configured');
  console.log('- Ensure CORS allows credentials for cookie auth');
  console.log('- Confirm all protected endpoints return proper status codes');
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
