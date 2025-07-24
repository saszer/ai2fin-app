const axios = require('axios');

async function debugPatternAnalysis() {
  try {
    console.log('🔍 DEBUGGING PATTERN ANALYSIS END-TO-END...\n');
    
    // Step 1: Test the transactions endpoint to see what data is available
    console.log('1️⃣ Testing transactions endpoint...');
    const transactionsResponse = await axios.get('http://localhost:3001/api/bank/transactions?page=1&limit=5', {
      headers: {
        'Authorization': 'Bearer test-token', // You'll need a real token
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Transactions endpoint response:', {
      hasData: !!transactionsResponse.data.data,
      dataLength: transactionsResponse.data.data?.length || 0,
      hasPagination: !!transactionsResponse.data.pagination,
      total: transactionsResponse.data.pagination?.total || 'NOT_FOUND',
      sampleTransaction: transactionsResponse.data.data?.[0] ? {
        id: transactionsResponse.data.data[0].id,
        description: transactionsResponse.data.data[0].description,
        amount: transactionsResponse.data.data[0].amount,
        date: transactionsResponse.data.data[0].date,
        merchant: transactionsResponse.data.data[0].merchant
      } : 'NO_TRANSACTIONS'
    });

    // Step 2: Test pattern analysis with empty filters (should get all transactions)
    console.log('\n2️⃣ Testing pattern analysis with empty filters...');
    const emptyFiltersPayload = {
      transactions: [],
      filters: {}
    };

    console.log('📤 Sending empty filters payload:', JSON.stringify(emptyFiltersPayload, null, 2));
    
    const emptyFiltersResponse = await axios.post('http://localhost:3001/api/bills-patterns/analyze-patterns', emptyFiltersPayload, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Empty filters response:', {
      success: emptyFiltersResponse.data.success,
      patternsFound: emptyFiltersResponse.data.patterns?.length || 0,
      totalTransactions: emptyFiltersResponse.data.stats?.totalTransactions || 0,
      processingTime: emptyFiltersResponse.data.processingTime
    });

    // Step 3: Test pattern analysis with some basic filters
    console.log('\n3️⃣ Testing pattern analysis with basic filters...');
    const basicFiltersPayload = {
      transactions: [],
      filters: {
        searchQuery: '',
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

    console.log('📤 Sending basic filters payload:', JSON.stringify(basicFiltersPayload, null, 2));
    
    const basicFiltersResponse = await axios.post('http://localhost:3001/api/bills-patterns/analyze-patterns', basicFiltersPayload, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Basic filters response:', {
      success: basicFiltersResponse.data.success,
      patternsFound: basicFiltersResponse.data.patterns?.length || 0,
      totalTransactions: basicFiltersResponse.data.stats?.totalTransactions || 0,
      processingTime: basicFiltersResponse.data.processingTime
    });

    // Step 4: Test with actual transaction data
    console.log('\n4️⃣ Testing pattern analysis with actual transaction data...');
    const mockTransactions = [
      {
        id: 'test1',
        description: 'Netflix Subscription',
        amount: -15.99,
        date: '2025-01-01',
        merchant: 'Netflix',
        category: 'Entertainment',
        primaryType: 'expense'
      },
      {
        id: 'test2',
        description: 'Netflix Subscription',
        amount: -15.99,
        date: '2025-02-01',
        merchant: 'Netflix',
        category: 'Entertainment',
        primaryType: 'expense'
      },
      {
        id: 'test3',
        description: 'Spotify Premium',
        amount: -9.99,
        date: '2025-01-15',
        merchant: 'Spotify',
        category: 'Entertainment',
        primaryType: 'expense'
      },
      {
        id: 'test4',
        description: 'Spotify Premium',
        amount: -9.99,
        date: '2025-02-15',
        merchant: 'Spotify',
        category: 'Entertainment',
        primaryType: 'expense'
      }
    ];

    const transactionDataPayload = {
      transactions: mockTransactions,
      filters: {}
    };

    console.log('📤 Sending transaction data payload with', mockTransactions.length, 'transactions');
    
    const transactionDataResponse = await axios.post('http://localhost:3001/api/bills-patterns/analyze-patterns', transactionDataPayload, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Transaction data response:', {
      success: transactionDataResponse.data.success,
      patternsFound: transactionDataResponse.data.patterns?.length || 0,
      totalTransactions: transactionDataResponse.data.stats?.totalTransactions || 0,
      processingTime: transactionDataResponse.data.processingTime
    });

    if (transactionDataResponse.data.patterns && transactionDataResponse.data.patterns.length > 0) {
      console.log('\n📊 Detected Patterns:');
      transactionDataResponse.data.patterns.forEach((pattern, index) => {
        console.log(`  ${index + 1}. ${pattern.name} (${pattern.merchant})`);
        console.log(`     Frequency: ${pattern.frequency}, Confidence: ${pattern.confidence}`);
        console.log(`     Transaction Count: ${pattern.transactionCount}`);
      });
    }

    console.log('\n🔍 DEBUG SUMMARY:');
    console.log('- Transactions endpoint working:', !!transactionsResponse.data.data);
    console.log('- Empty filters working:', emptyFiltersResponse.data.success);
    console.log('- Basic filters working:', basicFiltersResponse.data.success);
    console.log('- Transaction data working:', transactionDataResponse.data.success);
    console.log('- Patterns detected with mock data:', transactionDataResponse.data.patterns?.length || 0);

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Note: You need to provide a valid authentication token for this test');
    }
  }
}

// Run the debug
debugPatternAnalysis(); 