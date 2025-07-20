const axios = require('axios');

// Test transactions with CLEAR PATTERNS
const testTransactions = [
  // Netflix Monthly Pattern - Perfect 30-day intervals
  {
    id: 'netflix_1',
    description: 'NETFLIX.COM',
    amount: -15.99,
    date: '2024-01-15',
    merchant: 'NETFLIX',
    category: 'Entertainment'
  },
  {
    id: 'netflix_2', 
    description: 'NETFLIX.COM',
    amount: -15.99,
    date: '2024-02-15',
    merchant: 'NETFLIX',
    category: 'Entertainment'
  },
  {
    id: 'netflix_3',
    description: 'NETFLIX.COM', 
    amount: -15.99,
    date: '2024-03-15',
    merchant: 'NETFLIX',
    category: 'Entertainment'
  },
  {
    id: 'netflix_4',
    description: 'NETFLIX.COM',
    amount: -15.99,
    date: '2024-04-15', 
    merchant: 'NETFLIX',
    category: 'Entertainment'
  },
  {
    id: 'netflix_5',
    description: 'NETFLIX.COM',
    amount: -15.99,
    date: '2024-05-15',
    merchant: 'NETFLIX',
    category: 'Entertainment'
  },

  // Spotify Monthly Pattern
  {
    id: 'spotify_1',
    description: 'SPOTIFY PREMIUM',
    amount: -9.99,
    date: '2024-01-05',
    merchant: 'SPOTIFY',
    category: 'Entertainment'
  },
  {
    id: 'spotify_2',
    description: 'SPOTIFY PREMIUM',
    amount: -9.99,
    date: '2024-02-05',
    merchant: 'SPOTIFY', 
    category: 'Entertainment'
  },
  {
    id: 'spotify_3',
    description: 'SPOTIFY PREMIUM',
    amount: -10.99,
    date: '2024-03-05',
    merchant: 'SPOTIFY',
    category: 'Entertainment'
  },
  {
    id: 'spotify_4',
    description: 'SPOTIFY PREMIUM',
    amount: -10.99,
    date: '2024-04-05',
    merchant: 'SPOTIFY',
    category: 'Entertainment'
  },

  // Electricity Bill Pattern
  {
    id: 'electric_1',
    description: 'ENERGY AUSTRALIA',
    amount: -156.78,
    date: '2024-01-28',
    merchant: 'ENERGY AUSTRALIA',
    category: 'Utilities'
  },
  {
    id: 'electric_2',
    description: 'ENERGY AUSTRALIA',
    amount: -203.45,
    date: '2024-02-28',
    merchant: 'ENERGY AUSTRALIA',
    category: 'Utilities'  
  },
  {
    id: 'electric_3',
    description: 'ENERGY AUSTRALIA',
    amount: -178.92,
    date: '2024-03-28',
    merchant: 'ENERGY AUSTRALIA',
    category: 'Utilities'
  }
];

async function testPatternDetection() {
  console.log('🧪 Testing Pattern Detection\n');
  
  console.log('📊 Test Data:');
  console.log('   Netflix: 5 monthly transactions');
  console.log('   Spotify: 4 monthly transactions');
  console.log('   Energy: 3 monthly bills\n');

  try {
    const response = await axios.post('http://localhost:3001/api/bills-patterns/analyze-patterns', {
      transactions: testTransactions
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Status:', response.status);
    console.log('⏱️ Time:', response.data.processingTime, 'ms\n');

    if (response.data.success) {
      const patterns = response.data.patterns || [];
      console.log(`🎯 PATTERNS DETECTED: ${patterns.length}\n`);

      patterns.forEach((pattern, index) => {
        console.log(`Pattern ${index + 1}: ${pattern.name}`);
        console.log(`   Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
        console.log(`   Transactions: ${pattern.transactionCount}`);
        console.log(`   Amount: $${pattern.averageAmount?.toFixed(2)}`);
        console.log(`   Recommended: ${pattern.isRecommended ? '✅' : '❌'}\n`);
      });

      if (patterns.length >= 2) {
        console.log('🎉 SUCCESS: Pattern detection working!');
      } else {
        console.log('⚠️ Expected more patterns');
      }

    } else {
      console.log('❌ Analysis failed:', response.data.error);
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running');
    } else if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testPatternDetection(); 