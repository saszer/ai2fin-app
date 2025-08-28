const axios = require('axios');

async function test401Endpoints() {
  console.log('🔍 Testing 401 Endpoints...\n');
  
  const baseURL = 'http://localhost:3001';
  
  // Test users from the system
  const testUsers = [
    { email: 'test@example.com', password: 'password123' },
    { email: 'user@test.com', password: 'password123' },
    { email: 'test@embracingearth.space', password: 'TestPass123!' },
    { email: 'sz.sahaj@gmail.com', password: 'TestPass123!' }
  ];
  
  // Endpoints that are failing with 401
  const endpoints = [
    '/api/country/preferences',
    '/api/ai/profile', 
    '/api/auth/profile',
    '/api/user/permissions',
    '/api/bank/transactions?limit=1',
    '/api/subscription/status',
    '/api/system/metrics'
  ];
  
  for (const user of testUsers) {
    console.log(`\n🎯 Testing user: ${user.email}`);
    console.log('='.repeat(50));
    
    try {
      // 1. Login
      const loginResponse = await axios.post(`${baseURL}/api/oidc/login`, user, {
        withCredentials: true,
        validateStatus: () => true
      });
      
      console.log(`Login Status: ${loginResponse.status}`);
      
      if (loginResponse.status !== 200) {
        console.log(`❌ Login failed: ${loginResponse.data?.error || 'Unknown error'}`);
        continue;
      }
      
      const token = loginResponse.data.token;
      const cookies = loginResponse.headers['set-cookie'];
      const cookieHeader = cookies ? cookies.join('; ') : '';
      
      console.log('✅ Login successful');
      
      // 2. Test /api/auth/me first
      const meResponse = await axios.get(`${baseURL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
        validateStatus: () => true
      });
      
      console.log(`/api/auth/me Status: ${meResponse.status}, Auth: ${meResponse.data?.authenticated}`);
      
      if (meResponse.status !== 200 || !meResponse.data?.authenticated) {
        console.log('❌ Bearer token auth not working');
        continue;
      }
      
      // 3. Test each failing endpoint with Bearer token
      console.log('\n📡 Testing endpoints with Bearer token:');
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${baseURL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            validateStatus: () => true,
            timeout: 5000
          });
          
          const status = response.status === 200 ? '✅' : '❌';
          console.log(`  ${status} ${endpoint}: ${response.status}`);
          
          if (response.status === 401) {
            console.log(`    Error: ${response.data?.error || 'Unauthorized'}`);
          }
        } catch (error) {
          console.log(`  ❌ ${endpoint}: ERROR - ${error.message}`);
        }
      }
      
      // 4. Test with cookies
      console.log('\n🍪 Testing endpoints with cookies:');
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${baseURL}${endpoint}`, {
            headers: { 'Cookie': cookieHeader },
            validateStatus: () => true,
            timeout: 5000
          });
          
          const status = response.status === 200 ? '✅' : '❌';
          console.log(`  ${status} ${endpoint}: ${response.status}`);
          
          if (response.status === 401) {
            console.log(`    Error: ${response.data?.error || 'Unauthorized'}`);
          }
        } catch (error) {
          console.log(`  ❌ ${endpoint}: ERROR - ${error.message}`);
        }
      }
      
      break; // If we found a working user, stop testing others
      
    } catch (error) {
      console.log(`❌ Error testing ${user.email}: ${error.message}`);
    }
  }
}

test401Endpoints();
