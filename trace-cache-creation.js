const axios = require('axios');

async function traceCacheCreation() {
  console.log('🔍 TRACING CACHE CREATION SOURCES');
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

    // Step 2: Clear all cache to start fresh
    console.log('\n2️⃣  Clearing all categorization cache...');
    await axios.post(`${baseURL}/api/intelligent-categorization/clear-cache`, {}, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Cache cleared');

    // Step 3: Check current cache count
    console.log('\n3️⃣  Checking initial cache count...');
    try {
      const cacheStatsResponse = await axios.get(`${baseURL}/api/intelligent-categorization/analytics`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      console.log('📊 Initial cache stats:', cacheStatsResponse.data.cacheStats || 'No stats available');
    } catch (error) {
      console.log('ℹ️  Cache stats not available');
    }

    // Step 4: Test with a completely unique transaction
    console.log('\n4️⃣  Testing with unique transaction...');
    const uniqueTransaction = {
      id: `trace-${Date.now()}`,
      description: `UNIQUE TRACE TEST ${Date.now()} NO PATTERN SHOULD MATCH THIS`,
      amount: -99.99,
      merchant: `TraceTestMerchant${Date.now()}`,
      date: new Date().toISOString(),
      type: 'debit'
    };

    console.log(`   Testing transaction: ${uniqueTransaction.description.substring(0, 50)}...`);

    // Step 5: Run categorization and trace results
    console.log('\n5️⃣  Running categorization analysis...');
    const analysisResponse = await axios.post(
      `${baseURL}/api/intelligent-categorization/analyze-for-categorization`,
      {
        filterOptions: {},
        selectedCategories: []
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    if (analysisResponse.data.success) {
      const analysis = analysisResponse.data.analysis;
      console.log(`📊 Analysis found ${analysis.uncategorizedTransactions.length} uncategorized transactions`);
      
      // Add our test transaction to the mix
      console.log('\n6️⃣  Adding test transaction and running classification...');
      const testTransactions = [uniqueTransaction];
      
      const classifyResponse = await axios.post(
        `${baseURL}/api/intelligent-categorization/classify-batch`,
        {
          transactions: testTransactions,
          selectedCategories: ['Office Supplies', 'Technology'] // User has preferences
        },
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      );

      if (classifyResponse.data.success) {
        const results = classifyResponse.data.results;
        const summary = classifyResponse.data.summary;
        
        console.log('\n7️⃣  CLASSIFICATION RESULTS:');
        console.log('=' .repeat(40));
        
        results.forEach((result, index) => {
          console.log(`\n📋 Transaction ${index + 1}:`);
          console.log(`   Description: ${uniqueTransaction.description.substring(0, 50)}...`);
          console.log(`   Result Category: ${result.category}`);
          console.log(`   Source: ${result.source}`);
          console.log(`   Confidence: ${result.confidence}`);
          console.log(`   Reasoning: ${result.reasoning}`);
          console.log(`   OpenAI Calls: ${summary.openaiDetails?.totalCalls || 0}`);
          
          // CRITICAL: Check if this result will create cache
          if (result.confidence >= 0.7) {
            console.log(`   ⚠️  HIGH CONFIDENCE: This will create a cache entry!`);
            console.log(`   📝 Cache source will be: ${result.source}`);
          } else {
            console.log(`   ✅ LOW CONFIDENCE: No cache entry created`);
          }
        });

        console.log('\n8️⃣  CACHE CREATION ANALYSIS:');
        console.log('=' .repeat(40));
        
        // Trace specific flows
        console.log(`📊 Summary Statistics:`);
        console.log(`   Total processed: ${summary.processed}`);
        console.log(`   Successfully categorized: ${summary.successfullyCategorized}`);
        console.log(`   AI calls used: ${summary.aiCallsUsed || 0}`);
        console.log(`   Cache hits: ${summary.cacheHits || 0}`);
        console.log(`   Pattern matches: ${summary.patternMatches || 0}`);

        // Check for cache creation sources
        console.log('\n9️⃣  IDENTIFYING CACHE CREATION SOURCES:');
        
        if (summary.aiCallsUsed === 0 && summary.successfullyCategorized > 0) {
          console.log('🚨 ISSUE FOUND: Successful categorization WITHOUT AI calls!');
          console.log('   This means cache is being created from:');
          
          if (summary.cacheHits > 0) {
            console.log('   ✅ Legitimate cache hits from existing data');
          }
          
          if (summary.patternMatches > 0) {
            console.log('   ❌ PATTERN MATCHING still active!');
          }
          
          // Check if it's user preference matching
          if (results.some(r => r.source === 'user')) {
            console.log('   ❌ USER PREFERENCE PATTERN MATCHING active!');
            console.log('   📍 Source: checkUserCategoryPatterns() method');
          }
          
          // Check if it's internal cache with merchant matching
          if (results.some(r => r.source === 'cache' && r.confidence >= 0.6)) {
            console.log('   ❌ MERCHANT PATTERN MATCHING in checkInternalCache()!');
            console.log('   📍 Source: merchant contains() query');
          }
        } else if (summary.aiCallsUsed > 0) {
          console.log('✅ Real AI calls made - cache creation legitimate');
        } else {
          console.log('✅ No successful categorization - no cache created');
        }

      } else {
        console.error('❌ Classification failed:', classifyResponse.data);
      }
    } else {
      console.error('❌ Analysis failed:', analysisResponse.data);
    }

  } catch (error) {
    console.error('❌ Trace failed:', error.response?.data || error.message);
  }
}

// Run the trace
traceCacheCreation(); 