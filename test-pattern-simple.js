const axios = require('axios');

async function testPatternAnalysis() {
  console.log('🧪 TESTING PATTERN ANALYSIS WITH DEBUG\n');
  
  // Create perfect test data that should definitely be detected
  const perfectTestData = [
    // Netflix - Perfect monthly pattern
    {
      id: 'netflix1',
      description: 'NETFLIX.COM',
      merchant: 'NETFLIX',
      amount: -15.99,
      date: '2024-01-15'
    },
    {
      id: 'netflix2',
      description: 'NETFLIX.COM', 
      merchant: 'NETFLIX',
      amount: -15.99,
      date: '2024-02-15'
    },
    {
      id: 'netflix3',
      description: 'NETFLIX.COM',
      merchant: 'NETFLIX', 
      amount: -15.99,
      date: '2024-03-15'
    },
    {
      id: 'netflix4',
      description: 'NETFLIX.COM',
      merchant: 'NETFLIX',
      amount: -15.99,
      date: '2024-04-15'
    },
    
    // Spotify - Monthly with slight variation
    {
      id: 'spotify1',
      description: 'SPOTIFY PREMIUM',
      merchant: 'SPOTIFY',
      amount: -9.99,
      date: '2024-01-05'
    },
    {
      id: 'spotify2',
      description: 'SPOTIFY PREMIUM',
      merchant: 'SPOTIFY',
      amount: -9.99,
      date: '2024-02-05'
    },
    {
      id: 'spotify3',
      description: 'SPOTIFY PREMIUM',
      merchant: 'SPOTIFY',
      amount: -10.99,
      date: '2024-03-05'
    },
    
    // Random transactions (should not form patterns)
    {
      id: 'random1',
      description: 'WOOLWORTHS GROCERIES',
      merchant: 'WOOLWORTHS',
      amount: -67.82,
      date: '2024-03-12'
    }
  ];
  
  console.log(`🔍 Testing with ${perfectTestData.length} transactions:`);
  console.log(`   Netflix: 4 monthly transactions (perfect 31-day intervals)`);
  console.log(`   Spotify: 3 monthly transactions`);
  console.log(`   Woolworths: 1 random transaction\n`);
  
  try {
    // Test with debug endpoint (no auth required)
    console.log('📡 Calling pattern analysis endpoint...\n');
    
    const response = await axios.post('http://localhost:3001/api/bills-patterns/simple-debug', {
      transactions: perfectTestData
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`\n✅ Response Status: ${response.status}`);
    console.log(`📊 Response Data:`, response.data);
    
    const patterns = response.data.patterns || [];
    console.log(`\n🎯 PATTERNS DETECTED: ${patterns.length}`);
    
    if (patterns.length > 0) {
      patterns.forEach((pattern, i) => {
        console.log(`\n   Pattern ${i + 1}: ${pattern.name}`);
        console.log(`      Merchant: ${pattern.merchant}`);
        console.log(`      Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
        console.log(`      Transactions: ${pattern.transactionCount}`);
        console.log(`      Frequency: ${pattern.frequency}`);
        console.log(`      Recommended: ${pattern.isRecommended ? '✅' : '❌'}`);
        console.log(`      Reasoning: ${pattern.reasoning}`);
      });
      
      console.log(`\n🎉 SUCCESS: Pattern detection is working!`);
    } else {
      console.log(`\n❌ FAILURE: No patterns detected even with perfect test data`);
      console.log(`   This indicates a bug in the pattern detection algorithm`);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status);
      console.log('   Response:', error.response.data);
      
      if (error.response.status === 404) {
        console.log('\n🔄 Trying main endpoint...');
        try {
          const mainResponse = await axios.post('http://localhost:3001/api/bills-patterns/analyze-patterns-debug', {
            transactions: perfectTestData
          }, {
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json'
            }
          });
          console.log('✅ Main endpoint response:', mainResponse.data);
        } catch (mainError) {
          console.log('❌ Main endpoint also failed:', mainError.response?.status, mainError.response?.data);
        }
      }
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testPatternAnalysis(); 