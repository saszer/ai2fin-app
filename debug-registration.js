/**
 * Debug Registration Issue
 */

const BASE = 'http://localhost:3001';

async function debugRegistration() {
  console.log('🔍 Debugging registration endpoint...');
  
  try {
    // Test 1: Check if server is responding
    console.log('\n1. Testing server health...');
    const healthRes = await fetch(`${BASE}/health`);
    console.log(`Health: ${healthRes.status} ${healthRes.ok ? 'OK' : 'FAIL'}`);
    
    // Test 2: Check enterprise auth status
    console.log('\n2. Testing enterprise auth status...');
    const statusRes = await fetch(`${BASE}/api/enterprise-auth/status`);
    const statusBody = await statusRes.text();
    console.log(`Status: ${statusRes.status}`);
    console.log(`Body: ${statusBody}`);
    
    // Test 3: Try registration with detailed error
    console.log('\n3. Testing registration...');
    const regRes = await fetch(`${BASE}/api/enterprise-auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `debug+${Date.now()}@embracingearth.space`,
        password: 'TestPass123!',
        firstName: 'Debug',
        lastName: 'User',
        acceptTerms: true,
        countryCode: 'US'
      })
    });
    
    console.log(`Registration: ${regRes.status}`);
    const regBody = await regRes.text();
    console.log(`Body: ${regBody}`);
    
    // Test 4: Check environment variables
    console.log('\n4. Environment check...');
    console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'SET' : 'MISSING'}`);
    console.log(`ZITADEL_ISSUER: ${process.env.ZITADEL_ISSUER ? 'SET' : 'MISSING'}`);
    console.log(`ZITADEL_CLIENT_ID: ${process.env.ZITADEL_CLIENT_ID ? 'SET' : 'MISSING'}`);
    console.log(`ZITADEL_CLIENT_SECRET: ${process.env.ZITADEL_CLIENT_SECRET ? 'SET' : 'MISSING'}`);
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

debugRegistration();
