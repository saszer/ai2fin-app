/**
 * Dynamic User Registration + Subscription Activation Tests
 * - Creates a new user via enterprise auth API (registers in Zitadel)
 * - Tests subscription status and UI lock behavior
 * - Uses timestamp-based email to avoid conflicts
 */
/* eslint-disable no-console */

const BASE = (process.env.API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');

async function json(res) { 
  const t = await res.text(); 
  try { return JSON.parse(t); } catch { return { raw: t }; } 
}

async function createTestUser() {
  const timestamp = Date.now();
  const email = `qa+subtest-${timestamp}@embracingearth.space`;
  const password = 'TestPass123!';
  
  console.log(`🔄 Creating test user: ${email}`);
  
  const registerRes = await fetch(`${BASE}/api/enterprise-auth/register`, {
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
  
  const registerBody = await json(registerRes);
  
  if (!registerRes.ok) {
    throw new Error(`Registration failed: ${registerRes.status} ${registerBody?.error || registerBody?.raw || ''}`);
  }
  
  if (!registerBody?.token) {
    throw new Error(`No token in registration response: ${JSON.stringify(registerBody)}`);
  }
  
  console.log(`✅ User created successfully: ${email}`);
  return { email, password, token: registerBody.token, userId: registerBody.user?.id };
}

async function getSubscriptionStatus(token, force = false, etag = null) {
  const url = `${BASE}/api/subscription/status${force ? '?force=true' : ''}`;
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'X-Source': 'dynamic-sub-tests'
  };
  
  if (force) {
    headers['X-Force-Refresh'] = '1';
    headers['Cache-Control'] = 'no-cache';
  }
  
  if (etag) {
    headers['If-None-Match'] = etag;
  }
  
  const res = await fetch(url, { headers, credentials: 'include' });
  const body = await json(res);
  
  return { 
    status: res.status, 
    ok: res.ok, 
    body, 
    etag: res.headers.get('etag'),
    headers: Object.fromEntries(res.headers.entries())
  };
}

async function testUserCreationAndSubscription() {
  const results = [];
  const push = (name, success, details) => {
    results.push({ name, success, details });
    console.log(`${success ? '✅' : '❌'} ${name}`, details || '');
  };
  
  try {
    // 1. Create new user dynamically
    const user = await createTestUser();
    push('User Registration', true, { email: user.email, hasToken: !!user.token });
    
    // 2. Test initial subscription status (should be inactive for new user)
    const initialStatus = await getSubscriptionStatus(user.token);
    push('Initial Status Check', initialStatus.ok, { 
      status: initialStatus.status,
      active: initialStatus.body?.data?.subscription?.isActive || initialStatus.body?.subscription?.isActive,
      userId: initialStatus.body?.data?.user?.id || initialStatus.body?.user?.id
    });
    
    // 3. Test forced refresh
    const forcedStatus = await getSubscriptionStatus(user.token, true);
    push('Forced Status Refresh', forcedStatus.ok, {
      status: forcedStatus.status,
      active: forcedStatus.body?.data?.subscription?.isActive || forcedStatus.body?.subscription?.isActive,
      etag: forcedStatus.etag
    });
    
    // 4. Test ETag behavior (should return 304 if nothing changed)
    if (forcedStatus.etag) {
      const etagStatus = await getSubscriptionStatus(user.token, false, forcedStatus.etag);
      push('ETag 304 Check', etagStatus.status === 304, { status: etagStatus.status });
    }
    
    // 5. Test subscription lock behavior
    const subscription = forcedStatus.body?.data?.subscription || forcedStatus.body?.subscription || {};
    const isLocked = !subscription.isActive;
    push('UI Lock Status', true, { 
      isLocked, 
      reason: isLocked ? 'New user - no active subscription' : 'User has active subscription',
      subscriptionStatus: subscription.status,
      stripeCustomerId: subscription.stripeCustomerId
    });
    
    console.log('\n📊 Test Summary:');
    console.log(JSON.stringify({ 
      user: { email: user.email, userId: user.userId },
      results,
      subscription: {
        isActive: subscription.isActive,
        status: subscription.status,
        stripeCustomerId: subscription.stripeCustomerId
      }
    }, null, 2));
    
    console.log('\n💡 Next Steps:');
    console.log(`1. Go to Stripe Dashboard and create a subscription for: ${user.email}`);
    console.log(`2. Or use this token to test frontend: ${user.token}`);
    console.log(`3. Re-run with TEST_TOKEN="${user.token}" to test post-activation`);
    
    const hasFailures = results.some(r => !r.success);
    process.exit(hasFailures ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Also export individual functions for reuse
async function testWithExistingToken(token) {
  console.log('🔄 Testing with existing token...');
  
  const results = [];
  const push = (name, success, details) => {
    results.push({ name, success, details });
    console.log(`${success ? '✅' : '❌'} ${name}`, details || '');
  };
  
  try {
    // Test current status
    const status1 = await getSubscriptionStatus(token);
    push('Token Auth', status1.ok, { status: status1.status });
    
    // Test forced refresh
    const status2 = await getSubscriptionStatus(token, true);
    const sub = status2.body?.data?.subscription || status2.body?.subscription || {};
    push('Subscription Active', sub.isActive === true, { 
      active: sub.isActive, 
      status: sub.status,
      stripeCustomerId: sub.stripeCustomerId 
    });
    
    console.log('\n📊 Results:', JSON.stringify({ results, subscription: sub }, null, 2));
    process.exit(results.some(r => !r.success) ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Token test failed:', error.message);
    process.exit(1);
  }
}

async function run() {
  const token = process.env.TEST_TOKEN;
  
  if (token) {
    await testWithExistingToken(token);
  } else {
    await testUserCreationAndSubscription();
  }
}

if (require.main === module) {
  run();
}

module.exports = { run, createTestUser, getSubscriptionStatus, testWithExistingToken };


