const jwt = require('jsonwebtoken');

// Extract the NEW session cookie from the debug output
const sessionCookie = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZW1icmFjaW5nZWFydGguc3BhY2UiLCJzZXNzaW9uSWQiOiJiYTFmYjk4OTkxOGQwMzJhZTk1OWVlM2FkYmFhOWFiYiIsImp0aSI6ImE2YTVjZTIxZTM4ODA0YmEyYzU0ZTViZTJmNThmZmU3IiwiaWF0IjoxNzU2MzUwOTI3LCJleHAiOjE3NTY0MzczMjcsImlzcyI6ImFpMi1wbGF0Zm9ybSJ9.xde8qxhBDrpY2U9uZQZ1hRgZ4s-MEr7MZnJ96hsBRyc';

console.log('🔍 Decoding NEW Session Cookie...\n');

try {
  // Decode without verification first to see structure
  const decoded = jwt.decode(sessionCookie);
  console.log('📋 Cookie Payload:', JSON.stringify(decoded, null, 2));
  
  // Check what fields are missing
  console.log('\n🔍 Field Analysis:');
  console.log('- email:', decoded.email);
  console.log('- userId:', decoded.userId);
  console.log('- sessionId:', decoded.sessionId);
  console.log('- jti:', decoded.jti);
  
  console.log('\n❌ Missing Fields:');
  if (!decoded.userId) console.log('- userId is missing');
  if (!decoded.email) console.log('- email is missing');
  if (!decoded.sessionId) console.log('- sessionId is missing');
  
} catch (error) {
  console.error('❌ Error decoding cookie:', error.message);
}


