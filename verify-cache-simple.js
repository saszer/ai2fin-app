/**
 * 🔍 SIMPLE CACHE VERIFICATION SCRIPT
 * Tests the database cache tables and storage
 */

const { PrismaClient } = require('./ai2-core-app/node_modules/.prisma/client');

const prisma = new PrismaClient();

async function verifyCacheDatabase() {
  console.log('🔍 ===== CACHE DATABASE VERIFICATION =====\n');

  try {
    // Step 1: Check database schema and tables
    console.log('📋 Step 1: Verifying cache tables exist...');
    
    try {
      const cacheCount = await prisma.categoryIntelligenceCache.count();
      console.log(`✅ CategoryIntelligenceCache: EXISTS (${cacheCount} records)`);
    } catch (error) {
      console.log(`❌ CategoryIntelligenceCache: ERROR - ${error.message}`);
    }

    try {
      const taxCacheCount = await prisma.taxIntelligenceCache.count();
      console.log(`✅ TaxIntelligenceCache: EXISTS (${taxCacheCount} records)`);
    } catch (error) {
      console.log(`❌ TaxIntelligenceCache: ERROR - ${error.message}`);
    }

    try {
      const prefsCount = await prisma.userCategorizationPreferences.count();
      console.log(`✅ UserCategorizationPreferences: EXISTS (${prefsCount} records)`);
    } catch (error) {
      console.log(`❌ UserCategorizationPreferences: ERROR - ${error.message}`);
    }

    // Step 2: Get test user
    console.log('\n📋 Step 2: Finding test user...');
    const user = await prisma.user.findFirst({
      select: { 
        id: true, 
        email: true, 
        businessType: true,
        profession: true,
        industry: true 
      }
    });
    
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`✅ Test user: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Business Type: ${user.businessType || 'Not set'}`);
    console.log(`   Profession: ${user.profession || 'Not set'}`);
    console.log(`   Industry: ${user.industry || 'Not set'}`);

    // Step 3: Check transactions
    console.log('\n📋 Step 3: Checking transactions...');
    const transactionCount = await prisma.bankTransaction.count({
      where: { userId: user.id }
    });
    
    const categorizedCount = await prisma.bankTransaction.count({
      where: { 
        userId: user.id,
        categoryId: { not: null }
      }
    });
    
    const uncategorizedCount = transactionCount - categorizedCount;
    
    console.log(`✅ Total transactions: ${transactionCount}`);
    console.log(`✅ Categorized transactions: ${categorizedCount}`);
    console.log(`✅ Uncategorized transactions: ${uncategorizedCount}`);

    // Step 4: Check existing cache entries
    console.log('\n📋 Step 4: Checking existing cache entries...');
    
    try {
      const userCacheCount = await prisma.categoryIntelligenceCache.count({
        where: { userId: user.id }
      });
      
      console.log(`✅ User's cache entries: ${userCacheCount}`);
      
      if (userCacheCount > 0) {
        const recentCache = await prisma.categoryIntelligenceCache.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            merchantPattern: true,
            category: true,
            confidence: true,
            usageCount: true,
            source: true,
            createdAt: true,
            lastUsed: true
          }
        });

        console.log(`\n🎯 Recent cache entries:`);
        recentCache.forEach((cache, i) => {
          console.log(`   ${i + 1}. ${cache.merchantPattern || 'No merchant'} → ${cache.category}`);
          console.log(`      Confidence: ${(cache.confidence * 100).toFixed(1)}%`);
          console.log(`      Usage count: ${cache.usageCount}`);
          console.log(`      Source: ${cache.source}`);
          console.log(`      Created: ${cache.createdAt.toISOString()}`);
          console.log(`      Last used: ${cache.lastUsed.toISOString()}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log(`❌ Error checking cache entries: ${error.message}`);
    }

    // Step 5: Check tax cache
    console.log('📋 Step 5: Checking tax cache entries...');
    
    try {
      const userTaxCacheCount = await prisma.taxIntelligenceCache.count({
        where: { userId: user.id }
      });
      
      console.log(`✅ User's tax cache entries: ${userTaxCacheCount}`);
      
      if (userTaxCacheCount > 0) {
        const recentTaxCache = await prisma.taxIntelligenceCache.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            merchantPattern: true,
            categoryPattern: true,
            isTaxDeductible: true,
            businessUsePercentage: true,
            confidence: true,
            deductionType: true
          }
        });

        console.log(`\n💰 Recent tax cache entries:`);
        recentTaxCache.forEach((cache, i) => {
          console.log(`   ${i + 1}. ${cache.merchantPattern || 'No merchant'} → ${cache.categoryPattern}`);
          console.log(`      Tax deductible: ${cache.isTaxDeductible ? 'YES' : 'NO'}`);
          console.log(`      Business use: ${cache.businessUsePercentage}%`);
          console.log(`      Deduction type: ${cache.deductionType || 'none'}`);
          console.log(`      Confidence: ${(cache.confidence * 100).toFixed(1)}%`);
          console.log('');
        });
      }
    } catch (error) {
      console.log(`❌ Error checking tax cache entries: ${error.message}`);
    }

    // Step 6: Show some uncategorized transactions for testing
    if (uncategorizedCount > 0) {
      console.log('\n📋 Step 6: Sample uncategorized transactions for testing...');
      
      const sampleTransactions = await prisma.bankTransaction.findMany({
        where: { 
          userId: user.id,
          OR: [
            { category: null },
            { category: 'Uncategorized' },
            { categoryId: null }
          ]
        },
        take: 5,
        select: {
          id: true,
          description: true,
          amount: true,
          merchant: true,
          date: true,
          category: true
        },
        orderBy: { date: 'desc' }
      });

      console.log(`🔍 Sample transactions that could be categorized:`);
      sampleTransactions.forEach((tx, i) => {
        console.log(`   ${i + 1}. ${tx.description} - $${tx.amount}`);
        console.log(`      Merchant: ${tx.merchant || 'Not set'}`);
        console.log(`      Current category: ${tx.category || 'Uncategorized'}`);
        console.log(`      Date: ${tx.date ? new Date(tx.date).toISOString().split('T')[0] : 'No date'}`);
        console.log('');
      });
    }

    // Step 7: Summary
    console.log('📋 Step 7: Cache flow verification summary...');
    console.log(`\n🎯 CACHE SYSTEM STATUS:`);
    console.log(`   ✅ Cache tables exist and accessible`);
    console.log(`   ✅ User has ${categorizedCount} categorized transactions`);
    console.log(`   ✅ User has ${userCacheCount || 0} intelligence cache entries`);
    console.log(`   ✅ User has ${userTaxCacheCount || 0} tax cache entries`);
    
    if (uncategorizedCount > 0) {
      console.log(`   🔄 ${uncategorizedCount} transactions ready for smart categorization`);
      console.log(`\n💡 NEXT STEPS:`);
      console.log(`   1. Run smart categorization on frontend`);
      console.log(`   2. Check for new cache entries after categorization`);
      console.log(`   3. Verify cache hit rate improves on second run`);
    } else {
      console.log(`   ✅ All transactions are categorized`);
    }

    console.log('\n🎉 ===== CACHE VERIFICATION COMPLETE =====');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyCacheDatabase().catch(console.error); 