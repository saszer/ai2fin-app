/**
 * Debug script for tax analysis endpoint
 */

const { PrismaClient } = require('@prisma/client');

async function debugTaxEndpoint() {
  console.log('🔍 Debugging Tax Analysis Endpoint...\n');

  try {
    const prisma = new PrismaClient();

    // Test 1: Check the test user
    console.log('1. Checking test user...');
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    if (testUser) {
      console.log('✅ Found test user:', testUser);
    } else {
      console.log('❌ Test user not found');
      return;
    }

    // Test 2: Check transactions for this user
    console.log('\n2. Checking transactions for test user...');
    const transactions = await prisma.bankTransaction.findMany({
      where: { userId: testUser.id },
      select: {
        id: true,
        description: true,
        amount: true,
        isTaxDeductible: true,
        businessUsePercentage: true
      },
      take: 5
    });
    
    console.log(`✅ Found ${transactions.length} transactions for test user`);
    transactions.forEach(tx => {
      console.log(`   - ${tx.description} ($${tx.amount}) - Tax: ${tx.isTaxDeductible}, Business: ${tx.businessUsePercentage}%`);
    });

    // Test 3: Check total transaction count
    console.log('\n3. Checking total transaction count...');
    const totalTransactions = await prisma.bankTransaction.count({
      where: { userId: testUser.id }
    });
    console.log(`✅ Total transactions for test user: ${totalTransactions}`);

    // Test 4: Check transactions with tax analysis
    console.log('\n4. Checking transactions with tax analysis...');
    const analyzedTransactions = await prisma.bankTransaction.count({
      where: {
        userId: testUser.id,
        OR: [
          { isTaxDeductible: true },
          { isTaxDeductible: false }
        ]
      }
    });
    console.log(`✅ Transactions with tax analysis: ${analyzedTransactions}`);

    // Test 5: Check transactions needing analysis
    console.log('\n5. Checking transactions needing analysis...');
    const transactionsNeedingAnalysis = await prisma.bankTransaction.count({
      where: {
        userId: testUser.id,
        isTaxDeductible: {
          equals: null
        }
      }
    });
    console.log(`✅ Transactions needing analysis: ${transactionsNeedingAnalysis}`);

    // Test 6: Check unique bills and one-time expenses
    console.log('\n6. Checking unique bills and one-time expenses...');
    const allUserTransactions = await prisma.bankTransaction.findMany({
      where: { userId: testUser.id },
      select: {
        id: true,
        description: true,
        amount: true,
        secondaryType: true,
        billOccurrence: true
      }
    });

    const uniqueBills = new Set();
    let oneTimeExpenses = 0;

    allUserTransactions.forEach(tx => {
      if (tx.billOccurrence && tx.billOccurrence.length > 0) {
        uniqueBills.add(tx.billOccurrence[0].billPatternId);
      }
      if (tx.secondaryType === 'one-time expense') {
        oneTimeExpenses++;
      }
    });

    console.log(`✅ Unique bills: ${uniqueBills.size}`);
    console.log(`✅ One-time expenses: ${oneTimeExpenses}`);

    await prisma.$disconnect();
    console.log('\n🎉 Debug completed!');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugTaxEndpoint(); 