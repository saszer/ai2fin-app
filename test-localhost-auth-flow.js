/**
 * Localhost Authentication Flow Testing
 * Tests the exact same endpoints that are failing in production
 * embracingearth.space - Local Development Testing
 */

const axios = require('axios');

console.log('🧪 LOCALHOST AUTHENTICATION FLOW TESTING');
console.log('=========================================');

const BASE_URL = 'http://localhost:3001';
const SUBSCRIPTION_URL = 'http://localhost:3002';

// Test configuration
const TEST_CONFIG = {
  email: process.env.TEST_EMAIL || 'test@example.com',
  password: process.env.TEST_PASSWORD || 'testpass123'
};

let authToken = null;
let sessionCookies = null;
let csrfToken = null;

// Create axios instances with different configurations
const coreAPI = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
  validateStatus: () => true // Don't throw on error status codes
});

const subsAPI = axios.create({
  baseURL: SUBSCRIPTION_URL,
  timeout: 10000,
  withCredentials: true,
  validateStatus: () => true
});

async function step1_testCoreServiceHealth() {
  console.log('\n📋 STEP 1: Core Service Health Check');
  console.log('====================================');
  
  try {
    const response = await coreAPI.get('/health');
    console.log(`✅ Core service health: ${response.status} ${response.statusText}`);
    console.log(`   Response:`, response.data);
    return response.status === 200;
  } catch (error) {
    console.log(`❌ Core service health failed:`, error.message);
    return false;
  }
}

async function step2_testSubscriptionServiceHealth() {
  console.log('\n📋 STEP 2: Subscription Service Health Check');
  console.log('============================================');
  
  try {
    const response = await subsAPI.get('/health');
    console.log(`✅ Subscription service health: ${response.status} ${response.statusText}`);
    console.log(`   Response:`, response.data);
    return response.status === 200;
  } catch (error) {
    console.log(`❌ Subscription service health failed:`, error.message);
    return false;
  }
}

