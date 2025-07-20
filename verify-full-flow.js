const axios = require('axios');

async function verifyFullFlow() {
  console.log('🔍 Verifying Full Categorization Flow');
  console.log('====================================');
  
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 1: Check all transactions in database
    console.log('\n📊 Step 1: Checking all transactions in database...');
    const allTransactionsResponse = await axios.get('http://localhost:3001/api/bank/transactions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Handle different response formats
    let transactionsData = allTransactionsResponse.data;
    if (transactionsData.transactions) {
      transactionsData = transactionsData.transactions;
    } else if (transactionsData.data) {
      transactionsData = transactionsData.data;
    }
    
    console.log(`📋 Total transactions in database: ${transactionsData?.length || 'Unknown'}`);
    console.log('📋 Response structure:', {
      isArray: Array.isArray(allTransactionsResponse.data),
      hasTransactions: !!allTransactionsResponse.data?.transactions,
      hasData: !!allTransactionsResponse.data?.data,
      keys: Object.keys(allTransactionsResponse.data || {})
    });
    
    if (!Array.isArray(transactionsData)) {
      console.log('❌ Unexpected response format. Raw response:');
      console.log(JSON.stringify(allTransactionsResponse.data, null, 2));
      return;
    }
    
    // Show recent transactions
    const recentTransactions = transactionsData
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
    
    console.log('\n📝 Most recent transactions:');
    recentTransactions.forEach((tx, index) => {
      console.log(`  ${index + 1}. ${tx.description} - $${Math.abs(tx.amount)} (Category: ${tx.categoryId ? 'SET' : 'UNCATEGORIZED'}) [${tx.createdAt}]`);
    });
    
    // Count categorized vs uncategorized
    const categorized = transactionsData.filter(tx => tx.categoryId).length;
    const uncategorized = transactionsData.filter(tx => !tx.categoryId).length;
    console.log(`\n📊 Categorization status: ${categorized} categorized, ${uncategorized} uncategorized`);
    
    // Step 2: Test analyze-for-categorization endpoint
    console.log('\n📊 Step 2: Testing analyze-for-categorization endpoint...');
    const analyzeResponse = await axios.post('http://localhost:3001/api/intelligent-categorization/analyze-for-categorization', {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Analyze endpoint response:');
    console.log('  Success:', analyzeResponse.data.success);
    console.log('  Analysis data:', !!analyzeResponse.data.analysis);
    console.log('  Breakdown:', analyzeResponse.data.analysis?.breakdown);
    console.log(`  Transactions to analyze: ${analyzeResponse.data.analysis?.transactions?.length || 0}`);
    
    if (analyzeResponse.data.analysis?.transactions?.length > 0) {
      console.log('\n📋 Transactions returned by analyze endpoint:');
      analyzeResponse.data.analysis.transactions.forEach((tx, index) => {
        console.log(`  ${index + 1}. ${tx.description} - $${Math.abs(tx.amount)} [ID: ${tx.id}]`);
      });
      
      // Step 3: Test classification
      console.log('\n📊 Step 3: Testing classification endpoint...');
      const transactions = analyzeResponse.data.analysis.transactions.map(tx => ({
        id: tx.id,
        description: tx.description,
        amount: tx.amount,
        merchant: tx.merchant,
        date: tx.date,
        type: tx.type
      }));
      
      const classifyResponse = await axios.post('http://localhost:3001/api/intelligent-categorization/classify-batch', {
        transactions,
        selectedCategories: []
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Classification results:');
      console.log('  Success:', classifyResponse.data.success);
      console.log('  Results count:', classifyResponse.data.results?.length || 0);
      console.log('  OpenAI details:', classifyResponse.data.openaiDetails);
      
      if (classifyResponse.data.results) {
        console.log('\n📋 Classification breakdown:');
        classifyResponse.data.results.forEach((result, index) => {
          console.log(`  ${index + 1}. ${transactions[index].description}`);
          console.log(`     Source: "${result.source}"`);
          console.log(`     Category: ${result.category || result.primaryCategory}`);
          console.log(`     Confidence: ${Math.round((result.confidence || 0) * 100)}%`);
          
          // Apply the same smart mapping logic as frontend
          let frontendMethod = 'Fallback';
          const openaiDetails = classifyResponse.data.openaiDetails;
          
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
                // Smart mapping logic
                if (openaiDetails && openaiDetails.totalCalls > 0) {
                  frontendMethod = 'AI';
                } else {
                  frontendMethod = 'Cache';
                }
                break;
              case 'fallback':
              case 'rule':
              case 'rule-based':
                frontendMethod = 'Fallback';
                break;
            }
          }
          
          console.log(`     Frontend Method: ${frontendMethod}`);
          console.log('');
        });
      }
      
    } else {
      console.log('\n❌ No transactions found for analysis!');
      console.log('🔍 Possible reasons:');
      console.log('  • All transactions are already categorized');
      console.log('  • New test transactions were auto-categorized');
      console.log('  • Database filter is excluding transactions');
      console.log('  • Wrong user account');
    }
    
    // Step 4: Check if our test transactions were auto-categorized
    console.log('\n📊 Step 4: Checking if test transactions were auto-categorized...');
    const testTransactionPattern = transactionsData.filter(tx => 
      tx.description.includes('AI Test') || 
      tx.merchant?.includes('Coffee Bros') ||
      tx.merchant?.includes('Staples') ||
      tx.merchant?.includes('Pizza Palace')
    );
    
    console.log(`🔍 Found ${testTransactionPattern.length} test transactions:`);
    testTransactionPattern.forEach((tx, index) => {
      console.log(`  ${index + 1}. ${tx.description} - Category: ${tx.categoryId ? 'AUTO-CATEGORIZED ⚠️' : 'UNCATEGORIZED ✅'}`);
    });
    
    // Step 5: Summary and recommendations
    console.log('\n📊 FLOW ANALYSIS SUMMARY:');
    console.log('=========================');
    
    if (uncategorized === 0) {
      console.log('❌ ISSUE: No uncategorized transactions found');
      console.log('🔧 SOLUTION: Need to add transactions that stay uncategorized');
    }
    
    if (analyzeResponse.data.analysis?.transactions?.length === 0) {
      console.log('❌ ISSUE: Analyze endpoint returns no transactions');
      console.log('🔧 SOLUTION: Check analyze endpoint filtering logic');
    }
    
    if (testTransactionPattern.some(tx => tx.categoryId)) {
      console.log('❌ ISSUE: Test transactions were auto-categorized on creation');
      console.log('🔧 SOLUTION: Need to prevent auto-categorization or clear categories');
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Clear categories from test transactions');
    console.log('2. Verify analyze endpoint picks them up');
    console.log('3. Test fresh AI categorization');
    console.log('4. Test cached results on second run');
    
  } catch (error) {
    console.error('❌ Flow verification failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

verifyFullFlow(); 