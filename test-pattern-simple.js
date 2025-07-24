const axios = require('axios');

async function testPatternSimple() {
  try {
    console.log('🧪 Simple Pattern Analysis Test...\n');
    
    // Test 1: Check if endpoint exists (should return 401 without auth)
    console.log('1️⃣ Testing endpoint accessibility...');
    try {
      const response = await axios.post('http://localhost:3001/api/bills-patterns/analyze-patterns', {
        transactions: []
      });
      console.log('❌ Unexpected success without auth:', response.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Endpoint exists and requires authentication (expected)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Test 2: Check health endpoint
    console.log('\n2️⃣ Testing health endpoint...');
    try {
      const healthResponse = await axios.get('http://localhost:3001/health');
      console.log('✅ Health endpoint working:', healthResponse.status);
    } catch (error) {
      console.log('❌ Health endpoint failed:', error.message);
    }

    // Test 3: Check if server is running
    console.log('\n3️⃣ Testing server connectivity...');
    try {
      const testResponse = await axios.get('http://localhost:3001/test-simple');
      console.log('✅ Server is running:', testResponse.data);
    } catch (error) {
      console.log('❌ Server connectivity failed:', error.message);
    }

    console.log('\n🔍 SUMMARY:');
    console.log('- Server running: Check health endpoint result above');
    console.log('- Pattern endpoint accessible: Check auth test result above');
    console.log('- Next step: Need valid authentication token to test further');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPatternSimple(); 