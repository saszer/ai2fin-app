const axios = require('axios');

async function testEnhancedPatternAnalysis() {
  try {
    console.log('🧪 Testing Enhanced Pattern Analysis with Server-Side Filtering...');
    
    // Test 1: Pattern analysis with filters (server-side transaction fetching)
    console.log('\n1️⃣ Testing pattern analysis with filters...');
    const filterResponse = await axios.post('http://localhost:3001/api/bills-patterns/analyze-patterns', {
      transactions: [], // Empty array to trigger server-side fetching
      filters: {
        datePreset: 'thisMonth', // Test with this month's transactions
        searchQuery: '', // No search filter
        categoryFilter: '', // No category filter
        amountMin: undefined,
        amountMax: undefined,
        merchantFilter: '',
        typeFilter: ''
      }
    }, {
      headers: {
        'Authorization': 'Bearer test-token', // You'll need a real token
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Filter-based analysis response:', {
      success: filterResponse.data.success,
      patternsFound: filterResponse.data.patterns?.length || 0,
      totalTransactions: filterResponse.data.stats?.totalTransactions || 0,
      processingTime: filterResponse.data.processingTime
    });

    // Test 2: Pattern analysis with provided transactions
    console.log('\n2️⃣ Testing pattern analysis with provided transactions...');
    const mockTransactions = [
      {
        id: 'tx1',
        description: 'Netflix Subscription',
        amount: -15.99,
        date: '2025-01-01',
        merchant: 'Netflix',
        category: 'Entertainment',
        primaryType: 'expense'
      },
      {
        id: 'tx2',
        description: 'Netflix Subscription',
        amount: -15.99,
        date: '2025-02-01',
        merchant: 'Netflix',
        category: 'Entertainment',
        primaryType: 'expense'
      },
      {
        id: 'tx3',
        description: 'Spotify Premium',
        amount: -9.99,
        date: '2025-01-15',
        merchant: 'Spotify',
        category: 'Entertainment',
        primaryType: 'expense'
      },
      {
        id: 'tx4',
        description: 'Spotify Premium',
        amount: -9.99,
        date: '2025-02-15',
        merchant: 'Spotify',
        category: 'Entertainment',
        primaryType: 'expense'
      }
    ];

    const transactionResponse = await axios.post('http://localhost:3001/api/bills-patterns/analyze-patterns', {
      transactions: mockTransactions
    }, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Transaction-based analysis response:', {
      success: transactionResponse.data.success,
      patternsFound: transactionResponse.data.patterns?.length || 0,
      totalTransactions: transactionResponse.data.stats?.totalTransactions || 0,
      processingTime: transactionResponse.data.processingTime
    });

    if (transactionResponse.data.patterns) {
      console.log('\n📊 Detected Patterns:');
      transactionResponse.data.patterns.forEach((pattern, index) => {
        console.log(`  ${index + 1}. ${pattern.name} (${pattern.merchant})`);
        console.log(`     Frequency: ${pattern.frequency}, Confidence: ${pattern.confidence}`);
        console.log(`     Transaction Count: ${pattern.transactionCount}`);
      });
    }

    console.log('\n✅ Enhanced pattern analysis tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Note: You need to provide a valid authentication token for this test');
    }
  }
}

// Run the test
testEnhancedPatternAnalysis(); 