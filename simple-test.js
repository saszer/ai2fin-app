const http = require('http');

console.log('🔬 Testing Option 2 Middleware...');

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/bills-patterns/analyze-patterns',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  console.log('✅ Status:', res.statusCode);
  console.log('✅ No hanging detected!');
  
  const headers = Object.keys(res.headers).filter(h => 
    h.includes('rate') || h.includes('x-') || h.includes('security')
  );
  
  if (headers.length > 0) {
    console.log('🛡️ Security/Rate Headers:', headers.join(', '));
  }
  
  res.on('end', () => {
    console.log('🎉 Middleware test completed successfully!');
  });
});

req.on('timeout', () => {
  console.log('❌ TIMEOUT: Middleware hanging detected');
  process.exit(1);
});

req.on('error', (e) => {
  console.log('Error:', e.message);
});

req.setTimeout(5000);
req.write(JSON.stringify({ transactions: [] }));
req.end(); 