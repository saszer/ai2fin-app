const axios = require('axios');

async function testFrontendUser() {
  console.log('🔍 Testing Frontend User Authentication...\n');
  
  const baseURL = 'http://localhost:3001';
  const frontendUser = {
    email: 'sz.sahaj@gmail.com',
    password: 'TestPass123!' // Try the same password
  };
  
  try {
    // Test login with the frontend user
    console.log('1️⃣ Testing login with frontend user:', frontendUser.email);
    const loginResponse = await axios.post(`${baseURL}/api/oidc/login`, frontendUser, {
      withCredentials: true,
      validateStatus: () => true
    });
    
    console.log('Login Status:', loginResponse.status);
    console.log('Login Data:', loginResponse.data);
    
    if (loginResponse.status !== 200) {
      console.log('❌ Frontend user login failed');
      
      // Try to register the user
      console.log('\n2️⃣ Attempting to register frontend user...');
      const registerResponse = await axios.post(`${baseURL}/api/oidc/register`, {
        email: frontendUser.email,
        password: frontendUser.password,
        firstName: 'Sahaj',
        lastName: 'Sz',
        businessType: 'SOLE_TRADER',
        countryCode: 'AU'
      }, {
        withCredentials: true,
        validateStatus: () => true
      });
      
      console.log('Register Status:', registerResponse.status);
      console.log('Register Data:', registerResponse.data);
      
      if (registerResponse.status === 200) {
        console.log('✅ User registered successfully, now testing login...');
        
        // Try login again
        const retryLogin = await axios.post(`${baseURL}/api/oidc/login`, frontendUser, {
          withCredentials: true,
          validateStatus: () => true
        });
        
        console.log('Retry Login Status:', retryLogin.status);
        console.log('Retry Login Data:', retryLogin.data);
      }
    } else {
      console.log('✅ Frontend user login successful');
      
      // Test with the token
      const token = loginResponse.data.token;
      console.log('\n3️⃣ Testing /api/auth/me with Bearer token...');
      
      const meResponse = await axios.get(`${baseURL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        validateStatus: () => true
      });
      
      console.log('Me Status:', meResponse.status);
      console.log('Me Data:', meResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

testFrontendUser();
