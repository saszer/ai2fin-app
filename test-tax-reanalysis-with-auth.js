const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test user credentials (try different passwords)
const TEST_USERS = [
  { email: 'test@example.com', password: 'password123' },
  { email: 'test@example.com', password: 'testpassword123' },
  { email: 'test@example.com', password: 'password' },
  { email: 'test@embracingearth.space', password: 'password123' },
  { email: 'demo@example.com', password: 'password123' }
];

async function testTaxReanalysisWithAuth() {
  try {
    console.log('🧪 Testing Tax Reanalysis with Authentication...\n');

    // Step 1: Try to login with different test users
    console.log('🔐 Step 1: Attempting login with test users...');
    let loginResponse;
    let TEST_USER;
    
    for (const user of TEST_USERS) {
      try {
        console.log(`   Trying ${user.email}...`);
        loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, user);
        if (loginResponse.data.success) {
          TEST_USER = user;
          console.log(`✅ Login successful with ${user.email}`);
          break;
        }
      } catch (error) {
        console.log(`   ❌ Failed: ${error.response?.data?.error || error.message}`);
        continue;
      }
    }
    
    // If no existing user worked, create a new one
    if (!loginResponse || !loginResponse.data.success) {
      console.log('👤 No existing users worked, creating new test user...');
      TEST_USER = TEST_USERS[0]; // Use first user for creation
      
      try {
        const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
          ...TEST_USER,
          firstName: 'Test',
          lastName: 'User',
          countryCode: 'AU',
          businessType: 'SOLE_TRADER',
          profession: 'Software Developer',
          industry: 'SOFTWARE_SERVICES'
        });
        
        if (!registerResponse.data.success) {
          throw new Error('User registration failed');
        }
        
        console.log('✅ Test user created successfully');
        
        // Now login
        loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
      } catch (regError) {
        throw new Error(`Registration failed: ${regError.response?.data?.error || regError.message}`);
      }
    }
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Configure axios with auth token
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Step 2: Check current analysis status
    console.log('\n📊 Step 2: Checking current tax analysis status...');
    let response = await axios.post(`${BASE_URL}/api/intelligent-tax-deduction/analyze-for-tax-deduction`, {
      userFilters: {},
      includeAlreadyAnalyzed: false,
      userContext: {
        businessType: 'SOLE_TRADER',
        countryCode: 'AU',
        occupation: 'Software Developer'
      }
    });
    
    console.log(`   - Total transactions: ${response.data.totalTransactions || 0}`);
    console.log(`   - Already analyzed: ${response.data.alreadyAnalyzed || 0}`);
    console.log(`   - Need analysis: ${response.data.needAnalysis || 0}`);
    console.log(`   - Success: ${response.data.success}\n`);
    
    // Step 3: Force reanalysis of ALL transactions
    console.log('🔥 Step 3: Forcing reanalysis of ALL transactions...');
    response = await axios.post(`${BASE_URL}/api/intelligent-tax-deduction/analyze-for-tax-deduction`, {
      userFilters: {},
      includeAlreadyAnalyzed: true, // 🔥 Force reanalysis
      userContext: {
        businessType: 'SOLE_TRADER',
        countryCode: 'AU',
        occupation: 'Software Developer'
      }
    });
    
    console.log(`✅ Forced reanalysis completed:`);
    console.log(`   - Total processed: ${response.data.totalTransactions || 0}`);
    console.log(`   - Analysis results: ${response.data.results ? response.data.results.length : 0}`);
    console.log(`   - Processing time: ${response.data.processingTime || 0}ms`);
    console.log(`   - Cost estimate: $${response.data.costEstimate || 0}`);
    
    if (response.data.results && response.data.results.length > 0) {
      console.log('\n📊 Sample analysis results:');
      response.data.results.slice(0, 5).forEach((result, i) => {
        console.log(`   ${i+1}. "${result.description}" ($${result.amount})`);
        console.log(`      Tax deductible: ${result.isTaxDeductible ? 'YES' : 'NO'}`);
        console.log(`      Business use: ${result.businessUsePercentage || 0}%`);
        console.log(`      Confidence: ${(result.confidence || 0).toFixed(2)}`);
        console.log(`      Category: ${result.taxCategory || 'Unknown'}`);
        console.log('');
      });
    }
    
    // Step 4: Verify the fix worked - check analysis status again
    console.log('🔍 Step 4: Verifying fix - checking analysis status again...');
    response = await axios.post(`${BASE_URL}/api/intelligent-tax-deduction/analyze-for-tax-deduction`, {
      userFilters: {},
      includeAlreadyAnalyzed: false,
      userContext: {
        businessType: 'SOLE_TRADER',
        countryCode: 'AU',
        occupation: 'Software Developer'
      }
    });
    
    console.log(`   - Total transactions: ${response.data.totalTransactions || 0}`);
    console.log(`   - Already analyzed: ${response.data.alreadyAnalyzed || 0}`);
    console.log(`   - Need analysis: ${response.data.needAnalysis || 0}`);
    
    if (response.data.alreadyAnalyzed > 0) {
      console.log('\n✅ SUCCESS: Transactions now show as properly analyzed!');
      console.log(`💰 Found ${response.data.alreadyAnalyzed} analyzed transactions`);
      
      // Get summary stats
      if (response.data.deductibleValue !== undefined) {
        console.log(`💸 Total deductible value: $${response.data.deductibleValue}`);
      }
      if (response.data.averageBusinessUse !== undefined) {
        console.log(`📊 Average business use: ${response.data.averageBusinessUse}%`);
      }
    } else {
      console.log('\n❌ Issue: Transactions still not showing as analyzed');
      console.log('🔧 This might indicate the analysis results are not being saved properly');
    }
    
  } catch (error) {
    console.error('❌ Error in tax reanalysis test:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Authentication failed. The server might need proper JWT secret configuration.');
    }
  }
}

// Run the test
testTaxReanalysisWithAuth(); 