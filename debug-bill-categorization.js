/**
 * 🐛 DEBUG: Bill Categorization Issue
 * 
 * This script tests the bill pattern categorization logic to identify
 * why bill transactions are showing as "Uncategorized" in the UI.
 */

const testBillPatterns = [
  {
    id: 'test-bill-1',
    name: 'Netflix Monthly Subscription',
    baseAmount: -19.99,
    merchant: 'Netflix',
    startDate: new Date('2024-01-01'),
    category: null, // 🎯 This should be set by AI classification
    categoryId: null,
    isTaxDeductible: null,
    businessUsePercentage: null,
    occurrences: [
      {
        id: 'occ-1',
        bankTransaction: {
          id: 'tx-1',
          description: 'Netflix Monthly Subscription',
          amount: -19.99,
          merchant: 'Netflix',
          date: '2024-12-15'
        }
      }
    ]
  },
  {
    id: 'test-bill-2', 
    name: 'Telstra Mobile Bill',
    baseAmount: -89.99,
    merchant: 'Telstra',
    startDate: new Date('2024-01-01'),
    category: null,
    categoryId: null,
    isTaxDeductible: null,
    businessUsePercentage: null,
    occurrences: [
      {
        id: 'occ-2',
        bankTransaction: {
          id: 'tx-2',
          description: 'Telstra Mobile Bill',
          amount: -89.99,
          merchant: 'Telstra',
          date: '2024-12-20'
        }
      }
    ]
  }
];

