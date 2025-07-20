const axios = require('axios');

async function debugAnalyzeEndpoint() {
  console.log('🔍 Debugging Analyze-for-Categorization Endpoint');
  console.log('=================================================');
  
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Call analyze endpoint (exactly like frontend modal does)
    console.log('\n📊 Calling analyze-for-categorization endpoint...');
    const analyzeResponse = await axios.post('http://localhost:3001/api/intelligent-categorization/analyze-for-categorization', {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('\n🔍 RAW ANALYZE RESPONSE:');
    console.log('========================');
    console.log('Success:', analyzeResponse.data.success);
    console.log('Message:', analyzeResponse.data.message);
    
    if (analyzeResponse.data.analysis) {
      console.log('\n📊 ANALYSIS BREAKDOWN:');
      console.log('======================');
      console.log('Total Uncategorized:', analyzeResponse.data.analysis.totalUncategorized);
      console.log('Breakdown:', analyzeResponse.data.analysis.breakdown);
      
      console.log('\n📋 TRANSACTIONS RETURNED BY ANALYZE:');
      console.log('====================================');
      console.log('Transactions count:', analyzeResponse.data.analysis.transactions?.length || 0);
      
      if (analyzeResponse.data.analysis.transactions?.length > 0) {
        console.log('\nFirst 10 transactions:');
        analyzeResponse.data.analysis.transactions.slice(0, 10).forEach((tx, index) => {
          console.log(`  ${index + 1}. ${tx.description} - $${Math.abs(tx.amount)} [${tx.analysisType}] (ID: ${tx.id})`);
        });
        
        if (analyzeResponse.data.analysis.transactions.length > 10) {
          console.log(`  ... and ${analyzeResponse.data.analysis.transactions.length - 10} more`);
        }
        
        // Look for our test transactions specifically
        console.log('\n🔍 Looking for our test transactions:');
        const testTransactions = analyzeResponse.data.analysis.transactions.filter(tx => 
          tx.description.includes('AI Test')
        );
        
        if (testTransactions.length > 0) {
          console.log(`✅ Found ${testTransactions.length} test transactions:`);
          testTransactions.forEach((tx, index) => {
            console.log(`  ${index + 1}. ${tx.description} - $${Math.abs(tx.amount)}`);
          });
        } else {
          console.log('❌ No test transactions found in analyze response!');
        }
        
      } else {
        console.log('❌ No transactions returned by analyze endpoint!');
      }
      
      console.log('\n👤 USER CATEGORIES:');
      console.log('===================');
      console.log('Categories count:', analyzeResponse.data.analysis.userCategories?.length || 0);
      if (analyzeResponse.data.analysis.userCategories?.length > 0) {
        analyzeResponse.data.analysis.userCategories.slice(0, 5).forEach((cat, index) => {
          console.log(`  ${index + 1}. ${cat.name} (ID: ${cat.id})`);
        });
      }
      
    } else {
      console.log('❌ No analysis data in response!');
    }
    
    console.log('\n🔍 KEY FINDINGS:');
    console.log('================');
    console.log(`• Backend found ${analyzeResponse.data.analysis?.totalUncategorized || 0} total uncategorized transactions`);
    console.log(`• But only returning ${analyzeResponse.data.analysis?.transactions?.length || 0} for analysis`);
    console.log(`• Breakdown shows ${analyzeResponse.data.analysis?.breakdown?.totalToAnalyze || 0} total to analyze`);
    
    const mismatch = (analyzeResponse.data.analysis?.totalUncategorized || 0) !== (analyzeResponse.data.analysis?.transactions?.length || 0);
    if (mismatch) {
      console.log('⚠️  MISMATCH DETECTED: totalUncategorized ≠ transactions.length');
      console.log('   This explains why frontend shows fewer transactions than backend processes!');
    } else {
      console.log('✅ Numbers match - issue must be elsewhere');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

debugAnalyzeEndpoint(); 