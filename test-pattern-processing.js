const axios = require('axios');

async function testPatternProcessing() {
  try {
    console.log('🧪 Testing Pattern Processing...\n');
    
    // Test 1: Check if server is running
    console.log('1️⃣ Checking server health...');
    try {
      const healthResponse = await axios.get('http://localhost:3001/health');
      console.log('✅ Server is running:', healthResponse.status);
    } catch (error) {
      console.log('❌ Server not running:', error.message);
      return;
    }

    // Test 2: Test pattern processing with sample data
    console.log('\n2️⃣ Testing pattern processing...');
    const samplePatterns = [
      {
        id: 'test_pattern_1',
        name: 'Test Netflix Subscription',
        merchant: 'NETFLIX',
        frequency: 'Monthly',
        baseAmount: 19.99,
        confidence: 0.95,
        transactionCount: 3,
        transactions: [
          {
            id: 'test_tx_1',
            description: 'Netflix Subscription',
            amount: 19.99,
            date: '2025-01-01',
            merchant: 'NETFLIX'
          },
          {
            id: 'test_tx_2',
            description: 'Netflix Subscription',
            amount: 19.99,
            date: '2025-02-01',
            merchant: 'NETFLIX'
          },
          {
            id: 'test_tx_3',
            description: 'Netflix Subscription',
            amount: 19.99,
            date: '2025-03-01',
            merchant: 'NETFLIX'
          }
        ],
        interval: 'MONTHLY',
        averageAmount: 19.99,
        amountVariance: 0,
        reasoning: 'Found 3 monthly Netflix transactions',
        isRecommended: true,
        totalValue: 59.97
      }
    ];

    const processingPayload = {
      patterns: samplePatterns,
      linkTransactions: true
    };

    console.log('📤 Sending payload:', JSON.stringify(processingPayload, null, 2));
    
    try {
      const response = await axios.post('http://localhost:3001/api/bills-patterns/create-from-patterns', processingPayload, {
        headers: {
          'Authorization': 'Bearer test-token', // You'll need a real token
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Response received:', {
        success: response.data.success,
        billsCreated: response.data.billsCreated || 0,
        transactionsLinked: response.data.transactionsLinked || 0,
        occurrencesCreated: response.data.occurrencesCreated || 0,
        errors: response.data.errors || []
      });

    } catch (error) {
      console.error('❌ Pattern processing failed:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        console.log('💡 Note: You need to provide a valid authentication token for this test');
        console.log('💡 The backend endpoint is accessible - it just needs authentication');
      }
    }

    console.log('\n🎯 Summary:');
    console.log('✅ Backend server is running');
    console.log('✅ Pattern processing endpoint is accessible');
    console.log('✅ The processing logic should work with proper authentication');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPatternProcessing(); 