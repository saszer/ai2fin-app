const axios = require('axios');

// Test the pattern creation and linking with real transaction IDs
async function testPatternLinkingWithRealTransactions() {
  try {
    console.log('🔍 Testing pattern creation and linking with real transactions...');
    
    // First, get a valid token by logging in
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Got auth token');
    
    // First, get real transactions from the database
    console.log('📥 Fetching real transactions from database...');
    const transactionsResponse = await axios.get('http://localhost:3001/api/bank/transactions?limit=10', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const realTransactions = transactionsResponse.data.data || [];
    console.log(`✅ Found ${realTransactions.length} real transactions`);
    
    if (realTransactions.length === 0) {
      console.log('❌ No transactions found in database. Please add some transactions first.');
      return;
    }
    
    // Show sample transactions
    console.log('📋 Sample transactions:');
    realTransactions.slice(0, 3).forEach((tx, i) => {
      console.log(`   ${i + 1}. ID: ${tx.id}, ${tx.description} - $${tx.amount} (${tx.date})`);
    });
    
    // Create a test pattern using real transaction IDs
    const testPatterns = [
      {
        id: 'test_pattern_real_1',
        name: 'Test Real Transaction Pattern',
        merchant: realTransactions[0].merchant || 'Test Merchant',
        frequency: 'monthly',
        baseAmount: Math.abs(realTransactions[0].amount),
        confidence: 0.95,
        transactionCount: 1,
        transactions: [
          {
            id: realTransactions[0].id, // Use REAL transaction ID
            description: realTransactions[0].description,
            amount: Math.abs(realTransactions[0].amount),
            date: realTransactions[0].date,
            merchant: realTransactions[0].merchant,
            category: realTransactions[0].category?.name,
            primaryType: 'expense',
            secondaryType: null
          }
        ],
        interval: 'monthly',
        nextPredictedDate: '2025-03-15',
        averageAmount: Math.abs(realTransactions[0].amount),
        amountVariance: 0,
        categoryId: null,
        categoryName: realTransactions[0].category?.name,
        reasoning: 'Test pattern with real transaction',
        isRecommended: true,
        totalValue: Math.abs(realTransactions[0].amount)
      }
    ];
    
    console.log('📤 Sending pattern creation request with REAL transaction IDs...');
    console.log('Patterns to create:', testPatterns.length);
    console.log('Transactions to link:', testPatterns[0].transactions.length);
    console.log('Real transaction ID:', testPatterns[0].transactions[0].id);
    
    const createResponse = await axios.post('http://localhost:3001/api/bills-patterns/create-from-patterns', {
      patterns: testPatterns,
      linkTransactions: true
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Pattern creation response:');
    console.log(JSON.stringify(createResponse.data, null, 2));
    
    // Check if transactions were actually linked
    if (createResponse.data.data?.transactionsLinked > 0) {
      console.log('🎉 Transactions were successfully linked!');
    } else {
      console.log('❌ No transactions were linked');
      console.log('Errors:', createResponse.data.data?.errors);
    }
    
  } catch (error) {
    console.error('❌ Error testing pattern linking:', error.response?.data || error.message);
  }
}

testPatternLinkingWithRealTransactions(); 