const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

async function testReanalysisToggle() {
  try {
    console.log('🔄 Testing Reanalysis Toggle Functionality...\n');

    // Step 1: Login
    console.log('🔐 Step 1: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Configure axios with auth token
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Step 2: Test with includeAlreadyAnalyzed = false (default)
    console.log('\n📊 Step 2: Testing with includeAlreadyAnalyzed = false...');
    const response1 = await axios.post(`${BASE_URL}/api/intelligent-tax-deduction/analyze-for-tax-deduction`, {
      includeAlreadyAnalyzed: false,
      filters: {},
      userContext: {
        businessType: 'SOLE_TRADER',
        countryCode: 'AU',
        occupation: 'Software Developer'
      }
    });
    
    const data1 = response1.data.data;
    console.log(`   - Total transactions: ${data1.totalTransactions}`);
    console.log(`   - Already analyzed: ${data1.alreadyAnalyzed}`);
    console.log(`   - Need analysis: ${data1.needAnalysis}`);
    console.log(`   - Transactions to analyze: ${data1.transactions ? data1.transactions.length : 0}`);
    
    // Step 3: Test with includeAlreadyAnalyzed = true (force reanalysis)
    console.log('\n🔥 Step 3: Testing with includeAlreadyAnalyzed = true...');
    const response2 = await axios.post(`${BASE_URL}/api/intelligent-tax-deduction/analyze-for-tax-deduction`, {
      includeAlreadyAnalyzed: true,
      filters: {},
      userContext: {
        businessType: 'SOLE_TRADER',
        countryCode: 'AU',
        occupation: 'Software Developer'
      }
    });
    
    const data2 = response2.data.data;
    console.log(`   - Total transactions: ${data2.totalTransactions}`);
    console.log(`   - Already analyzed: ${data2.alreadyAnalyzed}`);
    console.log(`   - Need analysis: ${data2.needAnalysis}`);
    console.log(`   - Transactions to analyze: ${data2.transactions ? data2.transactions.length : 0}`);
    
    // Step 4: Compare results
    console.log('\n📈 Step 4: Comparing results...');
    console.log(`Toggle OFF (false):`);
    console.log(`   - Will analyze: ${data1.transactions ? data1.transactions.length : 0} transactions`);
    console.log(`   - Need analysis count: ${data1.needAnalysis}`);
    
    console.log(`Toggle ON (true):`);
    console.log(`   - Will analyze: ${data2.transactions ? data2.transactions.length : 0} transactions`);
    console.log(`   - Need analysis count: ${data2.needAnalysis}`);
    
    // Verify the toggle is working
    if (data2.transactions && data2.transactions.length > data1.transactions.length) {
      console.log('\n✅ SUCCESS: Toggle is working correctly!');
      console.log(`   - Reanalysis mode includes ${data2.transactions.length - data1.transactions.length} additional transactions`);
      console.log('   - Users can now force reanalysis of previously analyzed transactions');
    } else if (data1.transactions.length === 0 && data2.transactions.length > 0) {
      console.log('\n✅ SUCCESS: Toggle enables analysis of all transactions!');
      console.log(`   - Default mode: ${data1.transactions.length} transactions (cost-optimized)`);
      console.log(`   - Reanalysis mode: ${data2.transactions.length} transactions (includes previous analyses)`);
    } else if (data1.transactions.length === data2.transactions.length) {
      console.log('\n⚠️  Same number of transactions in both modes');
      console.log('   - This is expected if all transactions need analysis anyway');
    } else {
      console.log('\n❓ Unexpected result - please check manually');
    }
    
  } catch (error) {
    console.error('❌ Error testing reanalysis toggle:', error.response?.data || error.message);
  }
}

// Run the test
testReanalysisToggle(); 