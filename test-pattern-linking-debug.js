const axios = require('axios');

// Test the pattern creation and linking
async function testPatternLinking() {
  try {
    console.log('🔍 Testing pattern creation and linking...');
    
    // First, get a valid token by logging in
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Got auth token');
    
    // Test pattern creation with sample data
    const testPatterns = [
      {
        id: 'test_pattern_1',
        name: 'Test Netflix Subscription',
        merchant: 'Netflix',
        frequency: 'monthly',
        baseAmount: 19.99,
        confidence: 0.95,
        transactionCount: 2,
        transactions: [
          {
            id: 'test_tx_1',
            description: 'Netflix Subscription',
            amount: 19.99,
            date: '2025-01-15',
            merchant: 'Netflix',
            category: 'Entertainment',
            primaryType: 'expense',
            secondaryType: null
          },
          {
            id: 'test_tx_2', 
            description: 'Netflix Subscription',
            amount: 19.99,
            date: '2025-02-15',
            merchant: 'Netflix',
            category: 'Entertainment',
            primaryType: 'expense',
            secondaryType: null
          }
        ],
        interval: 'monthly',
        nextPredictedDate: '2025-03-15',
        averageAmount: 19.99,
        amountVariance: 0,
        categoryId: null,
        categoryName: 'Entertainment',
        reasoning: 'Monthly Netflix subscription detected',
        isRecommended: true,
        totalValue: 39.98
      }
    ];
    
    console.log('📤 Sending pattern creation request...');
    console.log('Patterns to create:', testPatterns.length);
    console.log('Transactions to link:', testPatterns[0].transactions.length);
    
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
    }
    
  } catch (error) {
    console.error('❌ Error testing pattern linking:', error.response?.data || error.message);
  }
}

testPatternLinking(); 