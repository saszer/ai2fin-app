const axios = require('axios');

async function investigateRealIssue() {
  console.log('🔍 Investigating Real Frontend vs Backend Disconnect...\n');
  
  const baseURL = 'http://localhost:3001';
  
  // Let's check what happens when we make requests exactly like a browser would
  console.log('1️⃣ Testing Browser-like Requests');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Check if there's a CORS issue
    console.log('🌐 Testing CORS with Origin header...');
    
    const corsTest = await axios.get(`${baseURL}/api/auth/me`, {
      headers: {
        'Origin': 'http://localhost:3000', // Typical React dev server
        'Referer': 'http://localhost:3000/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      withCredentials: true,
      validateStatus: () => true
    });
    
    console.log(`CORS Test: ${corsTest.status}`);
    console.log('CORS Response:', corsTest.data);
    
    // Test 2: Check if there's a middleware order issue
    console.log('\n🔧 Testing Middleware Order...');
    
    // Make request without any auth first
    const noAuthTest = await axios.get(`${baseURL}/api/auth/me`, {
      validateStatus: () => true
    });
    
    console.log(`No Auth Test: ${noAuthTest.status}`);
    console.log('No Auth Response:', noAuthTest.data);
    
    // Test 3: Check if there's a token format issue
    console.log('\n🔑 Testing Token Format Issues...');
    
    // Login first
    const loginResponse = await axios.post(`${baseURL}/api/oidc/login`, {
      email: 'test@embracingearth.space',
      password: 'TestPass123!'
    }, {
      validateStatus: () => true
    });
    
    if (loginResponse.status === 200) {
      const token = loginResponse.data.token;
      console.log('Token received:', token ? 'YES' : 'NO');
      
      // Test different token formats that might be causing issues
      const tokenFormats = [
        { name: 'Standard Bearer', auth: `Bearer ${token}` },
        { name: 'Bearer with extra space', auth: `Bearer  ${token}` },
        { name: 'bearer lowercase', auth: `bearer ${token}` },
        { name: 'Token with newline', auth: `Bearer ${token}\n` },
        { name: 'Token with carriage return', auth: `Bearer ${token}\r` },
        { name: 'Token with both', auth: `Bearer ${token}\r\n` }
      ];
      
      for (const format of tokenFormats) {
        try {
          const response = await axios.get(`${baseURL}/api/auth/me`, {
            headers: { 'Authorization': format.auth },
            validateStatus: () => true
          });
          
          const status = response.status === 200 ? '✅' : '❌';
          console.log(`  ${status} ${format.name}: ${response.status}`);
          
        } catch (error) {
          console.log(`  ❌ ${format.name}: ERROR`);
        }
      }
      
      // Test 4: Check if there's a request timing issue
      console.log('\n⏱️ Testing Request Timing...');
      
      // Make multiple rapid requests like frontend might
      const rapidRequests = [];
      for (let i = 0; i < 5; i++) {
        rapidRequests.push(
          axios.get(`${baseURL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
            validateStatus: () => true
          })
        );
      }
      
      const rapidResults = await Promise.all(rapidRequests);
      const rapidStatuses = rapidResults.map(r => r.status);
      console.log('Rapid request statuses:', rapidStatuses);
      
      // Test 5: Check specific endpoints that are failing in frontend
      console.log('\n📡 Testing Specific Failing Endpoints...');
      
      const failingEndpoints = [
        '/api/bank/categories',
        '/api/bank/transactions', 
        '/api/bank/csv-uploads',
        '/api/country/preferences',
        '/api/user/permissions'
      ];
      
      for (const endpoint of failingEndpoints) {
        try {
          const response = await axios.get(`${baseURL}${endpoint}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Origin': 'http://localhost:3000',
              'Referer': 'http://localhost:3000/'
            },
            withCredentials: true,
            validateStatus: () => true
          });
          
          const status = response.status === 200 ? '✅' : '❌';
          console.log(`  ${status} ${endpoint}: ${response.status}`);
          
          if (response.status === 401) {
            console.log(`    Error: ${response.data?.error || 'Unknown'}`);
          }
          
        } catch (error) {
          console.log(`  ❌ ${endpoint}: ERROR - ${error.message}`);
        }
      }
      
      // Test 6: Check if there's a session/cookie conflict
      console.log('\n🍪 Testing Cookie vs Token Conflict...');
      
      // Get cookies from login
      const cookieLoginResponse = await axios.post(`${baseURL}/api/oidc/login`, {
        email: 'test@embracingearth.space',
        password: 'TestPass123!'
      }, {
        withCredentials: true,
        validateStatus: () => true
      });
      
      if (cookieLoginResponse.status === 200) {
        const cookies = cookieLoginResponse.headers['set-cookie'];
        
        if (cookies) {
          // Test with both cookies AND Bearer token (like frontend might do)
          const bothAuthResponse = await axios.get(`${baseURL}/api/auth/me`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Cookie': cookies.join('; ')
            },
            withCredentials: true,
            validateStatus: () => true
          });
          
          console.log(`Both Auth Test: ${bothAuthResponse.status} - authenticated: ${bothAuthResponse.data?.authenticated}`);
        }
      }
      
    } else {
      console.log('❌ Login failed, cannot test token formats');
    }
    
  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  }
}

async function checkServerLogs() {
  console.log('\n📋 Server Log Analysis');
  console.log('='.repeat(50));
  
  // Make a request that should trigger server logs
  try {
    const response = await axios.get('http://localhost:3001/api/auth/me', {
      headers: {
        'Authorization': 'Bearer invalid-token-to-trigger-logs',
        'X-Debug': 'frontend-investigation'
      },
      validateStatus: () => true
    });
    
    console.log('Debug request sent to trigger server logs');
    console.log('Check server console for authentication middleware logs');
    
  } catch (error) {
    console.log('Debug request sent (with error, as expected)');
  }
}

async function main() {
  await investigateRealIssue();
  await checkServerLogs();
  
  console.log('\n🎯 Summary');
  console.log('='.repeat(50));
  console.log('If all tests above show 200 status codes, then the issue is:');
  console.log('1. Frontend token storage/retrieval problem');
  console.log('2. Frontend request interceptor issue');
  console.log('3. Browser cache/localStorage corruption');
  console.log('4. Frontend using different base URL');
  console.log('5. Frontend making requests before login completes');
}

main();
