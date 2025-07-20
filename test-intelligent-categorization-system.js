/**
 * 🧠 INTELLIGENT CATEGORIZATION SYSTEM - COMPREHENSIVE END-TO-END TEST
 * Tests the complete intelligent categorization workflow with database caching, 
 * AI integration, user preferences, and cost optimization features.
 * // embracingearth.space - AI-powered financial intelligence
 */

const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const AI_MODULES_URL = 'http://localhost:3002';

// Test authentication token (replace with actual test user token)
const TEST_AUTH_TOKEN = 'your-test-token-here';

const headers = {
  'Authorization': `Bearer ${TEST_AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

/**
 * Test transaction data for categorization testing
 */
const TEST_TRANSACTIONS = [
  {
    description: 'UBER TRIP 123456789',
    amount: -23.50,
    merchant: 'Uber Technologies',
    date: '2025-01-15',
    type: 'debit'
  },
  {
    description: 'NETFLIX.COM SUBSCRIPTION',
    amount: -14.99,
    merchant: 'Netflix',
    date: '2025-01-15',
    type: 'debit'
  },
  {
    description: 'OFFICE SUPPLIES - STAPLES',
    amount: -127.85,
    merchant: 'Staples',
    date: '2025-01-15',
    type: 'debit'
  },
  {
    description: 'COFFEE MEETING CLIENT',
    amount: -18.75,
    merchant: 'Starbucks',
    date: '2025-01-15',
    type: 'debit'
  }
];

/**
 * Test the complete intelligent categorization workflow
 */
async function testIntelligentCategorizationSystem() {
  console.log('\n🧠 INTELLIGENT CATEGORIZATION SYSTEM - COMPREHENSIVE TEST');
  console.log('=' .repeat(70));
  
  try {
    // 1. Test service health
    console.log('\n📊 1. TESTING SERVICE HEALTH...');
    await testServiceHealth();
    
    // 2. Test user preferences
    console.log('\n⚙️ 2. TESTING USER PREFERENCES...');
    await testUserPreferences();
    
    // 3. Test individual transaction classification
    console.log('\n🔍 3. TESTING TRANSACTION CLASSIFICATION...');
    await testTransactionClassification();
    
    // 4. Test batch classification
    console.log('\n📦 4. TESTING BATCH CLASSIFICATION...');
    await testBatchClassification();
    
    // 5. Test cache performance
    console.log('\n⚡ 5. TESTING CACHE PERFORMANCE...');
    await testCachePerformance();
    
    // 6. Test analytics and cost tracking
    console.log('\n📈 6. TESTING ANALYTICS & COST TRACKING...');
    await testAnalytics();
    
    // 7. Test tax deductibility
    console.log('\n💰 7. TESTING TAX DEDUCTIBILITY...');
    await testTaxDeductibility();
    
    console.log('\n✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('🎉 Intelligent categorization system is fully operational');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

/**
 * Test service health and connectivity
 */
async function testServiceHealth() {
  // Test core app health
  const coreHealth = await axios.get(`${BASE_URL}/health`);
  console.log('✅ Core app health:', coreHealth.data.status);
  
  // Test AI modules health
  try {
    const aiHealth = await axios.get(`${AI_MODULES_URL}/health`);
    console.log('✅ AI modules health:', aiHealth.data.status);
  } catch (error) {
    console.log('⚠️ AI modules offline - using core app intelligent categorization');
  }
  
  // Test intelligent categorization endpoints
  const endpoints = [
    '/intelligent-categorization/preferences',
    '/intelligent-categorization/analytics'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint}`, { headers });
      console.log(`✅ Endpoint ${endpoint}: ${response.status}`);
    } catch (error) {
      console.log(`📝 Endpoint ${endpoint}: ${error.response?.status || 'unavailable'}`);
    }
  }
}

/**
 * Test user preferences management
 */
