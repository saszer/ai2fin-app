/**
 * Detailed Subscription Debug Test
 * Shows exactly what's happening with subscription status
 */

const BASE = process.env.API_BASE_URL || 'http://localhost:3001';
const token = process.env.TEST_TOKEN;

async function json(res) { 
  const t = await res.text(); 
  try { return JSON.parse(t); } catch { return { raw: t }; } 
}

async function detailedDebug() {
  console.log('🔍 DETAILED SUBSCRIPTION DEBUG');
  console.log('='.repeat(50));
  
  if (!token) {
    console.log('❌ TEST_TOKEN not set');
    return;
  }
  
  // Decode the token to see user info
  const [header, payload, signature] = token.split('.');
  const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
  
  console.log('👤 User Info from Token:');
  console.log(`   User ID: ${decodedPayload.userId || decodedPayload.sub}`);
  console.log(`   Email: ${decodedPayload.email}`);
  console.log(`   Expires: ${new Date(decodedPayload.exp * 1000).toISOString()}`);
  
  console.log('\n🔄 Testing Subscription Endpoints:');
  
  // Test 1: Normal status
  console.log('\n1. Normal Status Check:');
  try {
    const res1 = await fetch(`${BASE}/api/subscription/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const body1 = await json(res1);
    console.log(`   Status: ${res1.status}`);
    console.log(`   Response:`, JSON.stringify(body1, null, 4));
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }
  
  // Test 2: Force refresh
  console.log('\n2. Force Refresh (Appbar Button):');
  try {
    const res2 = await fetch(`${BASE}/api/subscription/status?force=true`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'X-Force-Refresh': '1',
        'Cache-Control': 'no-cache'
      }
    });
    const body2 = await json(res2);
    console.log(`   Status: ${res2.status}`);
    console.log(`   Response:`, JSON.stringify(body2, null, 4));
    console.log(`   Headers:`, Object.fromEntries(res2.headers.entries()));
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }
  
  // Test 3: Direct subscription service
  console.log('\n3. Direct Subscription Service:');
  try {
    const res3 = await fetch(`http://localhost:3010/api/subscription/status/${decodedPayload.userId || decodedPayload.sub}`);
    const body3 = await json(res3);
    console.log(`   Status: ${res3.status}`);
    console.log(`   Response:`, JSON.stringify(body3, null, 4));
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }
  
  // Test 4: Check if user exists in subscription DB
  console.log('\n4. User Lookup in Subscription Service:');
  try {
    const res4 = await fetch(`http://localhost:3010/api/subscription/user/${decodedPayload.userId || decodedPayload.sub}`);
    const body4 = await json(res4);
    console.log(`   Status: ${res4.status}`);
    console.log(`   Response:`, JSON.stringify(body4, null, 4));
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 NEXT STEPS:');
  console.log('1. Check Stripe Dashboard for customer with exact email:');
  console.log(`   ${decodedPayload.email}`);
  console.log('2. Ensure subscription status is "active"');
  console.log('3. Check if webhook events fired in Stripe');
  console.log('4. If webhook didn\'t fire, manually trigger sync');
  console.log('='.repeat(50));
}

detailedDebug().catch(console.error);
