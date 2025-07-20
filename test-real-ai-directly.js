const axios = require('axios');

async function testRealAI() {
  console.log('🚀 Testing AI Modules Service Directly...');
  
  try {
    // Test single transaction classification
    const response = await axios.post('http://localhost:3002/api/classify', {
      description: 'Gas Station Purchase',
      amount: -45.20,
      type: 'debit',
      merchant: 'Shell Station',
      date: new Date().toISOString(),
      analysisType: 'single'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
    
    // Check if it's mock or real
    if (response.data.mock) {
      console.log('❌ Still getting MOCK response!');
      console.log('💡 Check if OpenAI API key is loaded correctly');
    } else {
      console.log('🎉 SUCCESS: Real AI response received!');
      if (response.data.openai_calls > 0) {
        console.log('🔥 OpenAI calls made:', response.data.openai_calls);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📊 Error Response:', error.response.data);
    }
  }
}

testRealAI(); 