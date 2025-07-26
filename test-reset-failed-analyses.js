const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

async function testResetFailedAnalyses() {
  try {
    console.log('🔧 Testing Reset Failed Tax Analyses...\n');

    // Step 1: Login
    console.log('🔐 Step 1: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Configure axios with auth token
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Step 2: Check current analysis status
    console.log('\n📊 Step 2: Checking current analysis status...');
    const statusResponse = await axios.post(`${BASE_URL}/api/intelligent-tax-deduction/analyze-for-tax-deduction`, {
      includeAlreadyAnalyzed: false,
      filters: {},
      userContext: {
        businessType: 'SOLE_TRADER',
        countryCode: 'AU',
        occupation: 'Software Developer'
      }
    });
    
    const statusData = statusResponse.data.data;
    console.log(`   - Total transactions: ${statusData.totalTransactions}`);
    console.log(`   - Already analyzed: ${statusData.alreadyAnalyzed}`);
    console.log(`   - Need analysis: ${statusData.needAnalysis}`);
    
    // Step 3: Reset failed analyses
    console.log('\n🔄 Step 3: Resetting failed analyses...');
    const resetResponse = await axios.post(`${BASE_URL}/api/intelligent-tax-deduction/reset-failed`);
    
    if (resetResponse.data.success) {
      const resetData = resetResponse.data.data;
      console.log('✅ Reset completed successfully!');
      console.log(`   - Total transactions checked: ${resetData.totalTransactions}`);
      console.log(`   - Failed analyses found: ${resetData.failedAnalyses}`);
      console.log(`   - Failed analyses cleared: ${resetData.clearedAnalyses}`);
      console.log(`   - Message: ${resetData.message}`);
    } else {
      console.log('❌ Reset failed:', resetResponse.data.error);
      return;
    }
    
    // Step 4: Check status again after reset
    console.log('\n📊 Step 4: Checking analysis status after reset...');
    const newStatusResponse = await axios.post(`${BASE_URL}/api/intelligent-tax-deduction/analyze-for-tax-deduction`, {
      includeAlreadyAnalyzed: false,
      filters: {},
      userContext: {
        businessType: 'SOLE_TRADER',
        countryCode: 'AU',
        occupation: 'Software Developer'
      }
    });
    
    const newStatusData = newStatusResponse.data.data;
    console.log(`   - Total transactions: ${newStatusData.totalTransactions}`);
    console.log(`   - Already analyzed: ${newStatusData.alreadyAnalyzed}`);
    console.log(`   - Need analysis: ${newStatusData.needAnalysis}`);
    
    if (newStatusData.needAnalysis > statusData.needAnalysis) {
      console.log('\n✅ SUCCESS: Failed analyses cleared! More transactions now need analysis.');
      console.log('🔄 You can now retry the tax analysis in the frontend.');
    } else if (newStatusData.needAnalysis === statusData.needAnalysis) {
      console.log('\n⚠️  No change detected - this might mean there were no failed analyses to clear.');
    } else {
      console.log('\n❓ Unexpected result - please check manually.');
    }
    
  } catch (error) {
    console.error('❌ Error testing reset:', error.response?.data || error.message);
  }
}

// Run the test
testResetFailedAnalyses(); 