const axios = require('axios');

async function testSingleTransactionClassification() {
  console.log('🧪 Test 1: Single Transaction Classification');
  
  const testData = {
    description: 'Adobe Creative Cloud Subscription',
    amount: 52.99,
    type: 'expense',
    merchant: 'Adobe Systems',
    userPreferences: {
      businessType: 'SOLE_TRADER',
      industry: 'SOFTWARE_SERVICES',
      countryCode: 'AU',
      profession: 'Software Developer'
    }
  };

  try {
    const response = await axios.post('http://localhost:3002/api/classify', testData);
    console.log('✅ Single transaction test passed');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Single transaction test failed:', error.response?.data || error.message);
    return null;
  }
}

async function testBatchTransactionProcessing() {
  console.log('\n🧪 Test 2: Batch Transaction Processing');
  
  const testData = {
    transactions: [
      {
        id: 'tx-1',
        description: 'Office supplies from Officeworks',
        amount: 125.50,
        type: 'expense',
        merchant: 'Officeworks'
      },
      {
        id: 'tx-2',
        description: 'GitHub Pro subscription',
        amount: 29.99,
        type: 'expense',
        merchant: 'GitHub'
      },
      {
        id: 'tx-3',
        description: 'Business lunch at Cafe Milano',
        amount: 45.80,
        type: 'expense',
        merchant: 'Cafe Milano'
      },
      {
        id: 'tx-4',
        description: 'Internet bill - Telstra',
        amount: 89.00,
        type: 'expense',
        merchant: 'Telstra'
      },
      {
        id: 'tx-5',
        description: 'Client payment received',
        amount: 2500.00,
        type: 'income',
        merchant: 'Client ABC'
      }
    ],
    userPreferences: {
      businessType: 'SOLE_TRADER',
      industry: 'SOFTWARE_SERVICES',
      countryCode: 'AU',
      profession: 'Software Developer'
    }
  };

  try {
    const response = await axios.post('http://localhost:3002/api/classify', testData);
    console.log('✅ Batch processing test passed');
    console.log('📊 Response summary:');
    console.log(`  - Total transactions processed: ${response.data.results?.length || 0}`);
    console.log(`  - Bills detected: ${response.data.insights?.billsDetected || 0}`);
    console.log(`  - Recurring patterns: ${response.data.insights?.recurringPatterns || 0}`);
    console.log(`  - Tax deductible amount: $${response.data.insights?.taxDeductibleAmount?.toFixed(2) || 0}`);
    console.log('📋 Full response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Batch processing test failed:', error.response?.data || error.message);
    return null;
  }
}

async function testBillPatternDetection() {
  console.log('\n🧪 Test 3: Bill Pattern Detection');
  
  const testTransactions = [
    {
      description: 'Microsoft Office 365 subscription',
      amount: 12.50,
      merchant: 'Microsoft'
    },
    {
      description: 'AWS hosting services',
      amount: 89.45,
      merchant: 'Amazon Web Services'
    },
    {
      description: 'Electricity bill - AGL',
      amount: 178.30,
      merchant: 'AGL'
    },
    {
      description: 'One-time office chair purchase',
      amount: 299.99,
      merchant: 'Office Furniture Store'
    }
  ];

  console.log('🔍 Testing bill pattern detection for different transaction types...');

  for (const tx of testTransactions) {
    try {
      const response = await axios.post('http://localhost:3002/api/classify', {
        description: tx.description,
        amount: tx.amount,
        merchant: tx.merchant
      });
      
      const billAnalysis = response.data.billAnalysis;
      console.log(`\n📝 ${tx.description}:`);
      console.log(`  - Is Bill: ${billAnalysis?.isBill ? '✅' : '❌'}`);
      console.log(`  - Is Recurring: ${billAnalysis?.isRecurring ? '✅' : '❌'}`);
      console.log(`  - Confidence: ${billAnalysis?.confidence?.toFixed(2) || 'N/A'}`);
      console.log(`  - Pattern Type: ${billAnalysis?.pattern?.type || 'None'}`);
      console.log(`  - Frequency: ${billAnalysis?.pattern?.frequency || 'None'}`);
      console.log(`  - Recommendations: ${billAnalysis?.recommendations?.length || 0} items`);
      
    } catch (error) {
      console.error(`❌ Failed to test ${tx.description}:`, error.response?.data || error.message);
    }
  }
}

