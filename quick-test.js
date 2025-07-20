const axios = require('axios');

async function quickTest() {
  console.log('🧪 Quick Test After Middleware Changes');
  
  // Test 1: No-auth route
  try {
    const response = await axios.post('http://localhost:3001/api/bills-patterns/analyze-patterns-no-auth', 
      { transactions: [] }, 
      { timeout: 3000 }
    );
    console.log('✅ No-auth route works:', response.status, response.data?.message);
  } catch (error) {
    console.log('❌ No-auth route failed:', error.response?.status || 'timeout');
  }
  
  // Test 2: Auth route without token
  try {
    const response = await axios.post('http://localhost:3001/api/bills-patterns/analyze-patterns', 
      { transactions: [] }, 
      { timeout: 3000 }
    );
    console.log('✅ Auth route without token:', response.status);
  } catch (error) {
    const status = error.response?.status;
    if (status === 401) {
      console.log('✅ Auth route properly returns 401 (working)');
    } else {
      console.log('❌ Auth route failed:', status || 'timeout');
    }
  }
}

quickTest(); 