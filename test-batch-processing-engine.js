const axios = require('axios');

async function testBatchProcessingEngine() {
  console.log('🚀 Testing BatchProcessingEngine Route...\n');
  
  try {
    // Test the optimized batch endpoint
    const testTransactions = [
      {
        id: 'tx-1',
        description: 'Gas Station Purchase',
        amount: -45.20,
        merchant: 'Shell Station',
        date: new Date().toISOString(),
        type: 'debit'
      },
      {
        id: 'tx-2', 
        description: 'Restaurant Dinner',
        amount: -85.50,
        merchant: 'Italian Bistro',
        date: new Date().toISOString(),
        type: 'debit'
      }
    ];

    const payload = {
      transactions: testTransactions,
      selectedCategories: ['Food & Dining', 'Business Expenses', 'Travel', 'Utilities'],
      options: {
        enableCategorization: true,
        batchSize: 20,
        confidenceThreshold: 0.8
      },
      userProfile: {
        businessType: 'SOLE_TRADER',
        industry: 'Software Services',
        countryCode: 'AU'
      }
    };

    console.log('📤 Testing BatchProcessingEngine route...');
    const response = await axios.post('http://localhost:3002/api/optimized/analyze-batch', payload);

    console.log('✅ BatchProcessingEngine Response:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${response.data.success}`);
    console.log(`   Total Transactions: ${response.data.totalTransactions || 'N/A'}`);
    console.log(`   Processing Time: ${response.data.processingTimeMs || 'N/A'}ms`);
    console.log(`   AI Calls Made: ${response.data.aiCallsMade || 'N/A'}`);
    console.log(`   Cache Hits: ${response.data.cacheHits || 'N/A'}`);

    if (response.data.results) {
      console.log('\n📋 Sample Results:');
      response.data.results.slice(0, 2).forEach((result, i) => {
        console.log(`   Transaction ${i+1}:`);
        console.log(`   └─ Category: ${result.category || 'N/A'}`);
        console.log(`   └─ Confidence: ${result.confidence || 'N/A'}`);
        console.log(`   └─ Source: ${result.source || 'N/A'}`);
      });
    }

    // Check if this is using the real BatchProcessingEngine
    if (response.data.costBreakdown) {
      console.log('\n💰 Cost Analysis (BatchProcessingEngine feature):');
      console.log(`   Total Cost: $${response.data.costBreakdown.totalCost || 0}`);
      console.log(`   Cost Per Transaction: $${response.data.costBreakdown.costPerTransaction || 0}`);
      console.log(`   Efficiency Rating: ${response.data.costBreakdown.efficiencyRating || 'N/A'}`);
      console.log('\n🎉 SUCCESS: Using BatchProcessingEngine!');
    } else {
      console.log('\n❌ Still not using real BatchProcessingEngine');
    }

  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        console.log('❌ Route not found - BatchProcessingEngine not mounted');
      } else {
        console.log('❌ Error response:', error.response.data);
      }
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testBatchProcessingEngine(); 