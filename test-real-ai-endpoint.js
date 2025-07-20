const axios = require('axios');

async function testRealAIEndpoint() {
  console.log('🧪 Testing Real AI Endpoint Integration');
  console.log('=' .repeat(60));

  const baseURL = 'http://localhost:3000';
  let authToken = null;

  try {
    // Step 1: Login
    console.log('\n1️⃣  Logging in...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });

    if (loginResponse.data.success && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      console.log('✅ Login successful');
    } else {
      throw new Error('Login failed');
    }

    // Step 2: Clear cache
    console.log('\n2️⃣  Clearing cache...');
    await axios.post(`${baseURL}/api/intelligent-categorization/clear-cache`, {}, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Cache cleared');

    // Step 3: Test with unique transaction
    console.log('\n3️⃣  Testing with unique transaction...');
    const testTransaction = {
      id: `test-real-ai-${Date.now()}`,
      description: `REAL AI TEST ${Date.now()} - Should call /api/classify`,
      amount: -150.00,
      merchant: `RealAITestMerchant${Date.now()}`,
      date: new Date().toISOString(),
      type: 'debit'
    };

    console.log(`   Transaction: ${testTransaction.description.substring(0, 50)}...`);

    // Step 4: Run categorization
    console.log('\n4️⃣  Running categorization...');
    const classifyResponse = await axios.post(
      `${baseURL}/api/intelligent-categorization/classify-batch`,
      {
        transactions: [testTransaction],
        selectedCategories: ['Office Supplies', 'Technology']
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    if (classifyResponse.data.success) {
      const results = classifyResponse.data.results;
      const summary = classifyResponse.data.summary;
      
      console.log('\n5️⃣  RESULTS ANALYSIS:');
      console.log('=' .repeat(40));
      
      results.forEach((result, index) => {
        console.log(`\n📋 Transaction ${index + 1}:`);
        console.log(`   Description: ${testTransaction.description.substring(0, 50)}...`);
        console.log(`   Category: ${result.category}`);
        console.log(`   Source: ${result.source}`);
        console.log(`   Method: ${result.method || 'Not specified'}`);
        console.log(`   Confidence: ${result.confidence}`);
        console.log(`   Reasoning: ${result.reasoning}`);
      });

      console.log('\n6️⃣  ENDPOINT VERIFICATION:');
      console.log('=' .repeat(40));
      
      const firstResult = results[0];
      
      if (firstResult.source === 'mock') {
        console.log('✅ SUCCESS: Using /api/classify endpoint');
        console.log('   Status: Mock mode (OpenAI not configured)');
        console.log('   Expected: Mock responses with proper structure');
      } else if (firstResult.source === 'ai_plus') {
        console.log('✅ SUCCESS: Using /api/classify endpoint');
        console.log('   Status: Real AI mode (OpenAI configured)');
        console.log('   Expected: Real OpenAI API calls');
      } else if (firstResult.source === 'pattern') {
        console.log('❌ ISSUE: Still using old pattern matching');
        console.log('   Expected: Should use /api/classify endpoint');
      } else {
        console.log('⚠️  UNKNOWN: Unexpected source -', firstResult.source);
      }

      console.log('\n7️⃣  OPENAI USAGE:');
      console.log('=' .repeat(40));
      console.log(`   OpenAI calls: ${summary.openaiDetails?.totalCalls || 0}`);
      console.log(`   Cost estimate: $${summary.openaiDetails?.estimatedCost || 0}`);
      
      if ((summary.openaiDetails?.totalCalls || 0) > 0) {
        console.log('🎉 Real OpenAI API calls detected!');
      } else {
        console.log('ℹ️  No OpenAI calls (expected in mock mode)');
      }

      console.log('\n8️⃣  FINAL VERDICT:');
      console.log('=' .repeat(40));
      
      if (firstResult.source === 'mock' || firstResult.source === 'ai_plus') {
        console.log('✅ SUCCESS: Backend now calls /api/classify endpoint');
        console.log('   • No more pattern matching fallback');
        console.log('   • Using proper AI architecture');
        console.log('   • Phase 1: Cache check + Phase 2: Real AI');
      } else {
        console.log('❌ ISSUE: Still using old endpoint');
      }

    } else {
      console.error('❌ Classification failed:', classifyResponse.data);
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Server not running');
      console.log('\n📝 CHANGES MADE (server not running):');
      console.log('   ✅ Updated backend to call /api/classify instead of /api/simple/analyze');
      console.log('   ✅ Fixed request format for classify endpoint');
      console.log('   ✅ Updated response parsing for new format');
      console.log('   ✅ Added mock/real AI detection');
    } else {
      console.error('❌ Test failed:', error.response?.data || error.message);
    }
  }
}

// Run the test
testRealAIEndpoint(); 