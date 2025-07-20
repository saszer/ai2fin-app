const axios = require('axios');

// Test Classification Flow with Mock AI Response
async function testClassificationFlow() {
  console.log('🧪 Testing Classification Flow with Core App...\n');

  try {
    // Test 1: Check Core App Health
    console.log('1️⃣ Testing Core App Health...');
    const healthRes = await axios.get('http://localhost:3001/health');
    console.log('✅ Core App Status:', healthRes.status);
    console.log('');

    // Test 2: Check Database Connection
    console.log('2️⃣ Testing Database Connection...');
    const transactionsRes = await axios.get('http://localhost:3001/transactions');
    console.log('✅ Database Access:', transactionsRes.status);
    console.log('📊 Total Transactions:', Array.isArray(transactionsRes.data) ? transactionsRes.data.length : 'Error');
    
    if (Array.isArray(transactionsRes.data) && transactionsRes.data.length > 0) {
      console.log('📋 Sample transactions:');
      transactionsRes.data.slice(0, 3).forEach((tx, i) => {
        console.log(`  ${i+1}. ${tx.description} - $${tx.amount} [Category: ${tx.category || 'None'}]`);
      });
    }
    console.log('');

    // Test 3: Test Manual Transaction Classification (if endpoint exists)
    console.log('3️⃣ Testing Manual Transaction Classification...');
    try {
      const classifyPayload = {
        transactions: [{
          id: 'test-123',
          description: 'Uber ride to client meeting',
          amount: 25.50,
          date: new Date().toISOString()
        }]
      };

      // Try the core app's classification endpoint first
      const coreClassifyRes = await axios.post('http://localhost:3001/api/ai/classify-transaction', classifyPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      console.log('✅ Core App Classification Status:', coreClassifyRes.status);
      console.log('📥 Response:', JSON.stringify(coreClassifyRes.data, null, 2));
      
    } catch (classifyError) {
      console.log('⚠️ Core app classification endpoint not available:', classifyError.response?.status || classifyError.message);
    }
    console.log('');

    // Test 4: Test Category Assignment via Direct Update
    console.log('4️⃣ Testing Direct Category Assignment...');
    if (Array.isArray(transactionsRes.data) && transactionsRes.data.length > 0) {
      const firstTransaction = transactionsRes.data[0];
      const updatePayload = {
        category: 'Business Expense - Travel',
        aiClassified: true,
        confidence: 0.85
      };

      try {
        const updateRes = await axios.put(`http://localhost:3001/transactions/${firstTransaction.id}`, updatePayload, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('✅ Transaction Update Status:', updateRes.status);
        console.log('📝 Updated transaction category to:', updatePayload.category);
        
        // Verify the update
        const verifyRes = await axios.get(`http://localhost:3001/transactions/${firstTransaction.id}`);
        if (verifyRes.data && verifyRes.data.category) {
          console.log('✅ Category persisted to database:', verifyRes.data.category);
        } else {
          console.log('⚠️ Category not found in database response');
        }
        
      } catch (updateError) {
        console.log('⚠️ Transaction update failed:', updateError.response?.status || updateError.message);
      }
    }
    console.log('');

    // Test 5: Service Discovery Status  
    console.log('5️⃣ Testing Service Discovery...');
    const serviceRes = await axios.get('http://localhost:3001/api/services/status');
    console.log('✅ Services Status:', serviceRes.data);
    console.log('');

    console.log('🎉 Classification Flow Test Summary:');
    console.log(`   - Core App Health: ${healthRes.status}`);
    console.log(`   - Database Access: ${transactionsRes.status}`);
    console.log(`   - Transaction Count: ${Array.isArray(transactionsRes.data) ? transactionsRes.data.length : 'N/A'}`);
    console.log(`   - Service Discovery: ${serviceRes.status}`);
    
    // Summary
    console.log('\n🔍 Analysis:');
    if (serviceRes.data && serviceRes.data.services) {
      const aiModulesStatus = serviceRes.data.services.find(s => s.name === 'ai-modules');
      if (aiModulesStatus) {
        console.log(`   - AI Modules: ${aiModulesStatus.status} (${aiModulesStatus.responseTime || 'N/A'})`);
      } else {
        console.log('   - AI Modules: Not found in service discovery');
      }
    }

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    
    if (error.response) {
      console.error('📋 Response Status:', error.response.status);
      console.error('📋 Response Headers:', error.response.headers);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️ Connection refused - check if Core App is running on port 3001');
    }
    
    console.error('🔍 Full Error Details:', {
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 5)
    });
  }
}

// Run the test
testClassificationFlow(); 