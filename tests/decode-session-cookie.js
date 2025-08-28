const jwt = require('jsonwebtoken');

// Extract the session cookie from the debug output
const sessionCookie = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZW1icmFjaW5nZWFydGguc3BhY2UiLCJzZXNzaW9uSWQiOiI4MzVhZGEwMzJiOTYzODNmZGE5YjgwYTA2ODdlMGMyMiIsImp0aSI6IjliMTY0MWZiYzdiYmVhMmY4NzJkNDkyMTljNDkzOTA2IiwiaWF0IjoxNzU2MzUwNjE5LCJleHAiOjE3NTY0MzcwMTksImlzcyI6ImFpMi1wbGF0Zm9ybSJ9.UazIqXsaSXOlI8UltUBsn2Tw_fIN8vAhCzJt5gLbaGc';

console.log('🔍 Decoding Session Cookie...\n');

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


