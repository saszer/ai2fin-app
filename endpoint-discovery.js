/**
 * 🔍 ENDPOINT DISCOVERY & VALIDATION
 * 
 * Discovers which authentication endpoints actually exist and work
 * to identify the discrepancy between tests and frontend.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testEndpoint(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      validateStatus: () => true,
      timeout: 5000
    };
    
    if (data) {
      config.data = data;
      config.headers = { 'Content-Type': 'application/json' };
    }
    
    const response = await axios(config);
    return {
      endpoint,
      status: response.status,
      success: response.status >= 200 && response.status < 300,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      endpoint,
      error: error.message,
      success: false
    };
  }
}

async function discoverEndpoints() {
  console.log('🔍 ENDPOINT DISCOVERY REPORT');
  console.log('=' .repeat(60));
  
  const testCredentials = {
    email: 'test@embracingearth.space',
    password: 'TestPass123!'
  };
  
  // Test different authentication endpoints
  const authEndpoints = [
    { method: 'POST', path: '/api/auth/login', data: testCredentials },
    { method: 'POST', path: '/api/oidc/login', data: testCredentials },
    { method: 'POST', path: '/api/auth/register', data: { ...testCredentials, name: 'Test User' } },
    { method: 'GET', path: '/api/auth/me' },
    { method: 'GET', path: '/health' },
    { method: 'GET', path: '/api/version' },
    { method: 'GET', path: '/api/services/status' }
  ];
  
  console.log('\n📋 TESTING AUTHENTICATION ENDPOINTS:');
  console.log('-'.repeat(60));
  
  for (const endpoint of authEndpoints) {
    const result = await testEndpoint(endpoint.method, endpoint.path, endpoint.data);
    
    const statusIcon = result.success ? '✅' : '❌';
    const statusText = result.error ? `ERROR: ${result.error}` : `${result.status}`;
    
    console.log(`${statusIcon} ${endpoint.method.padEnd(4)} ${endpoint.path.padEnd(25)} → ${statusText}`);
    
    if (result.success && result.data) {
      if (result.data.token) {
        console.log(`    🔑 Token received: ${result.data.token.substring(0, 20)}...`);
      }
      if (result.data.user) {
        console.log(`    👤 User: ${result.data.user.email || result.data.user.id}`);
      }
    }
    
    if (result.status === 401) {
      console.log(`    ⚠️  401 Unauthorized - Authentication required or failed`);
    }
  }
  
  // Test frontend problem endpoints without auth
  console.log('\n📋 TESTING FRONTEND PROBLEM ENDPOINTS (NO AUTH):');
  console.log('-'.repeat(60));
  
  const frontendEndpoints = [
    '/api/categories',
    '/api/bank/csv-uploads',
    '/api/bank/transactions'
  ];
  
  for (const endpoint of frontendEndpoints) {
    const result = await testEndpoint('GET', endpoint);
    const statusIcon = result.success ? '✅' : '❌';
    const statusText = result.error ? `ERROR: ${result.error}` : `${result.status}`;
    
    console.log(`${statusIcon} GET  ${endpoint.padEnd(25)} → ${statusText}`);
    
    if (result.status === 401) {
      console.log(`    ⚠️  Requires authentication (expected)`);
    }
  }
  
  console.log('\n🔍 ANALYSIS:');
  console.log('=' .repeat(60));
  
  // Try to login with both endpoints and see which works
  console.log('\n🔐 COMPARING LOGIN ENDPOINTS:');
  
  const authLoginResult = await testEndpoint('POST', '/api/auth/login', testCredentials);
  const oidcLoginResult = await testEndpoint('POST', '/api/oidc/login', testCredentials);
  
  console.log(`/api/auth/login:  ${authLoginResult.success ? '✅ WORKS' : '❌ FAILS'} (${authLoginResult.status || authLoginResult.error})`);
  console.log(`/api/oidc/login:  ${oidcLoginResult.success ? '✅ WORKS' : '❌ FAILS'} (${oidcLoginResult.status || oidcLoginResult.error})`);
  
  if (authLoginResult.success !== oidcLoginResult.success) {
    console.log('\n⚠️  DISCREPANCY FOUND:');
    if (oidcLoginResult.success && !authLoginResult.success) {
      console.log('• Tests use /api/oidc/login (works) but frontend likely uses /api/auth/login (broken)');
      console.log('• This explains why tests pass but frontend gets 401 errors');
    } else if (authLoginResult.success && !oidcLoginResult.success) {
      console.log('• Frontend uses /api/auth/login (works) but tests use /api/oidc/login (broken)');
      console.log('• Tests may be giving false positives');
    }
  }
  
  // Test with a working token if we got one
  const workingToken = authLoginResult.data?.token || oidcLoginResult.data?.token;
  if (workingToken) {
    console.log('\n🔑 TESTING WITH VALID TOKEN:');
    console.log('-'.repeat(60));
    
    for (const endpoint of frontendEndpoints) {
      const result = await testEndpoint('GET', endpoint);
      // Add auth header
      const authResult = await axios.get(`${BASE_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${workingToken}` },
        validateStatus: () => true,
        timeout: 5000
      }).catch(err => ({ status: 'ERROR', error: err.message }));
      
      const statusIcon = authResult.status >= 200 && authResult.status < 300 ? '✅' : '❌';
      console.log(`${statusIcon} GET  ${endpoint.padEnd(25)} → ${authResult.status || authResult.error}`);
    }
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('=' .repeat(60));
  
  if (oidcLoginResult.success && !authLoginResult.success) {
    console.log('1. Fix /api/auth/login endpoint or update frontend to use /api/oidc/login');
    console.log('2. Ensure both endpoints work for consistency');
    console.log('3. Update tests to use the same endpoint as frontend');
  }
  
  if (!authLoginResult.success && !oidcLoginResult.success) {
    console.log('1. Both login endpoints are broken - check authentication middleware');
    console.log('2. Check database connectivity and user table');
    console.log('3. Verify JWT_SECRET and other auth environment variables');
  }
  
  console.log('4. Create unified tests that match exact frontend behavior');
  console.log('5. Add endpoint validation to CI/CD to catch these discrepancies');
}

discoverEndpoints().catch(console.error);
