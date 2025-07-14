const axios = require('axios');

/**
 * 🧪 TEST NEW /api/classify ENDPOINT
 * 
 * This script tests the newly added /api/classify route that was missing.
 * This should fix the 404 errors we were seeing in the logs.
 */

const AI_MODULES_URL = 'http://localhost:3002';

async function testClassifyEndpoint() {
  console.log('🧪 Testing NEW /api/classify endpoint...');
  console.log('='.repeat(50));
  
  const testTransactions = [
    {
      description: 'Office supplies from Officeworks',
      amount: 125.50,
      type: 'debit',
      merchant: 'Officeworks'
    },
    {
      description: 'Software subscription - GitHub Pro',
      amount: 29.99,
      type: 'debit',
      merchant: 'GitHub'
    },
    {
      description: 'Business lunch at Cafe Milano',
      amount: 45.80,
      type: 'debit',
      merchant: 'Cafe Milano'
    },
    {
      description: 'Client payment received',
      amount: 2500.00,
      type: 'credit',
      merchant: 'Client ABC'
    }
  ];
  
  for (let i = 0; i < testTransactions.length; i++) {
    const transaction = testTransactions[i];
    
    console.log(`\n${i + 1}. Testing: ${transaction.description}`);
    console.log(`   Amount: $${transaction.amount} (${transaction.type})`);
    
    try {
      const response = await axios.post(`${AI_MODULES_URL}/api/ai/classify`, transaction, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   ✅ SUCCESS - Status: ${response.status}`);
      console.log(`   📊 Classification:`);
      console.log(`      Category: ${response.data.classification?.category || 'N/A'}`);
      console.log(`      Confidence: ${response.data.classification?.confidence || 'N/A'}`);
      console.log(`      Tax Deductible: ${response.data.classification?.isTaxDeductible || 'N/A'}`);
      console.log(`      Business Use: ${response.data.classification?.businessUsePercentage || 0}%`);
      console.log(`      Bill Name: ${response.data.classification?.suggestedBillName || 'N/A'}`);
      console.log(`      Recurring: ${response.data.classification?.isRecurring || false}`);
      
      if (response.data.mock) {
        console.log(`   🚨 MOCK RESPONSE (No OpenAI API Key)`);
      }
      
    } catch (error) {
      console.log(`   ❌ FAILED - Status: ${error.response?.status || 'NO_RESPONSE'}`);
      console.log(`   🚨 Error: ${error.response?.data?.error || error.message}`);
      
      if (error.response?.status === 404) {
        console.log(`   💡 Route still not found - check if service restarted properly`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log('✅ If all tests passed: The missing /api/classify route is now working!');
  console.log('❌ If tests failed: Check service restart and route mounting');
  console.log('🚨 Mock responses: Expected until OpenAI API key is configured');
}

// Wait a bit for service to start, then test
setTimeout(() => {
  testClassifyEndpoint().catch(console.error);
}, 5000); 