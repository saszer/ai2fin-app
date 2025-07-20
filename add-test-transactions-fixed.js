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
    isRecurringBill: true,
    billFrequency: 'MONTHLY',
    aiSuggestedClassification: 'subscription'
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
    isRecurringBill: true,
    billFrequency: 'MONTHLY',
    aiSuggestedClassification: 'subscription'
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
    isRecurringBill: true,
    billFrequency: 'MONTHLY',
    aiSuggestedClassification: 'subscription'
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
    isRecurringBill: true,
    billFrequency: 'MONTHLY',
    aiSuggestedClassification: 'subscription'
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
    isRecurringBill: true,
    billFrequency: 'MONTHLY',
    aiSuggestedClassification: 'subscription'
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
    isRecurringBill: true,
    billFrequency: 'MONTHLY',
    aiSuggestedClassification: 'subscription'
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
    isRecurringBill: true,
    billFrequency: 'MONTHLY',
    aiSuggestedClassification: 'subscription'
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
    isRecurringBill: true,
    billFrequency: 'MONTHLY',
    aiSuggestedClassification: 'bill'
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
    isRecurringBill: true,
    billFrequency: 'MONTHLY',
    aiSuggestedClassification: 'bill'
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
    isRecurringBill: true,
    billFrequency: 'MONTHLY',
    aiSuggestedClassification: 'bill'
  }
];

async function addTestTransactions() {
  console.log('🧪 Adding Test Transactions for Pattern Detection (Fixed)\n');
  
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
    console.log(`   Netflix: 4 monthly transactions (perfect 30-day pattern)`);
    console.log(`   Spotify: 3 monthly transactions (with price change)`);  
    console.log(`   Energy: 3 monthly bills (amount variance)\n`);

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
    console.log(`\n📋 NEXT STEPS:`);
    console.log(`   1. Refresh your frontend browser`);
    console.log(`   2. Go to Bill Pattern Analysis`);
    console.log(`   3. Click "Analyze Patterns"`);
    console.log(`   4. Should detect 3 clear patterns:`);
    console.log(`      ✅ Netflix Monthly (95%+ confidence)`);
    console.log(`      ✅ Spotify Monthly (90%+ confidence)`);
    console.log(`      ✅ Energy Australia Monthly (85%+ confidence)`);

  } catch (error) {
    console.error('❌ Error adding test transactions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestTransactions(); 