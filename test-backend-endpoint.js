const http = require('http');

// Test the backend endpoint directly
function testBackendEndpoint() {
  console.log('🧪 Testing Backend Endpoint Directly...\n');
  
  const testData = JSON.stringify({
    transactions: [
      {
        id: 'test1',
        description: 'Netflix Subscription',
        amount: -14.99,
        date: '2024-07-01',
        merchant: 'Netflix'
      },
      {
        id: 'test2',
        description: 'Netflix Subscription', 
        amount: -14.99,
        date: '2024-06-01',
        merchant: 'Netflix'
      }
    ]
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/test-pattern-analysis',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testData)
    }
  };

  console.log('📤 Making request to:', `http://${options.hostname}:${options.port}${options.path}`);
  console.log('📊 Request data:', JSON.parse(testData));

  const startTime = Date.now();
  
  const req = http.request(options, (res) => {
    const endTime = Date.now();
    console.log(`📥 Response status: ${res.statusCode} ${res.statusMessage}`);
    console.log(`⏱️  Response time: ${endTime - startTime}ms`);
    console.log('📋 Response headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('✅ Success! Response:', response);
        
        if (response.success && response.patterns) {
          console.log(`🎉 Found ${response.patterns.length} patterns`);
          response.patterns.forEach((pattern, index) => {
            console.log(`${index + 1}. ${pattern.name} - ${pattern.frequency} (${pattern.confidence} confidence)`);
          });
        }
      } catch (error) {
        console.log('📄 Raw response:', data);
        console.error('❌ Failed to parse JSON:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
  });

  req.on('timeout', () => {
    console.error('⏰ Request timed out');
    req.destroy();
  });

  req.setTimeout(10000); // 10 second timeout
  req.write(testData);
  req.end();
}

// Also test if the server is reachable
function testServerHealth() {
  console.log('🔍 Testing server health...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Server health: ${res.statusCode} ${res.statusMessage}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const health = JSON.parse(data);
        console.log('🏥 Health status:', health.status);
        console.log('');
        
        // Now test the pattern endpoint
        testBackendEndpoint();
      } catch (error) {
        console.log('📄 Health response:', data);
        testBackendEndpoint();
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Health check failed:', error.message);
    console.log('Trying pattern endpoint anyway...\n');
    testBackendEndpoint();
  });

  req.setTimeout(5000);
  req.end();
}

console.log('🚀 Starting Backend Endpoint Test...');
console.log('='.repeat(50));
testServerHealth(); 