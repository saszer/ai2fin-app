const axios = require('axios');

async function testNoPatternMatching() {
  console.log('🧪 Testing Categorization Without Pattern Matching');
  console.log('=' .repeat(60));

  const baseURL = 'http://localhost:3000';
  let authToken = null;

  try {
    // Step 1: Login to get auth token
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

    // Step 2: Clear cache to ensure fresh tests
    console.log('\n2️⃣  Clearing categorization cache...');
    await axios.post(`${baseURL}/api/intelligent-categorization/clear-cache`, {}, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Cache cleared');

    // Step 3: Test with unique transactions that should NOT get pattern matched
    console.log('\n3️⃣  Testing unique transactions (should return Uncategorized)...');
    
    const testTransactions = [
      {
        id: `test-unique-${Date.now()}-1`,
        description: `UNIQUE TEST MERCHANT ${Date.now()} - PATTERN SHOULD NOT MATCH`,
        amount: -123.45,
        merchant: `UniqueTestMerchant${Date.now()}`,
        date: new Date().toISOString(),
        type: 'debit'
      },
      {
        id: `test-unique-${Date.now()}-2`, 
        description: `COMPLETELY NOVEL TRANSACTION ${Date.now()}`,
        amount: -67.89,
        merchant: `NovelMerchant${Date.now()}`,
        date: new Date().toISOString(),
        type: 'debit'
      }
    ];

    // Step 4: Test batch classification
    console.log('\n4️⃣  Running batch classification...');
    const classifyResponse = await axios.post(
      `${baseURL}/api/intelligent-categorization/classify-batch`,
      {
        transactions: testTransactions,
        selectedCategories: ['Office Supplies', 'Technology']
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    if (classifyResponse.data.success) {
      const results = classifyResponse.data.results;
      const summary = classifyResponse.data.summary;
      
      console.log(`✅ Classification completed: ${results.length} results`);
      console.log(`📊 Summary:`, {
        processed: summary.processed,
        successfullyCategorized: summary.successfullyCategorized,
        aiCallsUsed: summary.aiCallsUsed,
        cacheHits: summary.cacheHits,
        patternMatches: summary.patternMatches
      });

      // Step 5: Analyze results for pattern matching
      console.log('\n5️⃣  Analyzing results for pattern matching...');
      
      let uncategorizedCount = 0;
      let patternMatchedCount = 0;
      
      results.forEach((result, index) => {
        const transaction = testTransactions[index];
        console.log(`\n📋 Transaction ${index + 1}:`);
        console.log(`   Description: ${transaction.description.substring(0, 50)}...`);
        console.log(`   Category: ${result.category}`);
        console.log(`   Source: ${result.source}`);
        console.log(`   Confidence: ${result.confidence}`);
        console.log(`   Reasoning: ${result.reasoning}`);
        
        if (result.category === 'Uncategorized') {
          uncategorizedCount++;
          console.log(`   ✅ CORRECT: Returned uncategorized (no pattern matching)`);
        } else if (result.source === 'pattern') {
          patternMatchedCount++;
          console.log(`   ❌ ERROR: Used pattern matching!`);
        } else if (result.source === 'cache' || result.source === 'user') {
          console.log(`   ✅ CORRECT: Used legitimate cache source`);
        } else if (result.source === 'ai' || result.source === 'ai_plus') {
          console.log(`   ✅ CORRECT: Used AI classification`);
        } else {
          console.log(`   ⚠️  UNKNOWN: Unknown source - ${result.source}`);
        }
      });

      // Step 6: Verify OpenAI usage
      console.log('\n6️⃣  Checking OpenAI usage...');
      const openaiUsage = summary.openaiDetails || {};
      console.log(`   Total OpenAI calls: ${openaiUsage.totalCalls || 0}`);
      console.log(`   Cost estimate: $${openaiUsage.estimatedCost || 0}`);
      
      if (openaiUsage.totalCalls > 0) {
        console.log('   ✅ Real AI calls were made (pattern matching disabled)');
      } else {
        console.log('   ⚠️  No AI calls - AI service might be down');
      }

      // Step 7: Final verdict
      console.log('\n7️⃣  FINAL VERDICT:');
      console.log('=' .repeat(60));
      
      if (patternMatchedCount === 0) {
        console.log('✅ SUCCESS: No pattern matching detected!');
        console.log(`   ${uncategorizedCount}/${results.length} transactions returned as Uncategorized`);
        console.log('   System correctly avoids pattern-based categorization');
      } else {
        console.log('❌ FAILURE: Pattern matching still present!');
        console.log(`   ${patternMatchedCount}/${results.length} transactions used pattern matching`);
      }

    } else {
      console.error('❌ Classification failed:', classifyResponse.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testNoPatternMatching(); 