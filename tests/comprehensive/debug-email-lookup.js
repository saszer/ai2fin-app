/**
 * Debug Email Lookup - Step by Step Analysis
 * Tests each lookup strategy individually to find the exact failure point
 */

const BASE = process.env.API_BASE_URL || 'http://localhost:3001';
const token = process.env.TEST_TOKEN;

async function json(res) { 
  const t = await res.text(); 
  try { return JSON.parse(t); } catch { return { raw: t }; } 
}

async function debugEmailLookup() {
  console.log('🔍 EMAIL LOOKUP DEBUG - STEP BY STEP');
  console.log('='.repeat(60));
  
  if (!token) {
    console.log('❌ TEST_TOKEN not set');
    return;
  }
  
  // Decode token to get user info
  const [header, payload, signature] = token.split('.');
  const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
  const email = decodedPayload.email;
  const userId = decodedPayload.userId || decodedPayload.sub;
  
  console.log('👤 TARGET USER:');
  console.log(`   Email: ${email}`);
  console.log(`   User ID: ${userId}`);
  
  console.log('\n🔍 TESTING EACH LOOKUP STRATEGY:');
  
  // Strategy 1: StripeCustomer mapping
  console.log('\n1️⃣ STRIPE CUSTOMER MAPPING:');
  try {
    const res = await fetch(`http://localhost:3010/api/subscription/debug/mapping/${encodeURIComponent(email)}`);
    if (res.status === 404) {
      console.log('   ❌ Endpoint not found - mapping check not available');
    } else {
      const body = await json(res);
      console.log(`   Status: ${res.status}`);
      console.log(`   Result:`, JSON.stringify(body, null, 4));
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }
  
  // Strategy 2: Check environment variables for Zitadel
  console.log('\n2️⃣ ZITADEL CONFIGURATION:');
  console.log(`   OIDC_ISSUER: ${process.env.OIDC_ISSUER ? 'SET' : 'MISSING'}`);
  console.log(`   ZITADEL_MANAGEMENT_TOKEN: ${process.env.ZITADEL_MANAGEMENT_TOKEN ? 'SET' : 'MISSING'}`);
  
  if (!process.env.OIDC_ISSUER || !process.env.ZITADEL_MANAGEMENT_TOKEN) {
    console.log('   ❌ Zitadel not configured - this lookup will fail');
  } else {
    console.log('   ✅ Zitadel configured - but our user is not in Zitadel');
  }
  
  // Strategy 3: Core service lookup
  console.log('\n3️⃣ CORE SERVICE LOOKUP:');
  console.log(`   SERVICE_SECRET: ${process.env.SERVICE_SECRET ? 'SET' : 'MISSING'}`);
  console.log(`   CORE_SERVICE_URL: ${process.env.CORE_SERVICE_URL || 'http://localhost:3001'}`);
  
  // Test if core service endpoint exists
  try {
    const res = await fetch(`${BASE}/api/users/lookup-by-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer test-token`
      },
      body: JSON.stringify({ email })
    });
    console.log(`   Core endpoint test: ${res.status}`);
    const body = await json(res);
    console.log(`   Response:`, JSON.stringify(body, null, 4));
  } catch (e) {
    console.log(`   ❌ Core service endpoint error: ${e.message}`);
  }
  
  // Strategy 4: Check Stripe customer existence
  console.log('\n4️⃣ STRIPE CUSTOMER EXISTENCE:');
  console.log('   Testing if Stripe customer exists with our email...');
  try {
    const res = await fetch(`http://localhost:3010/api/subscription/debug/stripe-customer/${encodeURIComponent(email)}`);
    if (res.status === 404) {
      console.log('   ❌ Debug endpoint not available');
    } else {
      const body = await json(res);
      console.log(`   Status: ${res.status}`);
      console.log(`   Result:`, JSON.stringify(body, null, 4));
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }
  
  console.log('\n🎯 DIAGNOSIS:');
  console.log('Based on the userLookup.ts code, the failure is likely:');
  console.log('1. StripeCustomer mapping table is empty (no record)');
  console.log('2. Zitadel lookup fails (user not in Zitadel)');
  console.log('3. Core service endpoint missing (/api/users/lookup-by-email)');
  console.log('4. All strategies fail → gets cached with backoff');
  
  console.log('\n🚀 IMMEDIATE FIXES NEEDED:');
  console.log('A) Create StripeCustomer mapping record');
  console.log('B) Implement core service lookup endpoint');
  console.log('C) Add cache override for user-initiated refresh');
  console.log('D) Add anti-abuse measures for cache override');
  
  console.log('\n' + '='.repeat(60));
}

debugEmailLookup().catch(console.error);
