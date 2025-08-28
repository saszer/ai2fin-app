const axios = require('axios');

async function testFrontendUserAuth() {
  console.log('🔍 Testing Frontend User Authentication...\n');
  
  const baseURL = 'http://localhost:3001';
  
  // The user the frontend is trying to use
  const frontendUser = 'sz.sahaj@gmail.com';
  
  // Test different passwords
  const passwords = [
    'TestPass123!',
    'password123', 
    'Password123!',
    'test123',
    'admin123'
  ];
  
  console.log(`🎯 Testing user: ${frontendUser}`);
  console.log('='.repeat(50));
  
  for (const password of passwords) {
    try {
      console.log(`\n🔑 Trying password: ${password}`);
      
      const loginResponse = await axios.post(`${baseURL}/api/oidc/login`, {
        email: frontendUser,
        password: password
      }, {
        validateStatus: () => true
      });
      
      console.log(`Status: ${loginResponse.status}`);
      
      if (loginResponse.status === 200) {
        console.log('✅ SUCCESS! Found working password');
        console.log('Token received:', !!loginResponse.data.token);
        
        // Test the token
        if (loginResponse.data.token) {
          const testResponse = await axios.get(`${baseURL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${loginResponse.data.token}` },
            validateStatus: () => true
          });
          
          console.log(`Token test: ${testResponse.status} - authenticated: ${testResponse.data?.authenticated}`);
        }
        
        return; // Found working credentials
      } else {
        console.log(`❌ Failed: ${loginResponse.data?.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🔍 No working password found. User might need to be created or reset.');
  
  // Try to register the user
  console.log('\n📝 Attempting to register user...');
  try {
    const registerResponse = await axios.post(`${baseURL}/api/oidc/register`, {
      email: frontendUser,
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User'
    }, {
      validateStatus: () => true
    });
    
    console.log(`Register Status: ${registerResponse.status}`);
    console.log('Register Response:', registerResponse.data);
    
  } catch (error) {
    console.log(`Register Error: ${error.message}`);
  }
}

testFrontendUserAuth();
