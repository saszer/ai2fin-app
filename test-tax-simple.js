const axios = require('axios');

async function testTaxAnalysisSimple() {
  console.log('🔍 Testing Tax Analysis (Simple)...\n');
  
  try {
    // Test the health endpoint first
    console.log('1. Testing server health...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Server is healthy\n');
    
    // Test getting user preferences first (might not need auth)
    console.log('2. Testing user preferences endpoint...');
    try {
      const prefsResponse = await axios.get('http://localhost:3001/api/intelligent-tax-deduction/preferences');
      console.log('✅ Preferences endpoint accessible');
      console.log('   Response:', prefsResponse.data);
    } catch (error) {
      console.log('❌ Preferences endpoint needs auth:', error.response?.data?.error || error.message);
    }
    
    // Test the analytics endpoint (might be open)
    console.log('\n3. Testing analytics endpoint...');
    try {
      const analyticsResponse = await axios.get('http://localhost:3001/api/intelligent-tax-deduction/analytics');
      console.log('✅ Analytics endpoint accessible');
      console.log('   Response:', analyticsResponse.data);
    } catch (error) {
      console.log('❌ Analytics endpoint needs auth:', error.response?.data?.error || error.message);
    }
    
    // Test a simple transaction analysis without auth
    console.log('\n4. Testing simple transaction analysis...');
    try {
      const analysisResponse = await axios.post('http://localhost:3001/api/intelligent-tax-deduction/analyze-transaction', {
        description: 'Office supplies from Officeworks',
        amount: 150.00,
        category: 'Office Supplies',
        userContext: {
          businessType: 'INDIVIDUAL',
          countryCode: 'AU'
        }
      });
      console.log('✅ Transaction analysis successful');
      console.log('   Response:', analysisResponse.data);
    } catch (error) {
      console.log('❌ Transaction analysis needs auth:', error.response?.data?.error || error.message);
    }
    
  } catch (error) {
    console.error('❌ Error in tax analysis test:', error.message);
  }
}

// Run the test
testTaxAnalysisSimple(); 