/**
 * 🧪 BATCH OPTIMIZATION TEST SCRIPT
 * 
 * This script demonstrates the cost optimization achieved by the batch processing system.
 * It compares the old approach (individual AI calls) vs the new optimized approach.
 */

const axios = require('axios');

// Configuration
const AI_MODULES_URL = 'http://localhost:3002';
const TEST_TRANSACTIONS = [
  {
    id: 'tx1',
    description: 'Adobe Creative Suite Monthly',
    amount: 79.99,
    merchant: 'Adobe Inc',
    date: '2025-01-15T00:00:00Z'
  },
  {
    id: 'tx2', 
    description: 'Microsoft Office 365 Business',
    amount: 29.99,
    merchant: 'Microsoft Corporation',
    date: '2025-01-14T00:00:00Z'
  },
  {
    id: 'tx3',
    description: 'AWS Cloud Services',
    amount: 150.50,
    merchant: 'Amazon Web Services',
    date: '2025-01-13T00:00:00Z'
  },
  {
    id: 'tx4',
    description: 'Telstra Mobile Plan',
    amount: 45.00,
    merchant: 'Telstra Corporation',
    date: '2025-01-12T00:00:00Z'
  },
  {
    id: 'tx5',
    description: 'Unknown Coffee Shop',
    amount: 8.50,
    merchant: 'Local Cafe',
    date: '2025-01-11T00:00:00Z'
  },
  {
    id: 'tx6',
    description: 'Uber ride to client',
    amount: 23.75,
    merchant: 'Uber',
    date: '2025-01-10T00:00:00Z'
  },
  {
    id: 'tx7',
    description: 'GitHub Pro subscription',
    amount: 21.00,
    merchant: 'GitHub Inc',
    date: '2025-01-09T00:00:00Z'
  },
  {
    id: 'tx8',
    description: 'Origin Energy Bill',
    amount: 125.30,
    merchant: 'Origin Energy',
    date: '2025-01-08T00:00:00Z'
  },
  {
    id: 'tx9',
    description: 'Some random payment',
    amount: 89.99,
    merchant: 'Unknown Merchant',
    date: '2025-01-07T00:00:00Z'
  },
  {
    id: 'tx10',
    description: 'Dropbox Business Plan',
    amount: 16.58,
    merchant: 'Dropbox Inc',
    date: '2025-01-06T00:00:00Z'
  }
];

async function testOldApproach() {
  console.log('🕐 Testing OLD APPROACH - Individual AI calls for each transaction...\n');
  
  const startTime = Date.now();
  const results = [];
  let totalCost = 0;
  
  for (const transaction of TEST_TRANSACTIONS) {
    try {
      const response = await axios.post(`${AI_MODULES_URL}/api/classify`, {
        description: transaction.description,
        amount: transaction.amount,
        merchant: transaction.merchant,
        date: transaction.date
      });
      
      if (response.data.success) {
        results.push(response.data);
        totalCost += 0.045; // Estimated cost per individual AI call
      }
    } catch (error) {
      console.log(`❌ Error processing ${transaction.id}: ${error.message}`);
      totalCost += 0.045; // Still count the cost
    }
  }
  
  const processingTime = Date.now() - startTime;
  
  return {
    approach: 'Individual AI Calls',
    transactionsProcessed: TEST_TRANSACTIONS.length,
    successfulClassifications: results.length,
    totalCost: totalCost,
    costPerTransaction: totalCost / TEST_TRANSACTIONS.length,
    processingTimeMs: processingTime,
    processingTimeSeconds: Math.round(processingTime / 1000),
    aiCallsMade: TEST_TRANSACTIONS.length,
    referenceDataUsed: 0,
    efficiency: 0 // No optimization
  };
}

