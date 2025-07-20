async function testAIEndpoints() {
  // Dynamic import for node-fetch (ESM module)
  const { default: fetch } = await import('node-fetch');
  
  const baseUrl = 'http://localhost:3002';
  
  const endpoints = [
    '/api/optimized/analyze-batch',
    '/api/simple/analyze',
    '/api/ai/classify',
    '/api/ai/orchestrate'
  ];
  
  console.log('🔍 Testing AI modules endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing: ${baseUrl}${endpoint}`);
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: 'data',
          transactions: [
            {
              id: 'test-1',
              description: 'Coffee Shop',
              amount: -5.50,
              date: '2024-01-01'
            }
          ]
        })
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        console.log('   ❌ Endpoint not found');
      } else if (response.status >= 200 && response.status < 300) {
        console.log('   ✅ Endpoint available');
        const result = await response.text();
        console.log(`   Response preview: ${result.substring(0, 200)}...`);
      } else {
        console.log(`   ⚠️  Endpoint error: ${response.status}`);
        const error = await response.text();
        console.log(`   Error: ${error.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ Connection error: ${error.message}`);
    }
  }
}

testAIEndpoints().catch(console.error); 