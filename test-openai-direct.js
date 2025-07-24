// Direct OpenAI API test
// embracingearth.space - AI-powered financial intelligence

// Load environment variables
require('dotenv').config({ path: './ai2-ai-modules/.env' });
require('dotenv').config({ path: './.env' });

const testTransactions = [
  {
    "description": "Spotify Premium",
    "amount": -11.99,
    "merchant": "Spotify"
  },
  {
    "description": "Coles Grocery",
    "amount": -141.6,
    "merchant": "Coles"
  },
  {
    "description": "Salary Deposit",
    "amount": 4500,
    "merchant": "Employer"
  }
];

async function testOpenAIDirect() {
  console.log('🧪 Testing Direct OpenAI API Call...\n');
  
  try {
    // Test 1: Direct OpenAI call
    console.log('1️⃣ Making direct OpenAI API call:');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a financial transaction categorizer. Categorize the given transaction into one of these categories: Marketing, Fuel & Transport, Meals & Entertainment, Office Supplies, Travel, Professional Services, Technology, Utilities. Respond with only the category name.'
          },
          {
            role: 'user',
            content: `Categorize this transaction: ${testTransactions[0].description} ($${Math.abs(testTransactions[0].amount)})`
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ OpenAI API call failed: ${response.status} ${response.statusText}`);
      console.log(`   Error details: ${errorText}`);
      return;
    }

    const data = await response.json();
    console.log(`   ✅ OpenAI API call successful!`);
    console.log(`   🤖 Response: ${data.choices[0].message.content}`);
    console.log(`   📊 Usage: ${data.usage.total_tokens} tokens`);
    console.log(`   💰 Model: ${data.model}\n`);

    // Test 2: Check AI+ microservice logs
    console.log('2️⃣ Checking AI+ microservice logs:');
    
    try {
      const logResponse = await fetch('http://localhost:3002/api/logs/recent');
      if (logResponse.ok) {
        const logData = await logResponse.json();
        console.log(`   ✅ Log endpoint accessible`);
        console.log(`   📝 Recent API calls: ${logData.length || 0}`);
        
        if (logData.length > 0) {
          console.log(`   📊 Latest calls:`);
          logData.slice(-3).forEach((log, i) => {
            console.log(`      ${i+1}. ${log.timestamp} - ${log.service} - ${log.method}`);
          });
        }
      } else {
        console.log(`   ⚠️  Log endpoint not accessible: ${logResponse.status}`);
      }
    } catch (error) {
      console.log(`   ⚠️  Could not check logs: ${error.message}`);
    }

    // Test 3: Make a test call to AI+ microservice
    console.log('\n3️⃣ Making test call to AI+ microservice:');
    
    const aiResponse = await fetch('http://localhost:3002/api/optimized/analyze-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactions: testTransactions.map(tx => ({
          id: `test-${Date.now()}-${Math.random()}`,
          description: tx.description,
          amount: tx.amount,
          merchant: tx.merchant,
          date: new Date().toISOString(),
          type: tx.amount > 0 ? 'credit' : 'debit'
        })),
        selectedCategories: ['Marketing', 'Fuel & Transport', 'Meals & Entertainment', 'Office Supplies', 'Travel', 'Professional Services', 'Technology', 'Utilities'],
        options: {
          enableCategorization: true,
          batchSize: 3,
          confidenceThreshold: 0.8
        },
        userProfile: {
          businessType: 'INDIVIDUAL',
          industry: 'General',
          countryCode: 'AU'
        }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.log(`   ❌ AI+ microservice call failed: ${aiResponse.status} ${aiResponse.statusText}`);
      console.log(`   Error details: ${errorText}`);
      return;
    }

    const aiData = await aiResponse.json();
    console.log(`   ✅ AI+ microservice call successful!`);
    console.log(`   📊 Processed ${aiData.results?.length || 0} transactions`);
    console.log(`   🤖 AI calls: ${aiData.processedWithAI || 0}`);
    console.log(`   💾 Cache hits: ${aiData.processedWithReferenceData || 0}`);
    
    // Check for mock data
    const mockResults = aiData.results?.filter(r => 
      r.reasoning?.includes('MOCK DATA') || 
      r.reasoning?.includes('MOCK FALLBACK')
    ) || [];
    
    if (mockResults.length > 0) {
      console.log(`   ⚠️  Found ${mockResults.length} mock results:`);
      mockResults.forEach(r => {
        console.log(`      - ${r.reasoning}`);
      });
    } else {
      console.log(`   ✅ All results appear to be real AI responses`);
      aiData.results?.forEach((r, i) => {
        console.log(`      ${i+1}. ${r.category} (${r.confidence}) - ${r.reasoning}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n🔍 Debug Information:');
  console.log(`🔑 OpenAI API Key exists: ${!!process.env.OPENAI_API_KEY}`);
  console.log(`🔑 OpenAI API Key length: ${process.env.OPENAI_API_KEY?.length || 0}`);
  console.log(`🔑 OpenAI API Key prefix: ${process.env.OPENAI_API_KEY?.substring(0, 7) || 'N/A'}...`);
}

testOpenAIDirect().catch(console.error); 