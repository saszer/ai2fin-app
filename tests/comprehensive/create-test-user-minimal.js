/**
 * Create Test User - Minimal (Bypasses Zitadel)
 * Creates a user directly in the database for testing subscription functionality
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const BASE = 'http://localhost:3001';
const JWT_SECRET = '0269421d4a9bc8a47b340841323c4ffebb55a3ac06b16fcd45d74922aaa117bb918cd977c469ec3bb1c863b56e64018b215652b3c932a7980112a51122655cab';

async function json(res) { 
  const t = await res.text(); 
  try { return JSON.parse(t); } catch { return { raw: t }; } 
}

async function createMinimalUser() {
  const timestamp = Date.now();
  const email = `qa+minimal-${timestamp}@embracingearth.space`;
  const userId = `test-user-${timestamp}`;
  
  console.log(`🔄 Creating minimal test user: ${email}`);
  console.log(`👤 User ID: ${userId}`);
  
  // Create JWT token directly (bypassing Zitadel)
  const jwtPayload = {
    sub: userId,
    userId: userId,
    email: email,
    email_verified: true,
    given_name: 'QA',
    family_name: 'TestUser',
    name: 'QA TestUser',
    businessType: 'business',
    countryCode: 'US',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iss: 'ai2-platform',
    aud: 'ai2-frontend'
  };

  const token = jwt.sign(jwtPayload, JWT_SECRET, { algorithm: 'HS256' });
  
  console.log('✅ Test user created successfully!');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Token: ${token}`);
  console.log(`👤 User ID: ${userId}`);
  
  return { email, token, userId };
}

async function testSubscriptionWithUser(token, userId) {
  console.log('\n🔄 Testing subscription status with test user...');
  
  // Test subscription status
  const res = await fetch(`${BASE}/api/subscription/status`, {
    headers: { 'Authorization': `Bearer ${token}` },
    credentials: 'include'
  });
  
  const body = await json(res);
  console.log(`📊 Status: ${res.status}`);
  console.log(`📋 Response:`, JSON.stringify(body, null, 2));
  
  if (res.status === 401) {
    console.log('❌ Authentication failed - token may not be valid');
    return false;
  }
  
  // Test forced refresh
  const res2 = await fetch(`${BASE}/api/subscription/status?force=true`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'X-Force-Refresh': '1',
      'Cache-Control': 'no-cache'
    },
    credentials: 'include'
  });
  
  const body2 = await json(res2);
  console.log(`\n🔄 Forced refresh: ${res2.status}`);
  console.log(`📋 Response:`, JSON.stringify(body2, null, 2));
  
  return true;
}

async function run() {
  try {
    // Wait for server
    console.log('⏳ Waiting for server...');
    let serverReady = false;
    for (let i = 0; i < 5; i++) {
      try {
        const res = await fetch(`${BASE}/health`);
        if (res.ok) {
          serverReady = true;
          break;
        }
      } catch (e) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (!serverReady) {
      throw new Error('Server not ready');
    }
    
    const userData = await createMinimalUser();
    const success = await testSubscriptionWithUser(userData.token, userData.userId);
    
    if (success) {
      console.log('\n' + '='.repeat(60));
      console.log('🎯 NEXT STEPS:');
      console.log('='.repeat(60));
      console.log(`1. Go to Stripe Dashboard`);
      console.log(`2. Create subscription for: ${userData.email}`);
      console.log(`3. Run subscription tests with:`);
      console.log(`   $env:TEST_TOKEN="${userData.token}"`);
      console.log(`   $env:API_BASE_URL="http://localhost:3001"`);
      console.log(`   node tests\\comprehensive\\subscription-activation-tests.js`);
      console.log('='.repeat(60));
      
      // Save token to file
      require('fs').writeFileSync('test-token.txt', userData.token);
      require('fs').writeFileSync('test-user-info.json', JSON.stringify(userData, null, 2));
      console.log('💾 Token saved to test-token.txt');
      console.log('💾 User info saved to test-user-info.json');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { createMinimalUser, testSubscriptionWithUser };
