const axios = require('axios');

// Set up authentication
const API_BASE = 'http://localhost:3001';
const authToken = 'test-auth-token'; // Use actual auth token if needed

// Configure axios defaults
axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
axios.defaults.headers.common['Content-Type'] = 'application/json';

async function testForceTaxReanalysis() {
  console.log('🔍 Testing Force Tax Reanalysis...\n');
  
  try {
    // Step 1: Test current analysis status
    console.log('1. Checking current analysis status...');
    let response = await axios.post('http://localhost:3001/api/intelligent-tax-deduction/analyze-for-tax-deduction', {
      userFilters: {},
      includeAlreadyAnalyzed: false,
      userContext: {
        businessType: 'INDIVIDUAL',
        countryCode: 'AU',
        occupation: 'Software Developer'
      }
    });
    
    console.log(`   - Total transactions: ${response.data.totalTransactions}`);
    console.log(`   - Already analyzed: ${response.data.alreadyAnalyzed}`);
    console.log(`   - Need analysis: ${response.data.needAnalysis}`);
    console.log(`   - Success: ${response.data.success}\n`);
    
    // Step 2: Force reanalysis of ALL transactions
    console.log('2. Forcing reanalysis of ALL transactions...');
    response = await axios.post('http://localhost:3001/api/intelligent-tax-deduction/analyze-for-tax-deduction', {
      userFilters: {},
      includeAlreadyAnalyzed: true, // 🔥 Force reanalysis
      userContext: {
        businessType: 'INDIVIDUAL',
        countryCode: 'AU',
        occupation: 'Software Developer'
      }
    });
    
    console.log(`✅ Forced reanalysis results:`);
    console.log(`   - Total processed: ${response.data.totalTransactions}`);
    console.log(`   - Analysis results: ${response.data.results ? response.data.results.length : 0}`);
    console.log(`   - Processing time: ${response.data.processingTime}ms`);
    console.log(`   - Cost estimate: $${response.data.costEstimate || 0}`);
    
    if (response.data.results && response.data.results.length > 0) {
      console.log('\n📊 Sample analysis results:');
      response.data.results.slice(0, 3).forEach((result, i) => {
        console.log(`   ${i+1}. "${result.description}" ($${result.amount})`);
        console.log(`      Tax deductible: ${result.isTaxDeductible ? 'YES' : 'NO'}`);
        console.log(`      Business use: ${result.businessUsePercentage || 0}%`);
        console.log(`      Confidence: ${result.confidence || 0}`);
        console.log('');
      });
    }
    
    // Step 3: Verify the fix worked
    console.log('3. Verifying fix - checking analysis status again...');
    response = await axios.post('http://localhost:3001/api/intelligent-tax-deduction/analyze-for-tax-deduction', {
      userFilters: {},
      includeAlreadyAnalyzed: false,
      userContext: {
        businessType: 'INDIVIDUAL',
        countryCode: 'AU',
        occupation: 'Software Developer'
      }
    });
    
    console.log(`   - Total transactions: ${response.data.totalTransactions}`);
    console.log(`   - Already analyzed: ${response.data.alreadyAnalyzed}`);
    console.log(`   - Need analysis: ${response.data.needAnalysis}`);
    
    if (response.data.alreadyAnalyzed > 0) {
      console.log('\n✅ SUCCESS: Transactions now show as properly analyzed!');
    } else {
      console.log('\n❌ Issue: Transactions still not showing as analyzed');
    }
    
  } catch (error) {
    console.error('❌ Error testing tax reanalysis:', error.response?.data || error.message);
  }
}

// Run the test
testForceTaxReanalysis(); 