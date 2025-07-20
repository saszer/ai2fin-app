const axios = require('axios');

// Test AI Modules Connection and Database Integration
async function testAIEndpointConnection() {
  console.log('🧪 Testing AI Endpoint Connection & Database Integration...\n');

  try {
    // Test 1: AI Modules Health
    console.log('1️⃣ Testing AI Modules Health...');
    const healthRes = await axios.get('http://localhost:3002/health');
    console.log('✅ AI Modules Health:', healthRes.data);
    console.log('');

    // Test 2: Single Transaction Classification
    console.log('2️⃣ Testing Single Transaction Classification...');
    const classifyRes = await axios.post('http://localhost:3002/classify', {
      transactions: [{
        id: 'test-classify-123',
        description: 'Uber ride to airport',
        amount: 45.50,
        date: new Date().toISOString()
      }]
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    console.log('✅ Classification Response:');
    console.log('Status:', classifyRes.status);
    console.log('Data:', JSON.stringify(classifyRes.data, null, 2));
    console.log('');

    // Test 3: Check AI Modules Logs
    console.log('3️⃣ Checking AI Modules Request Logging...');
    const fs = require('fs');
    const path = require('path');
    
    const logPaths = [
      './ai2-ai-modules/logs/api-requests.log',
      './ai2-ai-modules/logs/ai-modules-combined.log',
      './ai2-ai-modules/logs/ai-modules-error.log'
    ];
    
    for (const logPath of logPaths) {
      if (fs.existsSync(logPath)) {
        const logContent = fs.readFileSync(logPath, 'utf8');
        console.log(`📄 ${logPath}: ${logContent.length} bytes`);
        if (logContent.length > 0) {
          console.log('Last 200 chars:', logContent.slice(-200));
        } else {
          console.log('⚠️ Log file is empty');
        }
      } else {
        console.log(`❌ Log file not found: ${logPath}`);
      }
    }
    console.log('');

    // Test 4: Test Core App Database Connection  
    console.log('4️⃣ Testing Core App Database Connection...');
    const dbTestRes = await axios.get('http://localhost:3001/transactions', {
      timeout: 10000
    });
    console.log('✅ Database Connection (Transactions):', dbTestRes.status);
    console.log('Transaction count:', Array.isArray(dbTestRes.data) ? dbTestRes.data.length : 'Non-array response');
    console.log('');

    // Test 5: Core App Service Status
    console.log('5️⃣ Testing Core App Service Discovery...');
    const serviceStatusRes = await axios.get('http://localhost:3001/api/services/status');
    console.log('✅ Service Status:', serviceStatusRes.data);
    console.log('');

    console.log('🎉 All Tests Completed Successfully!');
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️ Connection refused - service may not be running');
    }
    
    if (error.code === 'ETIMEDOUT') {
      console.error('⚠️ Request timed out - OpenAI API or database may be slow');
    }
  }
}

// Run the test
testAIEndpointConnection(); 