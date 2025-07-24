/**
 * 🧪 TEST: Actual Bill Categorization Process
 * 
 * This script simulates the actual bill categorization process
 * to identify where the issue is occurring.
 */

// Simulate the actual transaction data that might be in the database
const actualDatabaseTransactions = [
  {
    id: 'gym-membership-1',
    description: 'Gym Membership',
    amount: -49.99,
    merchant: 'Gym',
    date: '2025-01-15',
    type: 'debit',
    // 🚨 ISSUE: These fields might be missing or incorrect in the database
    secondaryType: null, // This might be null instead of 'bill'
    analysisType: null,  // This might be null instead of 'recurring-bill'
    classification: 'Bill', // This is what shows in the UI
    category: 'Uncategorized',
    categoryId: null
  },
  {
    id: 'netflix-subscription-1',
    description: 'Netflix Monthly Subscription',
    amount: -19.99,
    merchant: 'Netflix',
    date: '2025-01-15',
    type: 'debit',
    secondaryType: null, // This might be null instead of 'bill'
    analysisType: null,  // This might be null instead of 'recurring-bill'
    classification: 'Bill', // This is what shows in the UI
    category: 'Uncategorized',
    categoryId: null
  },
  {
    id: 'grocery-shopping-1',
    description: 'Grocery Shopping',
    amount: -85.50,
    merchant: 'Woolworths',
    date: '2025-01-10',
    type: 'debit',
    secondaryType: 'one-time expense',
    analysisType: 'one-time',
    classification: 'One-Time Expense',
    category: 'Groceries',
    categoryId: 'cat-123'
  }
];

async function testActualBillCategorization() {
  console.log('🧪 Testing Actual Bill Categorization Process...\n');

  // Step 1: Check what's in the database vs what's shown in UI
  console.log('1. Database vs UI Mismatch Analysis:');
  
  for (const tx of actualDatabaseTransactions) {
    console.log(`   Transaction: ${tx.description}`);
    console.log(`     UI Classification: ${tx.classification}`);
    console.log(`     DB secondaryType: ${tx.secondaryType || 'null'}`);
    console.log(`     DB analysisType: ${tx.analysisType || 'null'}`);
    console.log(`     DB category: ${tx.category}`);
    console.log('');
  }

  // Step 2: Simulate the AI analysis results
  console.log('2. AI Analysis Results (what the modal receives):');
  
  const aiResults = actualDatabaseTransactions.map(tx => ({
    transactionId: tx.id,
    description: tx.description,
    suggestedCategory: 'Entertainment',
    type: tx.classification === 'Bill' ? 'bill-pattern' : 'one-time', // Based on UI classification
    secondaryType: tx.secondaryType, // This might be null for bills!
    confidence: 0.95,
    reasoning: 'AI categorization'
  }));

  for (const result of aiResults) {
    console.log(`   ${result.description}: ${result.type} (secondaryType: ${result.secondaryType || 'null'})`);
  }
  console.log('');

  // Step 3: Simulate the batch update payload construction
  console.log('3. Batch Update Payload Construction:');
  
  const batchUpdates = aiResults.map(result => {
    // 🎯 FIXED: Ensure bill transactions get proper secondaryType
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
      categoryId: result.categoryId,
      primaryType: result.primaryType || 'expense',
      secondaryType: isBillTransaction ? 'bill' : (result.secondaryType || 'one-time expense'),
      isTaxDeductible: result.isTaxDeductible || false,
      businessUsePercentage: result.businessUsePercentage || 0,
      aiConfidence: result.confidence || 0.7,
      aiReasoning: result.reasoning || 'AI categorization applied',
      classificationSource: 'ai'
    };
  });

  for (const update of batchUpdates) {
    console.log(`   ${update.transactionId}: ${update.category} (${update.secondaryType})`);
  }
  console.log('');

  // Step 4: Simulate the backend bill transaction identification
  console.log('4. Backend Bill Transaction Identification:');
  
  for (const update of batchUpdates) {
    // Simulate what the database transaction looks like when the batch update runs
    const existingTransaction = actualDatabaseTransactions.find(tx => tx.id === update.transactionId);
    
    const isBillTransaction = existingTransaction?.billPatternId || 
                             existingTransaction?.secondaryType === 'bill' || 
                             existingTransaction?.analysisType === 'recurring-bill' ||
                             existingTransaction?.type === 'Bill' ||
                             existingTransaction?.classification === 'Bill'; // 🎯 ADDED: Check UI classification

    console.log(`   ${update.transactionId}: ${isBillTransaction ? 'Bill' : 'One-time'} transaction`);
    console.log(`     DB secondaryType: ${existingTransaction?.secondaryType || 'null'}`);
    console.log(`     DB analysisType: ${existingTransaction?.analysisType || 'null'}`);
    console.log(`     UI classification: ${existingTransaction?.classification || 'null'}`);
    console.log('');
  }

  // Step 5: Simulate the related bill transaction matching
  console.log('5. Related Bill Transaction Matching:');
  
  const targetTransaction = actualDatabaseTransactions[0]; // Gym transaction
  const relatedBillTransactions = actualDatabaseTransactions.filter(tx => 
    tx.merchant === targetTransaction.merchant &&
    tx.id !== targetTransaction.id &&
    (tx.secondaryType === 'bill' || 
     tx.analysisType === 'recurring-bill' || 
     tx.type === 'Bill' ||
     tx.classification === 'Bill') // 🎯 ADDED: Check UI classification
  );

  console.log(`   Target transaction: ${targetTransaction.merchant} (${targetTransaction.id})`);
  console.log(`   Related bill transactions found: ${relatedBillTransactions.length}`);
  for (const tx of relatedBillTransactions) {
    console.log(`   - ${tx.id}: ${tx.merchant} (${tx.classification})`);
  }
  console.log('');

  console.log('🎯 ISSUE IDENTIFIED:');
  console.log('The problem is that transactions marked as "Bill" in the UI');
  console.log('don\'t have the proper secondaryType field set in the database.');
  console.log('');
  console.log('🔧 SOLUTION:');
  console.log('The backend bill transaction identification logic needs to also check');
  console.log('the UI classification field or the transaction description to identify bills.');
  console.log('');
  console.log('📋 RECOMMENDATION:');
  console.log('Update the backend logic to also check for UI classification or');
  console.log('transaction description patterns when identifying bill transactions.');
}

// Run the test
testActualBillCategorization().catch(console.error); 