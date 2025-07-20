const axios = require('axios');

// Test Complete AI Flow: API → Database → Logging
async function testCompleteAIFlow() {
  console.log('🔍 Testing Complete AI Flow: API → Database → Logging\n');

  try {
    // Test 1: Verify AI Modules Health & Config
    console.log('1️⃣ Testing AI Modules Health & Configuration...');
    const healthRes = await axios.get('http://localhost:3002/health');
    console.log('✅ AI Modules Status:', healthRes.data);
    console.log('API Key Configured:', healthRes.data.apiKeyConfigured);
    console.log('');

    // Test 2: Test Single Transaction Classification
    console.log('2️⃣ Testing Single Transaction Classification...');
    const classifyPayload = {
      description: 'Uber ride to the office - business meeting',
      amount: 35.75,
      type: 'expense',
      date: new Date().toISOString(),
      userPreferences: {
        businessType: 'SOLE_TRADER',
        countryCode: 'AU'
      }
    };

    console.log('📤 Sending classification request:', JSON.stringify(classifyPayload, null, 2));
    
    const classifyRes = await axios.post('http://localhost:3002/classify', classifyPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    console.log('✅ Classification Response Status:', classifyRes.status);
    console.log('📥 Response Data:', JSON.stringify(classifyRes.data, null, 2));
    console.log('');

    // Test 3: Check Core App Database for Transaction Updates
    console.log('3️⃣ Testing Core App Database Access...');
    const dbRes = await axios.get('http://localhost:3001/transactions', {
      timeout: 10000
    });
    console.log('✅ Database Connection Status:', dbRes.status);
    console.log('📊 Total Transactions in DB:', Array.isArray(dbRes.data) ? dbRes.data.length : 'Error: Non-array response');
    
    if (Array.isArray(dbRes.data) && dbRes.data.length > 0) {
      const recentTx = dbRes.data.slice(-3);
      console.log('📋 Recent Transactions (last 3):');
      recentTx.forEach((tx, i) => {
        console.log(`  ${i+1}. ${tx.description} - $${tx.amount} [Category: ${tx.category || 'None'}]`);
      });
    }
    console.log('');

    // Test 4: Verify AI Modules Request Logging
    console.log('4️⃣ Checking AI Modules Request Logging...');
    const fs = require('fs');
    const path = require('path');
    
    // Check multiple log files
    const logFiles = [
      './ai2-ai-modules/logs/api-requests.log',
      './ai2-ai-modules/logs/ai-modules-combined.log', 
      './ai2-ai-modules/logs/ai-modules-error.log'
    ];
    
    let logsFound = false;
    for (const logPath of logFiles) {
      if (fs.existsSync(logPath)) {
        const stats = fs.statSync(logPath);
        const content = fs.readFileSync(logPath, 'utf8');
        console.log(`📄 ${path.basename(logPath)}: ${stats.size} bytes (modified: ${stats.mtime.toISOString()})`);
        
        if (content.length > 0) {
          logsFound = true;
          console.log('📝 Last 300 chars:');
          console.log(content.slice(-300));
          console.log('---');
        } else {
          console.log('⚠️ File exists but is empty');
        }
      } else {
        console.log(`❌ Log file not found: ${path.basename(logPath)}`);
      }
    }
    
    if (!logsFound) {
      console.log('⚠️ No log content found - logging system may not be working');
    }
    console.log('');

    // Test 5: Test Batch Classification
    console.log('5️⃣ Testing Batch Transaction Classification...');
    const batchPayload = {
      transactions: [
        {
          id: 'test-1',
          description: 'Netflix subscription monthly',
          amount: 19.99,
          date: new Date().toISOString()
        },
        {
          id: 'test-2', 
          description: 'Office supplies - Officeworks',
          amount: 45.30,
          date: new Date().toISOString()
        },
        {
          id: 'test-3',
          description: 'Coffee meeting with client',
          amount: 12.50,
          date: new Date().toISOString()
        }
      ],
      userPreferences: {
        businessType: 'SOLE_TRADER',
        countryCode: 'AU'
      },
      analysisType: 'batch'
    };

    const batchRes = await axios.post('http://localhost:3002/classify', batchPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    console.log('✅ Batch Classification Status:', batchRes.status);
    console.log('📊 Batch Results Summary:');
    
    if (batchRes.data && batchRes.data.results) {
      batchRes.data.results.forEach((result, i) => {
        console.log(`  ${i+1}. ${result.description || `Transaction ${i+1}`} → ${result.category || 'Uncategorized'} (${result.confidence || 'N/A'} confidence)`);
      });
    } else {
      console.log('📄 Full Batch Response:', JSON.stringify(batchRes.data, null, 2));
    }
    console.log('');

    // Test 6: Service Discovery Status
    console.log('6️⃣ Testing Service Discovery...');
    const serviceRes = await axios.get('http://localhost:3001/api/services/status');
    console.log('✅ Service Discovery Response:', serviceRes.data);
    console.log('');

    console.log('🎉 Complete AI Flow Test Finished!');
    console.log('📈 Summary:');
    console.log(`   - AI Modules Health: ${healthRes.data.status}`);
    console.log(`   - API Key Configured: ${healthRes.data.apiKeyConfigured}`);
    console.log(`   - Classification Status: ${classifyRes.status}`);
    console.log(`   - Database Access: ${dbRes.status}`);
    console.log(`   - Batch Processing: ${batchRes.status}`);
    console.log(`   - Service Discovery: ${serviceRes.status}`);
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    
    if (error.response) {
      console.error('📋 Response Status:', error.response.status);
      console.error('📋 Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️ Connection refused - check if services are running:');
      console.error('   - Core App: http://localhost:3001');
      console.error('   - AI Modules: http://localhost:3002');
    }
    
    if (error.code === 'ETIMEDOUT') {
      console.error('⚠️ Request timed out - OpenAI API or database may be slow');
    }

    // Log error details for debugging
    console.error('🔍 Full Error Details:', {
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 3)
    });
  }
}

// Run the comprehensive test
testCompleteAIFlow(); 