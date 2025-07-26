const axios = require('axios');

const AI_MODULES_URL = 'http://localhost:3002';

async function testAIDirectBatch() {
  try {
    console.log('🔥 Testing AI Modules Batch Endpoint Directly...\n');

    console.log('🧪 Step 1: Test single transaction first...');
    try {
      const singleResponse = await axios.post(`${AI_MODULES_URL}/api/ai-tax/analyze-transaction`, {
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
      console.log('✅ Single transaction analysis successful');
      console.log('   Response:', JSON.stringify(singleResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Single transaction failed:', error.response?.data || error.message);
    }

    console.log('\n🔥 Step 2: Test batch analysis with same data...');
    try {
      const batchResponse = await axios.post(`${AI_MODULES_URL}/api/ai-tax/batch-analyze`, {
        transactions: [
          {
            id: 'test-1',
            description: 'Office supplies from Officeworks',
            amount: 150.00,
            date: '2024-01-15',
            category: 'Office Supplies',
            type: 'expense'
          },
          {
            id: 'test-2', 
            description: 'Client lunch meeting',
            amount: 85.50,
            date: '2024-01-16',
            category: 'Meals',
            type: 'expense'
          }
        ],
        userProfile: {
          businessType: 'SOLE_TRADER',
          countryCode: 'AU',
          occupation: 'Software Developer'
        }
      });
      console.log('✅ Batch analysis successful');
      console.log('   Response:', JSON.stringify(batchResponse.data, null, 2));
      
      if (batchResponse.data.results) {
        console.log('\n📊 Batch Results Analysis:');
        batchResponse.data.results.forEach((result, index) => {
          console.log(`   ${index + 1}. Transaction ${result.id}:`);
          console.log(`      - Tax Deductible: ${result.isTaxDeductible}`);
          console.log(`      - Confidence: ${result.confidence}`);
          console.log(`      - Reasoning: "${result.reasoning}"`);
          console.log(`      - Category: ${result.taxCategory}`);
          console.log(`      - Business Use: ${result.businessUsePercentage}%`);
        });
      }
      
    } catch (error) {
      console.log('❌ Batch analysis failed:', error.response?.data || error.message);
      console.log('   Status:', error.response?.status);
      console.log('   Full error:', error.message);
    }

    console.log('\n🔧 Step 3: Environment check in AI modules context...');
    try {
      const healthResponse = await axios.get(`${AI_MODULES_URL}/health`);
      console.log('✅ AI modules health check');
      console.log('   Health data:', JSON.stringify(healthResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAIDirectBatch(); 