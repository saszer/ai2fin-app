const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

async function testDetailedTaxResults() {
  try {
    console.log('🧪 Testing Enhanced Tax Analysis Results...\n');

    // Step 1: Login
    console.log('🔐 Step 1: Logging in...');
    let loginResponse;
    try {
      loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.error || error.message);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Configure axios with auth token
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Step 2: Get transaction list for analysis
    console.log('\n📊 Step 2: Getting transactions for analysis...');
    const analysisResponse = await axios.post(`${BASE_URL}/api/intelligent-tax-deduction/analyze-for-tax-deduction`, {
      includeAlreadyAnalyzed: true, // Force reanalysis to test
      filters: {},
      userContext: {
        businessType: 'SOLE_TRADER',
        countryCode: 'AU',
        occupation: 'Software Developer'
      }
    });
    
    const analysisData = analysisResponse.data.data;
    console.log(`   - Found ${analysisData.totalTransactions} transactions`);
    console.log(`   - Already analyzed: ${analysisData.alreadyAnalyzed}`);
    console.log(`   - Need analysis: ${analysisData.needAnalysis}`);
    
    // Step 3: Run batch analysis on a small sample
    console.log('\n🔥 Step 3: Running batch tax analysis...');
    const sampleTransactions = analysisData.transactions.slice(0, 3); // Test with just 3 transactions
    
    console.log('Sample transactions:');
    sampleTransactions.forEach((tx, i) => {
      console.log(`   ${i+1}. "${tx.description}" ($${tx.amount}) - ${tx.date}`);
    });
    
    const batchResponse = await axios.post(`${BASE_URL}/api/intelligent-tax-deduction/analyze-batch`, {
      transactions: sampleTransactions,
      userContext: {
        businessType: 'SOLE_TRADER',
        countryCode: 'AU',
        occupation: 'Software Developer'
      }
    });
    
    if (batchResponse.data.success) {
      const results = batchResponse.data.results;
      const summary = batchResponse.data.summary;
      
      console.log('\n✅ Batch analysis completed!');
      console.log(`📊 Summary:`);
      console.log(`   - Total processed: ${summary.totalTransactions}`);
      console.log(`   - Deductible: ${summary.deductibleCount}`);
      console.log(`   - AI calls: ${summary.aiCalls}`);
      console.log(`   - Cache hits: ${summary.cacheHits}`);
      console.log(`   - Average confidence: ${summary.averageConfidence?.toFixed(2) || 0}`);
      
      console.log('\n📋 Detailed Results:');
      results.forEach((result, i) => {
        console.log(`\n   ${i+1}. Transaction Analysis:`);
        console.log(`      Description: ${result.description}`);
        console.log(`      Amount: $${result.amount}`);
        console.log(`      Date: ${result.date}`);
        console.log(`      Type: ${result.type}`);
        console.log(`      Tax Deductible: ${result.isTaxDeductible ? 'YES' : 'NO'}`);
        console.log(`      Business Use: ${result.businessUsePercentage}%`);
        console.log(`      Confidence: ${(result.confidence * 100).toFixed(0)}%`);
        console.log(`      Category: ${result.taxCategory}`);
        console.log(`      Source: ${result.source}`);
        console.log(`      Reasoning: ${result.reasoning}`);
      });
      
      // Check if we have valid data for frontend display
      const hasValidData = results.every(r => 
        r.description && 
        !isNaN(r.amount) && 
        r.date && 
        r.type
      );
      
      if (hasValidData) {
        console.log('\n✅ SUCCESS: All required fields present for frontend display!');
      } else {
        console.log('\n❌ Issue: Some required fields are missing or invalid');
      }
      
    } else {
      console.log('❌ Batch analysis failed:', batchResponse.data.error);
    }
    
  } catch (error) {
    console.error('❌ Error in detailed tax results test:', error.response?.data || error.message);
  }
}

// Run the test
testDetailedTaxResults(); 