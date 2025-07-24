const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test transactions that should form patterns
const testTransactions = [
  // Netflix subscription pattern (monthly, same amount)
  { date: new Date('2024-01-15'), description: 'NETFLIX.COM', amount: -19.99, merchant: 'Netflix', type: 'debit', primaryType: 'entertainment', secondaryType: 'subscription' },
  { date: new Date('2024-02-15'), description: 'NETFLIX.COM', amount: -19.99, merchant: 'Netflix', type: 'debit', primaryType: 'entertainment', secondaryType: 'subscription' },
  { date: new Date('2024-03-15'), description: 'NETFLIX.COM', amount: -19.99, merchant: 'Netflix', type: 'debit', primaryType: 'entertainment', secondaryType: 'subscription' },
  { date: new Date('2024-04-15'), description: 'NETFLIX.COM', amount: -19.99, merchant: 'Netflix', type: 'debit', primaryType: 'entertainment', secondaryType: 'subscription' },
  
  // Spotify subscription pattern (monthly, same amount)
  { date: new Date('2024-01-10'), description: 'SPOTIFY USA', amount: -9.99, merchant: 'Spotify', type: 'debit', primaryType: 'entertainment', secondaryType: 'subscription' },
  { date: new Date('2024-02-10'), description: 'SPOTIFY USA', amount: -9.99, merchant: 'Spotify', type: 'debit', primaryType: 'entertainment', secondaryType: 'subscription' },
  { date: new Date('2024-03-10'), description: 'SPOTIFY USA', amount: -9.99, merchant: 'Spotify', type: 'debit', primaryType: 'entertainment', secondaryType: 'subscription' },
  { date: new Date('2024-04-10'), description: 'SPOTIFY USA', amount: -9.99, merchant: 'Spotify', type: 'debit', primaryType: 'entertainment', secondaryType: 'subscription' },
  
  // Uber rides pattern (variable amounts, bi-weekly)
  { date: new Date('2024-01-05'), description: 'UBER *TRIP', amount: -23.50, merchant: 'Uber', type: 'debit', primaryType: 'transportation', secondaryType: 'ride-sharing' },
  { date: new Date('2024-01-19'), description: 'UBER *TRIP', amount: -18.75, merchant: 'Uber', type: 'debit', primaryType: 'transportation', secondaryType: 'ride-sharing' },
  { date: new Date('2024-02-02'), description: 'UBER *TRIP', amount: -21.20, merchant: 'Uber', type: 'debit', primaryType: 'transportation', secondaryType: 'ride-sharing' },
  { date: new Date('2024-02-16'), description: 'UBER *TRIP', amount: -19.80, merchant: 'Uber', type: 'debit', primaryType: 'transportation', secondaryType: 'ride-sharing' },
  { date: new Date('2024-03-01'), description: 'UBER *TRIP', amount: -22.10, merchant: 'Uber', type: 'debit', primaryType: 'transportation', secondaryType: 'ride-sharing' },
  { date: new Date('2024-03-15'), description: 'UBER *TRIP', amount: -17.90, merchant: 'Uber', type: 'debit', primaryType: 'transportation', secondaryType: 'ride-sharing' },
  
  // One-time expenses (should not form patterns)
  { date: new Date('2024-01-03'), description: 'WALMART GROCERY', amount: -125.50, merchant: 'Walmart', type: 'debit', primaryType: 'food', secondaryType: 'grocery' },
  { date: new Date('2024-01-12'), description: 'SHELL GAS STATION', amount: -45.20, merchant: 'Shell', type: 'debit', primaryType: 'transportation', secondaryType: 'fuel' },
  { date: new Date('2024-01-18'), description: 'MCDONALDS', amount: -15.99, merchant: 'McDonalds', type: 'debit', primaryType: 'food', secondaryType: 'restaurant' },
  { date: new Date('2024-02-08'), description: 'AMAZON.COM', amount: -89.99, merchant: 'Amazon', type: 'debit', primaryType: 'shopping', secondaryType: 'online' },
  { date: new Date('2024-03-22'), description: 'STARBUCKS', amount: -8.50, merchant: 'Starbucks', type: 'debit', primaryType: 'food', secondaryType: 'coffee' },
];

async function addTestTransactions() {
  console.log('📝 Adding test transactions for pattern analysis...\n');
  
  try {
    // Get the first user (or create one if needed)
    let user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('No user found, creating test user...');
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          password: 'hashedpassword',
          countryCode: 'AU'
        }
      });
    }
    
    console.log(`Using user: ${user.email} (ID: ${user.id})`);
    
    // Add test transactions
    const createdTransactions = [];
    
    for (const transactionData of testTransactions) {
      const transaction = await prisma.bankTransaction.create({
        data: {
          userId: user.id,
          transactionId: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          date: transactionData.date,
          description: transactionData.description,
          amount: transactionData.amount,
          type: transactionData.type,
          merchant: transactionData.merchant,
          primaryType: transactionData.primaryType,
          secondaryType: transactionData.secondaryType,
          isRecurringBill: false,
          billPatternId: null,
          billOccurrenceDate: null,
          categoryId: null,
          csvUploadId: null,
          bankAccountId: null,
          isTaxDeductible: false,
          businessUsePercentage: 0,
          notes: 'Test transaction for pattern analysis',
          aiAnalyzed: false,
          aiConfidence: 0,
          aiReasoning: '',
          userClassifiedAt: null,
          classificationSource: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      createdTransactions.push(transaction);
      console.log(`✅ Added transaction: ${transaction.description} (${transaction.date.toISOString().split('T')[0]}) - $${Math.abs(transaction.amount)}`);
    }
    
    console.log(`\n🎉 Successfully added ${createdTransactions.length} test transactions`);
    console.log('📊 Transaction breakdown:');
    console.log(`   - Netflix (subscription): 4 transactions`);
    console.log(`   - Spotify (subscription): 4 transactions`);
    console.log(`   - Uber (ride-sharing): 6 transactions`);
    console.log(`   - One-time expenses: 5 transactions`);
    console.log('\n🧪 Ready for pattern analysis testing!');
    
  } catch (error) {
    console.error('❌ Error adding test transactions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addTestTransactions(); 