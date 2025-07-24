const axios = require('axios');

// Test transaction linking
async function testTransactionLinking() {
  try {
    console.log('🔍 Testing transaction linking...');
    
    // 1. Login to get token
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // 2. Get some transactions to see their actual IDs
    const transactionsResponse = await axios.get('http://localhost:3001/api/bank/transactions?limit=10', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const transactions = transactionsResponse.data.data || [];
    console.log(`📊 Found ${transactions.length} transactions`);
    
    if (transactions.length === 0) {
      console.log('❌ No transactions found for testing');
      return;
    }
    
    // 3. Show transaction details
    console.log('\n📋 Sample transactions:');
    transactions.slice(0, 3).forEach((tx, index) => {
      console.log(`${index + 1}. ID: ${tx.id}, Date: ${tx.date}, Amount: ${tx.amount}, Description: ${tx.description}`);
    });
    
    // 4. Create a test pattern with real transaction IDs
    const testPattern = {
      id: 'test_pattern_1',
      name: 'Test Pattern',
      merchant: transactions[0].merchant || 'Test Merchant',
      frequency: 'Monthly',
      baseAmount: Math.abs(transactions[0].amount),
      confidence: 0.95,
      transactionCount: 1,
      transactions: [transactions[0]], // Use real transaction
      reasoning: 'Test pattern for debugging'
    };
    
    console.log('\n🧪 Creating test pattern with real transaction ID:', transactions[0].id);
    
    // 5. Test pattern creation
    const createResponse = await axios.post('http://localhost:3001/api/bills-patterns/create-from-patterns', {
      patterns: [testPattern],
      linkTransactions: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n✅ Pattern creation response:', createResponse.data);
    
    // 6. Check if transaction was actually linked
    const linkedTransactionResponse = await axios.get(`http://localhost:3001/api/bank/transactions/${transactions[0].id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n🔗 Transaction after linking:', {
      id: linkedTransactionResponse.data.id,
      secondaryType: linkedTransactionResponse.data.secondaryType,
      isRecurringBill: linkedTransactionResponse.data.isRecurringBill
    });
    
    // 7. Check bill occurrences
    const billPatternsResponse = await axios.get('http://localhost:3001/api/bills-patterns', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const billPatterns = billPatternsResponse.data || [];
    console.log('\n📅 Bill patterns created:', billPatterns.length);
    
    if (billPatterns.length > 0) {
      const latestPattern = billPatterns[billPatterns.length - 1];
      console.log('Latest pattern:', {
        id: latestPattern.id,
        name: latestPattern.name,
        occurrencesCount: latestPattern.occurrences?.length || 0
      });
      
      if (latestPattern.occurrences && latestPattern.occurrences.length > 0) {
        console.log('Occurrences:');
        latestPattern.occurrences.forEach((occ, index) => {
          console.log(`  ${index + 1}. Due: ${occ.dueDate}, Amount: ${occ.amount}, Linked TX: ${occ.bankTransactionId || 'None'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing transaction linking:', error.response?.data || error.message);
  }
}

testTransactionLinking(); 