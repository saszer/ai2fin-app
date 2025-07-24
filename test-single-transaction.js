const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSingleTransaction() {
  try {
    // Get the first user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('No user found');
      return;
    }
    
    console.log(`Using user: ${user.email} (ID: ${user.id})`);
    
    // Try to create a single transaction with minimal fields
    const transaction = await prisma.bankTransaction.create({
      data: {
        userId: user.id,
        transactionId: `test-${Date.now()}`,
        description: 'TEST TRANSACTION',
        amount: -19.99,
        date: new Date('2024-01-15'),
        type: 'debit',
        merchant: 'Test Merchant',
        primaryType: 'expense',
        secondaryType: 'one-time expense',
        recurring: false,
        isRecurringBill: false,
        billPatternId: null,
        billOccurrenceDate: null,
        categoryId: null,
        csvUploadId: null,
        bankAccountId: null,
        isTaxDeductible: false,
        businessUsePercentage: 0,
        processed: true,
        confidence: 0,
        aiClassified: false,
        aiConfidence: 0,
        classificationSource: 'test',
        classificationConfidence: 0,
        userReviewedAI: false,
        aiSuggestionStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Successfully created transaction:', transaction);
    
  } catch (error) {
    console.error('❌ Error creating transaction:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSingleTransaction(); 