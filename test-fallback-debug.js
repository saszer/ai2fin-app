const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testFallbackDebug() {
  try {
    console.log('🔧 Debugging Tax Analysis Fallback...\n');

    // Login
    console.log('🔐 Step 1: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Test with clear test data
    console.log('\n🔄 Step 2: Testing batch analysis...');
    
    const testTransaction = {
      id: 'debug-test-1',
      description: 'Debug test office supplies',
      amount: -150.00,
      date: '2024-01-15T00:00:00.000Z',
      category: 'Office Supplies',
      primaryType: 'expense',
      secondaryType: 'expense',
      merchant: 'Test Merchant'
    };
    
    console.log('📤 Sending transaction:', JSON.stringify(testTransaction, null, 2));
    
    const analysisResponse = await axios.post(`${BASE_URL}/api/intelligent-tax-deduction/analyze-batch`, {
      transactions: [testTransaction],
      userContext: {
        businessType: 'SOLE_TRADER',
        countryCode: 'AU',
        occupation: 'Software Developer'
      }
    });

    if (analysisResponse.data.success) {
      console.log('✅ Analysis successful');
      console.log('\n📥 Received results:');
      analysisResponse.data.results.forEach((result, index) => {
        console.log(`\nResult ${index + 1}:`);
        console.log(`  ID: ${result.id}`);
        console.log(`  Description: "${result.description}" (${typeof result.description})`);
        console.log(`  Amount: ${result.amount} (${typeof result.amount})`);
        console.log(`  Date: "${result.date}" (${typeof result.date})`);
        console.log(`  Category: "${result.category}" (${typeof result.category})`);
        console.log(`  Type: "${result.type}" (${typeof result.type})`);
        console.log(`  Source: ${result.source}`);
        console.log(`  Reasoning: ${result.reasoning}`);
        
        // Check for undefined/null values
        console.log('\n🔍 Debugging undefined values:');
        console.log(`  description === undefined: ${result.description === undefined}`);
        console.log(`  description === null: ${result.description === null}`);
        console.log(`  amount === undefined: ${result.amount === undefined}`);
        console.log(`  date === undefined: ${result.date === undefined}`);
        console.log(`  category === undefined: ${result.category === undefined}`);
      });
      
    } else {
      console.log('❌ Analysis failed:', analysisResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testFallbackDebug(); 