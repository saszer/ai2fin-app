const axios = require('axios');

async function testAuth() {
  try {
    // Test with simple token format (like the frontend sends)
    const token = 'token-user123-1642345678';
    
    console.log('🔍 Testing authentication with simple token...');
    
    const response = await axios.get('http://localhost:3001/api/bank/transactions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Authentication successful!');
    console.log('Response status:', response.status);
    console.log('Data received:', response.data ? 'Yes' : 'No');
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('❌ Authentication failed - 401 Unauthorized');
      console.log('Error:', error.response.data);
    } else {
      console.log('❌ Test failed:', error.message);
    }
  }
}

testAuth(); 