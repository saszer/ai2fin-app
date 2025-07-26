const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testOpenAIVerification() {
  console.log('🤖 Testing OpenAI API Integration...\n');
  
  try {
    // Check if OpenAI is configured
    console.log('1️⃣ Checking OpenAI configuration...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is healthy');
    
    // Test a simple classification to see if it makes OpenAI calls
    console.log('\n2️⃣ Testing AI categorization endpoint...');
    try {
      const classifyResponse = await axios.post(`${BASE_URL}/api/enhanced-ai-categorization/classify`, {
        userTransactions: [{
          id: 'test-1',
          description: 'Office supplies from Officeworks',
          amount: -150.00,
          date: '2024-01-15',
          category: 'Uncategorized'
        }],
        userProfile: {
          businessType: 'SOLE_TRADER',
          countryCode: 'AU',
          occupation: 'Software Developer',
          industry: 'SOFTWARE_SERVICES'
        },
        preferences: {
          enableAIClassification: true
        },
        showOpenAICallDetails: true
      });
      
      console.log('✅ Classification response received');
      
      // Check for OpenAI usage indicators
      const openaiDetails = classifyResponse.data.openaiDetails;
      if (openaiDetails) {
        console.log('\n🔍 OpenAI Usage Details:');
        console.log(`   - Total calls: ${openaiDetails.totalCalls || 0}`);
        console.log(`   - Total tokens: ${openaiDetails.totalTokens || 0}`);
        console.log(`   - Model used: ${openaiDetails.model || 'Unknown'}`);
        console.log(`   - Cost estimate: $${openaiDetails.estimatedCost || 0}`);
        
        if (openaiDetails.totalCalls > 0) {
          console.log('\n🎉 REAL OPENAI CALLS DETECTED!');
          console.log('   The system is making actual API calls to OpenAI');
        } else {
          console.log('\n⚠️  No OpenAI calls detected');
          console.log('   The system might be using mock/cached responses');
        }
      } else {
        console.log('\n❌ No OpenAI details in response');
      }
      
    } catch (classifyError) {
      console.log('❌ Classification test failed:', classifyError.response?.data?.error || classifyError.message);
    }
    
    // Test environment variables
    console.log('\n3️⃣ Checking environment configuration...');
    console.log(`   - OPENAI_API_KEY present: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
    console.log(`   - OPENAI_API_KEY length: ${process.env.OPENAI_API_KEY?.length || 0}`);
    console.log(`   - AI_MODEL: ${process.env.AI_MODEL || 'Not set'}`);
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('\n⚠️  OPENAI_API_KEY not found in environment!');
      console.log('   This explains why no real AI calls are being made.');
      console.log('   To enable real AI calls:');
      console.log('   1. Set OPENAI_API_KEY in your .env file');
      console.log('   2. Restart the server');
    }
    
    // Test direct OpenAI endpoint (if key exists)
    if (process.env.OPENAI_API_KEY) {
      console.log('\n4️⃣ Testing direct OpenAI API access...');
      try {
        const directResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Test: Is office supplies tax deductible for business?' }],
            max_tokens: 50
          })
        });
        
        if (directResponse.ok) {
          console.log('✅ Direct OpenAI API access works');
          const result = await directResponse.json();
          console.log('   Sample response:', result.choices[0]?.message?.content?.substring(0, 100) + '...');
        } else {
          console.log('❌ Direct OpenAI API access failed:', directResponse.status, directResponse.statusText);
        }
      } catch (directError) {
        console.log('❌ Direct OpenAI test error:', directError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in OpenAI verification:', error.message);
  }
}

// Run the test
testOpenAIVerification(); 