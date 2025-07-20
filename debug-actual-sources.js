const axios = require('axios');

async function debugActualSources() {
  console.log('🔍 Debugging Actual Backend Sources');
  console.log('====================================');
  
  try {
    // First login to get token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Get analysis
    console.log('\n📊 Getting analysis...');
    const analyzeResponse = await axios.post('http://localhost:3001/api/intelligent-categorization/analyze-for-categorization', {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (analyzeResponse.data.analysis?.transactions?.length > 0) {
      console.log('✅ Found transactions to analyze');
      
      const transactions = analyzeResponse.data.analysis.transactions.map(tx => ({
        id: tx.id,
        description: tx.description,
        amount: tx.amount,
        merchant: tx.merchant,
        date: tx.date,
        type: tx.type
      }));
      
      console.log('\n🔬 Running classification...');
      const classifyResponse = await axios.post('http://localhost:3001/api/intelligent-categorization/classify-batch', {
        transactions,
        selectedCategories: []
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('\n🔍 RAW BACKEND RESPONSE:');
      console.log('========================');
      console.log(JSON.stringify(classifyResponse.data, null, 2));
      
      console.log('\n📋 DETAILED SOURCE ANALYSIS:');
      console.log('=============================');
      
      if (classifyResponse.data.results) {
        classifyResponse.data.results.forEach((result, index) => {
          console.log(`\nTransaction ${index + 1}:`);
          console.log(`  Description: ${transactions[index].description}`);
          console.log(`  Amount: $${transactions[index].amount}`);
          console.log(`  🔹 Raw Source: "${result.source}"`);
          console.log(`  🔹 Category: ${result.category || result.primaryCategory}`);
          console.log(`  🔹 Reasoning: ${result.reasoning || result.categoryReasoning}`);
          console.log(`  🔹 Confidence: ${result.confidence}`);
          
          // Apply current frontend mapping logic
          let frontendMethod = 'Fallback';
          if (result.source) {
            switch (result.source.toLowerCase()) {
              case 'cache':
              case 'cached':
              case 'database':
                frontendMethod = 'Cache';
                break;
              case 'pattern':
              case 'pattern_match':
              case 'pattern-match':
              case 'bill-pattern':
                frontendMethod = 'Cache';
                break;
              case 'user':
              case 'user-preference':
                frontendMethod = 'Cache';
                break;
              case 'ai':
              case 'ai_plus':
              case 'ai-plus':
              case 'openai':
                frontendMethod = 'AI';
                break;
              case 'fallback':
              case 'rule':
              case 'rule-based':
                frontendMethod = 'Fallback';
                break;
            }
          }
          
          console.log(`  ➡️  Frontend Method: ${frontendMethod}`);
          
          // Check for inconsistency
          if (frontendMethod === 'AI') {
            console.log(`  ⚠️  INCONSISTENCY DETECTED: Shows as AI but OpenAI calls = ${classifyResponse.data.openaiDetails?.totalCalls || 0}`);
          }
        });
      }
      
      console.log('\n💰 OPENAI USAGE DETAILS:');
      console.log('========================');
      const openaiDetails = classifyResponse.data.openaiDetails || {};
      console.log(`Total Calls: ${openaiDetails.totalCalls || 0}`);
      console.log(`Total Tokens: ${openaiDetails.totalTokens || 0}`);
      console.log(`Total Cost: $${(openaiDetails.totalCost || 0).toFixed(3)}`);
      
      if (openaiDetails.totalCalls === 0) {
        console.log('\n🔍 ZERO OPENAI CALLS - This means:');
        console.log('  • Transactions were categorized from cache/patterns');
        console.log('  • Backend should return source: "cache" or "pattern"');
        console.log('  • If source shows "ai", this is a backend labeling bug');
      }
      
    } else {
      console.log('❌ No transactions found to analyze');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

debugActualSources(); 