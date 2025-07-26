/**
 * 🧪 COMPREHENSIVE TAX ANALYSIS DEBUG TEST
 * Tests every aspect of the data flow from UI request to final response
 */

const axios = require('axios');

async function comprehensiveTest() {
  console.log('🧪 Comprehensive Tax Analysis Debug Test');
  console.log('='.repeat(80));

  try {
    // Test 1: Check if AI modules service is running
    console.log('\n📋 TEST 1: AI Modules Health Check');
    console.log('-'.repeat(50));
    
    try {
      const healthResponse = await axios.get('http://localhost:3002/health', { timeout: 5000 });
      console.log('✅ AI Modules Service: ONLINE');
      console.log('📊 Health Response:', JSON.stringify(healthResponse.data, null, 2));
    } catch (healthError) {
      console.log('❌ AI Modules Service: OFFLINE');
      console.log('❌ Health Error:', healthError.message);
      return;
    }

    // Test 2: Single transaction with detailed logging
    console.log('\n📋 TEST 2: Single Transaction Analysis');
    console.log('-'.repeat(50));
    
    const singleRequest = {
      description: 'Professional development course - React certification',
      amount: 299.00,
      date: '2024-01-17T00:00:00.000Z',
      category: 'Education',
      type: 'expense',
      userProfile: {
        countryCode: 'AU',
        occupation: 'Software Developer',
        businessType: 'SOLE_TRADER'
      }
    };

    console.log('📤 Single Request:', JSON.stringify(singleRequest, null, 2));
    
    const singleResponse = await axios.post('http://localhost:3002/api/ai-tax/analyze-transaction', singleRequest, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('📥 Single Response Status:', singleResponse.status);
    console.log('📥 Single Response Data:', JSON.stringify(singleResponse.data, null, 2));

    // Test 3: Batch analysis with detailed field mapping
    console.log('\n📋 TEST 3: Batch Analysis with Field Mapping');
    console.log('-'.repeat(50));
    
    const batchRequest = {
      transactions: [
        {
          id: 'test-batch-1',
          description: 'Business lunch with client at Restaurant XYZ',
          amount: 125.00,
          date: '2024-01-15T00:00:00.000Z',
          category: 'Meals & Entertainment',
          type: 'expense'
        },
        {
          id: 'test-batch-2',
          description: 'Personal groceries from Woolworths',
          amount: 78.50,
          date: '2024-01-16T00:00:00.000Z',
          category: 'Groceries',
          type: 'expense'
        }
      ],
      userProfile: {
        countryCode: 'AU',
        occupation: 'Software Developer',
        businessType: 'SOLE_TRADER'
      }
    };

    console.log('📤 Batch Request:', JSON.stringify(batchRequest, null, 2));
    
    const batchResponse = await axios.post('http://localhost:3002/api/ai-tax/batch-analyze', batchRequest, {
      timeout: 60000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('📥 Batch Response Status:', batchResponse.status);
    console.log('📥 Batch Response Data:', JSON.stringify(batchResponse.data, null, 2));

    // Test 4: Field-by-field validation
    console.log('\n📋 TEST 4: Field-by-Field Validation');
    console.log('-'.repeat(50));
    
    if (batchResponse.data && batchResponse.data.results) {
      batchResponse.data.results.forEach((result, index) => {
        console.log(`\n🔍 Transaction ${index + 1} Field Analysis:`);
        console.log(`   ID: ${result.id || 'MISSING'}`);
        console.log(`   Description: ${result.description || 'MISSING'}`);
        console.log(`   Amount: ${result.amount || 'MISSING'}`);
        console.log(`   Date: ${result.date || 'MISSING'}`);
        console.log(`   Category: ${result.category || 'MISSING'}`);
        console.log(`   Type: ${result.type || 'MISSING'}`);
        console.log(`   Source: ${result.source || 'MISSING'}`);
        console.log(`   Tax Deductible: ${result.isTaxDeductible !== undefined ? result.isTaxDeductible : 'MISSING'}`);
        console.log(`   Confidence: ${result.confidence !== undefined ? result.confidence : 'MISSING'}`);
        console.log(`   Reasoning: ${result.reasoning ? result.reasoning.substring(0, 100) + '...' : 'MISSING'}`);
        console.log(`   Business Use %: ${result.businessUsePercentage !== undefined ? result.businessUsePercentage : 'MISSING'}`);
        console.log(`   Tax Category: ${result.taxCategory || 'MISSING'}`);
      });
    }

    // Test 5: Check OpenAI logs
    console.log('\n📋 TEST 5: OpenAI Logs Check');
    console.log('-'.repeat(50));
    
    const today = new Date().toISOString().split('T')[0];
    console.log(`🔍 Looking for log file: openai-tax-calls-${today}.json`);
    console.log('📁 Check the /logs/ directory for detailed OpenAI prompts and responses');

    console.log('\n✅ Comprehensive test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Comprehensive test failed:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
  }
}

// Run the comprehensive test
comprehensiveTest(); 