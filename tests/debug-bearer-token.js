const axios = require('axios');
const jwt = require('jsonwebtoken');

async function debugBearerToken() {
  console.log('🔍 Debugging Bearer Token Authentication...\n');
  
  const baseURL = 'http://localhost:3001';
  const user = { email: 'test@embracingearth.space', password: 'TestPass123!' };
  
  try {
    // 1. Login and get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${baseURL}/api/oidc/login`, user, {
      validateStatus: () => true
    });
    
    console.log('Login Status:', loginResponse.status);
    
    if (loginResponse.status !== 200) {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Token received:', token ? 'YES' : 'NO');
    
    // 2. Decode token to see structure
    console.log('\n2️⃣ Decoding Bearer token...');
    const decoded = jwt.decode(token);
    console.log('Token payload:', JSON.stringify(decoded, null, 2));
    
    // 3. Test Bearer token with different header formats
    console.log('\n3️⃣ Testing Bearer token formats...');
    
    const testFormats = [
      { name: 'Standard Bearer', header: `Bearer ${token}` },
      { name: 'Lowercase bearer', header: `bearer ${token}` },
      { name: 'No Bearer prefix', header: token },
      { name: 'Token prefix', header: `Token ${token}` }
    ];
    
    for (const format of testFormats) {
      try {
        const response = await axios.get(`${baseURL}/api/auth/me`, {
          headers: { 'Authorization': format.header },
          validateStatus: () => true
        });
        
        console.log(`${format.name}: ${response.status} - authenticated: ${response.data?.authenticated}`);
      } catch (error) {
        console.log(`${format.name}: ERROR - ${error.message}`);
      }
    }
    
    // 4. Test specific failing endpoint
    console.log('\n4️⃣ Testing failing endpoint with Bearer token...');
    try {
      const response = await axios.get(`${baseURL}/api/country/preferences`, {
        headers: { 'Authorization': `Bearer ${token}` },
        validateStatus: () => true
      });
      
      console.log(`/api/country/preferences: ${response.status}`);
      if (response.status !== 200) {
        console.log('Response:', response.data);
      }
    } catch (error) {
      console.log('Error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

debugBearerToken();


