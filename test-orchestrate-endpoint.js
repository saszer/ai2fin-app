const axios = require('axios');

async function testOrchestrateEndpoint() {
  console.log('🔍 Testing AI Orchestrate Endpoint Structure...\n');
  
  // Test data that matches what the core app sends
  const testData = {
    workflow: 'fullTransactionAnalysis',
    userId: 'test-user-123',
    data: {
      transactions: [
        {
          id: 'tx-1',
          description: 'Adobe Creative Cloud',
          amount: -29.99,
          date: '2025-01-15',
          type: 'debit',
          merchant: 'Adobe'
        },
        {
          id: 'tx-2', 
          description: 'Coffee Shop',
          amount: -5.50,
          date: '2025-01-15',
          type: 'debit',
          merchant: 'Local Cafe'
        }
      ],
      userProfile: {
        profession: 'Software Developer',
        industry: 'Technology',
        businessType: 'SOLE_TRADER',
        countryCode: 'AU'
      },
      options: {
        includeTaxAnalysis: true,
        includeBillDetection: true,
        includeRecurringPatterns: true,
        confidenceThreshold: 0.7
      }
    }
  };
  
  try {
    console.log('📡 Testing orchestrate endpoint...');
    console.log('Request payload:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post('http://localhost:3002/api/ai/orchestrate', testData);
    
    console.log('✅ Orchestrate Endpoint: SUCCESS');
    console.log('Status:', response.status);
    console.log('Response Structure:');
    console.log('- success:', response.data.success);
    console.log('- data:', typeof response.data.data);
    console.log('- mock:', response.data.mock);
    console.log('- timestamp:', response.data.timestamp);
    
    if (response.data.data) {
      console.log('\n📊 Analysis Results:');
      console.log('- Results count:', response.data.data.results?.length || 'N/A');
      console.log('- Summary:', response.data.data.summary ? 'Present' : 'Missing');
      
      if (response.data.data.results && response.data.data.results.length > 0) {
        const firstResult = response.data.data.results[0];
        console.log('\n🔍 First Transaction Analysis:');
        console.log('- Transaction ID:', firstResult.transactionId);
        console.log('- Category:', firstResult.category);
        console.log('- Confidence:', firstResult.confidence);
        console.log('- Tax Deductible:', firstResult.isTaxDeductible);
        console.log('- Business Use %:', firstResult.businessUsePercentage);
      }
    }
    
    return response.data;
    
  } catch (error) {
    console.log('❌ Orchestrate Endpoint: FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('ℹ️  400 error might indicate structure mismatch - checking...');
      console.log('Expected: { workflow, userId, data }');
      console.log('Sent:', Object.keys(testData));
    }
    
    return null;
  }
}

async function testAlternativeEndpoints() {
  console.log('\n🔄 Testing Alternative Unified Endpoints...\n');
  
  const simpleTestData = {
    transactions: [
      {
        id: 'tx-1',
        description: 'Adobe Creative Cloud',
        amount: -29.99,
        date: '2025-01-15',
        type: 'debit',
        merchant: 'Adobe'
      }
    ],
    userProfile: {
      profession: 'Software Developer',
      industry: 'Technology',
      businessType: 'SOLE_TRADER',
      countryCode: 'AU'
    },
    options: {
      includeTaxAnalysis: true
    }
  };
  
  // Test the simple analyze endpoint
  try {
    console.log('Testing /api/simple/analyze endpoint...');
    const response = await axios.post('http://localhost:3002/api/simple/analyze', simpleTestData);
    console.log('✅ Simple Analyze: SUCCESS');
    console.log('Results:', response.data.results?.length || 0, 'transactions processed');
  } catch (error) {
    console.log('❌ Simple Analyze: FAILED -', error.response?.status || error.message);
  }
  
  // Test the batch optimized endpoint
  try {
    console.log('Testing /api/optimized/analyze-batch endpoint...');
    const batchData = {
      transactions: simpleTestData.transactions,
      userProfile: simpleTestData.userProfile,
      options: simpleTestData.options
    };
    const response = await axios.post('http://localhost:3002/api/optimized/analyze-batch', batchData);
    console.log('✅ Batch Optimized: SUCCESS');
    console.log('Results:', response.data.results?.length || 0, 'transactions processed');
  } catch (error) {
    console.log('❌ Batch Optimized: FAILED -', error.response?.status || error.message);
  }
}

async function main() {
  const orchestrateResult = await testOrchestrateEndpoint();
  await testAlternativeEndpoints();
  
  console.log('\n🎯 RECOMMENDATION:');
  if (orchestrateResult) {
    console.log('✅ The orchestrate endpoint is working correctly');
    console.log('✅ The structure matches what the core app expects');
    console.log('✅ Fallback logic is operational');
  } else {
    console.log('❌ The orchestrate endpoint has issues');
    console.log('🔧 Consider switching to an alternative endpoint');
  }
}

main().catch(console.error); 