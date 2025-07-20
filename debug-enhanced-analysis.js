/**
 * 🧪 DEBUG ENHANCED ANALYSIS
 * Quick test to see if the enhanced Smart Categorization analysis is working
 */

async function debugEnhancedAnalysis() {
  const fetch = (await import('node-fetch')).default;
  
  console.log('🔍 Testing Enhanced Analysis Endpoint...\n');
  
  try {
    // Test the enhanced analysis endpoint
    console.log('📡 Calling enhanced analysis endpoint...');
    const response = await fetch('http://localhost:3001/api/intelligent-categorization/analyze-for-categorization', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Using the token from your logs - normally this would be from frontend auth
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWQ3cHIyNGgwMDAwcDk5Z2xtYW4ydDU5IiwiZW1haWwiOiJzei5zYWhhakBnbWFpbC5jb20iLCJmaXJzdE5hbWUiOiJTYWhhaiIsImxhc3ROYW1lIjoiR2FyZyIsImJ1c2luZXNzVHlwZSI6IiIsImNvdW50cnlDb2RlIjoiQVUiLCJpYXQiOjE3NTI5NDE3NjEsImV4cCI6MTc1MzAyODE2MX0.74XOvunbK2NXNiApJDVWmhM_Sa0ScHJ_dkzt7ou9vcQ'
      },
      body: JSON.stringify({
        includeAlreadyCategorized: true
      })
    });

    if (response.ok) {
      const data = await response.json();
      
      console.log('✅ Enhanced Analysis Response:');
      console.log('📊 Success:', data.success);
      console.log('📊 Message:', data.message);
      
      if (data.analysis) {
        const analysis = data.analysis;
        console.log('\n📈 ENHANCED ANALYSIS DATA:');
        console.log(`   📊 Total Transactions: ${analysis.totalTransactions || 'N/A'}`);
        console.log(`   🆕 Uncategorized: ${analysis.uncategorizedCount || 'N/A'}`);
        console.log(`   ✅ Already Categorized: ${analysis.categorizedCount || 'N/A'}`);
        console.log(`   🎯 Ready for Analysis: ${analysis.breakdown?.totalToAnalyze || 'N/A'}`);
        console.log(`   🔄 Available for Re-analysis: ${analysis.breakdown?.totalCategorizedAvailable || 'N/A'}`);
        console.log(`   🏷️  Has Already Categorized: ${analysis.hasAlreadyCategorized}`);
        
        if (analysis.categorizedStats) {
          console.log('\n📈 CATEGORIZATION QUALITY:');
          const stats = analysis.categorizedStats;
          console.log(`   Total Categorized: ${stats.total}`);
          console.log(`   High Confidence: ${stats.confidenceDistribution?.high || 0}`);
          console.log(`   Medium Confidence: ${stats.confidenceDistribution?.medium || 0}`);
          console.log(`   Low Confidence: ${stats.confidenceDistribution?.low || 0}`);
          console.log(`   Average Confidence: ${Math.round((stats.averageConfidence || 0) * 100)}%`);
          
          console.log('\n🔧 METHOD BREAKDOWN:');
          Object.entries(stats.methodBreakdown || {}).forEach(([method, count]) => {
            console.log(`   ${method}: ${count}`);
          });
          
          console.log('\n📂 TOP CATEGORIES:');
          Object.entries(stats.categoryBreakdown || {}).slice(0, 5).forEach(([category, count]) => {
            console.log(`   ${category}: ${count}`);
          });
        } else {
          console.log('\n⚠️  No categorized stats (all transactions might be uncategorized)');
        }
        
        console.log('\n📋 TRANSACTION ARRAYS:');
        console.log(`   Uncategorized transactions: ${analysis.transactions?.length || 0}`);
        console.log(`   Categorized transactions: ${analysis.categorizedTransactions?.length || 0}`);
        console.log(`   User categories: ${analysis.userCategories?.length || 0}`);
        
      } else {
        console.log('❌ No analysis data in response');
      }
      
    } else {
      const errorText = await response.text();
      console.log(`❌ Request failed: ${response.status} ${response.statusText}`);
      console.log(`❌ Error: ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the debug
debugEnhancedAnalysis(); 