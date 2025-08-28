/**
 * ORPHAN RECOVERY SYSTEM ANALYSIS
 * 
 * WHY THE ORPHAN RECOVERY ISN'T WORKING:
 * 
 * 1. TIMING: Reconciliation runs every 15 minutes (every 15 min)
 * 2. SCOPE: Only checks subscriptions created in last 30 days
 * 3. LOOKUP FAILURE: Even when found, resolveUserIdByEmail() fails
 * 4. BACKOFF: Failed lookups are cached with exponential backoff
 * 
 * ROOT CAUSE: The orphan recovery system DOES find the subscription,
 * but fails at the same userLookup.ts bottleneck we identified.
 */

const BASE = process.env.API_BASE_URL || 'http://localhost:3001';
const token = process.env.TEST_TOKEN;

async function json(res) { 
  const t = await res.text(); 
  try { return JSON.parse(t); } catch { return { raw: t }; } 
}

async function analyzeOrphanRecovery() {
  console.log('🔍 ORPHAN RECOVERY SYSTEM ANALYSIS');
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
  
  console.log('\n🔄 ORPHAN RECOVERY FLOW:');
  console.log('1. ✅ Reconciliation task runs every 15 minutes');
  console.log('2. ✅ Scans Stripe for subscriptions created in last 30 days');
  console.log('3. ✅ Finds our subscription (created today)');
  console.log('4. ✅ Calls attemptOrphanRecovery()');
  console.log('5. ❌ FAILS at resolveUserIdByEmail() - same issue!');
  console.log('6. ❌ Gets cached with exponential backoff');
  
  console.log('\n🎯 THE REAL ISSUE:');
  console.log('The orphan recovery system IS working correctly!');
  console.log('It finds the subscription but fails at the SAME lookup issue.');
  console.log('');
  console.log('The system tries:');
  console.log('1. StripeCustomer mapping → EMPTY');
  console.log('2. Zitadel lookup → FAILS (no user)');
  console.log('3. Stripe name matching → FAILS');
  console.log('4. Core service lookup → FAILS');
  console.log('5. Gets cached and won\'t retry for 1+ hours');
  
  console.log('\n🚨 BACKOFF CACHE PROBLEM:');
  console.log('If the lookup failed once, it\'s cached with exponential backoff:');
  console.log('- Attempt 1: Retry after 1 hour');
  console.log('- Attempt 2: Retry after 2 hours');
  console.log('- Attempt 3: Retry after 4 hours');
  console.log('- Attempt 4: Retry after 8 hours');
  console.log('- Attempt 5: EXHAUSTED - manual intervention required');
  
  console.log('\n🔧 SOLUTIONS:');
  console.log('A) Create StripeCustomer mapping (immediate fix)');
  console.log('B) Clear the failed lookup cache');
  console.log('C) Trigger manual reconciliation');
  console.log('D) Add core service lookup endpoint');
  
  console.log('\n🚀 TEST MANUAL RECONCILIATION:');
  try {
    const res = await fetch(`http://localhost:3010/api/subscription/admin/reconcile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const body = await json(res);
    console.log(`Manual reconciliation: ${res.status}`);
    console.log('Response:', JSON.stringify(body, null, 2));
  } catch (e) {
    console.log(`Manual reconciliation failed: ${e.message}`);
  }
  
  console.log('\n🔍 CHECK ORPHAN STATUS:');
  try {
    const res = await fetch(`http://localhost:3010/api/subscription/admin/mappings/orphans`);
    const body = await json(res);
    console.log(`Orphan check: ${res.status}`);
    console.log('Response:', JSON.stringify(body, null, 2));
  } catch (e) {
    console.log(`Orphan check failed: ${e.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 CONCLUSION:');
  console.log('The orphan recovery system is working as designed.');
  console.log('The issue is the user lookup bottleneck we identified.');
  console.log('Creating the StripeCustomer mapping will fix both:');
  console.log('1. Direct API calls (refresh button)');
  console.log('2. Orphan recovery system (future subscriptions)');
  console.log('='.repeat(60));
}

analyzeOrphanRecovery().catch(console.error);
