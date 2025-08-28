/**
 * 🔧 BASIC AUTHENTICATION TEST
 * 
 * Tests the most fundamental authentication endpoints to identify
 * if the core auth system is working at all.
 * 
 * embracingearth.space - Basic auth debugging
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testBasicEndpoints() {
  console.log('🔍 Testing basic endpoints...\n');
  
  // Test 1: Health endpoint (should always work)
  try {
    const healthResponse = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Health endpoint:', healthResponse.status, healthResponse.data);
  } catch (error) {
    console.log('❌ Health endpoint failed:', error.message);
  }
  
  // Test 2: Version endpoint (should be public)
  try {
    const versionResponse = await axios.get(`${BASE_URL}/api/version`, { timeout: 5000 });
    console.log('✅ Version endpoint:', versionResponse.status, versionResponse.data);
  } catch (error) {
    console.log('❌ Version endpoint failed:', error.message);
  }
  
  // Test 3: Login endpoint structure
  try {
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@embracingearth.space',
      password: 'TestPass123!'
    }, { 
      timeout: 5000,
      validateStatus: () => true // Don't throw on 4xx/5xx
    });
    
    console.log('📝 Login attempt result:');
    console.log('  Status:', loginResponse.status);
    console.log('  Headers:', JSON.stringify(loginResponse.headers, null, 2));
    console.log('  Data:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.status === 401) {
      console.log('⚠️  Login returned 401 - this indicates a fundamental auth issue');
    }
  } catch (error) {
    console.log('❌ Login endpoint failed:', error.message);
  }
  
  // Test 4: Try with different credentials
  try {
    const altLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    }, { 
      timeout: 5000,
      validateStatus: () => true
    });
    
    console.log('\n📝 Alternative login attempt:');
    console.log('  Status:', altLoginResponse.status);
    console.log('  Data:', JSON.stringify(altLoginResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Alternative login failed:', error.message);
  }
  
  // Test 5: Check if auth middleware is even responding
  try {
    const authMeResponse = await axios.get(`${BASE_URL}/api/auth/me`, { 
      timeout: 5000,
      validateStatus: () => true
    });
    
    console.log('\n📝 Auth/me without token:');
    console.log('  Status:', authMeResponse.status);
    console.log('  Data:', JSON.stringify(authMeResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Auth/me endpoint failed:', error.message);
  }
  
  // Test 6: Check server connectivity
  try {
    const serverResponse = await axios.get(`${BASE_URL}`, { 
      timeout: 5000,
      validateStatus: () => true
    });
    
    console.log('\n📝 Root server response:');
    console.log('  Status:', serverResponse.status);
  } catch (error) {
    console.log('❌ Server root failed:', error.message);
  }
}

async function testDatabaseConnection() {
  console.log('\n🗄️ Testing database-related endpoints...\n');
  
  // Test user registration (might give us clues about DB issues)
  try {
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: `test-${Date.now()}@test.com`,
      password: 'TestPass123!',
      name: 'Test User'
    }, { 
      timeout: 5000,
      validateStatus: () => true
    });
    
    console.log('📝 Registration attempt:');
    console.log('  Status:', registerResponse.status);
    console.log('  Data:', JSON.stringify(registerResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Registration failed:', error.message);
  }
}

async function main() {
  console.log('🚀 BASIC AUTHENTICATION SYSTEM TEST');
  console.log('=====================================\n');
  
  await testBasicEndpoints();
  await testDatabaseConnection();
  
  console.log('\n🔍 ANALYSIS:');
  console.log('If health/version work but login fails with 401:');
  console.log('  → Authentication middleware or database issue');
  console.log('If nothing works:');
  console.log('  → Server not running or wrong port');
  console.log('If login works but other endpoints fail:');
  console.log('  → Token validation or routing issue');
  
  console.log('\n💡 Next step: Check server logs for detailed error messages');
}

main().catch(console.error);
