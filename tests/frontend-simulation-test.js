const axios = require('axios');

async function simulateFrontendFlow() {
  console.log('🌐 Simulating Real Frontend Flow...\n');
  
  const baseURL = 'http://localhost:3001';
  
  // Create axios instance that mimics frontend behavior
  const frontendClient = axios.create({
    baseURL: baseURL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  
  // Add request interceptor like frontend does
  frontendClient.interceptors.request.use((config) => {
    const token = global.frontendToken; // Simulate localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔗 Frontend: Attached token to', config.url);
    } else {
      console.warn('⚠️ Frontend: No token available for', config.url);
    }
    return config;
  });
  
  try {
    // Step 1: Simulate frontend login
    console.log('1️⃣ Frontend Login Simulation');
    console.log('='.repeat(40));
    
    // Try with the user from the screenshot
    const loginData = {
      email: 'sz.sahaj@gmail.com',
      password: 'TestPass123!' // Try our standard password
    };
    
    console.log('Attempting login with:', loginData.email);
    
    const loginResponse = await frontendClient.post('/api/oidc/login', loginData, {
      validateStatus: () => true
    });
    
    console.log('Login Status:', loginResponse.status);
    console.log('Login Response:', loginResponse.data);
    
    if (loginResponse.status !== 200) {
      console.log('❌ Login failed, trying with working test user...');
      
      // Try with working test user
      const workingLogin = {
        email: 'test@embracingearth.space',
        password: 'TestPass123!'
      };
      
      const workingLoginResponse = await frontendClient.post('/api/oidc/login', workingLogin, {
        validateStatus: () => true
      });
      
      console.log('Working user login status:', workingLoginResponse.status);
      
      if (workingLoginResponse.status === 200) {
        global.frontendToken = workingLoginResponse.data.token;
        console.log('✅ Using working test user token');
      } else {
        console.log('❌ Even working user failed!');
        return;
      }
    } else {
      global.frontendToken = loginResponse.data.token;
      console.log('✅ Login successful with original user');
    }
    
    // Step 2: Simulate frontend page loads
    console.log('\n2️⃣ Frontend Page Load Simulation');
    console.log('='.repeat(40));
    
    // Simulate the exact requests the frontend makes
    const frontendRequests = [
      { name: 'Auth Check', url: '/api/auth/me' },
      { name: 'User Permissions', url: '/api/user/permissions' },
      { name: 'Country Preferences', url: '/api/country/preferences' },
      { name: 'Bank Categories', url: '/api/bank/categories' },
      { name: 'Bank Transactions', url: '/api/bank/transactions?limit=10' },
      { name: 'AI Profile', url: '/api/ai/profile' },
      { name: 'Subscription Status', url: '/api/subscription/status' }
    ];
    
    let failureCount = 0;
    
    for (const request of frontendRequests) {
      try {
        console.log(`\n🔍 Testing: ${request.name}`);
        
        const response = await frontendClient.get(request.url, {
          validateStatus: () => true
        });
        
        if (response.status === 200) {
          console.log(`  ✅ ${request.name}: 200 OK`);
          
          // Log some response details for auth endpoints
          if (request.url.includes('/auth/me')) {
            console.log(`    - Authenticated: ${response.data?.authenticated}`);
            console.log(`    - User: ${response.data?.user?.email || 'null'}`);
          }
        } else if (response.status === 401) {
          console.log(`  ❌ ${request.name}: 401 UNAUTHORIZED`);
          console.log(`    - Error: ${response.data?.error || 'Unknown'}`);
          failureCount++;
        } else {
          console.log(`  ⚠️ ${request.name}: ${response.status}`);
          console.log(`    - Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
        }
        
      } catch (error) {
        console.log(`  ❌ ${request.name}: ERROR - ${error.message}`);
        failureCount++;
      }
    }
    
    // Step 3: Test with cookies (like real browser)
    console.log('\n3️⃣ Browser Cookie Simulation');
    console.log('='.repeat(40));
    
    // Login again to get cookies
    const cookieLoginResponse = await frontendClient.post('/api/oidc/login', {
      email: 'test@embracingearth.space',
      password: 'TestPass123!'
    }, {
      validateStatus: () => true
    });
    
    if (cookieLoginResponse.status === 200) {
      console.log('✅ Cookie login successful');
      
      // Extract cookies like browser would
      const cookies = cookieLoginResponse.headers['set-cookie'];
      if (cookies) {
        const cookieHeader = cookies.join('; ');
        console.log('🍪 Cookies received:', cookieHeader.substring(0, 100) + '...');
        
        // Test with cookies only (no Bearer token)
        const cookieClient = axios.create({
          baseURL: baseURL,
          withCredentials: true,
          headers: {
            'Cookie': cookieHeader
          }
        });
        
        const cookieTestResponse = await cookieClient.get('/api/auth/me', {
          validateStatus: () => true
        });
        
        console.log(`Cookie-only auth test: ${cookieTestResponse.status} - authenticated: ${cookieTestResponse.data?.authenticated}`);
      }
    }
    
    // Summary
    console.log('\n📊 Frontend Simulation Summary');
    console.log('='.repeat(40));
    console.log(`Total requests: ${frontendRequests.length}`);
    console.log(`Failed requests: ${failureCount}`);
    console.log(`Success rate: ${((frontendRequests.length - failureCount) / frontendRequests.length * 100).toFixed(1)}%`);
    
    if (failureCount > 0) {
      console.log('\n🔍 Debugging Tips:');
      console.log('1. Check if frontend token is being stored correctly');
      console.log('2. Verify Authorization header format');
      console.log('3. Check for CORS issues');
      console.log('4. Verify backend middleware order');
    }
    
  } catch (error) {
    console.error('❌ Frontend simulation failed:', error.message);
  }
}

simulateFrontendFlow();


