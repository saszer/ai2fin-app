const axios = require('axios');

async function createFreshTestUser() {
  console.log('🔧 Creating Fresh Test User for Frontend...\n');
  
  const baseURL = 'http://localhost:3001';
  
  // Create a new test user with a unique email
  const timestamp = Date.now();
  const testUser = {
    email: `testuser${timestamp}@embracingearth.space`,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User'
  };
  
  try {
    console.log('1️⃣ Creating fresh test user:', testUser.email);
    
    // Register the user
    const registerResponse = await axios.post(`${baseURL}/api/oidc/register`, testUser, {
      validateStatus: () => true
    });
    
    console.log('Register Status:', registerResponse.status);
    console.log('Register Response:', registerResponse.data);
    
    if (registerResponse.status === 200 || registerResponse.status === 201) {
      console.log('✅ Fresh test user created successfully!');
      
      // Test login immediately
      console.log('\n2️⃣ Testing login with fresh user...');
      const loginResponse = await axios.post(`${baseURL}/api/oidc/login`, {
        email: testUser.email,
        password: testUser.password
      }, {
        validateStatus: () => true
      });
      
      console.log('Login Status:', loginResponse.status);
      
      if (loginResponse.status === 200) {
        console.log('✅ Login successful!');
        console.log('Token received:', !!loginResponse.data.token);
        
        // Test all the endpoints that were failing in frontend
        if (loginResponse.data.token) {
          console.log('\n3️⃣ Testing all frontend endpoints...');
          
          const endpoints = [
            '/api/auth/me',
            '/api/country/preferences',
            '/api/ai/profile',
            '/api/auth/profile', 
            '/api/user/permissions',
            '/api/bank/transactions?limit=1',
            '/api/subscription/status'
          ];
          
          let successCount = 0;
          
          for (const endpoint of endpoints) {
            try {
              const response = await axios.get(`${baseURL}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${loginResponse.data.token}` },
                validateStatus: () => true
              });
              
              if (response.status === 200) {
                console.log(`  ✅ ${endpoint}: 200`);
                successCount++;
              } else {
                console.log(`  ❌ ${endpoint}: ${response.status}`);
              }
              
            } catch (error) {
              console.log(`  ❌ ${endpoint}: ERROR - ${error.message}`);
            }
          }
          
          console.log(`\n📊 Results: ${successCount}/${endpoints.length} endpoints working`);
          
          if (successCount === endpoints.length) {
            console.log('🎉 ALL ENDPOINTS WORKING! Frontend should work with this user.');
          }
          
          console.log('\n🔑 Frontend Credentials:');
          console.log(`Email: ${testUser.email}`);
          console.log(`Password: ${testUser.password}`);
          console.log('\n💡 Update your frontend to use these credentials!');
        }
      } else {
        console.log('❌ Login failed:', loginResponse.data);
      }
      
    } else {
      console.log('❌ Registration failed:', registerResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Also test cookie authentication
async function testCookieAuth() {
  console.log('\n🍪 Testing Cookie Authentication...\n');
  
  const baseURL = 'http://localhost:3001';
  const workingUser = {
    email: 'test@embracingearth.space',
    password: 'TestPass123!'
  };
  
  try {
    // Login and get cookies
    const loginResponse = await axios.post(`${baseURL}/api/oidc/login`, workingUser, {
      withCredentials: true,
      validateStatus: () => true
    });
    
    if (loginResponse.status === 200) {
      console.log('✅ Cookie login successful');
      
      // Extract cookies
      const cookies = loginResponse.headers['set-cookie'];
      if (cookies) {
        const cookieHeader = cookies.join('; ');
        
        // Test with cookies
        const testResponse = await axios.get(`${baseURL}/api/auth/me`, {
          headers: { 'Cookie': cookieHeader },
          withCredentials: true,
          validateStatus: () => true
        });
        
        console.log(`Cookie auth test: ${testResponse.status} - authenticated: ${testResponse.data?.authenticated}`);
        
        if (testResponse.data?.authenticated) {
          console.log('✅ Cookie authentication working perfectly!');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Cookie auth test error:', error.message);
  }
}

async function main() {
  await createFreshTestUser();
  await testCookieAuth();
}

main();


