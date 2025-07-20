/**
 * FRONTEND DATA EXTRACTION SCRIPT
 * 
 * This script helps debug pattern analysis by testing with actual frontend data.
 * 
 * HOW TO USE:
 * 1. Open your browser to http://localhost:3000/all-transactions
 * 2. Open DevTools (F12) -> Console
 * 3. Run this command to export your transaction data:
 *    
 *    copy(JSON.stringify(window.allTransactions || [], null, 2))
 * 
 * 4. Paste the data into the 'transactions' variable below
 * 5. Run: node extract-frontend-data.js
 */

const axios = require('axios');

// PASTE YOUR TRANSACTION DATA HERE (from browser console)
const transactions = [
  // Example format:
  // {
  //   "id": "some-id",
  //   "description": "NETFLIX.COM",
  //   "merchant": "NETFLIX",
  //   "amount": -15.99,
  //   "date": "2024-01-15",
  //   "category": "Entertainment"
  // }
];

async function testWithFrontendData() {
  console.log('🔍 TESTING PATTERN ANALYSIS WITH FRONTEND DATA\n');
  
  if (transactions.length === 0) {
    console.log('❌ No transaction data found!');
    console.log('\n📋 TO GET YOUR TRANSACTION DATA:');
    console.log('1. Open browser to: http://localhost:3000/all-transactions');
    console.log('2. Open DevTools (F12) -> Console');
    console.log('3. Run: copy(JSON.stringify(window.allTransactions || [], null, 2))');
    console.log('4. Paste the data into this script');
    console.log('5. Run the script again\n');
    return;
  }
  
  console.log(`📊 Found ${transactions.length} transactions`);
  console.log('📋 Sample transaction:', transactions[0]);
  
  try {
    const response = await axios.post('http://localhost:3001/api/bills-patterns/debug-with-data', {
      transactions: transactions
    }, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`\n✅ Response Status: ${response.status}`);
    console.log(`⏱️ Processing Time: ${response.data.processingTime}ms`);
    console.log(`🎯 Patterns Found: ${response.data.patterns.length}`);
    
    if (response.data.debug) {
      console.log(`\n📊 DEBUG INFO:`);
      console.log(`   Total Transactions: ${response.data.debug.transactionCount}`);
      console.log(`   Merchants with 2+ transactions: ${response.data.debug.merchantsWithMultipleTransactions.length}`);
      
      response.data.debug.merchantsWithMultipleTransactions.forEach(merchant => {
        console.log(`      "${merchant.merchant}": ${merchant.count} transactions`);
      });
    }
    
    if (response.data.patterns.length > 0) {
      console.log(`\n🎯 DETECTED PATTERNS:`);
      response.data.patterns.forEach((pattern, i) => {
        console.log(`   ${i + 1}. ${pattern.name}`);
        console.log(`      Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
        console.log(`      Transactions: ${pattern.transactionCount}`);
        console.log(`      Frequency: ${pattern.frequency}`);
        console.log(`      Recommended: ${pattern.isRecommended ? '✅' : '❌'}`);
      });
      console.log(`\n🎉 SUCCESS: Patterns detected correctly!`);
    } else {
      console.log(`\n❌ NO PATTERNS DETECTED`);
      console.log(`   Check the server logs for detailed debugging output`);
      console.log(`   The algorithm is working, so this is likely a data format issue`);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status);
      console.log('   Response:', error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testWithFrontendData(); 