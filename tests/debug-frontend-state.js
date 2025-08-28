const axios = require('axios');

async function debugFrontendState() {
  console.log('🔍 Debugging Frontend Authentication State...\n');
  
  const baseURL = 'http://localhost:3001';
  
  // Test what the frontend is actually sending
  console.log('1️⃣ Testing Frontend Request Headers');
  console.log('='.repeat(50));
  
  try {
    // Create a request interceptor to see what's being sent
    const debugClient = axios.create({
      baseURL: baseURL,
      withCredentials: true
    });
    
    debugClient.interceptors.request.use((config) => {
      console.log('📤 Outgoing Request:');
      console.log('  URL:', config.url);
      console.log('  Method:', config.method?.toUpperCase());
      console.log('  Headers:', JSON.stringify(config.headers, null, 2));
      console.log('  WithCredentials:', config.withCredentials);
      return config;
    });
    
    debugClient.interceptors.response.use(
      (response) => {
        console.log('📥 Response:');
        console.log('  Status:', response.status);
        console.log('  Headers:', JSON.stringify(response.headers, null, 2));
        return response;
      },
      (error) => {
        console.log('📥 Error Response:');
        console.log('  Status:', error.response?.status);
        console.log('  Data:', error.response?.data);
        console.log('  Headers:', JSON.stringify(error.response?.headers, null, 2));
        return Promise.reject(error);
      }
    );
    
    // Test the exact scenario: no token, no cookies
    console.log('\n🔍 Test 1: No Authentication (like fresh browser)');
    console.log('-'.repeat(30));
    
    const noAuthResponse = await debugClient.get('/api/auth/me', {
      validateStatus: () => true
    });
    
    console.log('Result:', noAuthResponse.status, noAuthResponse.data);
    
    // Test with working login
    console.log('\n🔍 Test 2: After Successful Login');
    console.log('-'.repeat(30));
    
    const loginResponse = await debugClient.post('/api/oidc/login', {
      email: 'test@embracingearth.space',
      password: 'TestPass123!'
    }, {
      validateStatus: () => true
    });
    
    if (loginResponse.status === 200) {
      console.log('✅ Login successful');
      
      // Now test with the token manually
      const token = loginResponse.data.token;
      
      console.log('\n🔍 Test 3: With Bearer Token');
      console.log('-'.repeat(30));
      
      const tokenResponse = await debugClient.get('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        validateStatus: () => true
      });
      
      console.log('Token test result:', tokenResponse.status, tokenResponse.data);
      
      // Test with cookies from login
      console.log('\n🔍 Test 4: With Cookies Only');
      console.log('-'.repeat(30));
      
      const cookies = loginResponse.headers['set-cookie'];
      if (cookies) {
        const cookieResponse = await debugClient.get('/api/auth/me', {
          headers: {
            'Cookie': cookies.join('; ')
          },
          validateStatus: () => true
        });
        
        console.log('Cookie test result:', cookieResponse.status, cookieResponse.data);
      }
    }
    
    // Test the specific endpoints from the screenshot
    console.log('\n🔍 Test 5: Screenshot Endpoints');
    console.log('-'.repeat(30));
    
    const screenshotEndpoints = [
      '/api/bank/categories',
      '/api/bank/transactions',
      '/api/bank/csv-uploads'
    ];
    
    const workingToken = loginResponse.data.token;
    
    for (const endpoint of screenshotEndpoints) {
      try {
        const response = await debugClient.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${workingToken}`
          },
          validateStatus: () => true
        });
        
        console.log(`${endpoint}: ${response.status}`);
        
        if (response.status === 401) {
          console.log('  ❌ 401 Details:', response.data);
        }
        
      } catch (error) {
        console.log(`${endpoint}: ERROR - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Also test CORS preflight
async function testCORS() {
  console.log('\n🌐 Testing CORS Configuration');
  console.log('='.repeat(50));
  
  const baseURL = 'http://localhost:3001';
  
  try {
    // Test OPTIONS request (CORS preflight)
    const corsResponse = await axios.options(`${baseURL}/api/auth/me`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,content-type'
      },
      validateStatus: () => true
    });
    
    console.log('CORS Preflight Status:', corsResponse.status);
    console.log('CORS Headers:', {
      'Access-Control-Allow-Origin': corsResponse.headers['access-control-allow-origin'],
      'Access-Control-Allow-Credentials': corsResponse.headers['access-control-allow-credentials'],
      'Access-Control-Allow-Methods': corsResponse.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': corsResponse.headers['access-control-allow-headers']
    });
    
  } catch (error) {
    console.error('CORS test failed:', error.message);
  }
}

async function main() {
  await debugFrontendState();
  await testCORS();
}

main();