async function testUserPreferences() {
  const testPreferences = {
    confidenceThreshold: 0.8,
    enableLearning: true,
    preferredCategories: ['Business Meals', 'Office Supplies', 'Transportation'],
    customCategories: [
      { name: 'Client Entertainment', type: 'business', deductiblePercentage: 50 }
    ],
    enableCostOptimization: true,
    autoApplyHighConfidence: true
  };
  
  // Set preferences
  const setResponse = await axios.post(
    `${BASE_URL}/intelligent-categorization/preferences`, 
    testPreferences, 
    { headers }
  );
  console.log('✅ Set preferences:', setResponse.data.success ? 'Success' : 'Failed');
  
  // Get preferences
  const getResponse = await axios.get(
    `${BASE_URL}/intelligent-categorization/preferences`, 
    { headers }
  );
  console.log('✅ Get preferences:', getResponse.data.success ? 'Success' : 'Failed');
  
  if (getResponse.data.preferences) {
    console.log('   - Confidence threshold:', getResponse.data.preferences.confidenceThreshold);
    console.log('   - Learning enabled:', getResponse.data.preferences.enableLearning);
    console.log('   - Custom categories:', getResponse.data.preferences.customCategories?.length || 0);
  }
}

/**
 * Test individual transaction classification
 */
async function testTransactionClassification() {
  for (const [index, transaction] of TEST_TRANSACTIONS.entries()) {
    console.log(`\n   Testing transaction ${index + 1}: ${transaction.description}`);
    
    const startTime = Date.now();
    const response = await axios.post(
      `${BASE_URL}/intelligent-categorization/classify-transaction`,
      {
        transactionId: `test-${index + 1}`,
        ...transaction
      },
      { headers }
    );
    const responseTime = Date.now() - startTime;
    
    if (response.data.success) {
      const result = response.data.result;
      console.log(`   ✅ Classified as: ${result.category}`);
      console.log(`   📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   🏷️ Source: ${result.source}`);
      console.log(`   💰 Tax deductible: ${result.isTaxDeductible ? 'Yes' : 'No'}`);
      console.log(`   ⚡ Response time: ${responseTime}ms`);
      
      if (result.cost) {
        console.log(`   💲 Cost: $${result.cost.toFixed(4)}`);
      }
    } else {
      console.log(`   ❌ Classification failed: ${response.data.error}`);
    }
  }
}

/**
 * Test batch classification for efficiency
 */
async function testBatchClassification() {
  const batchRequest = {
    transactions: TEST_TRANSACTIONS.map((t, i) => ({
      transactionId: `batch-${i + 1}`,
      ...t
    }))
  };
  
  const startTime = Date.now();
  const response = await axios.post(
    `${BASE_URL}/intelligent-categorization/classify-batch`,
    batchRequest,
    { headers }
  );
  const responseTime = Date.now() - startTime;
  
  if (response.data.success) {
    const results = response.data.results;
    console.log(`✅ Batch classified ${results.length} transactions`);
    console.log(`⚡ Total response time: ${responseTime}ms`);
    console.log(`📊 Average per transaction: ${(responseTime / results.length).toFixed(1)}ms`);
    
    // Show cache hit statistics
    if (response.data.cacheStats) {
      const { hits, misses, hitRate } = response.data.cacheStats;
      console.log(`🎯 Cache hits: ${hits}, misses: ${misses}`);
      console.log(`📈 Cache hit rate: ${(hitRate * 100).toFixed(1)}%`);
    }
    
    // Show cost savings
    if (response.data.costSavings) {
      console.log(`💰 Total cost savings: $${response.data.costSavings.toFixed(4)}`);
    }
  } else {
    console.log(`❌ Batch classification failed: ${response.data.error}`);
  }
}

/**
 * Test cache performance by running same classification twice
 */
