/**
 * Create User Dynamically + Run Subscription Tests
 * - Creates user via enterprise auth registration
 * - Returns token for immediate testing
 * - Saves user info for Stripe setup
 */
/* eslint-disable no-console */

const BASE = 'http://localhost:3001';

async function json(res) { 
  const t = await res.text(); 
  try { return JSON.parse(t); } catch { return { raw: t }; } 
}

async function waitForServer(maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) {
        console.log('✅ Server is ready');
        return true;
      }
    } catch (e) {
      console.log(`⏳ Waiting for server... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  throw new Error('Server not ready after waiting');
}

async function createUser() {
  const timestamp = Date.now();
  const email = `qa+subtest-${timestamp}@embracingearth.space`;
  const password = 'TestPass123!';
  
  console.log(`🔄 Creating user: ${email}`);
  
  const res = await fetch(`${BASE}/api/enterprise-auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email,
      password,
      firstName: 'QA',
      lastName: 'TestUser',
      acceptTerms: true,
      countryCode: 'US'
    })
  });
  
  const body = await json(res);
  
  if (!res.ok) {
    throw new Error(`Registration failed: ${res.status} ${body?.error || body?.raw}`);
  }
  
  if (!body?.token) {
    throw new Error(`No token received: ${JSON.stringify(body)}`);
  }
  
  console.log('✅ User created successfully!');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Token: ${body.token}`);
  console.log(`👤 User ID: ${body.user?.id || 'N/A'}`);
  
  return { email, password, token: body.token, user: body.user };
}

async function testSubscriptionStatus(token) {
  console.log('\n🔄 Testing subscription status...');
  
  // Normal status
  const res1 = await fetch(`${BASE}/api/subscription/status`, {
    headers: { 'Authorization': `Bearer ${token}` },
    credentials: 'include'
  });
  const body1 = await json(res1);
  
  console.log(`📊 Status: ${res1.status}`);
  console.log(`📋 Response:`, JSON.stringify(body1, null, 2));
  
  // Forced refresh
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
  
  const sub = body2?.data?.subscription || body2?.subscription || {};
  const isActive = sub.isActive === true;
  
  console.log(`\n🔒 UI Lock Status: ${isActive ? 'UNLOCKED' : 'LOCKED'}`);
  console.log(`💳 Stripe Customer: ${sub.stripeCustomerId || 'Not created'}`);
  
  return { isActive, subscription: sub };
}

async function run() {
  try {
    await waitForServer();
    
    const userData = await createUser();
    const { isActive } = await testSubscriptionStatus(userData.token);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 NEXT STEPS:');
    console.log('='.repeat(60));
    console.log(`1. Go to Stripe Dashboard`);
    console.log(`2. Create subscription for: ${userData.email}`);
    console.log(`3. Run tests with this token:`);
    console.log(`   $env:TEST_TOKEN="${userData.token}"`);
    console.log(`   node tests\\comprehensive\\subscription-activation-tests.js`);
    console.log('='.repeat(60));
    
    // Save token to file for easy reuse
    require('fs').writeFileSync('test-token.txt', userData.token);
    console.log('💾 Token saved to test-token.txt');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { createUser, testSubscriptionStatus };


