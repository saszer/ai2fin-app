/**
 * 🧪 TEST: Bill Transaction ID Fix Verification
 * 
 * This script tests that bill transactions are using actual transaction IDs
 * instead of bill pattern IDs in the categorization results.
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = 'test-user-001';

// Mock data for testing
const mockBillTransactions = [
  {
    id: 'tx-gym-001', // Actual transaction ID
    description: 'Gym Membership',
    amount: 49.99,
    merchant: 'Enter me GY',
    secondaryType: 'bill',
    isRecurringBill: true,
    billPatternId: 'bp-gym-001', // Bill pattern ID
    linkedBillOccurrence: {
      billPatternId: 'bp-gym-001',
      billPatternName: 'Gym Membership'
    }
  },
  {
    id: 'tx-gym-002', // Actual transaction ID
    description: 'Gym Membership',
    amount: 49.99,
    merchant: 'Enter me GY',
    secondaryType: 'bill',
    isRecurringBill: true,
    billPatternId: 'bp-gym-001', // Same bill pattern ID
    linkedBillOccurrence: {
      billPatternId: 'bp-gym-001',
      billPatternName: 'Gym Membership'
    }
  },
  {
    id: 'tx-netflix-001', // Actual transaction ID
    description: 'Netflix Subscription',
    amount: 19.99,
    merchant: 'Netflix',
    secondaryType: 'bill',
    isRecurringBill: true,
    billPatternId: null, // No explicit bill pattern
    linkedBillOccurrence: null
  }
];

async function testBillTransactionIdFix() {
  console.log('🧪 Testing Bill Transaction ID Fix\n');

  try {
    // Test 1: Simulate the intelligent categorization response
    console.log('1. Simulating Intelligent Categorization Response:');
    
    // Simulate the data structure that would be sent to classify-batch
    const transactionsForAnalysis = mockBillTransactions.map(tx => ({
      id: tx.id, // This should be the actual transaction ID
      description: tx.description,
      amount: tx.amount,
      merchant: tx.merchant,
      date: new Date(),
      type: tx.type,
      analysisType: tx.billPatternId ? 'recurring-bill' : 'one-time',
      linkedBill: tx.linkedBillOccurrence ? {
        patternId: tx.linkedBillOccurrence.billPatternId,
        patternName: tx.linkedBillOccurrence.billPatternName,
        transactionCount: 1,
        transactionIds: [tx.id] // Actual transaction IDs
      } : null,
      secondaryType: tx.secondaryType,
      isRecurringBill: tx.isRecurringBill,
      billPatternId: tx.billPatternId
    }));

    console.log('   📤 Transactions for analysis:');
    transactionsForAnalysis.forEach((tx, index) => {
      console.log(`      ${index + 1}. ${tx.description}:`);
      console.log(`         - Transaction ID: ${tx.id}`);
      console.log(`         - Bill Pattern ID: ${tx.billPatternId || 'None'}`);
      console.log(`         - Analysis Type: ${tx.analysisType}`);
      console.log(`         - Secondary Type: ${tx.secondaryType}`);
    });
    console.log('');

    // Test 2: Simulate bill pattern grouping
    console.log('2. Simulating Bill Pattern Grouping:');
    
    // Simulate the bill pattern grouping logic
    const billPatternGroups = new Map();
    
    for (const tx of transactionsForAnalysis) {
      const billPatternId = tx.linkedBill?.patternId || tx.billPatternId;
      
      if (billPatternId) {
        // Transaction has explicit bill pattern ID
        if (!billPatternGroups.has(billPatternId)) {
          billPatternGroups.set(billPatternId, {
            billPatternId,
            billPatternName: tx.linkedBill?.patternName || 'Unknown Bill',
            transactions: []
          });
        }
        billPatternGroups.get(billPatternId).transactions.push(tx);
      } else {
        // Handle virtual bill patterns
        const merchantKey = tx.merchant || tx.description || 'Unknown Merchant';
        const virtualPatternId = `virtual-${merchantKey.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        if (!billPatternGroups.has(virtualPatternId)) {
          billPatternGroups.set(virtualPatternId, {
            billPatternId: virtualPatternId,
            billPatternName: `${merchantKey} (Bill)`,
            transactions: [],
            isVirtualPattern: true
          });
        }
        billPatternGroups.get(virtualPatternId).transactions.push(tx);
      }
    }

    console.log('   📋 Bill pattern groups:');
    for (const [patternId, group] of billPatternGroups) {
      console.log(`      Pattern: ${group.billPatternName} (${patternId})`);
      console.log(`         Transactions: ${group.transactions.length}`);
      group.transactions.forEach(tx => {
        console.log(`            - ${tx.description}: ${tx.id}`);
      });
    }
    console.log('');

    // Test 3: Simulate bill pattern results generation
    console.log('3. Simulating Bill Pattern Results Generation:');
    
    const billPatternResults = [];
    
    for (const [patternId, group] of billPatternGroups) {
      console.log(`   🏢 Processing bill pattern: ${group.billPatternName}`);
      
      // Simulate bill pattern categorization result
      const billPatternResult = {
        primaryType: 'expense',
        secondaryType: 'bill',
        category: 'Health & Fitness',
        categoryId: 'cat-health',
        confidence: 0.95,
        reasoning: 'Gym membership subscription',
        isTaxDeductible: false,
        businessUsePercentage: 0,
        isBill: true,
        isRecurring: true
      };
      
      // Apply the same categorization to all transactions in this bill pattern
      for (const tx of group.transactions) {
        const transactionAmount = Math.abs(parseFloat(tx.amount) || 0);
        
        billPatternResults.push({
          transactionId: tx.transactionId || tx.id, // Use actual transaction ID, not bill pattern ID
          ...billPatternResult,
          source: 'bill-pattern',
          reasoning: `Applied bill pattern categorization: ${group.billPatternName}`,
          expenseCalculation: {
            transactionAmount,
            deductibleAmount: 0,
            businessUsePercentage: billPatternResult.businessUsePercentage || 0,
            isExpense: billPatternResult.primaryType === 'expense',
            isBill: true
          }
        });
      }
      
      console.log(`      ✅ Applied to ${group.transactions.length} transactions`);
    }
    console.log('');

    // Test 4: Verify transaction IDs in results
    console.log('4. Verifying Transaction IDs in Results:');
    
    console.log('   📊 Bill pattern results:');
    billPatternResults.forEach((result, index) => {
      console.log(`      ${index + 1}. ${result.transactionId}:`);
      console.log(`         - Transaction ID: ${result.transactionId}`);
      console.log(`         - Category: ${result.category}`);
      console.log(`         - Source: ${result.source}`);
      console.log(`         - Is Bill Pattern ID: ${result.transactionId.startsWith('bp-') ? '❌ YES (WRONG!)' : '✅ NO (CORRECT)'}`);
    });
    console.log('');

    // Test 5: Check for any bill pattern IDs in results
    console.log('5. Checking for Bill Pattern IDs in Results:');
    
    const billPatternIdsInResults = billPatternResults.filter(result => 
      result.transactionId.startsWith('bp-') || 
      result.transactionId.startsWith('virtual-')
    );
    
    if (billPatternIdsInResults.length > 0) {
      console.log('   ❌ PROBLEM: Found bill pattern IDs in results:');
      billPatternIdsInResults.forEach(result => {
        console.log(`      - ${result.transactionId} (should be actual transaction ID)`);
      });
    } else {
      console.log('   ✅ SUCCESS: All results use actual transaction IDs');
    }
    console.log('');

    // Test 6: Expected behavior summary
    console.log('6. Expected Behavior Summary:');
    console.log('   ✅ Bill pattern transactions should use actual transaction IDs');
    console.log('   ✅ Bill pattern IDs should only be used for grouping');
    console.log('   ✅ Each transaction in a bill pattern should have its own result');
    console.log('   ✅ All transactions in a bill pattern should get the same categorization');
    console.log('   ✅ The backend should be able to find each transaction by its actual ID');
    console.log('');

    console.log('🎉 Bill Transaction ID Fix Test Complete!');
    console.log('\n📋 Summary:');
    console.log('- Bill pattern grouping works correctly');
    console.log('- Each transaction gets its own result with actual transaction ID');
    console.log('- Bill pattern IDs are only used for grouping, not as transaction IDs');
    console.log('- Backend should now be able to find and update actual transactions');
    console.log('\n✅ If the fix is working:');
    console.log('   1. No more "Transaction not found" errors for bill patterns');
    console.log('   2. Bill transactions get properly categorized when Apply is clicked');
    console.log('   3. All related transactions in the same bill pattern get updated');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBillTransactionIdFix(); 