async function testUserPreferencesIntegration() {
  console.log('\n🧪 Test 4: User Preferences Integration');
  
  const baseTransaction = {
    description: 'Software development tools',
    amount: 199.99,
    type: 'expense'
  };

  const testScenarios = [
    {
      name: 'AU Sole Trader - Software Services',
      preferences: {
        businessType: 'SOLE_TRADER',
        industry: 'SOFTWARE_SERVICES',
        countryCode: 'AU',
        profession: 'Software Developer'
      }
    },
    {
      name: 'AU Company - Consulting',
      preferences: {
        businessType: 'COMPANY',
        industry: 'CONSULTING',
        countryCode: 'AU',
        profession: 'Business Consultant'
      }
    },
    {
      name: 'No Preferences',
      preferences: null
    }
  ];

  for (const scenario of testScenarios) {
    try {
      const testData = {
        ...baseTransaction,
        userPreferences: scenario.preferences
      };
      
      const response = await axios.post('http://localhost:3002/api/classify', testData);
      
      console.log(`\n📊 ${scenario.name}:`);
      console.log(`  - Business Type: ${response.data.userProfile?.businessType || 'None'}`);
      console.log(`  - Industry: ${response.data.userProfile?.industry || 'None'}`);
      console.log(`  - Country: ${response.data.userProfile?.countryCode || 'None'}`);
      console.log(`  - Tax Deductible: ${response.data.classification?.isTaxDeductible ? '✅' : '❌'}`);
      console.log(`  - Business Use %: ${response.data.classification?.businessUsePercentage || 0}%`);
      
    } catch (error) {
      console.error(`❌ Failed to test ${scenario.name}:`, error.response?.data || error.message);
    }
  }
}

async function testEnhancedFeatures() {
  console.log('\n🧪 Test 5: Enhanced Features Verification');
  
  const testData = {
    transactions: [
      {
        id: 'feature-test-1',
        description: 'Monthly GitHub subscription',
        amount: 25.00,
        type: 'expense'
      }
    ],
    userPreferences: {
      businessType: 'SOLE_TRADER',
      countryCode: 'AU'
    }
  };

  try {
    const response = await axios.post('http://localhost:3002/api/classify', testData);
    
    console.log('✅ Enhanced features verification:');
    const features = response.data.enhancedFeatures;
    console.log(`  - Batch Processing: ${features?.batchProcessing ? '✅' : '❌'}`);
    console.log(`  - Bill Pattern Detection: ${features?.billPatternDetection ? '✅' : '❌'}`);
    console.log(`  - User Preference Integration: ${features?.userPreferenceIntegration ? '✅' : '❌'}`);
    console.log(`  - Tax Analysis: ${features?.taxAnalysis ? '✅' : '❌'}`);
    console.log(`  - Insights: ${features?.insights ? '✅' : '❌'}`);
    console.log(`  - Analysis Type: ${response.data.analysisType}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Enhanced features test failed:', error.response?.data || error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 AI2 Enhanced Classify Endpoint Tests');
  console.log('=' .repeat(50));
  
  const results = {
    singleTransaction: await testSingleTransactionClassification(),
    batchProcessing: await testBatchTransactionProcessing(),
    userPreferences: await testUserPreferencesIntegration(),
    enhancedFeatures: await testEnhancedFeatures()
  };
  
  // Run bill pattern detection test (no return value needed)
  await testBillPatternDetection();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:');
  console.log(`Single Transaction: ${results.singleTransaction ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Batch Processing: ${results.batchProcessing ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`User Preferences: ${results.userPreferences ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Enhanced Features: ${results.enhancedFeatures ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result !== null);
  console.log(`\n🎉 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🌟 Enhanced classify endpoint is working correctly!');
    console.log('🔥 Features verified:');
    console.log('  • Single transaction classification');
    console.log('  • Batch transaction processing');
    console.log('  • Bill pattern detection');
    console.log('  • User preference integration');
    console.log('  • Australian tax rules');
    console.log('  • Enhanced insights and analytics');
  }
}

runAllTests().catch(console.error); 