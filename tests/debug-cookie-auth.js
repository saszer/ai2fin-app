const axios = require('axios');

async function testCookieAuth() {
  console.log('🍪 Testing Cookie Authentication Debug...\n');
  
  const baseURL = 'http://localhost:3001';
  
  try {
    // Step 1: Login and get cookies
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${baseURL}/api/oidc/login`, {
      email: 'test@embracingearth.space',
      password: 'TestPass123!'
    }, {
      withCredentials: true,
      validateStatus: () => true
    });
    
    console.log('Login Status:', loginResponse.status);
    console.log('Login Data:', loginResponse.data);
    
    // Extract cookies from response
    const cookies = loginResponse.headers['set-cookie'];
    console.log('Set-Cookie Headers:', cookies);
    
    if (!cookies) {
      console.log('❌ No cookies received from login');
      return;
    }
    
    // Parse cookies
    const cookieHeader = cookies.join('; ');
    console.log('Cookie Header for requests:', cookieHeader);
    
    // Step 2: Test authenticated endpoint with cookies
    console.log('\n2️⃣ Testing /api/auth/me with cookies...');
    const meResponse = await axios.get(`${baseURL}/api/auth/me`, {
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true,
      validateStatus: () => true
    });
    
    console.log('Me Status:', meResponse.status);
    console.log('Me Data:', meResponse.data);
    
    // Step 3: Test another protected endpoint
    console.log('\n3️⃣ Testing /api/user/permissions with cookies...');
    const permissionsResponse = await axios.get(`${baseURL}/api/user/permissions`, {
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true,
      validateStatus: () => true
    });
    
    console.log('Permissions Status:', permissionsResponse.status);
    console.log('Permissions Data:', permissionsResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

testCookieAuth();
