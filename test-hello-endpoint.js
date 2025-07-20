const http = require('http');

console.log('🎯 Testing Hello Endpoint...');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/bills/hello',
  method: 'GET'
};

console.log('📤 Making request to:', `http://${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, (res) => {
  console.log(`📥 Response status: ${res.statusCode} ${res.statusMessage}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ Success! Response:', response);
    } catch (error) {
      console.log('📄 Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.setTimeout(5000);
req.end(); 