async function debugBillCategorization() {
  console.log('🐛 DEBUG: Bill Categorization Issue');
  console.log('====================================');
  
  // Test 1: Check bill pattern classification logic
  console.log('\n1️⃣ Testing bill pattern classification logic...');
  
  testBillPatterns.forEach((pattern, i) => {
    console.log(`\n📋 Bill Pattern ${i + 1}: ${pattern.name}`);
    console.log(`   • Has category: ${pattern.category ? 'YES' : 'NO'}`);
    console.log(`   • Category ID: ${pattern.categoryId || 'NULL'}`);
    console.log(`   • Is tax deductible: ${pattern.isTaxDeductible !== null ? pattern.isTaxDeductible : 'NULL'}`);
    console.log(`   • Business use %: ${pattern.businessUsePercentage || 'NULL'}`);
    console.log(`   • Occurrences: ${pattern.occurrences.length}`);
  });
  
  // Test 2: Simulate the classification flow
  console.log('\n2️⃣ Simulating classification flow...');
  
  const classificationResults = testBillPatterns.map(pattern => {
    // Simulate the classifyBillPattern method logic
    if (pattern.category && pattern.categoryId) {
      // Bill pattern already has classification
      console.log(`✅ Pattern "${pattern.name}" already categorized: ${pattern.category}`);
      return {
        patternId: pattern.id,
        category: pattern.category,
        categoryId: pattern.categoryId,
        isTaxDeductible: pattern.isTaxDeductible || false,
        businessUsePercentage: pattern.businessUsePercentage || 0,
        confidence: 0.95,
        source: 'bill-pattern',
        reasoning: `Existing bill pattern classification: ${pattern.name}`
      };
    } else {
      // Bill pattern needs AI classification
      console.log(`🤖 Pattern "${pattern.name}" needs AI classification`);
      
      // Simulate AI classification result
      const aiResult = {
        category: 'Entertainment', // Mock AI result
        confidence: 0.85,
        isTaxDeductible: false,
        businessUsePercentage: 0,
        source: 'ai'
      };
      
      // Simulate database update
      pattern.category = aiResult.category;
      pattern.categoryId = 'cat-entertainment';
      pattern.isTaxDeductible = aiResult.isTaxDeductible;
      pattern.businessUsePercentage = aiResult.businessUsePercentage;
      
      console.log(`✅ Pattern "${pattern.name}" classified by AI: ${aiResult.category}`);
      
      return {
        patternId: pattern.id,
        category: aiResult.category,
        categoryId: 'cat-entertainment',
        isTaxDeductible: aiResult.isTaxDeductible,
        businessUsePercentage: aiResult.businessUsePercentage,
        confidence: aiResult.confidence,
        source: 'ai',
        reasoning: `AI classified bill pattern: ${pattern.name}`
      };
    }
  });
  
  // Test 3: Simulate applying bill pattern results to transactions
  console.log('\n3️⃣ Simulating application to transactions...');
  
  const transactionResults = [];
  
  testBillPatterns.forEach((pattern, i) => {
    const classification = classificationResults[i];
    
    pattern.occurrences.forEach(occurrence => {
      const transaction = occurrence.bankTransaction;
      const transactionAmount = Math.abs(parseFloat(transaction.amount) || 0);
      const deductibleAmount = classification.isTaxDeductible 
        ? transactionAmount * (classification.businessUsePercentage || 100) / 100 
        : 0;
      
      const result = {
        transactionId: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        merchant: transaction.merchant,
        primaryType: 'expense',
        secondaryType: 'bill',
        category: classification.category,
        categoryId: classification.categoryId,
        isTaxDeductible: classification.isTaxDeductible,
        businessUsePercentage: classification.businessUsePercentage,
        confidence: classification.confidence,
        source: classification.source,
        reasoning: `Applied bill pattern categorization: ${pattern.name}`,
        expenseCalculation: {
          transactionAmount,
          deductibleAmount,
          businessUsePercentage: classification.businessUsePercentage || 0,
          isExpense: true,
          isBill: true
        }
      };
      
      transactionResults.push(result);
      
      console.log(`   📝 Transaction "${transaction.description}" → Category: "${result.category}"`);
    });
  });
  
  // Test 4: Check for potential issues
  console.log('\n4️⃣ Checking for potential issues...');
  
  const uncategorizedTransactions = transactionResults.filter(r => 
    !r.category || r.category === 'Uncategorized' || r.category === ''
  );
  
  const categorizedTransactions = transactionResults.filter(r => 
    r.category && r.category !== 'Uncategorized' && r.category !== ''
  );
  
  console.log(`📊 Results:`);
  console.log(`   • Total transactions: ${transactionResults.length}`);
  console.log(`   • Categorized: ${categorizedTransactions.length}`);
  console.log(`   • Uncategorized: ${uncategorizedTransactions.length}`);
  
  if (uncategorizedTransactions.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    uncategorizedTransactions.forEach(tx => {
      console.log(`   • Transaction "${tx.description}" is uncategorized`);
      console.log(`     - Category: "${tx.category}"`);
      console.log(`     - Source: ${tx.source}`);
      console.log(`     - Reasoning: ${tx.reasoning}`);
    });
  } else {
    console.log('\n✅ All transactions are properly categorized!');
  }
  
  // Test 5: Identify potential root causes
  console.log('\n5️⃣ Potential root causes:');
  console.log('   • AI+ microservice not running or not responding');
  console.log('   • Bill patterns not being found in database');
  console.log('   • AI classification returning null/empty category');
  console.log('   • Database update failing after AI classification');
  console.log('   • Frontend not receiving updated category data');
  console.log('   • Bill pattern linking not working correctly');
  
  // Test 6: Debug steps
  console.log('\n6️⃣ Debug steps to try:');
  console.log('   1. Check if AI+ microservice is running on port 3002');
  console.log('   2. Check database for bill patterns and their categories');
  console.log('   3. Test AI+ microservice directly with bill pattern data');
  console.log('   4. Check if bill pattern classification is being called');
  console.log('   5. Verify database updates are happening');
  console.log('   6. Check frontend API calls and data flow');
  
  console.log('\n🎯 Expected behavior:');
  console.log('   • Bill patterns should be classified by AI');
  console.log('   • Categories should be stored in database');
  console.log('   • All transactions in bill pattern should get same category');
  console.log('   • Frontend should display categorized transactions');
  
  console.log('\n✅ Debug completed!');
}

debugBillCategorization().catch(console.error); 