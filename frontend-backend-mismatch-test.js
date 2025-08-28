/**
 * 🔍 FRONTEND-BACKEND MISMATCH TEST
 * 
 * Tests the exact discrepancy between what the tests use vs what the frontend uses
 * to identify why tests pass but frontend fails.
 * 
 * embracingearth.space - Endpoint mismatch debugging
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testEndpointMismatch() {
  console.log('🔍 FRONTEND-BACKEND MISMATCH ANALYSIS');
  console.log('=' .repeat(70));
  
  const testCredentials = {
    email: 'test@embracingearth.space',
    password: 'TestPass123!'
  };
  
  console.log('\n📋 TESTING BOTH LOGIN ENDPOINTS:');
  console.log('-'.repeat(70));
  
  // Test 1: /api/oidc/login (what tests use)
  try {
    const oidcResponse = await axios.post(`${BASE_URL}/api/oidc/login`, testCredentials, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
      validateStatus: () => true
    });
    
    console.log('🔧 TESTS ENDPOINT: /api/oidc/login');
    console.log(`   Status: ${oidcResponse.status}`);
    console.log(`   Success: ${oidcResponse.data?.success || false}`);
    console.log(`   Token: ${oidcResponse.data?.token ? 'YES' : 'NO'}`);
    console.log(`   User: ${oidcResponse.data?.user?.email || 'NO'}`);
    
    if (oidcResponse.status === 200) {
      console.log('   ✅ OIDC LOGIN WORKS - This is why tests pass');
    } else {
      console.log('   ❌ OIDC LOGIN FAILS');
    }
  } catch (error) {
    console.log('🔧 TESTS ENDPOINT: /api/oidc/login');
    console.log(`   ERROR: ${error.message}`);
  }
  
  console.log('');
  
  // Test 2: /api/auth/login (what frontend likely uses)
  try {
    const authResponse = await axios.post(`${BASE_URL}/api/auth/login`, testCredentials, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
      validateStatus: () => true
    });
    
    console.log('🖥️  FRONTEND ENDPOINT: /api/auth/login');
    console.log(`   Status: ${authResponse.status}`);
    console.log(`   Success: ${authResponse.data?.success || false}`);
    console.log(`   Token: ${authResponse.data?.token ? 'YES' : 'NO'}`);
    console.log(`   User: ${authResponse.data?.user?.email || 'NO'}`);
    console.log(`   Error: ${authResponse.data?.error || 'NONE'}`);
    
    if (authResponse.status === 200) {
      console.log('   ✅ AUTH LOGIN WORKS');
    } else {
      console.log('   ❌ AUTH LOGIN FAILS - This is why frontend gets 401s');
    }
  } catch (error) {
    console.log('🖥️  FRONTEND ENDPOINT: /api/auth/login');
    console.log(`   ERROR: ${error.message}`);
  }
  
  console.log('\n📋 TESTING FRONTEND PROBLEM ENDPOINTS:');
  console.log('-'.repeat(70));
  
  // Get a working token from OIDC login
  let workingToken = null;
  try {
    const oidcLogin = await axios.post(`${BASE_URL}/api/oidc/login`, testCredentials, {
      headers: { 'Content-Type': 'application/json' }
    });
    workingToken = oidcLogin.data?.token;
  } catch (error) {
    console.log('❌ Could not get working token from OIDC login');
  }
  
  if (workingToken) {
    console.log(`🔑 Using token from OIDC login: ${workingToken.substring(0, 20)}...`);
    
    const frontendEndpoints = [
      '/api/categories',
      '/api/bank/csv-uploads',
      '/api/bank/transactions'
    ];
    
    for (const endpoint of frontendEndpoints) {
      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
          headers: { 'Authorization': `Bearer ${workingToken}` },
          timeout: 5000,
          validateStatus: () => true
        });
        
        const statusIcon = response.status === 200 ? '✅' : '❌';
        console.log(`${statusIcon} ${endpoint}: ${response.status}`);
        
        if (response.status === 401) {
          console.log(`   ⚠️  Still 401 even with working token - deeper auth issue`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: ERROR - ${error.message}`);
      }
    }
  }
  
  console.log('\n🔍 ROOT CAUSE ANALYSIS:');
  console.log('=' .repeat(70));
  
  // Test if both endpoints exist
  try {
    const oidcOptions = await axios.options(`${BASE_URL}/api/oidc/login`, { validateStatus: () => true });
    const authOptions = await axios.options(`${BASE_URL}/api/auth/login`, { validateStatus: () => true });
    
    console.log(`/api/oidc/login exists: ${oidcOptions.status !== 404 ? 'YES' : 'NO'} (${oidcOptions.status})`);
    console.log(`/api/auth/login exists: ${authOptions.status !== 404 ? 'YES' : 'NO'} (${authOptions.status})`);
  } catch (error) {
    console.log('Could not check endpoint existence');
  }
  
  console.log('\n💡 SOLUTION:');
  console.log('=' .repeat(70));
  console.log('1. Fix /api/auth/login endpoint to work like /api/oidc/login');
  console.log('2. OR update frontend to use /api/oidc/login');
  console.log('3. Update tests to use the same endpoint as frontend');
  console.log('4. Ensure both endpoints work for redundancy');
  
  console.log('\n🛠️  IMMEDIATE ACTION NEEDED:');
  console.log('• Check which endpoint the frontend actually uses');
  console.log('• Fix the broken endpoint or update the frontend');
  console.log('• Update tests to match frontend behavior exactly');
}

testEndpointMismatch().catch(console.error);
