const axios = require('axios');

// Test the pattern analysis endpoint
async function testPatternAnalysis() {
  const baseURL = 'http://localhost:3001';
  
  console.log('🔍 Testing Pattern Analysis Endpoint...\n');
  
  try {
    // First, test authentication
    console.log('1. Testing authentication...');
    
    // You'll need to get a real token from localStorage or login first
    const token = 'YOUR_AUTH_TOKEN_HERE'; // Replace with actual token
    
    if (!token || token === 'YOUR_AUTH_TOKEN_HERE') {
      console.log('❌ No auth token provided. Please:');
      console.log('   1. Open browser dev console');
      console.log('   2. Run: localStorage.getItem("token")');
      console.log('   3. Copy the token and replace YOUR_AUTH_TOKEN_HERE in this script');
      return;
    }

    // Test the endpoint with sample data
    console.log('2. Testing /api/bills/analyze-patterns endpoint...');
    
    const testTransactions = [
      {
        id: 'test1',
        description: 'Netflix Subscription',
        amount: -14.99,
        date: '2024-07-01',
        merchant: 'Netflix',
        category: 'Entertainment'
      },
      {
        id: 'test2',
        description: 'Netflix Subscription',
        amount: -14.99,
        date: '2024-06-01',
        merchant: 'Netflix',
        category: 'Entertainment'
      },
      {
        id: 'test3',
        description: 'Spotify Premium',
        amount: -9.99,
        date: '2024-07-05',
        merchant: 'Spotify',
        category: 'Entertainment'
      }
    ];

    const response = await axios.post(`${baseURL}/api/bills/analyze-patterns`, {
      transactions: testTransactions
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 35000 // 35 second timeout
    });

    console.log('✅ Success! Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error testing pattern analysis:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else if (error.request) {
      console.log('No response received:', error.message);
    } else {
      console.log('Request error:', error.message);
    }
  }
}

// Test basic connectivity first
async function testConnectivity() {
  const baseURL = 'http://localhost:3001';
  
  try {
    console.log('🔗 Testing basic connectivity to backend...');
    const response = await axios.get(`${baseURL}/health`, { timeout: 5000 });
    console.log('✅ Backend is reachable:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Backend connectivity failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('='.repeat(50));
  console.log('🧪 Pattern Analysis Endpoint Test');
  console.log('='.repeat(50));
  
  const isConnected = await testConnectivity();
  
  if (isConnected) {
    await testPatternAnalysis();
  } else {
    console.log('\n❌ Cannot test pattern analysis - backend is not reachable');
    console.log('   Make sure the backend server is running on port 3001');
  }
}

runTests().catch(console.error); 