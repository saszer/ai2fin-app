const axios = require('axios');

async function forceFreshAnalysis() {
  console.log('🔄 Forcing Fresh AI Categorization Analysis');
  console.log('==========================================');
  
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 1: Call analyze-for-categorization (exactly like frontend)
    console.log('\n📊 Step 1: Calling analyze-for-categorization...');
    const analyzeResponse = await axios.post('http://localhost:3001/api/intelligent-categorization/analyze-for-categorization', {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Analyze response received');
    console.log('📋 Analysis data:');
    console.log('  Success:', analyzeResponse.data.success);
    console.log('  Breakdown:', analyzeResponse.data.analysis?.breakdown);
    console.log('  Transactions count:', analyzeResponse.data.analysis?.transactions?.length);
    
    if (analyzeResponse.data.analysis?.transactions?.length > 0) {
      console.log('\n📝 Transactions found for analysis:');
      analyzeResponse.data.analysis.transactions.forEach((tx, index) => {
        console.log(`  ${index + 1}. ${tx.description} - $${Math.abs(tx.amount)} [${tx.analysisType}]`);
      });
      
      // Step 2: Call classify-batch with exact same data (exactly like frontend)
      console.log('\n🤖 Step 2: Calling classify-batch...');
      
      const transactionData = analyzeResponse.data.analysis.transactions.map(tx => ({
        id: tx.id,
        description: tx.description,
        amount: tx.amount,
        merchant: tx.merchant,
        date: tx.date,
        type: tx.type,
        analysisType: tx.analysisType,
        linkedBill: tx.linkedBill
      }));
      
      console.log(`📤 Sending ${transactionData.length} transactions to classify-batch...`);
      
      const classifyResponse = await axios.post('http://localhost:3001/api/intelligent-categorization/classify-batch', {
        transactions: transactionData,
        selectedCategories: [] // No categories selected
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Classification response received');
      console.log('📊 Results:');
      console.log('  Success:', classifyResponse.data.success);
      console.log('  Results count:', classifyResponse.data.results?.length);
      console.log('  OpenAI details:', classifyResponse.data.openaiDetails);
      
      if (classifyResponse.data.results) {
        console.log('\n🎯 FRESH CLASSIFICATION RESULTS:');
        console.log('================================');
        
        classifyResponse.data.results.forEach((result, index) => {
          const transaction = transactionData[index];
          console.log(`\n${index + 1}. ${transaction.description}`);
          console.log(`   Amount: $${Math.abs(transaction.amount)}`);
          console.log(`   Source: "${result.source}"`);
          console.log(`   Category: ${result.category || result.primaryCategory}`);
          console.log(`   Confidence: ${Math.round((result.confidence || 0) * 100)}%`);
          
          // Apply smart mapping logic
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
          
          console.log(`   Frontend Method: ${frontendMethod}`);
          
          // Show reasoning with smart formatting
          let reasoning = result.reasoning || result.categoryReasoning || 'AI categorization';
          if (reasoning.includes('AI Analysis:') && frontendMethod === 'Cache' && result.source?.toLowerCase().includes('ai')) {
            reasoning = reasoning.replace('AI Analysis:', 'Cached AI Analysis:');
          } else if (frontendMethod === 'Cache' && !reasoning.includes('Cache') && !reasoning.includes('Cached')) {
            reasoning = `Cached Analysis: ${reasoning}`;
          }
          console.log(`   Reasoning: ${reasoning}`);
        });
        
        // Summary
        const methodCounts = classifyResponse.data.results.reduce((acc, result) => {
          let method = 'Fallback';
          const openaiDetails = classifyResponse.data.openaiDetails;
          
          if (result.source) {
            switch (result.source.toLowerCase()) {
              case 'cache':
              case 'cached':
              case 'database':
              case 'pattern':
              case 'pattern_match':
              case 'pattern-match':
              case 'bill-pattern':
              case 'user':
              case 'user-preference':
                method = 'Cache';
                break;
              case 'ai':
              case 'ai_plus':
              case 'ai-plus':
              case 'openai':
                if (openaiDetails && openaiDetails.totalCalls > 0) {
                  method = 'AI';
                } else {
                  method = 'Cache';
                }
                break;
              case 'fallback':
              case 'rule':
              case 'rule-based':
                method = 'Fallback';
                break;
            }
          }
          acc[method] = (acc[method] || 0) + 1;
          return acc;
        }, {});
        
        console.log('\n📊 SUMMARY:');
        console.log('============');
        console.log(`Cache: ${methodCounts.Cache || 0}`);
        console.log(`AI: ${methodCounts.AI || 0}`);
        console.log(`Fallback: ${methodCounts.Fallback || 0}`);
        console.log(`OpenAI Calls: ${classifyResponse.data.openaiDetails?.totalCalls || 0}`);
        console.log(`OpenAI Cost: $${(classifyResponse.data.openaiDetails?.totalCost || 0).toFixed(3)}`);
        
        console.log('\n🎯 This is what the frontend should show!');
        console.log('If the modal shows different results, there might be a frontend caching issue.');
        
      }
    } else {
      console.log('\n❌ No transactions returned by analyze endpoint!');
      console.log('This explains why the modal shows old results.');
      console.log('The analyze endpoint is not finding our test transactions.');
    }
    
  } catch (error) {
    console.error('❌ Fresh analysis failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

forceFreshAnalysis(); 