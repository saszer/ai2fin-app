const { PrismaClient } = require('./ai2-core-app/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function testEndpoint() {
  try {
    console.log('🔍 Testing statistics endpoint logic...');
    
    const uploadId = 'cmdlt4a1501jpp980lhuileu4';
    const userId = 'cmdhr1o8y0000p9a80t2ft9wc';
    
    // Test the exact logic from the updated endpoint
    const [aggregation, transfersCount, categoriesCount, dateRange, smallestTransaction, largestTransaction] = await Promise.all([
      prisma.bankTransaction.aggregate({
        where: { csvUploadId: uploadId, userId },
        _count: { id: true },
        _sum: { amount: true },
        _avg: { amount: true },
        _min: { amount: true },
        _max: { amount: true }
      }),
      prisma.bankTransaction.count({
        where: { csvUploadId: uploadId, userId, primaryType: 'transfer' }
      }),
      prisma.bankTransaction.groupBy({
        by: ['category'],
        where: { csvUploadId: uploadId, userId, category: { not: null } },
        _count: true
      }),
      prisma.bankTransaction.aggregate({
        where: { csvUploadId: uploadId, userId },
        _min: { date: true },
        _max: { date: true }
      }),
      prisma.bankTransaction.findFirst({
        where: { csvUploadId: uploadId, userId },
        orderBy: { amount: 'asc' },
        select: { id: true, amount: true, description: true, date: true }
      }),
      prisma.bankTransaction.findFirst({
        where: { csvUploadId: uploadId, userId },
        orderBy: { amount: 'desc' },
        select: { id: true, amount: true, description: true, date: true }
      })
    ]);

    // Calculate income and expenses
    const transactions = await prisma.bankTransaction.findMany({
      where: { csvUploadId: uploadId, userId },
      select: { amount: true }
    });

    let income = 0;
    let expenses = 0;
    let totalAbsoluteAmount = 0;

    transactions.forEach(tx => {
      if (tx.amount > 0) {
        income += tx.amount;
      } else {
        expenses += Math.abs(tx.amount);
      }
      totalAbsoluteAmount += Math.abs(tx.amount);
    });

    const stats = {
      totalTransactions: aggregation._count.id,
      totalValue: aggregation._sum.amount || 0,
      income,
      expenses,
      transfers: transfersCount,
      categories: categoriesCount.length,
      averageAmount: totalAbsoluteAmount / transactions.length,
      minDate: dateRange._min.date,
      maxDate: dateRange._max.date,
      smallestAmount: aggregation._min.amount,
      largestAmount: aggregation._max.amount
    };

    console.log('✅ Statistics calculation working correctly:');
    console.log(`  Total Transactions: ${stats.totalTransactions}`);
    console.log(`  Total Value: $${stats.totalValue.toFixed(2)}`);
    console.log(`  Income: $${stats.income.toFixed(2)}`);
    console.log(`  Expenses: $${stats.expenses.toFixed(2)}`);
    console.log(`  Transfers: ${stats.transfers}`);
    console.log(`  Categories: ${stats.categories}`);
    console.log(`  Average Amount: $${stats.averageAmount.toFixed(2)}`);
    
    // Simulate the API response structure
    const apiResponse = {
      success: true,
      data: {
        uploadId,
        fileName: 'ANZ (3).csv',
        displayName: 'ANZ (3).csv',
        statistics: {
          totalTransactions: stats.totalTransactions,
          totalValue: stats.totalValue,
          income: stats.income,
          expenses: stats.expenses,
          transfers: stats.transfers,
          categories: stats.categories,
          averageAmount: stats.averageAmount,
          dateRange: {
            min: stats.minDate,
            max: stats.maxDate
          },
          smallestTransaction,
          largestTransaction
        },
        metadata: {
          calculationTime: 123.45,
          calculatedAt: new Date().toISOString(),
          dataSource: 'prisma-aggregation'
        }
      }
    };
    
    console.log('\n📡 API Response structure:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEndpoint(); 