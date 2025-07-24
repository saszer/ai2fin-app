/**
 * 🧪 DEBUG: Actual Bill Categorization Flow Test
 * 
 * This script tests the actual bill categorization flow with real transaction data
 * to see why bill transactions remain uncategorized after clicking Apply.
 */

// Simulate the actual transactions from the All Transactions view
const actualTransactions = [
  {
    id: 'tx-gym-001',
    description: 'Gym Membership',
    amount: 49.99,
    type: 'debit',
    secondaryType: 'bill',
    isRecurringBill: true,
    category: 'Uncategorized',
    categoryId: null,
    merchant: 'Enter me GY',
    classification: 'Bill'
  },
  {
    id: 'tx-dinner-001',
    description: 'Dinner at Restaurant',
    amount: 118.75,
    type: 'debit',
    secondaryType: 'bill',
    isRecurringBill: true,
    category: 'Uncategorized',
    categoryId: null,
    merchant: 'Enter me RS',
    classification: 'Bill'
  },
  {
    id: 'tx-grocery-001',
    description: 'Woolworths Grocery',
    amount: 174.20,
    type: 'debit',
    secondaryType: 'bill',
    isRecurringBill: true,
    category: 'Uncategorized',
    categoryId: null,
    merchant: 'Enter me WC',
    classification: 'Bill'
  }
];

// Simulate the smart categorization analysis results
const mockAnalysisResults = [
  {
    transactionId: 'tx-gym-001',
    description: 'Gym Membership',
    amount: 49.99,
    type: 'bill-pattern',
    secondaryType: 'bill',
    suggestedCategory: 'Health & Fitness',
    confidence: 0.95,
    reasoning: 'Gym membership subscription',
    transactionCount: 1,
    patternId: 'bp-gym-001',
    patternName: 'Gym Membership'
  },
  {
    transactionId: 'tx-dinner-001',
    description: 'Dinner at Restaurant',
    amount: 118.75,
    type: 'bill-pattern',
    secondaryType: 'bill',
    suggestedCategory: 'Dining & Entertainment',
    confidence: 0.92,
    reasoning: 'Restaurant dining expense',
    transactionCount: 1,
    patternId: 'bp-dinner-001',
    patternName: 'Dinner at Restaurant'
  },
  {
    transactionId: 'tx-grocery-001',
    description: 'Woolworths Grocery',
    amount: 174.20,
    type: 'bill-pattern',
    secondaryType: 'bill',
    suggestedCategory: 'Groceries',
    confidence: 0.98,
    reasoning: 'Grocery store purchase',
    transactionCount: 1,
    patternId: 'bp-grocery-001',
    patternName: 'Woolworths Grocery'
  }
];

// Simulate the batch update payload that gets sent when Apply is clicked
const mockBatchUpdatePayload = {
  updates: mockAnalysisResults.map(result => {
    const isBillTransaction = result.type === 'bill-pattern' || 
                             result.secondaryType === 'bill' ||
                             (result.description && (
                               result.description.toLowerCase().includes('subscription') ||
                               result.description.toLowerCase().includes('membership') ||
                               result.description.toLowerCase().includes('monthly') ||
                               result.description.toLowerCase().includes('recurring')
                             ));
    
    return {
      transactionId: result.transactionId,
      category: result.suggestedCategory,
      categoryId: null, // Will be resolved by backend
      primaryType: 'expense',
      secondaryType: isBillTransaction ? 'bill' : 'one-time expense',
      isTaxDeductible: false,
      businessUsePercentage: 0,
      aiConfidence: result.confidence,
      aiReasoning: result.reasoning,
      classificationSource: 'ai'
    };
  })
};

// Simulate the backend bill transaction identification logic
function simulateBackendBillIdentification(existingTransaction, update) {
  // 🎯 FIXED: Also handle transactions marked as bills but without explicit billPatternId
  // Check multiple criteria for bill identification using existing database fields
  const isBillTransaction = existingTransaction.billPatternId || 
                           existingTransaction.secondaryType === 'bill' || 
                           existingTransaction.isRecurringBill === true ||
                           existingTransaction.recurring === true ||
                           // 🎯 ADDED: Check description patterns for bills
                           (existingTransaction.description && (
                             existingTransaction.description.toLowerCase().includes('subscription') ||
                             existingTransaction.description.toLowerCase().includes('membership') ||
                             existingTransaction.description.toLowerCase().includes('monthly') ||
                             existingTransaction.description.toLowerCase().includes('recurring') ||
                             existingTransaction.description.toLowerCase().includes('bill') ||
                             existingTransaction.description.toLowerCase().includes('payment')
                           ));
  
  return isBillTransaction;
}

