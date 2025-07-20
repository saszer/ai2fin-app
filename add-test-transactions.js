const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// User ID from the console logs (the logged in user)
const USER_ID = 'cmd30zfb50000p9iwjfpj81do';

const testTransactions = [
  // Netflix Monthly Pattern - Perfect 30-day intervals
  {
    id: 'netflix_test_1',
    transactionId: 'NETFLIX_2024_01_TEST',
    description: 'NETFLIX.COM SUBSCRIPTION',
    amount: -15.99,
    date: new Date('2024-01-15'),
    type: 'debit',
    primaryType: 'expense',
    merchant: 'NETFLIX',
    category: 'Entertainment',
    classification: 'subscription',
    isRecurringBill: true,
    billFrequency: 'MONTHLY'
  },
  {
    id: 'netflix_test_2',
    transactionId: 'NETFLIX_2024_02_TEST',
    description: 'NETFLIX.COM SUBSCRIPTION',
    amount: -15.99,
    date: new Date('2024-02-15'),
    type: 'debit',
    primaryType: 'expense',
    merchant: 'NETFLIX',
    category: 'Entertainment',
    classification: 'subscription',
    isRecurringBill: true,
    billFrequency: 'MONTHLY'
  },
  {
    id: 'netflix_test_3',
    transactionId: 'NETFLIX_2024_03_TEST',
    description: 'NETFLIX.COM SUBSCRIPTION',
    amount: -15.99,
    date: new Date('2024-03-15'),
    type: 'debit',
    primaryType: 'expense',
    merchant: 'NETFLIX',
    category: 'Entertainment',
    classification: 'subscription',
    isRecurringBill: true,
    billFrequency: 'MONTHLY'
  },
  {
    id: 'netflix_test_4',
    transactionId: 'NETFLIX_2024_04_TEST',
    description: 'NETFLIX.COM SUBSCRIPTION',
    amount: -15.99,
    date: new Date('2024-04-15'),
    type: 'debit',
    primaryType: 'expense',
    merchant: 'NETFLIX',
    category: 'Entertainment',
    classification: 'subscription',
    isRecurringBill: true,
    billFrequency: 'MONTHLY'
  },

  // Spotify Monthly Pattern 
  {
    id: 'spotify_test_1',
    transactionId: 'SPOTIFY_2024_01_TEST',
    description: 'SPOTIFY PREMIUM',
    amount: -9.99,
    date: new Date('2024-01-05'),
    type: 'debit',
    primaryType: 'expense',
    merchant: 'SPOTIFY',
    category: 'Entertainment',
    classification: 'subscription',
    isRecurringBill: true,
    billFrequency: 'MONTHLY'
  },
  {
    id: 'spotify_test_2',
    transactionId: 'SPOTIFY_2024_02_TEST',
    description: 'SPOTIFY PREMIUM',
    amount: -9.99,
    date: new Date('2024-02-05'),
    type: 'debit',
    primaryType: 'expense',
    merchant: 'SPOTIFY',
    category: 'Entertainment',
    classification: 'subscription',
    isRecurringBill: true,
    billFrequency: 'MONTHLY'
  },
  {
    id: 'spotify_test_3',
    transactionId: 'SPOTIFY_2024_03_TEST',
    description: 'SPOTIFY PREMIUM',
    amount: -10.99,
    date: new Date('2024-03-05'),
    type: 'debit',
    primaryType: 'expense',
    merchant: 'SPOTIFY',
    category: 'Entertainment',
    classification: 'subscription',
    isRecurringBill: true,
    billFrequency: 'MONTHLY'
  },

  // Energy Bill Pattern
  {
    id: 'energy_test_1',
    transactionId: 'ENERGY_2024_01_TEST',
    description: 'ENERGY AUSTRALIA ELECTRICITY',
    amount: -156.78,
    date: new Date('2024-01-28'),
    type: 'debit',
    primaryType: 'expense',
    merchant: 'ENERGY AUSTRALIA',
    category: 'Utilities',
    classification: 'bill',
    isRecurringBill: true,
    billFrequency: 'MONTHLY'
  },
  {
    id: 'energy_test_2',
    transactionId: 'ENERGY_2024_02_TEST',
    description: 'ENERGY AUSTRALIA ELECTRICITY',
    amount: -203.45,
    date: new Date('2024-02-28'),
    type: 'debit',
    primaryType: 'expense',
    merchant: 'ENERGY AUSTRALIA',
    category: 'Utilities',
    classification: 'bill',
    isRecurringBill: true,
    billFrequency: 'MONTHLY'
  },
  {
    id: 'energy_test_3',
    transactionId: 'ENERGY_2024_03_TEST',
    description: 'ENERGY AUSTRALIA ELECTRICITY',
    amount: -178.92,
    date: new Date('2024-03-28'),
    type: 'debit',
    primaryType: 'expense',
    merchant: 'ENERGY AUSTRALIA',
    category: 'Utilities',
    classification: 'bill',
    isRecurringBill: true,
    billFrequency: 'MONTHLY'
  }
];

async function addTestTransactions() {
  console.log('🧪 Adding Test Transactions for Pattern Detection\n');
  
  try {
    // First, clean up any existing test transactions
    console.log('🧹 Cleaning up existing test transactions...');
    const deleted = await prisma.bankTransaction.deleteMany({
      where: {
        userId: USER_ID,
        transactionId: {
          contains: '_TEST'
        }
      }
    });
    console.log(`   Deleted ${deleted.count} existing test transactions\n`);

    // Add new test transactions
    console.log('➕ Adding new test transactions...');
    let addedCount = 0;
    
    for (const transaction of testTransactions) {
      try {
        await prisma.bankTransaction.create({
          data: {
            ...transaction,
            userId: USER_ID
          }
        });
        addedCount++;
        console.log(`   ✅ Added: ${transaction.description} - $${Math.abs(transaction.amount)}`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`   ⚠️ Skipped duplicate: ${transaction.description}`);
        } else {
          console.log(`   ❌ Error adding ${transaction.description}:`, error.message);
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Added: ${addedCount} transactions`);
    console.log(`   Netflix: 4 monthly transactions`);
    console.log(`   Spotify: 3 monthly transactions`);  
    console.log(`   Energy: 3 monthly bills\n`);

    // Verify transactions were added
    console.log('🔍 Verifying transactions...');
    const verifyTransactions = await prisma.bankTransaction.findMany({
      where: {
        userId: USER_ID,
        transactionId: {
          contains: '_TEST'
        }
      },
      select: {
        description: true,
        amount: true,
        date: true,
        merchant: true
      },
      orderBy: [
        { merchant: 'asc' },
        { date: 'asc' }
      ]
    });

    verifyTransactions.forEach(tx => {
      console.log(`   ${tx.merchant}: ${tx.description} - $${Math.abs(tx.amount)} (${tx.date.toISOString().split('T')[0]})`);
    });

    console.log(`\n🎉 Test transactions added successfully!`);
    console.log(`   Now go to the Bill Pattern Analysis in the frontend to test pattern detection.`);
    console.log(`   Expected: Should detect 3 patterns (Netflix, Spotify, Energy Australia)`);

  } catch (error) {
    console.error('❌ Error adding test transactions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestTransactions(); 