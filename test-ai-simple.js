const axios = require('axios');

async function testAISimple() {
  try {
    console.log('🔧 Testing AI Modules Transaction Details...\n');

    const testData = {
      description: 'Office supplies from Staples',
      amount: 150.00,
      date: '2024-01-15T00:00:00.000Z',
      category: 'Office Supplies',
      userProfile: {
        countryCode: 'AU',
        occupation: 'Software Developer',
        businessType: 'SOLE_TRADER'
      },
      type: 'expense'
    };

    console.log('📤 Sending to AI modules:');
    console.log(JSON.stringify(testData, null, 2));

    const response = await axios.post('http://localhost:3002/api/ai-tax/analyze-transaction', testData);

    console.log('\n📥 Received from AI modules:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success && response.data.analysis) {
      const analysis = response.data.analysis;
      console.log('\n🔍 Analysis Details:');
      console.log(`  Description: ${analysis.description} (${typeof analysis.description})`);
      console.log(`  Amount: ${analysis.amount} (${typeof analysis.amount})`);
      console.log(`  Date: ${analysis.date} (${typeof analysis.date})`);
      console.log(`  Category: ${analysis.category} (${typeof analysis.category})`);
      console.log(`  Type: ${analysis.type} (${typeof analysis.type})`);
      console.log(`  Tax Deductible: ${analysis.isTaxDeductible}`);
      console.log(`  Confidence: ${analysis.confidence}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAISimple(); 