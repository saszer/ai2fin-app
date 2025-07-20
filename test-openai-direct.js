const axios = require('axios');
require('dotenv').config({ path: './ai2-ai-modules/.env' });

async function testOpenAIDirectly() {
  console.log('🧪 Testing OpenAI API directly...');
  
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 API Key configured:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NOT FOUND');
  
  if (!apiKey) {
    console.error('❌ No OpenAI API key found in environment variables');
    return;
  }
  
  try {
    console.log('📤 Making test call to OpenAI API...');
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a financial analyst.'
        },
        {
          role: 'user', 
          content: 'Classify this transaction: "Gas Station Purchase -$45.20" as either "bill" or "expense". Respond with just one word.'
        }
      ],
      max_tokens: 10,
      temperature: 0.1
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ OpenAI API call successful!');
    console.log('📊 Response:', response.data.choices[0]?.message?.content);
    console.log('🔥 Tokens used:', response.data.usage?.total_tokens);
    console.log('💰 Estimated cost: $', (response.data.usage?.total_tokens / 1000 * 0.01).toFixed(4));

  } catch (error) {
    console.error('❌ OpenAI API call failed:', error.message);
    if (error.response) {
      console.error('📊 Error details:', error.response.data);
      if (error.response.status === 401) {
        console.error('🔑 Authentication failed - check API key');
      } else if (error.response.status === 429) {
        console.error('🚨 Rate limit or quota exceeded');
      }
    }
  }
}

testOpenAIDirectly(); 