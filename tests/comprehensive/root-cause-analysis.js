/**
 * ROOT CAUSE ANALYSIS - Email Lookup Logic
 * 
 * ISSUE: Subscription service cannot find user by email
 * 
 * ANALYSIS:
 * 1. Our test user has email: qa+minimal-1756400831376@embracingearth.space
 * 2. Our test user has ID: test-user-1756400831376 (manually created JWT)
 * 3. Stripe subscription exists with correct email
 * 4. But subscription service can't resolve email -> user ID
 * 
 * WHY: The userLookup.ts service tries these strategies:
 * 1. StripeCustomer mapping table (empty - no mapping exists)
 * 2. Zitadel lookup (fails - user not in Zitadel, we bypassed it)
 * 3. Stripe customer name matching (fails - no Zitadel user)
 * 4. Core service lookup (fails - endpoint doesn't exist)
 * 
 * SOLUTION: Create a direct mapping in the StripeCustomer table
 */

const BASE = process.env.API_BASE_URL || 'http://localhost:3001';
const token = process.env.TEST_TOKEN;

async function json(res) { 
  const t = await res.text(); 
  try { return JSON.parse(t); } catch { return { raw: t }; } 
}

async function analyzeRootCause() {
  console.log('🔍 ROOT CAUSE ANALYSIS');
  console.log('='.repeat(60));
  
  if (!token) {
    console.log('❌ TEST_TOKEN not set');
    return;
  }
  
  // Decode token to get user info
  const [header, payload, signature] = token.split('.');
  const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
  
  console.log('👤 TEST USER DETAILS:');
  console.log(`   User ID: ${decodedPayload.userId || decodedPayload.sub}`);
  console.log(`   Email: ${decodedPayload.email}`);
  
  console.log('\n🔍 PROBLEM ANALYSIS:');
  console.log('1. ✅ Stripe subscription exists (confirmed by user)');
  console.log('2. ✅ API calls work (200 responses)');
  console.log('3. ❌ User lookup fails (no mapping exists)');
  
  console.log('\n🎯 ROOT CAUSE:');
  console.log('The subscription service uses userLookup.ts which tries:');
  console.log('1. StripeCustomer mapping table → EMPTY (no mapping)');
  console.log('2. Zitadel lookup → FAILS (user not in Zitadel)');
  console.log('3. Stripe name matching → FAILS (no Zitadel user)');
  console.log('4. Core service lookup → FAILS (endpoint missing)');
  
  console.log('\n💡 SOLUTION OPTIONS:');
  console.log('A) Create StripeCustomer mapping manually');
  console.log('B) Add user to Zitadel');
  console.log('C) Implement core service lookup endpoint');
  console.log('D) Force webhook processing');
  
  console.log('\n🚀 TESTING SOLUTION A - Manual Mapping:');
  
  // Test if we can create the mapping via direct DB call
  // This would simulate what should happen during webhook processing
  
  const testPayload = {
    userId: decodedPayload.userId || decodedPayload.sub,
    email: decodedPayload.email,
    stripeCustomerId: 'cus_test_placeholder' // Would be real Stripe customer ID
  };
  
  console.log('Test mapping payload:', JSON.stringify(testPayload, null, 2));
  
  console.log('\n🔧 IMMEDIATE FIX:');
  console.log('Run this SQL in your subscription database:');
  console.log(`INSERT INTO "StripeCustomer" ("userId", "email", "stripeCustomerId", "createdAt", "updatedAt")`);
  console.log(`VALUES ('${testPayload.userId}', '${testPayload.email}', '<REAL_STRIPE_CUSTOMER_ID>', NOW(), NOW());`);
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Get real Stripe customer ID from dashboard');
  console.log('2. Insert mapping record');
  console.log('3. Test refresh button again');
  console.log('4. Should show isActive: true');
  
  console.log('\n' + '='.repeat(60));
}

analyzeRootCause().catch(console.error);
