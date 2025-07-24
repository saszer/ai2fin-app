const axios = require('axios');

async function debugToken() {
  try {
    // Test different token formats to see what works
    const testTokens = [
      'token-user123-1642345678',  // Simple server format
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMTIzIiwiaWF0IjoxNjQyMzQ1Njc4fQ.invalid', // Invalid JWT
      'Bearer token-user123-1642345678', // With Bearer prefix
      'user123', // Just user ID
    ];
    
    for (const token of testTokens) {
      console.log(`\n🔍 Testing token: ${token.substring(0, 30)}...`);
      
      try {
        const response = await axios.get('http://localhost:3001/api/bank/transactions', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 5000
        });
        
        console.log('✅ SUCCESS! Status:', response.status);
        console.log('Token format that works:', token);
        return;
        
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('❌ 401 Unauthorized');
        } else {
          console.log('❌ Error:', error.message);
        }
      }
    }
    
    console.log('\n🔍 No working token format found. Checking server logs...');
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

debugToken(); 