const https = require('https');

console.log('Testing production endpoints...\n');

function testEndpoint(url) {
  return new Promise((resolve) => {
    console.log(`Testing: ${url}`);
    
    const req = https.request(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`  Status: ${res.statusCode}`);
        console.log(`  Headers:`, Object.keys(res.headers).join(', '));
        
        // Check for origin-related headers
        const originHeaders = Object.keys(res.headers).filter(h => 
          h.toLowerCase().includes('origin') || 
          h.toLowerCase().includes('auth') ||
          h.toLowerCase().includes('cf-')
        );
        
        if (originHeaders.length > 0) {
          console.log(`  Origin Headers:`, originHeaders.map(h => `${h}=${res.headers[h]}`).join(', '));
        } else {
          console.log(`  No Origin Headers Found`);
        }
        
        console.log('');
        resolve({ url, status: res.statusCode, headers: res.headers });
      });
    });
    
    req.on('error', (err) => {
      console.log(`  Error: ${err.message}\n`);
      resolve({ url, error: err.message });
    });
    
    req.setTimeout(10000, () => {
      console.log(`  Timeout\n`);
      req.destroy();
      resolve({ url, error: 'timeout' });
    });
    
    req.end();
  });
}

async function runTests() {
  const endpoints = [
    'https://api.ai2fin.com/health',
    'https://api.ai2fin.com/api/health',
    'https://api.ai2fin.com/api/core/status',
    'https://subscription.ai2fin.com/health'
  ];
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
}

runTests().catch(console.error);