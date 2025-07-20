console.log('🚀 Starting test script...');

async function testExactDatabucketsCall() {
  console.log('📦 Importing node-fetch...');
  const { default: fetch } = await import('node-fetch');
  console.log('✅ node-fetch imported successfully');
  
  const baseUrl = 'http://localhost:3002';
  const endpoint = '/api/optimized/analyze-batch';
  
  // This mimics the exact data structure sent by databuckets route
  const requestData = {
    transactions: [
      {
        id: 'cmd30zpi3000kp9iwwcj0w66b-1',
        description: 'Coffee Shop Purchase',
        amount: -15.50,
        date: '2024-01-01',
        type: 'debit',
        merchant: undefined,
        currentCategory: undefined,
        csvUploadId: 'cmd30zpi3000kp9iwwcj0w66b'
      }
    ],
    userProfile: {
      profession: 'Unknown',
      industry: 'General',
      businessType: 'SOLE_TRADER',
      countryCode: 'AU'
    },
    options: {
      batchSize: 50,
      maxConcurrentBatches: 3,
      confidenceThreshold: 0.8,
      enableBillDetection: true,
      enableCostOptimization: true,
      includeTaxAnalysis: true,
      includeRecurringPatterns: true
    },
    userId: 'cmd30zfbs0000p9iwjfpj81do'
  };
  
  console.log('🔍 Testing exact databuckets API call...');
  console.log('📤 Request URL:', `${baseUrl}${endpoint}`);
  console.log('📤 Request data size:', JSON.stringify(requestData).length, 'characters');
  
  try {
    console.log('📡 Making HTTP request...');
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-testing'
      },
      body: JSON.stringify(requestData)
    });
    
    console.log(`📡 Response received: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log('📥 Reading response body...');
      const result = await response.json();
      console.log('✅ Success! Response structure check:');
      console.log('- Type:', typeof result);
      console.log('- Keys:', Object.keys(result || {}));
      console.log('- success field:', result?.success);
      console.log('- results count:', result?.results?.length || 0);
      
      if (result?.results?.[0]) {
        console.log('📋 First result sample:', result.results[0]);
      }
    } else {
      console.log('❌ Error response received');
      const error = await response.text();
      console.log('Error details:', error);
    }
    
  } catch (error) {
    console.log(`❌ Exception caught: ${error.message}`);
    console.log('Full error:', error);
  }
}

console.log('🎯 Calling test function...');
testExactDatabucketsCall()
  .then(() => console.log('✅ Test completed'))
  .catch((error) => {
    console.log('❌ Test failed:', error.message);
    console.log('Full error:', error);
  }); 