const axios = require('axios');

async function testPatternAnalysisFixed() {
  try {
    console.log('🧪 Testing Pattern Analysis with Fixed Filter Structure...');
    
    // Test with the correct filter structure that matches FilterConfig
    const requestPayload = {
      transactions: [], // Empty array to trigger server-side fetching
      filters: {
        searchQuery: '',
        dateFrom: undefined,
        dateTo: undefined,
        datePreset: 'all',
        amountMin: undefined,
        amountMax: undefined,
        categoryIds: [],
        transactionTypes: [],
        primaryTypes: [],
        secondaryTypes: [],
        uncategorizedOnly: false,
        taxDeductibleOnly: false,
        recurringOnly: false,
        dataBucketIds: []
      }
    };

    console.log('📤 Sending request payload:', JSON.stringify(requestPayload, null, 2));
    
    const response = await axios.post('http://localhost:3001/api/bills-patterns/analyze-patterns', requestPayload, {
      headers: {
        'Authorization': 'Bearer test-token', // You'll need a real token
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Response:', {
      success: response.data.success,
      patternsFound: response.data.patterns?.length || 0,
      totalTransactions: response.data.stats?.totalTransactions || 0,
      processingTime: response.data.processingTime
    });

    if (response.data.patterns && response.data.patterns.length > 0) {
      console.log('\n📊 Detected Patterns:');
      response.data.patterns.forEach((pattern, index) => {
        console.log(`  ${index + 1}. ${pattern.name} (${pattern.merchant})`);
        console.log(`     Frequency: ${pattern.frequency}, Confidence: ${pattern.confidence}`);
        console.log(`     Transaction Count: ${pattern.transactionCount}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Note: You need to provide a valid authentication token for this test');
    }
  }
}

// Run the test
testPatternAnalysisFixed(); 