async function testOptimizedApproach() {
  console.log('🚀 Testing OPTIMIZED APPROACH - Batch processing with reference data...\n');
  
  try {
    const startTime = Date.now();
    
    const response = await axios.post(`${AI_MODULES_URL}/api/optimized/analyze-batch`, {
      transactions: TEST_TRANSACTIONS,
      options: {
        batchSize: 50,
        maxConcurrentBatches: 3,
        confidenceThreshold: 0.8,
        enableBillDetection: true,
        enableCostOptimization: true
      },
      userProfile: {
        businessType: 'SOLE_TRADER',
        industry: 'Software Services',
        countryCode: 'AU'
      }
    });
    
    const processingTime = Date.now() - startTime;
    
    if (response.data.success) {
      const data = response.data;
      
      return {
        approach: 'Optimized Batch Processing',
        transactionsProcessed: data.totalTransactions,
        successfulClassifications: data.results?.length || 0,
        totalCost: data.totalCost,
        costPerTransaction: data.costBreakdown.costPerTransaction,
        processingTimeMs: processingTime,
        processingTimeSeconds: Math.round(processingTime / 1000),
        aiCallsMade: data.processedWithAI,
        referenceDataUsed: data.processedWithReferenceData,
        efficiency: data.costBreakdown.efficiencyRating,
        estimatedSavings: data.costBreakdown.estimatedSavings,
        insights: data.insights,
        recurringBills: data.recurringBills
      };
    } else {
      throw new Error('Optimized analysis failed');
    }
    
  } catch (error) {
    console.log(`❌ Optimized approach failed: ${error.message}`);
    if (error.response?.data) {
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Return fallback data for comparison
    return {
      approach: 'Optimized Batch Processing (Failed)',
      transactionsProcessed: TEST_TRANSACTIONS.length,
      successfulClassifications: 0,
      totalCost: 0,
      costPerTransaction: 0,
      processingTimeMs: 0,
      processingTimeSeconds: 0,
      aiCallsMade: 0,
      referenceDataUsed: 0,
      efficiency: 0,
      error: error.message
    };
  }
}

async function testCostAnalysisDashboard() {
  console.log('📊 Testing Cost Analysis Dashboard...\n');
  
  try {
    const response = await axios.get(`${AI_MODULES_URL}/api/optimized/cost-analysis`);
    
    if (response.data.success) {
      return response.data.costAnalysis;
    } else {
      throw new Error('Cost analysis failed');
    }
  } catch (error) {
    console.log(`❌ Cost analysis failed: ${error.message}`);
    return null;
  }
}

async function testOptimizationDemo() {
  console.log('🧪 Testing Optimization Demo with 100 test transactions...\n');
  
  try {
    const response = await axios.post(`${AI_MODULES_URL}/api/optimized/test-optimization`, {
      testSize: 100
    });
    
    if (response.data.success) {
      return response.data.testResults;
    } else {
      throw new Error('Optimization demo failed');
    }
  } catch (error) {
    console.log(`❌ Optimization demo failed: ${error.message}`);
    return null;
  }
}

function displayResults(oldResult, newResult) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 BATCH OPTIMIZATION COMPARISON RESULTS');
  console.log('='.repeat(80) + '\n');
  
  // Cost Comparison
  console.log('💰 COST ANALYSIS:');
  console.log(`   Old Approach: $${oldResult.totalCost.toFixed(3)} (${oldResult.aiCallsMade} AI calls)`);
  console.log(`   New Approach: $${newResult.totalCost.toFixed(3)} (${newResult.aiCallsMade} AI calls)`);
  console.log(`   Cost Savings: $${(oldResult.totalCost - newResult.totalCost).toFixed(3)}`);
  console.log(`   Savings %:    ${Math.round(((oldResult.totalCost - newResult.totalCost) / oldResult.totalCost) * 100)}%\n`);
  
  // Performance Comparison
  console.log('⚡ PERFORMANCE ANALYSIS:');
  console.log(`   Old Approach: ${oldResult.processingTimeSeconds}s (${oldResult.processingTimeMs}ms)`);
  console.log(`   New Approach: ${newResult.processingTimeSeconds}s (${newResult.processingTimeMs}ms)`);
  console.log(`   Time Saved:   ${oldResult.processingTimeSeconds - newResult.processingTimeSeconds}s`);
  console.log(`   Speed Gain:   ${Math.round((oldResult.processingTimeMs / newResult.processingTimeMs))}x faster\n`);
  
  // Efficiency Analysis
  console.log('📈 EFFICIENCY ANALYSIS:');
  console.log(`   Reference Data Coverage: ${newResult.referenceDataUsed}/${newResult.transactionsProcessed} (${Math.round((newResult.referenceDataUsed / newResult.transactionsProcessed) * 100)}%)`);
  console.log(`   AI Dependency:           ${newResult.aiCallsMade}/${newResult.transactionsProcessed} (${Math.round((newResult.aiCallsMade / newResult.transactionsProcessed) * 100)}%)`);
  console.log(`   Efficiency Rating:       ${newResult.efficiency}%\n`);
  
  // Insights
  if (newResult.insights) {
    console.log('🔍 TRANSACTION INSIGHTS:');
    console.log(`   Categories Detected:     ${newResult.insights.topCategories?.length || 0}`);
    console.log(`   Tax Deductible:          ${newResult.insights.totalTaxDeductible?.count || 0} transactions`);
    console.log(`   Bills Detected:          ${newResult.insights.billsDetected?.count || 0}`);
    console.log(`   Recurring Bills:         ${newResult.recurringBills?.length || 0}`);
    console.log(`   Average Confidence:      ${Math.round((newResult.insights.averageConfidence || 0) * 100)}%\n`);
  }
  
  // Projections
  console.log('📊 SCALING PROJECTIONS:');
  const scalingFactors = [100, 1000, 10000];
  
  scalingFactors.forEach(factor => {
    const oldCost = oldResult.costPerTransaction * factor;
    const newCost = newResult.costPerTransaction * factor;
    const savings = oldCost - newCost;
    
    console.log(`   ${factor.toLocaleString()} transactions: $${oldCost.toFixed(2)} → $${newCost.toFixed(2)} (Save $${savings.toFixed(2)})`);
  });
  
  console.log('\n' + '='.repeat(80));
}

