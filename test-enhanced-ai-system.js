/**
 * 🧠 ENHANCED AI SYSTEM - COMPREHENSIVE TEST SUITE
 * 
 * Tests the complete enhanced AI categorization and tax analysis system:
 * - 🔥 Token-optimized bulk processing
 * - 💰 Cost tracking and optimization  
 * - 🎯 Tax deductibility analysis
 * - 📊 Performance metrics and analytics
 * - ⚡ Intelligent caching and fallbacks
 * 
 * // embracingearth.space - AI-powered financial intelligence
 */

const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_API_KEY = 'your-test-api-key'; // Replace with actual API key

const headers = {
  'Content-Type': 'application/json',
  // Add authorization header if required
  // 'Authorization': `Bearer ${TEST_API_KEY}`
};

// Mock transaction data for testing
const MOCK_TRANSACTIONS = [
  {
    id: 'tx_001',
    description: 'Microsoft Office 365 Subscription',
    amount: 99.99,
    date: '2025-01-15',
    primaryType: 'EXPENSE'
  },
  {
    id: 'tx_002', 
    description: 'Fuel - Shell Station',
    amount: 75.50,
    date: '2025-01-14',
    primaryType: 'EXPENSE'
  },
  {
    id: 'tx_003',
    description: 'Business Lunch - Restaurant',
    amount: 45.20,
    date: '2025-01-13',
    primaryType: 'EXPENSE'
  },
  {
    id: 'tx_004',
    description: 'Laptop Computer - Harvey Norman',
    amount: 1299.00,
    date: '2025-01-12', 
    primaryType: 'EXPENSE'
  },
  {
    id: 'tx_005',
    description: 'Mobile Phone Bill - Telstra',
    amount: 89.90,
    date: '2025-01-11',
    primaryType: 'EXPENSE'
  }
];

async function testSystemStatus() {
  console.log('\n🔍 TESTING SYSTEM STATUS');
  console.log('=' .repeat(50));
  
  try {
    const response = await axios.get(`${BASE_URL}/api/enhanced-ai-categorization/health`, { headers });
    console.log('✅ AI Service Status:', response.data);
    return response.data.result.status === 'healthy';
  } catch (error) {
    console.error('❌ System health check failed:', error.message);
    return false;
  }
}

async function testCostEstimation() {
  console.log('\n💰 TESTING COST ESTIMATION');
  console.log('=' .repeat(50));
  
  try {
    const response = await axios.get(`${BASE_URL}/api/enhanced-ai-categorization/cost-estimate`, {
      headers,
      params: {
        transactionCount: MOCK_TRANSACTIONS.length,
        mode: 'economy'
      }
    });
    
    console.log('✅ Cost Estimation Results:');
    console.log(`   📊 Transactions: ${response.data.result.transactionCount}`);
    console.log(`   💵 Estimated Cost: $${response.data.result.estimatedCost.toFixed(4)}`);
    console.log(`   🎯 Mode: ${response.data.result.mode}`);
    console.log(`   ⚡ Tokens per Transaction: ${response.data.result.costBreakdown.tokensPerTransaction}`);
    console.log(`   💾 Potential Cache Savings: ${response.data.result.savings.estimatedSavings.toFixed(4)}`);
    
    return true;
  } catch (error) {
    console.error('❌ Cost estimation failed:', error.response?.data || error.message);
    return false;
  }
}

async function testBulkCategorization() {
  console.log('\n🧠 TESTING BULK AI CATEGORIZATION');
  console.log('=' .repeat(50));
  
  try {
    const requestData = {
      transactions: MOCK_TRANSACTIONS,
      config: {
        mode: 'economy',
        batchSize: 25,
        maxTokens: 128,
        useCache: true,
        fallbackToGPT4: false
      },
      userContext: {
        businessType: 'SOLE_TRADER',
        countryCode: 'AU',
        customCategories: ['Software', 'Vehicle', 'Office Equipment']
      }
    };
    
    console.log(`📤 Sending ${MOCK_TRANSACTIONS.length} transactions for bulk processing...`);
    
    const response = await axios.post(
      `${BASE_URL}/api/enhanced-ai-categorization/bulk`,
      requestData,
      { headers }
    );
    
    if (response.data.success) {
      const result = response.data.result;
      const metadata = result.metadata;
      
      console.log('✅ Bulk Categorization Successful!');
      console.log(`   📊 Processed: ${metadata.totalProcessed} transactions`);
      console.log(`   ⏱️  Processing Time: ${metadata.processingTime}ms`);
      console.log(`   🎯 Tokens Used: ${metadata.tokensUsed}`);
      console.log(`   💵 Cost: $${metadata.costEstimate.toFixed(4)}`);
      console.log(`   💾 Cache Hit Rate: ${metadata.cacheHitRate.toFixed(1)}%`);
      console.log(`   🤖 Model: ${metadata.model}`);
      
      console.log('\n📋 Sample Categorization Results:');
      result.categorizations.slice(0, 3).forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.cat} (${(cat.conf * 100).toFixed(1)}% confidence)`);
        console.log(`      Tax Deductible: ${cat.tax_d ? 'Yes' : 'No'} (${cat.bus_pct || 0}%)`);
      });
      
      if (metadata.recommendations && metadata.recommendations.length > 0) {
        console.log('\n💡 Optimization Recommendations:');
        metadata.recommendations.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`);
        });
      }
      
      return true;
    } else {
      console.error('❌ Bulk categorization failed:', response.data.error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Bulk categorization error:', error.response?.data || error.message);
    return false;
  }
}

