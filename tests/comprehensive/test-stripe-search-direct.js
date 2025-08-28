/**
 * Test Stripe Customer Search Directly
 * Verify our Stripe search implementation against the official docs
 */

const Stripe = require('stripe');

async function testStripeSearchDirect() {
  console.log('🔍 TESTING STRIPE CUSTOMER SEARCH DIRECTLY');
  console.log('='.repeat(60));
  
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('❌ STRIPE_SECRET_KEY not set');
    return;
  }
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
  
  const testEmail = 'qa+minimal-1756400831376@embracingearth.space';
  
  console.log('👤 TARGET EMAIL:', testEmail);
  console.log('🔑 API VERSION:', '2023-10-16');
  
  // Test 1: Exact match search (our primary method)
  console.log('\n1️⃣ EXACT MATCH SEARCH:');
  console.log(`Query: email:'${testEmail}'`);
  try {
    const searchExact = await stripe.customers.search({ 
      query: `email:'${testEmail}'` 
    });
    console.log(`✅ Status: Success`);
    console.log(`📊 Results: ${searchExact.data.length} customers found`);
    if (searchExact.data.length > 0) {
      const customer = searchExact.data[0];
      console.log(`👤 Customer ID: ${customer.id}`);
      console.log(`📧 Email: ${customer.email}`);
      console.log(`📅 Created: ${new Date(customer.created * 1000).toISOString()}`);
    }
  } catch (error) {
    console.log(`❌ Error:`, error.message);
  }
  
  // Test 2: Substring search (our fallback)
  console.log('\n2️⃣ SUBSTRING SEARCH:');
  console.log(`Query: email~'${testEmail}'`);
  try {
    const searchFuzzy = await stripe.customers.search({ 
      query: `email~'${testEmail}'` 
    });
    console.log(`✅ Status: Success`);
    console.log(`📊 Results: ${searchFuzzy.data.length} customers found`);
    if (searchFuzzy.data.length > 0) {
      const customer = searchFuzzy.data[0];
      console.log(`👤 Customer ID: ${customer.id}`);
      console.log(`📧 Email: ${customer.email}`);
    }
  } catch (error) {
    console.log(`❌ Error:`, error.message);
  }
  
  // Test 3: List API (our final fallback)
  console.log('\n3️⃣ LIST API FALLBACK:');
  console.log(`Filter: { email: '${testEmail}', limit: 1 }`);
  try {
    const listResult = await stripe.customers.list({ 
      email: testEmail, 
      limit: 1 
    });
    console.log(`✅ Status: Success`);
    console.log(`📊 Results: ${listResult.data.length} customers found`);
    if (listResult.data.length > 0) {
      const customer = listResult.data[0];
      console.log(`👤 Customer ID: ${customer.id}`);
      console.log(`📧 Email: ${customer.email}`);
      console.log(`📅 Created: ${new Date(customer.created * 1000).toISOString()}`);
    }
  } catch (error) {
    console.log(`❌ Error:`, error.message);
  }
  
  // Test 4: Check account info
  console.log('\n4️⃣ ACCOUNT INFO:');
  try {
    const account = await stripe.accounts.retrieve();
    console.log(`🏢 Account ID: ${account.id}`);
    console.log(`🌍 Country: ${account.country}`);
    console.log(`💳 Type: ${account.type}`);
    console.log(`⚡ Charges enabled: ${account.charges_enabled}`);
  } catch (error) {
    console.log(`❌ Account error:`, error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 ANALYSIS:');
  console.log('If all 3 methods return 0 results:');
  console.log('1. Customer doesn\'t exist in Stripe');
  console.log('2. Email doesn\'t match exactly');
  console.log('3. Data freshness delay (< 1 minute for search)');
  console.log('4. Different Stripe account/environment');
  console.log('='.repeat(60));
}

testStripeSearchDirect().catch(console.error);
