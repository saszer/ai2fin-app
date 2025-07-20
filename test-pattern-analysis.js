/**
 * 🧪 Pattern Analysis Test Script
 * Tests the new bill pattern analysis endpoints
 */

const API_BASE = 'http://localhost:3001';

// Mock transaction data for testing
const mockTransactions = [
  {
    id: 'tx1',
    description: 'SPOTIFY PREMIUM',
    amount: -14.99,
    date: '2024-01-15',
    merchant: 'Spotify',
    primaryType: 'expense'
  },
  {
    id: 'tx2', 
    description: 'SPOTIFY PREMIUM',
    amount: -14.99,
    date: '2024-02-15',
    merchant: 'Spotify',
    primaryType: 'expense'
  },
  {
    id: 'tx3',
    description: 'SPOTIFY PREMIUM', 
    amount: -14.99,
    date: '2024-03-15',
    merchant: 'Spotify',
    primaryType: 'expense'
  },
  {
    id: 'tx4',
    description: 'WOOLWORTHS GROCERIES',
    amount: -89.50,
    date: '2024-01-07',
    merchant: 'Woolworths',
    primaryType: 'expense'
  },
  {
    id: 'tx5',
    description: 'WOOLWORTHS GROCERIES',
    amount: -92.30,
    date: '2024-01-14',
    merchant: 'Woolworths', 
    primaryType: 'expense'
  },
  {
    id: 'tx6',
    description: 'WOOLWORTHS GROCERIES',
    amount: -87.80,
    date: '2024-01-21',
    merchant: 'Woolworths',
    primaryType: 'expense'
  },
  {
    id: 'tx7',
    description: 'ORIGIN ENERGY BILL',
    amount: -156.80,
    date: '2024-01-20',
    merchant: 'Origin Energy',
    primaryType: 'expense'
  },
  {
    id: 'tx8',
    description: 'ORIGIN ENERGY BILL',
    amount: -162.45,
    date: '2024-04-20',
    merchant: 'Origin Energy',
    primaryType: 'expense'
  }
];

async function testPatternAnalysis() {
  console.log('🧪 Testing Pattern Analysis API');
  console.log('================================');

  try {
    // Test 1: Analyze patterns
    console.log('\n📊 Step 1: Testing pattern analysis...');
    
    const analyzeResponse = await fetch(`${API_BASE}/api/bills/analyze-patterns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You'll need a real JWT token
      },
      body: JSON.stringify({
        transactions: mockTransactions
      })
    });

    if (!analyzeResponse.ok) {
      console.log(`❌ Pattern analysis failed: ${analyzeResponse.status} ${analyzeResponse.statusText}`);
      console.log('Response:', await analyzeResponse.text());
      return;
    }

    const analyzeData = await analyzeResponse.json();
    console.log('✅ Pattern analysis successful!');
    console.log(`📈 Found ${analyzeData.patterns?.length || 0} patterns`);
    
    if (analyzeData.patterns && analyzeData.patterns.length > 0) {
      console.log('\n🔍 Detected Patterns:');
      analyzeData.patterns.forEach((pattern, index) => {
        console.log(`  ${index + 1}. ${pattern.name}`);
        console.log(`     Merchant: ${pattern.merchant}`);
        console.log(`     Frequency: ${pattern.frequency}`);
        console.log(`     Confidence: ${Math.round(pattern.confidence * 100)}%`);
        console.log(`     Transactions: ${pattern.transactionCount}`);
        console.log(`     Average Amount: $${pattern.averageAmount.toFixed(2)}`);
        console.log(`     Recommended: ${pattern.isRecommended ? 'Yes' : 'No'}`);
        console.log('');
      });

      // Test 2: Create bills from patterns (if patterns were found)
      console.log('\n🏗️ Step 2: Testing bill creation...');
      
      const createResponse = await fetch(`${API_BASE}/api/bills/create-from-patterns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // You'll need a real JWT token
        },
        body: JSON.stringify({
          patterns: analyzeData.patterns.slice(0, 2) // Test with first 2 patterns
        })
      });

      if (!createResponse.ok) {
        console.log(`❌ Bill creation failed: ${createResponse.status} ${createResponse.statusText}`);
        console.log('Response:', await createResponse.text());
        return;
      }

      const createData = await createResponse.json();
      console.log('✅ Bill creation successful!');
      console.log(`📋 Created ${createData.results?.billsCreated || 0} bill patterns`);
      console.log(`🔗 Linked ${createData.results?.transactionsLinked || 0} transactions`);
      console.log(`📅 Created ${createData.results?.occurrencesCreated || 0} occurrences`);
      
    } else {
      console.log('📝 No patterns detected in test data');
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Details:', error);
  }
}

async function testWithoutAuth() {
  console.log('🧪 Testing API Endpoints (No Auth)');
  console.log('===================================');

  try {
    // Test endpoint availability
    const response = await fetch(`${API_BASE}/api/bills/analyze-patterns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transactions: mockTransactions.slice(0, 3)
      })
    });

    console.log(`📡 API Response Status: ${response.status}`);
    console.log(`📡 API Response Status Text: ${response.statusText}`);
    
    if (response.status === 401) {
      console.log('✅ Authentication required (expected)');
      console.log('💡 To test with authentication, you need a valid JWT token');
    } else {
      const data = await response.text();
      console.log('📄 Response:', data);
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running on port 3001');
      console.log('💡 Start the server with: npm start');
    } else {
      console.error('❌ Connection error:', error.message);
    }
  }
}

// Check if server is running and test endpoints
async function main() {
  console.log('🚀 Pattern Analysis Test Suite');
  console.log('==============================');
  console.log(`📍 Testing API at: ${API_BASE}`);
  console.log('');

  // First test without auth to check if server is running
  await testWithoutAuth();
  
  console.log('\n📝 To run full tests with authentication:');
  console.log('1. Make sure you\'re logged in to the app');
  console.log('2. Get a JWT token from localStorage or login response');
  console.log('3. Replace "test-token" in this script with the real token');
  console.log('4. Run: node test-pattern-analysis.js');
}

if (require.main === module) {
  main();
}

module.exports = { testPatternAnalysis, mockTransactions }; 