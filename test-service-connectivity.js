const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const AI_MODULES_URL = 'http://localhost:3002';

async function testServiceConnectivity() {
  try {
    console.log('🔗 Testing Service Connectivity...\n');

    // Test 1: Core app health
    console.log('🏥 Step 1: Testing core app health...');
    try {
      const coreHealthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Core app is healthy');
      console.log('   Response:', coreHealthResponse.data);
    } catch (error) {
      console.log('❌ Core app health check failed:', error.message);
    }

    // Test 2: AI modules health  
    console.log('\n🤖 Step 2: Testing AI modules health...');
    try {
      const aiHealthResponse = await axios.get(`${AI_MODULES_URL}/health`);
      console.log('✅ AI modules service is healthy');
      console.log('   Response:', aiHealthResponse.data);
    } catch (error) {
      console.log('❌ AI modules health check failed:', error.message);
      console.log('   Code:', error.code);
    }

    // Test 3: Service discovery from core app
    console.log('\n📡 Step 3: Testing service discovery...');
    try {
      const servicesResponse = await axios.get(`${BASE_URL}/api/services/status`);
      console.log('✅ Service discovery accessible');
      console.log('   Services:', JSON.stringify(servicesResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Service discovery failed:', error.response?.data || error.message);
    }

    // Test 4: Direct AI modules tax analysis
    console.log('\n💰 Step 4: Testing AI modules tax analysis directly...');
    try {
      const directAIResponse = await axios.post(`${AI_MODULES_URL}/api/ai-tax/analyze-transaction`, {
        description: 'Office supplies from Officeworks',
        amount: 150.00,
        date: '2024-01-15',
        category: 'Office Supplies',
        userProfile: {
          businessType: 'SOLE_TRADER',
          countryCode: 'AU',
          occupation: 'Software Developer'
        },
        type: 'expense'
      });
      console.log('✅ Direct AI analysis successful');
      console.log('   Response:', JSON.stringify(directAIResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Direct AI analysis failed:', error.response?.data || error.message);
    }

    // Test 5: AI modules batch analysis
    console.log('\n🔄 Step 5: Testing AI modules batch analysis...');
    try {
      const batchAIResponse = await axios.post(`${AI_MODULES_URL}/api/ai-tax/batch-analyze`, {
        transactions: [{
          id: 'test-1',
          description: 'Office supplies',
          amount: 150.00,
          date: '2024-01-15',
          category: 'Office Supplies',
          type: 'expense'
        }],
        userProfile: {
          businessType: 'SOLE_TRADER',
          countryCode: 'AU',
          occupation: 'Software Developer'
        }
      });
      console.log('✅ Batch AI analysis successful');
      console.log('   Response:', JSON.stringify(batchAIResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Batch AI analysis failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Service connectivity test failed:', error.message);
  }
}

// Run the test
testServiceConnectivity(); 