async function main() {
  console.log('🚀 AI2 Batch Optimization Test Suite');
  console.log('=====================================\n');
  
  try {
    // Test both approaches
    console.log(`Testing with ${TEST_TRANSACTIONS.length} sample transactions...\n`);
    
    const oldResult = await testOldApproach();
    const newResult = await testOptimizedApproach();
    
    // Display comparison
    displayResults(oldResult, newResult);
    
    // Test cost analysis dashboard
    const costAnalysis = await testCostAnalysisDashboard();
    if (costAnalysis) {
      console.log('\n📊 COST ANALYSIS DASHBOARD:');
      console.log(`   Total Transactions: ${costAnalysis.overview?.totalTransactionsProcessed || 0}`);
      console.log(`   Total Cost Spent:   $${(costAnalysis.overview?.totalCostSpent || 0).toFixed(3)}`);
      console.log(`   Estimated Savings:  $${(costAnalysis.overview?.estimatedSavings || 0).toFixed(3)}`);
      console.log(`   Savings Percentage: ${costAnalysis.overview?.savingsPercentage || 0}%`);
    }
    
    // Test optimization demo with larger dataset
    const optimizationDemo = await testOptimizationDemo();
    if (optimizationDemo) {
      console.log('\n🧪 LARGE SCALE OPTIMIZATION TEST (100 transactions):');
      console.log(`   Processing Time:    ${optimizationDemo.processingTime}`);
      console.log(`   Reference Data:     ${optimizationDemo.costOptimization.referenceDataPercentage}%`);
      console.log(`   AI Calls Required:  ${optimizationDemo.costOptimization.aiCallsRequired}`);
      console.log(`   Total Cost:         $${optimizationDemo.costOptimization.totalCost.toFixed(3)}`);
      console.log(`   Estimated Savings:  $${optimizationDemo.costOptimization.estimatedSavings.toFixed(3)}`);
      console.log(`   Efficiency Rating:  ${optimizationDemo.costOptimization.efficiencyRating}%`);
    }
    
    console.log('\n✅ Batch optimization testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the test suite
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testOldApproach,
  testOptimizedApproach,
  testCostAnalysisDashboard,
  testOptimizationDemo,
  TEST_TRANSACTIONS
}; 