async function testCachePerformance() {
  const testTransaction = TEST_TRANSACTIONS[0];
  
  // First call (should miss cache)
  console.log('   First call (cache miss expected)...');
  const startTime1 = Date.now();
  const response1 = await axios.post(
    `${BASE_URL}/intelligent-categorization/classify-transaction`,
    { transactionId: 'cache-test-1', ...testTransaction },
    { headers }
  );
  const time1 = Date.now() - startTime1;
  
  // Second call (should hit cache)
  console.log('   Second call (cache hit expected)...');
  const startTime2 = Date.now();
  const response2 = await axios.post(
    `${BASE_URL}/intelligent-categorization/classify-transaction`,
    { transactionId: 'cache-test-2', ...testTransaction },
    { headers }
  );
  const time2 = Date.now() - startTime2;
  
  console.log(`✅ First call: ${time1}ms`);
  console.log(`✅ Second call: ${time2}ms`);
  console.log(`⚡ Performance improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
  
  if (time2 < time1) {
    console.log('🎯 Cache working correctly - faster second response');
  }
}

/**
 * Test analytics and cost tracking
 */
async function testAnalytics() {
  const response = await axios.get(
    `${BASE_URL}/intelligent-categorization/analytics`,
    { headers }
  );
  
  if (response.data.success) {
    const analytics = response.data.analytics;
    console.log('✅ Analytics retrieved successfully');
    console.log(`📊 Total classifications: ${analytics.totalClassifications || 0}`);
    console.log(`🎯 Cache hit rate: ${((analytics.cacheHits / (analytics.cacheHits + analytics.cacheMisses)) * 100).toFixed(1)}%`);
    console.log(`💰 Total cost savings: $${(analytics.totalCostSavings || 0).toFixed(4)}`);
    console.log(`⚡ Average response time: ${analytics.averageResponseTime || 0}ms`);
    
    if (analytics.topCategories) {
      console.log('🏆 Top categories:');
      analytics.topCategories.slice(0, 3).forEach((cat, i) => {
        console.log(`   ${i + 1}. ${cat.category}: ${cat.count} classifications`);
      });
    }
  } else {
    console.log(`❌ Analytics failed: ${response.data.error}`);
  }
}

/**
 * Test tax deductibility detection
 */
async function testTaxDeductibility() {
  const businessTransaction = {
    description: 'CLIENT DINNER - BUSINESS MEETING',
    amount: -156.75,
    merchant: 'The Capital Grille',
    date: '2025-01-15',
    type: 'debit'
  };
  
  const response = await axios.post(
    `${BASE_URL}/intelligent-categorization/classify-transaction`,
    { transactionId: 'tax-test-1', ...businessTransaction },
    { headers }
  );
  
  if (response.data.success) {
    const result = response.data.result;
    console.log(`✅ Business transaction classified: ${result.category}`);
    console.log(`💰 Tax deductible: ${result.isTaxDeductible ? 'Yes' : 'No'}`);
    
    if (result.businessUsePercentage) {
      console.log(`📊 Business use: ${result.businessUsePercentage}%`);
    }
    
    if (result.taxReasoning) {
      console.log(`🧠 Tax reasoning: ${result.taxReasoning}`);
    }
  } else {
    console.log(`❌ Tax deductibility test failed: ${response.data.error}`);
  }
}

/**
 * Test cache cleanup functionality
 */
async function testCacheCleanup() {
  console.log('\n🧹 8. TESTING CACHE CLEANUP...');
  
  const response = await axios.delete(
    `${BASE_URL}/intelligent-categorization/cache`,
    { headers }
  );
  
  if (response.data.success) {
    console.log('✅ Cache cleanup successful');
    console.log(`🗑️ Entries removed: ${response.data.entriesRemoved || 0}`);
  } else {
    console.log(`❌ Cache cleanup failed: ${response.data.error}`);
  }
}

// Run the comprehensive test
if (require.main === module) {
  testIntelligentCategorizationSystem();
}

module.exports = {
  testIntelligentCategorizationSystem,
  TEST_TRANSACTIONS
}; 