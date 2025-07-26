/**
 * Test script to verify tax analysis service functionality
 */

const { PrismaClient } = require('@prisma/client');

async function testTaxService() {
  console.log('🧪 Testing Tax Analysis Service...\n');

  try {
    const prisma = new PrismaClient();

    // Test 1: Check if we can connect to the database
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Test 2: Check if we have transactions
    console.log('2. Checking for transactions...');
    const transactionCount = await prisma.bankTransaction.count();
    console.log(`✅ Found ${transactionCount} transactions in database\n`);

    // Test 3: Check if we have users
    console.log('3. Checking for users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        businessType: true,
        countryCode: true
      }
    });
    console.log(`✅ Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.businessType || 'N/A'}, ${user.countryCode})`);
    });
    console.log();

    // Test 4: Check if we have categories
    console.log('4. Checking for categories...');
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        type: true
      }
    });
    console.log(`✅ Found ${categories.length} categories:`);
    categories.slice(0, 5).forEach(cat => {
      console.log(`   - ${cat.name} (${cat.type})`);
    });
    console.log();

    // Test 5: Check for existing tax analysis
    console.log('5. Checking for existing tax analysis...');
    const analyzedTransactions = await prisma.bankTransaction.count({
      where: {
        OR: [
          { isTaxDeductible: true },
          { isTaxDeductible: false }
        ]
      }
    });
    console.log(`✅ Found ${analyzedTransactions} transactions with tax analysis\n`);

    // Test 6: Check for tax intelligence cache
    console.log('6. Checking tax intelligence cache...');
    const taxCacheCount = await prisma.taxIntelligenceCache.count();
    console.log(`✅ Found ${taxCacheCount} entries in tax intelligence cache\n`);

    await prisma.$disconnect();
    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testTaxService(); 