/**
 * Check which user the transactions belong to and fix associations
 */

const { PrismaClient } = require('@prisma/client');

async function checkTransactions() {
  console.log('🔍 Checking Transaction Associations...\n');

  try {
    const prisma = new PrismaClient();

    // Test 1: Check all users
    console.log('1. Checking all users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log(`✅ Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user.id})`);
    });
    console.log();

    // Test 2: Check transaction distribution by user
    console.log('2. Checking transaction distribution by user...');
    for (const user of users) {
      const transactionCount = await prisma.bankTransaction.count({
        where: { userId: user.id }
      });
      console.log(`   - ${user.email}: ${transactionCount} transactions`);
    }
    console.log();

    // Test 3: Get some sample transactions
    console.log('\n3. Sample transactions:');
    const sampleTransactions = await prisma.bankTransaction.findMany({
      take: 5,
      select: {
        id: true,
        description: true,
        amount: true,
        userId: true,
        isTaxDeductible: true
      }
    });

    sampleTransactions.forEach(tx => {
      const user = users.find(u => u.id === tx.userId);
      console.log(`   - ${tx.description} ($${tx.amount}) - User: ${user ? user.email : 'NULL'} - Tax: ${tx.isTaxDeductible}`);
    });

    // Test 4: Fix transaction associations if needed
    console.log('\n4. Fixing transaction associations...');
    const testUser = users.find(u => u.email === 'test@example.com');
    const otherTestUser = users.find(u => u.email === 'test@gmail.com');
    
    if (testUser && otherTestUser) {
      // Move transactions from test@gmail.com to test@example.com
      const transactionsToMove = await prisma.bankTransaction.count({
        where: { userId: otherTestUser.id }
      });

      if (transactionsToMove > 0) {
        console.log(`🔄 Moving ${transactionsToMove} transactions from test@gmail.com to test@example.com...`);
        
        await prisma.bankTransaction.updateMany({
          where: { userId: otherTestUser.id },
          data: { userId: testUser.id }
        });
        
        console.log('✅ Transaction associations fixed');
      } else {
        console.log('✅ No transactions to move');
      }
    }

    // Test 5: Verify the fix
    console.log('\n5. Verifying transaction associations...');
    const testUserTransactions = await prisma.bankTransaction.count({
      where: { userId: testUser.id }
    });
    console.log(`✅ test@example.com now has ${testUserTransactions} transactions`);

    await prisma.$disconnect();
    console.log('\n🎉 Transaction association check completed!');

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkTransactions(); 