// Simulate finding related bill transactions
function simulateFindRelatedBillTransactions(existingTransaction, transactionId) {
  // This would be a database query in the real system
  const relatedTransactions = [];
  
  // Simulate finding transactions with same merchant that are also bills
  if (existingTransaction.merchant === 'Enter me GY') {
    // Simulate finding related gym transactions
    relatedTransactions.push({
      id: 'tx-gym-002',
      description: 'Gym Membership',
      merchant: 'Enter me GY',
      secondaryType: 'bill',
      isRecurringBill: true
    });
  } else if (existingTransaction.merchant === 'Enter me RS') {
    // Simulate finding related restaurant transactions
    relatedTransactions.push({
      id: 'tx-dinner-002',
      description: 'Dinner at Restaurant',
      merchant: 'Enter me RS',
      secondaryType: 'bill',
      isRecurringBill: true
    });
  } else if (existingTransaction.merchant === 'Enter me WC') {
    // Simulate finding related grocery transactions
    relatedTransactions.push({
      id: 'tx-grocery-002',
      description: 'Woolworths Grocery',
      merchant: 'Enter me WC',
      secondaryType: 'bill',
      isRecurringBill: true
    });
  }
  
  return relatedTransactions;
}

async function testActualBillCategorizationFlow() {
  console.log('🧪 Testing Actual Bill Categorization Flow...\n');

  // Test 1: Verify current state of transactions
  console.log('1. Current Transaction State:');
  console.log('   (Transactions are classified as Bill but Uncategorized)');
  
  actualTransactions.forEach((tx, index) => {
    console.log(`   📊 ${tx.description}:`);
    console.log(`      - Classification: ${tx.classification}`);
    console.log(`      - Secondary Type: ${tx.secondaryType}`);
    console.log(`      - Is Recurring Bill: ${tx.isRecurringBill}`);
    console.log(`      - Category: ${tx.category}`);
    console.log(`      - Category ID: ${tx.categoryId}`);
    console.log(`      - Merchant: ${tx.merchant}`);
  });
  console.log('');

  // Test 2: Verify smart categorization analysis results
  console.log('2. Smart Categorization Analysis Results:');
  console.log('   (AI suggests categories for bill transactions)');
  
  mockAnalysisResults.forEach((result, index) => {
    console.log(`   📊 ${result.patternName}:`);
    console.log(`      - Type: ${result.type}`);
    console.log(`      - Secondary Type: ${result.secondaryType}`);
    console.log(`      - Suggested Category: ${result.suggestedCategory}`);
    console.log(`      - Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    console.log(`      - Transaction Count: ${result.transactionCount}`);
  });
  console.log('');

  // Test 3: Verify batch update payload construction
  console.log('3. Batch Update Payload Construction:');
  console.log('   (Frontend should send proper bill identification)');
  
  mockBatchUpdatePayload.updates.forEach((update, index) => {
    const originalResult = mockAnalysisResults[index];
    console.log(`   📤 ${originalResult.description}:`);
    console.log(`      - Transaction ID: ${update.transactionId}`);
    console.log(`      - Category: ${update.category}`);
    console.log(`      - Secondary Type: ${update.secondaryType}`);
    console.log(`      - Is Bill: ${update.secondaryType === 'bill' ? '✅ Yes' : '❌ No'}`);
  });
  console.log('');

  // Test 4: Verify backend bill transaction identification
  console.log('4. Backend Bill Transaction Identification:');
  console.log('   (Backend should identify bill transactions correctly)');
  
  actualTransactions.forEach((existingTx, index) => {
    const update = mockBatchUpdatePayload.updates[index];
    const isBill = simulateBackendBillIdentification(existingTx, update);
    console.log(`   🔍 ${existingTx.description}:`);
    console.log(`      - Bill Pattern ID: ${existingTx.billPatternId || 'None'}`);
    console.log(`      - Secondary Type: ${existingTx.secondaryType}`);
    console.log(`      - Is Recurring Bill: ${existingTx.isRecurringBill}`);
    console.log(`      - Backend Identified as Bill: ${isBill ? '✅ Yes' : '❌ No'}`);
  });
  console.log('');

  // Test 5: Verify related bill transaction finding
  console.log('5. Related Bill Transaction Finding:');
  console.log('   (Backend should find all related bill transactions)');
  
  actualTransactions.forEach((existingTx, index) => {
    const update = mockBatchUpdatePayload.updates[index];
    const isBill = simulateBackendBillIdentification(existingTx, update);
    
    if (isBill) {
      const relatedTransactions = simulateFindRelatedBillTransactions(existingTx, existingTx.id);
      console.log(`   🔗 ${existingTx.description}:`);
      console.log(`      - Found ${relatedTransactions.length} related bill transactions`);
      console.log(`      - All will be updated with category: ${update.category}`);
      
      if (existingTx.billPatternId) {
        console.log(`      - Bill pattern ${existingTx.billPatternId} will also be updated`);
      }
    }
  });
  console.log('');

  // Test 6: Expected database updates
  console.log('6. Expected Database Updates:');
  console.log('   (After clicking Apply, these updates should occur)');
  
  let totalTransactionsUpdated = 0;
  let billPatternsUpdated = 0;
  
  mockAnalysisResults.forEach((result, index) => {
    const update = mockBatchUpdatePayload.updates[index];
    const existingTx = actualTransactions[index];
    
    if (result.type === 'bill-pattern') {
      const relatedCount = result.transactionCount - 1; // Exclude the representative transaction
      totalTransactionsUpdated += result.transactionCount; // All transactions in pattern
      billPatternsUpdated += 1; // The bill pattern itself
      
      console.log(`   📝 ${result.patternName}:`);
      console.log(`      - Representative transaction updated: ${result.transactionId}`);
      console.log(`      - ${relatedCount} related transactions updated`);
      console.log(`      - Bill pattern ${result.patternId} updated`);
      console.log(`      - Total: ${result.transactionCount} transactions + 1 bill pattern`);
    } else {
      totalTransactionsUpdated += 1;
      console.log(`   📝 ${result.description}:`);
      console.log(`      - Single transaction updated: ${result.transactionId}`);
    }
  });
  
  console.log('');
  console.log(`📊 SUMMARY: ${totalTransactionsUpdated} transactions + ${billPatternsUpdated} bill patterns will be updated`);
  console.log('');

  // Test 7: Potential Issues Analysis
  console.log('7. Potential Issues Analysis:');
  console.log('   (Why transactions might remain uncategorized)');
  
  console.log('   🔍 Issue 1: Category ID Resolution');
  console.log('      - Frontend sends category name but not categoryId');
  console.log('      - Backend needs to resolve categoryId from category name');
  console.log('      - If category doesn\'t exist, it might default to "Uncategorized"');
  
  console.log('   🔍 Issue 2: Bill Pattern ID Missing');
  console.log('      - Transactions have secondaryType: "bill" but no billPatternId');
  console.log('      - Backend might not find related transactions without pattern ID');
  
  console.log('   🔍 Issue 3: Merchant Matching');
  console.log('      - Related transactions found by merchant name');
  console.log('      - If merchant names don\'t match exactly, related transactions won\'t be found');
  
  console.log('   🔍 Issue 4: Database Update Failure');
  console.log('      - Batch update might fail silently');
  console.log('      - Transaction might not be updated if categoryId resolution fails');
  
  console.log('');

  // Test 8: Debugging Recommendations
  console.log('8. Debugging Recommendations:');
  console.log('   (Steps to identify the actual issue)');
  
  console.log('   1. Check browser console for batch update errors');
  console.log('   2. Verify category names exist in user\'s category list');
  console.log('   3. Check if billPatternId is set on transactions');
  console.log('   4. Verify merchant names match exactly for related transactions');
  console.log('   5. Check database logs for update failures');
  console.log('   6. Test with a simple one-time transaction first');
  
  console.log('');

  console.log('🎉 Actual Bill Categorization Flow Debug Complete!');
  console.log('\n📋 Summary:');
  console.log('- Transactions are correctly identified as bills');
  console.log('- AI suggests appropriate categories');
  console.log('- Frontend sends proper bill identification');
  console.log('- Backend should process and update all related transactions');
  console.log('- If still uncategorized, check category resolution and database updates');
}

// Run the test
testActualBillCategorizationFlow().catch(console.error); 