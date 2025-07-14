// Test AI Configuration
const axios = require('axios');

async function testAIConfiguration() {
  console.log('🧪 Testing AI Configuration...\n');
  
  try {
    // Test the AI modules health
    const healthResponse = await axios.get('http://localhost:3002/api/ai/test');
    console.log('✅ AI Modules Service:', healthResponse.data.message);
    
    // Test actual classification
    const classifyResponse = await axios.post('http://localhost:3002/api/classify', {
      description: 'Netflix Monthly Subscription',
      amount: 15.99,
      type: 'debit'
    });
    
    console.log('\n📊 Classification Test Results:');
    console.log('Success:', classifyResponse.data.success);
    console.log('Confidence:', classifyResponse.data.classification?.confidence);
    console.log('Category:', classifyResponse.data.classification?.category);
    console.log('Tax Deductible:', classifyResponse.data.classification?.isTaxDeductible);
    
    if (classifyResponse.data.success && classifyResponse.data.classification?.confidence > 0.5) {
      console.log('\n🎉 SUCCESS: AI is working with real analysis!');
      console.log('🚀 Your system is now providing intelligent transaction classification.');
    } else if (classifyResponse.data.mock) {
      console.log('\n⚠️  MOCK MODE: AI key not configured properly');
      console.log('💡 Set OPENAI_API_KEY environment variable');
    } else {
      console.log('\n❌ ISSUE: AI responding but with low confidence');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure AI modules service is running (npm start in ai2-ai-modules)');
    console.log('2. Check OPENAI_API_KEY is set correctly');
    console.log('3. Verify your OpenAI API key has credits');
  }
}

testAIConfiguration(); 