async function step3_testPublicEndpoints() {
  console.log('\n📋 STEP 3: Public Endpoints (Should Work Without Auth)');
  console.log('======================================================');
  
  const publicEndpoints = [
    { name: 'API Version', url: '/api/version', service: 'core' },
    { name: 'System Metrics', url: '/api/system/metrics', service: 'core' }
  ];
  
  const results = [];
  
  for (const endpoint of publicEndpoints) {
    try {
      const api = endpoint.service === 'core' ? coreAPI : subsAPI;
      const response = await api.get(endpoint.url);
      
      console.log(`\n🔍 ${endpoint.name}:`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Headers:`, Object.keys(response.headers));
      
      if (response.data) {
        console.log(`   Data:`, JSON.stringify(response.data, null, 2));
      }
      
      results.push({
        name: endpoint.name,
        status: response.status,
        success: response.status < 400
      });
      
    } catch (error) {
      console.log(`❌ ${endpoint.name} failed:`, error.message);
      results.push({
        name: endpoint.name,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

async function step4_testAuthentication() {
  console.log('\n📋 STEP 4: Authentication Flow');
  console.log('==============================');
  
  try {
    console.log(`🔐 Attempting login with: ${TEST_CONFIG.email}`);
    
    const loginResponse = await coreAPI.post('/api/enterprise-auth/login', {
      email: TEST_CONFIG.email,
      password: TEST_CONFIG.password
    });
    
    console.log(`   Login Status: ${loginResponse.status} ${loginResponse.statusText}`);
    
    if (loginResponse.status === 200 && loginResponse.data) {
      console.log(`✅ Login successful`);
      
      // Extract tokens
      if (loginResponse.data.token) {
        authToken = loginResponse.data.token;
        console.log(`   JWT Token: ${authToken.substring(0, 50)}...`);
      }
      
      // Extract cookies
      const setCookieHeaders = loginResponse.headers['set-cookie'];
      if (setCookieHeaders) {
        sessionCookies = setCookieHeaders;
        console.log(`   Cookies set: ${setCookieHeaders.length} cookies`);
        
        // Extract CSRF token from cookies
        const csrfCookie = setCookieHeaders.find(cookie => cookie.includes('ai2_csrf'));
        if (csrfCookie) {
          const match = csrfCookie.match(/ai2_csrf=([^;]+)/);
          if (match) {
            csrfToken = match[1];
            console.log(`   CSRF Token: ${csrfToken.substring(0, 20)}...`);
          }
        }
      }
      
      return true;
    } else {
      console.log(`❌ Login failed:`, loginResponse.data);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Authentication error:`, error.message);
    if (error.response) {
      console.log(`   Response status: ${error.response.status}`);
      console.log(`   Response data:`, error.response.data);
    }
    return false;
  }
}

async function step5_testAuthenticatedEndpoints() {
  console.log('\n📋 STEP 5: Authenticated Endpoints (Core Service)');
  console.log('=================================================');
  
  if (!authToken && !sessionCookies) {
    console.log('❌ No authentication tokens available, skipping authenticated tests');
    return [];
  }
  
  const authenticatedEndpoints = [
    { name: 'User Profile', url: '/api/user/profile', method: 'GET' },
    { name: 'Categories List', url: '/api/categories', method: 'GET' }
  ];
  
  const results = [];
  
  for (const endpoint of authenticatedEndpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint.name}`);
      
      // Prepare headers
      const headers = {};
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log(`   Using Bearer token`);
      }
      
      if (csrfToken && endpoint.method !== 'GET') {
        headers['X-CSRF-Token'] = csrfToken;
        console.log(`   Using CSRF token`);
      }
      
      const response = await coreAPI({
        method: endpoint.method,
        url: endpoint.url,
        headers
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.status < 400) {
        console.log(`✅ ${endpoint.name} successful`);
        if (response.data) {
          console.log(`   Data keys:`, Object.keys(response.data));
        }
      } else {
        console.log(`❌ ${endpoint.name} failed`);
        console.log(`   Error:`, response.data);
      }
      
      results.push({
        name: endpoint.name,
        status: response.status,
        success: response.status < 400
      });
      
    } catch (error) {
      console.log(`❌ ${endpoint.name} error:`, error.message);
      results.push({
        name: endpoint.name,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

async function step6_testSubscriptionEndpoints() {
  console.log('\n📋 STEP 6: Subscription Endpoints (The Failing Ones)');
  console.log('====================================================');
  
  if (!authToken && !sessionCookies) {
    console.log('❌ No authentication tokens available, skipping subscription tests');
    return [];
  }
  
  const subscriptionEndpoints = [
    { name: 'Subscription Status', url: '/api/subscription/status', method: 'GET' },
    { name: 'Subscription Sync User', url: '/api/subscription/sync-user', method: 'POST' },
    { name: 'Subscription Status (Force)', url: '/api/subscription/status?force=true', method: 'GET', headers: { 'X-Force-Refresh': '1', 'Cache-Control': 'no-cache' } }
  ];
  
  const results = [];
  
  for (const endpoint of subscriptionEndpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint.name}`);
      
      // Prepare headers
      const headers = { ...endpoint.headers };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log(`   Using Bearer token`);
      }
      
      if (csrfToken && endpoint.method !== 'GET') {
        headers['X-CSRF-Token'] = csrfToken;
        console.log(`   Using CSRF token`);
      }
      
      const requestConfig = {
        method: endpoint.method,
        url: endpoint.url,
        headers
      };
      
      if (endpoint.method === 'POST') {
        requestConfig.data = {};
      }
      
      const response = await subsAPI(requestConfig);
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.status < 400) {
        console.log(`✅ ${endpoint.name} successful`);
        if (response.data) {
          console.log(`   Data:`, JSON.stringify(response.data, null, 2));
        }
      } else {
        console.log(`❌ ${endpoint.name} failed`);
        console.log(`   Error:`, response.data);
        
        // Enhanced debugging for auth failures
        if (response.status === 401) {
          console.log(`   🔍 401 Debugging:`);
          console.log(`      - Token present: ${!!authToken}`);
          console.log(`      - Cookies present: ${!!sessionCookies}`);
          console.log(`      - Response headers:`, response.headers);
        }
        
        if (response.status === 403) {
          console.log(`   🔍 403 Debugging:`);
          console.log(`      - CSRF token present: ${!!csrfToken}`);
          console.log(`      - Method: ${endpoint.method}`);
          console.log(`      - Response headers:`, response.headers);
        }
      }
      
      results.push({
        name: endpoint.name,
        status: response.status,
        success: response.status < 400,
        data: response.data
      });
      
    } catch (error) {
      console.log(`❌ ${endpoint.name} error:`, error.message);
      if (error.response) {
        console.log(`   Response status: ${error.response.status}`);
        console.log(`   Response data:`, error.response.data);
      }
      results.push({
        name: endpoint.name,
        status: error.response?.status || 'ERROR',
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

async function step7_auditConfiguration() {
  console.log('\n📋 STEP 7: Configuration Audit');
  console.log('===============================');
  
  console.log('\n🔍 Environment Variables Check:');
  const requiredEnvVars = [
    'JWT_SECRET',
    'COOKIE_SECRET', 
    'ZITADEL_ISSUER',
    'ZITADEL_CLIENT_ID',
    'STRIPE_SECRET_KEY',
    'SERVICE_SECRET'
  ];
  
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    console.log(`   ${envVar}: ${value ? '✅ Set' : '❌ Missing'}`);
  });
  
  console.log('\n🔍 Service URLs:');
  console.log(`   Core Service: ${BASE_URL}`);
  console.log(`   Subscription Service: ${SUBSCRIPTION_URL}`);
  
  console.log('\n🔍 Authentication State:');
  console.log(`   JWT Token: ${authToken ? '✅ Present' : '❌ Missing'}`);
  console.log(`   Session Cookies: ${sessionCookies ? '✅ Present' : '❌ Missing'}`);
  console.log(`   CSRF Token: ${csrfToken ? '✅ Present' : '❌ Missing'}`);
}

async function runFullTest() {
  console.log('🚀 Starting comprehensive localhost testing...\n');
  
  const results = {
    coreHealth: false,
    subsHealth: false,
    publicEndpoints: [],
    authentication: false,
    authenticatedEndpoints: [],
    subscriptionEndpoints: []
  };
  
  // Step 1: Core service health
  results.coreHealth = await step1_testCoreServiceHealth();
  
  // Step 2: Subscription service health  
  results.subsHealth = await step2_testSubscriptionServiceHealth();
  
  // Step 3: Public endpoints
  results.publicEndpoints = await step3_testPublicEndpoints();
  
  // Step 4: Authentication
  results.authentication = await step4_testAuthentication();
  
  // Step 5: Authenticated endpoints (core)
  if (results.authentication) {
    results.authenticatedEndpoints = await step5_testAuthenticatedEndpoints();
  }
  
  // Step 6: Subscription endpoints (the failing ones)
  if (results.authentication) {
    results.subscriptionEndpoints = await step6_testSubscriptionEndpoints();
  }
  
  // Step 7: Configuration audit
  await step7_auditConfiguration();
  
  // Final summary
  console.log('\n📊 FINAL SUMMARY');
  console.log('================');
  
  console.log(`\n🏥 Service Health:`);
  console.log(`   Core Service: ${results.coreHealth ? '✅ Healthy' : '❌ Unhealthy'}`);
  console.log(`   Subscription Service: ${results.subsHealth ? '✅ Healthy' : '❌ Unhealthy'}`);
  
  console.log(`\n🔓 Public Endpoints:`);
  results.publicEndpoints.forEach(result => {
    console.log(`   ${result.name}: ${result.success ? '✅' : '❌'} (${result.status})`);
  });
  
  console.log(`\n🔐 Authentication: ${results.authentication ? '✅ Working' : '❌ Failed'}`);
  
  if (results.authenticatedEndpoints.length > 0) {
    console.log(`\n🔒 Authenticated Endpoints (Core):`);
    results.authenticatedEndpoints.forEach(result => {
      console.log(`   ${result.name}: ${result.success ? '✅' : '❌'} (${result.status})`);
    });
  }
  
  if (results.subscriptionEndpoints.length > 0) {
    console.log(`\n💳 Subscription Endpoints (Production Failing):`);
    results.subscriptionEndpoints.forEach(result => {
      console.log(`   ${result.name}: ${result.success ? '✅' : '❌'} (${result.status})`);
    });
  }
  
  // Identify issues
  const issues = [];
  
  if (!results.coreHealth) issues.push('Core service not responding');
  if (!results.subsHealth) issues.push('Subscription service not responding');
  if (!results.authentication) issues.push('Authentication flow broken');
  
  const failedSubscriptionEndpoints = results.subscriptionEndpoints.filter(r => !r.success);
  if (failedSubscriptionEndpoints.length > 0) {
    issues.push(`${failedSubscriptionEndpoints.length} subscription endpoints failing`);
  }
  
  if (issues.length > 0) {
    console.log(`\n🚨 ISSUES FOUND:`);
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  } else {
    console.log(`\n✅ ALL TESTS PASSED - Issue may be production-specific`);
  }
  
  return results;
}

// Run the test
runFullTest().catch(console.error);
