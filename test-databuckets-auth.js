async function testDatabucketsAuth() {
  const { default: fetch } = await import('node-fetch');
  
  const baseUrl = 'http://localhost:3001';
  const uploadId = 'cmd30zpi3000kp9iwwcj0w66b'; // From your screenshot
  const endpoint = `/api/databuckets/${uploadId}/analyze`;
  
  // Test data that should trigger our validation and debugging
  const requestData = {
    options: {
      includeTaxAnalysis: true,
      includeBillDetection: true,
      includeRecurringPatterns: true,
      confidenceThreshold: 0.8
    }
  };
  
  console.log('🔍 Testing databuckets analyze endpoint with auth...');
  console.log('📤 URL:', `${baseUrl}${endpoint}`);
  
  try {
    // Test WITHOUT authentication first
    console.log('\n📡 Testing WITHOUT auth token...');
    const responseNoAuth = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
    console.log(`   Status: ${responseNoAuth.status} ${responseNoAuth.statusText}`);
    if (responseNoAuth.status === 401) {
      console.log('   ✅ Expected 401 - authentication required');
    }
    
    // Test WITH a fake token
    console.log('\n📡 Testing WITH fake auth token...');
    const responseWithAuth = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWQzMHpmYnMwMDAwcDlpd2pmcGo4MWRvIiwiZW1haWwiOiJzei5zYWhhaUBnbWFpbC5jb20iLCJmaXJzdE5hbWUiOiJTYWhhaiIsImxhc3ROYW1lIjoiR2FyZyIsImJ1c2luZXNzVHlwZSI6IlNPTEVfVFJBREVSIiwiY291bnRyeUNvZGUiOiJBVSIsImlhdCI6MTc1MjUxMzAwOSwiZXhwIjoxNzUyNTk5NDA5fQ' // From logs
      },
      body: JSON.stringify(requestData)
    });
    
    console.log(`   Status: ${responseWithAuth.status} ${responseWithAuth.statusText}`);
    
    if (responseWithAuth.ok) {
      console.log('   ✅ Request succeeded!');
      const result = await responseWithAuth.text();
      console.log('   Response preview:', result.substring(0, 300));
    } else {
      console.log('   ❌ Request failed');
      const error = await responseWithAuth.text();
      console.log('   Error:', error.substring(0, 300));
    }
    
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
  }
}

testDatabucketsAuth().catch(console.error); 