async function testTaxAnalysis() {
  console.log('\n💰 TESTING TAX DEDUCTIBILITY ANALYSIS');
  console.log('=' .repeat(50));
  
  try {
    const requestData = {
      transactions: MOCK_TRANSACTIONS,
      userContext: {
        businessType: 'SOLE_TRADER',
        countryCode: 'AU',
        taxRate: 30
      }
    };
    
    console.log(`📤 Analyzing ${MOCK_TRANSACTIONS.length} transactions for tax deductibility...`);
    
    const response = await axios.post(
      `${BASE_URL}/api/enhanced-ai-categorization/tax-analysis`,
      requestData,
      { headers }
    );
    
    if (response.data.success) {
      const result = response.data.result;
      const metadata = result.metadata;
      const insights = result.insights;
      
      console.log('✅ Tax Analysis Successful!');
      console.log(`   📊 Total Transactions: ${metadata.totalTransactions}`);
      console.log(`   ✅ Deductible Count: ${metadata.deductibleCount}`);
      console.log(`   💵 Potential Savings: $${metadata.potentialSavings.toFixed(2)}`);
      console.log(`   ⚠️  Compliance Risk: ${metadata.complianceRisk.toUpperCase()}`);
      console.log(`   📈 Deductible Percentage: ${insights.deductiblePercentage.toFixed(1)}%`);
      
      console.log('\n📋 Tax Analysis Results:');
      result.taxAnalysis.slice(0, 3).forEach((analysis, index) => {
        const tx = MOCK_TRANSACTIONS[index];
        console.log(`   ${index + 1}. ${tx.description}`);
        console.log(`      Deductible: ${analysis.deductible ? 'Yes' : 'No'} (${analysis.percentage}%)`);
        console.log(`      Reasoning: ${analysis.reasoning}`);
      });
      
      if (insights.recommendations && insights.recommendations.length > 0) {
        console.log('\n💡 Tax Recommendations:');
        insights.recommendations.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`);
        });
      }
      
      if (insights.topCategories && insights.topCategories.length > 0) {
        console.log('\n🏆 Top Deductible Categories:');
        insights.topCategories.forEach((cat, index) => {
          console.log(`   ${index + 1}. ${cat.category}: ${cat.count} items ($${cat.amount.toFixed(2)})`);
        });
      }
      
      return true;
    } else {
      console.error('❌ Tax analysis failed:', response.data.error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Tax analysis error:', error.response?.data || error.message);
    return false;
  }
}

async function runComprehensiveTest() {
  console.log('🚀 ENHANCED AI SYSTEM - COMPREHENSIVE TEST SUITE');
  console.log('🌍 embracingearth.space - AI-powered financial intelligence');
  console.log('=' .repeat(70));
  
  const testResults = {
    systemStatus: false,
    costEstimation: false,
    bulkCategorization: false,
    taxAnalysis: false
  };
  
  // Run all tests
  testResults.systemStatus = await testSystemStatus();
  
  if (testResults.systemStatus) {
    testResults.costEstimation = await testCostEstimation();
    testResults.bulkCategorization = await testBulkCategorization();
    testResults.taxAnalysis = await testTaxAnalysis();
  } else {
    console.log('\n❌ System not healthy - skipping other tests');
  }
  
  // Final summary
  console.log('\n📊 TEST SUMMARY');
  console.log('=' .repeat(50));
  
  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  
  Object.entries(testResults).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log(`\n🎯 Overall Score: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Enhanced AI system is fully operational.');
  } else {
    console.log('⚠️  Some tests failed. Check server logs and API configuration.');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Ensure OpenAI API key is configured');
  console.log('   2. Start the AI2 core app server on port 3001');
  console.log('   3. Test the frontend AI categorization buttons');
  console.log('   4. Monitor cost optimization and cache performance');
  
  return passedTests === totalTests;
}

// Run the test suite
if (require.main === module) {
  runComprehensiveTest()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = {
  runComprehensiveTest,
  testSystemStatus,
  testCostEstimation,
  testBulkCategorization,
  testTaxAnalysis
}; 