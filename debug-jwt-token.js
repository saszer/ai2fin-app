// Debug JWT Token
const jwt = require('jsonwebtoken');

// Test the JWT token from our login
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZW1icmFjaW5nZWFydGguc3BhY2UiLCJidXNpbmVzc1R5cGUiOiJidXNpbmVzcyIsImNvdW50cnlDb2RlIjoiQVUiLCJpYXQiOjE3NTYzMTI4NTMsImV4cCI6MTc1NjM5OTI1MywiaXNzIjoiYWkyLXBsYXRmb3JtIn0.jkkoiLN1LGv-mKlDfZ7s1qnV1UcyF9xL2YPfJd6hV5s';

console.log('🔍 Debugging JWT Token...\n');

// Check if JWT_SECRET is available
const jwtSecret = process.env.JWT_SECRET;
console.log('JWT_SECRET available:', !!jwtSecret);
console.log('JWT_SECRET length:', jwtSecret ? jwtSecret.length : 0);

if (!jwtSecret) {
  console.log('❌ JWT_SECRET not found in environment');
  process.exit(1);
}

try {
  // Decode without verification first
  const decoded = jwt.decode(testToken, { complete: true });
  console.log('\n📋 Token Header:', JSON.stringify(decoded?.header, null, 2));
  console.log('\n📋 Token Payload:', JSON.stringify(decoded?.payload, null, 2));
  
  // Try to verify
  const verified = jwt.verify(testToken, jwtSecret, {
    algorithms: ['HS256'],
    issuer: 'ai2-platform'
  });
  
  console.log('\n✅ Token Verification Successful!');
  console.log('Verified Payload:', JSON.stringify(verified, null, 2));
  
  // Check what user ID fields are available
  console.log('\n🔍 User ID Fields:');
  console.log('- sub:', verified.sub);
  console.log('- userId:', verified.userId);
  console.log('- id:', verified.id);
  
} catch (error) {
  console.log('\n❌ Token Verification Failed:', error.message);
  
  // Try without issuer check
  try {
    const verifiedWithoutIssuer = jwt.verify(testToken, jwtSecret, {
      algorithms: ['HS256']
    });
    console.log('\n✅ Token verified without issuer check');
    console.log('Payload:', JSON.stringify(verifiedWithoutIssuer, null, 2));
  } catch (e) {
    console.log('❌ Token verification failed even without issuer check:', e.message);
  }
}
