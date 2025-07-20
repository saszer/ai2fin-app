const axios = require('axios');

async function addTestTransactions() {
  console.log('📝 Adding Test Transactions for AI Categorization');
  console.log('=================================================');
  
  try {
    // First login to get token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Add some unique test transactions that won't hit cache
    const testTransactions = [
      {
        description: `AI Test Coffee Shop ${Date.now()}`,
        amount: -4.50,
        merchant: `Coffee Bros ${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'debit'
      },
      {
        description: `AI Test Office Supplies ${Date.now()}`,
        amount: -23.45,
        merchant: `Staples ${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'debit'
      },
      {
        description: `AI Test Restaurant ${Date.now()}`,
        amount: -67.80,
        merchant: `Pizza Palace ${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'debit'
      }
    ];
    
    console.log('\n📝 Adding test transactions...');
    for (let i = 0; i < testTransactions.length; i++) {
      const transaction = testTransactions[i];
      console.log(`  ${i + 1}. ${transaction.description} - $${Math.abs(transaction.amount)}`);
      
      await axios.post('http://localhost:3001/api/bank/transactions', transaction, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
    
    console.log(`✅ Added ${testTransactions.length} test transactions`);
    
    console.log('\n🧪 Testing Plan:');
    console.log('================');
    console.log('1️⃣  Run AI Categorization Analysis now');
    console.log('   → Should show Method: AI, OpenAI calls > 0');
    console.log('   → Fresh AI categorization');
    console.log('');
    console.log('2️⃣  Run AI Categorization Analysis again');
    console.log('   → Should show Method: Cache, OpenAI calls = 0'); 
    console.log('   → Cached results, smart mapping should work');
    console.log('');
    console.log('3️⃣  Verify UX consistency:');
    console.log('   → First run: "AI Analysis" with costs');
    console.log('   → Second run: "Cached AI Analysis" with $0 cost');
    
    console.log('\n🎯 This will test the smart mapping fix!');
    
  } catch (error) {
    console.error('❌ Failed to add test transactions:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

addTestTransactions(); 