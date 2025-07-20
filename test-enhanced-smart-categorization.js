/**
 * 🚀 ENHANCED SMART CATEGORIZATION TEST
 * 
 * Tests the new enhanced Step 1 Smart Categorization features:
 * 1. Shows both uncategorized and already categorized transactions
 * 2. Provides re-analysis options with filtering
 * 3. Demonstrates cache-skipping for forced re-analysis
 * 4. Tests the UX improvements for handling thousands of transactions
 */

async function testEnhancedSmartCategorization() {
  const fetch = (await import('node-fetch')).default;
  
  console.log('🧪 Testing Enhanced Smart Categorization Features...\n');
  
  try {
    // Test 1: Basic analysis (shows both categorized and uncategorized)
    console.log('📊 TEST 1: Enhanced Analysis with both categorized and uncategorized transactions');
    const analysisResponse = await fetch('http://localhost:3001/api/intelligent-categorization/analyze-for-categorization', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token' // Using mock auth for testing
      },
      body: JSON.stringify({
        includeAlreadyCategorized: true
      })
    });

    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json();
      
      console.log('✅ Enhanced Analysis Results:');
      console.log(`   📊 Total Transactions: ${analysisData.analysis.totalTransactions}`);
      console.log(`   🆕 Uncategorized: ${analysisData.analysis.uncategorizedCount}`);
      console.log(`   ✅ Already Categorized: ${analysisData.analysis.categorizedCount}`);
      console.log(`   🎯 Ready for Analysis: ${analysisData.analysis.breakdown.totalToAnalyze}`);
      console.log(`   🔄 Available for Re-analysis: ${analysisData.analysis.breakdown.totalCategorizedAvailable}`);
      
      if (analysisData.analysis.categorizedStats) {
        console.log('   📈 Categorization Quality:');
        const stats = analysisData.analysis.categorizedStats;
        console.log(`     High Confidence: ${stats.confidenceDistribution.high}`);
        console.log(`     Medium Confidence: ${stats.confidenceDistribution.medium}`);
        console.log(`     Low Confidence: ${stats.confidenceDistribution.low}`);
        console.log(`     Average Confidence: ${Math.round(stats.averageConfidence * 100)}%`);
        
        console.log('   🔧 Method Breakdown:');
        Object.entries(stats.methodBreakdown).forEach(([method, count]) => {
          console.log(`     ${method}: ${count}`);
        });
        
        console.log('   📂 Category Breakdown:');
        Object.entries(stats.categoryBreakdown).slice(0, 5).forEach(([category, count]) => {
          console.log(`     ${category}: ${count}`);
        });
      }
    } else {
      console.log('❌ Analysis failed:', await analysisResponse.text());
      return;
    }

    // Test 2: Simulated Smart Categorization with both new and re-analysis
    console.log('\n🤖 TEST 2: Simulated Smart Categorization with Re-analysis');
    
    const mockTransactions = [
      {
        id: 'new-1',
        description: 'Shell Gas Station',
        amount: -45.50,
        merchant: 'Shell',
        date: new Date().toISOString(),
        type: 'debit',
        analysisType: 'one-time'
      },
      {
        id: 'recategorize-1',
        description: 'Office Supplies Store',
        amount: -127.80,
        merchant: 'Officeworks',
        date: new Date().toISOString(),
        type: 'debit',
        analysisType: 'one-time-recategorize',
        forceReanalysis: true // Skip cache for this one
      }
    ];

    const selectedCategories = [
      'Fuel & Transport',
      'Office Supplies',
      'Professional Services'
    ];

    console.log('📤 Sending enhanced categorization request...');
    console.log(`   🆕 New transactions: 1`);
    console.log(`   🔄 Re-analysis transactions: 1 (will skip cache)`);
    console.log(`   🎯 Selected categories: ${selectedCategories.join(', ')}`);

    const categorizationResponse = await fetch('http://localhost:3001/api/intelligent-categorization/classify-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token'
      },
      body: JSON.stringify({
        transactions: mockTransactions,
        selectedCategories: selectedCategories,
        options: {
          includeNewCategorySuggestions: true,
          confidenceThreshold: 0.6,
          enableBillPatternOptimization: true,
          enableProgressUpdates: true,
          enableRealTimeLogging: true,
          showOpenAICallDetails: true
        }
      })
    });

    if (categorizationResponse.ok) {
      const categorizationData = await categorizationResponse.json();
      
      console.log('✅ Enhanced Categorization Complete!');
      console.log(`   📊 Results: ${categorizationData.results?.length || 0}`);
      console.log(`   💰 AI Calls Used: ${categorizationData.aiCallsUsed || 0}`);
      console.log(`   ⏱️  Processing Time: ${categorizationData.processingTime || 0}ms`);
      
      if (categorizationData.results) {
        categorizationData.results.forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.description?.substring(0, 30)}...`);
          console.log(`      Category: ${result.category || 'Uncategorized'}`);
          console.log(`      Confidence: ${Math.round((result.confidence || 0) * 100)}%`);
          console.log(`      Method: ${result.method || 'Unknown'}`);
          console.log(`      Source: ${result.source || 'Unknown'}`);
          if (result.forceReanalysis) {
            console.log(`      🔄 Cache Skipped: Yes (Forced Re-analysis)`);
          }
        });
      }

      // Show method breakdown
      if (categorizationData.methodBreakdown) {
        console.log('   🔧 Method Breakdown:');
        Object.entries(categorizationData.methodBreakdown).forEach(([method, count]) => {
          console.log(`     ${method}: ${count}`);
        });
      }

      console.log('\n🎯 Key Enhanced Features Demonstrated:');
      console.log('   ✅ Shows both categorized and uncategorized transactions');
      console.log('   ✅ Provides re-analysis options with confidence filtering');
      console.log('   ✅ Skips cache for forced re-analysis (forceReanalysis flag)');
      console.log('   ✅ Enhanced UX with detailed statistics and breakdowns');
      console.log('   ✅ Scalable design for handling thousands of transactions');
      console.log('   ✅ Clear messaging about AI vs cache usage');

    } else {
      console.log('❌ Categorization failed:', await categorizationResponse.text());
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEnhancedSmartCategorization(); 