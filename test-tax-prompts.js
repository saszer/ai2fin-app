/**
 * 🧪 DIRECT TAX ANALYSIS PROMPT TESTING
 * Tests the enhanced OpenAI prompts and logs responses
 */

const axios = require('axios');

async function testTaxPrompts() {
  console.log('🧪 Testing Enhanced Tax Analysis Prompts...\n');

  try {
    // Test single transaction analysis
    console.log('📋 TEST 1: Single Transaction with Enhanced Prompts');
    console.log('='.repeat(60));
    
    const singleRequest = {
      description: 'Office supplies from Staples - printer paper, pens, notebooks',
      amount: 89.50,
      date: '2024-01-15T00:00:00.000Z',
      category: 'Office Supplies',
      type: 'expense',
      userProfile: {
        countryCode: 'AU',
        occupation: 'Software Developer',
        businessType: 'SOLE_TRADER'
      }
    };

    console.log('📤 Request to AI modules:');
    console.log(JSON.stringify(singleRequest, null, 2));
    
    const singleResponse = await axios.post('http://localhost:3002/api/ai-tax/analyze-transaction', singleRequest, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('\n📥 AI Response:');
    console.log(JSON.stringify(singleResponse.data, null, 2));
    
    // Test batch analysis
    console.log('\n\n📋 TEST 2: Batch Analysis with Enhanced Prompts');
    console.log('='.repeat(60));
    
    const batchRequest = {
      transactions: [
        {
          id: 'test-1',
          description: 'Business lunch with client at Restaurant XYZ',
          amount: 125.00,
          date: '2024-01-15T00:00:00.000Z',
          category: 'Meals',
          type: 'expense'
        },
        {
          id: 'test-2', 
          description: 'Personal groceries from Woolworths',
          amount: 78.50,
          date: '2024-01-16T00:00:00.000Z',
          category: 'Groceries',
          type: 'expense'
        },
        {
          id: 'test-3',
          description: 'Professional development course - React certification',
          amount: 299.00,
          date: '2024-01-17T00:00:00.000Z',
          category: 'Education',
          type: 'expense'
        }
      ],
      userProfile: {
        countryCode: 'AU',
        occupation: 'Software Developer', 
        businessType: 'SOLE_TRADER'
      }
    };

    console.log('📤 Batch Request to AI modules:');
    console.log(`Transactions: ${batchRequest.transactions.length}`);
    batchRequest.transactions.forEach((tx, i) => {
      console.log(`  ${i+1}. ${tx.description} - $${tx.amount}`);
    });
    
    const batchResponse = await axios.post('http://localhost:3002/api/ai-tax/batch-analyze', batchRequest, {
      timeout: 60000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('\n📥 Batch AI Response:');
    console.log(JSON.stringify(batchResponse.data, null, 2));
    
    // Check for log files
    console.log('\n\n📊 OPENAI CALL LOGS:');
    console.log('='.repeat(60));
    console.log('Check the /logs/ directory for detailed OpenAI prompts and responses.');
    console.log('Files will be named: openai-tax-calls-YYYY-MM-DD.json');
    
    console.log('\n✅ Tax prompt testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Tax prompt test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Run the test
testTaxPrompts(); 