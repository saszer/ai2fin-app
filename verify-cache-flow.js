/**
 * 🔍 CACHE FLOW VERIFICATION SCRIPT
 * Tests the complete smart categorization cache flow
 */

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

async function verifyCacheFlow() {
  console.log('🔍 ===== CACHE FLOW VERIFICATION =====\n');

  try {
    // Step 1: Check database schema
    console.log('📋 Step 1: Verifying database schema...');
    
    // Check if cache tables exist
    const cacheCount = await prisma.categoryIntelligenceCache.count().catch(() => null);
    const taxCacheCount = await prisma.taxIntelligenceCache.count().catch(() => null);
    const prefsCount = await prisma.userCategorizationPreferences.count().catch(() => null);
    
    console.log(`✅ CategoryIntelligenceCache: ${cacheCount !== null ? 'EXISTS' : 'MISSING'} (${cacheCount || 0} records)`);
    console.log(`✅ TaxIntelligenceCache: ${taxCacheCount !== null ? 'EXISTS' : 'MISSING'} (${taxCacheCount || 0} records)`);
    console.log(`✅ UserCategorizationPreferences: ${prefsCount !== null ? 'EXISTS' : 'MISSING'} (${prefsCount || 0} records)`);

    // Step 2: Get a test user
    console.log('\n📋 Step 2: Finding test user...');
    const user = await prisma.user.findFirst({
      select: { id: true, email: true, businessType: true }
    });
    
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`✅ Test user: ${user.email} (${user.id})`);

    // Step 3: Check existing transactions
    console.log('\n📋 Step 3: Checking transactions...');
    const transactionCount = await prisma.bankTransaction.count({
      where: { userId: user.id }
    });
    
    const uncategorizedCount = await prisma.bankTransaction.count({
      where: { 
        userId: user.id,
        OR: [
          { category: null },
          { category: 'Uncategorized' },
          { categoryId: null }
        ]
      }
    });
    
    console.log(`✅ Total transactions: ${transactionCount}`);
    console.log(`✅ Uncategorized transactions: ${uncategorizedCount}`);

    // Step 4: Test cache reading functionality
    console.log('\n📋 Step 4: Testing cache reading...');
    
    if (cacheCount > 0) {
      const sampleCache = await prisma.categoryIntelligenceCache.findFirst({
        where: { userId: user.id }
      });
      
      if (sampleCache) {
        console.log(`✅ Sample cache entry found:`);
        console.log(`   Merchant: ${sampleCache.merchantPattern}`);
        console.log(`   Category: ${sampleCache.category}`);
        console.log(`   Confidence: ${sampleCache.confidence}`);
        console.log(`   Usage count: ${sampleCache.usageCount}`);
        console.log(`   Last used: ${sampleCache.lastUsed}`);
      }
    } else {
      console.log('ℹ️  No cache entries found (expected for first run)');
    }

    // Step 5: Test backend API endpoints
    console.log('\n📋 Step 5: Testing backend API...');
    
    try {
      const healthResponse = await fetch('http://localhost:3001/health');
      const healthData = await healthResponse.json();
      console.log(`✅ Backend health: ${healthData.status}`);
    } catch (error) {
      console.log(`❌ Backend not responding: ${error.message}`);
      return;
    }

    // Step 6: Test AI+ microservice
    console.log('\n📋 Step 6: Testing AI+ microservice...');
    
    try {
      const aiHealthResponse = await fetch('http://localhost:3002/health');
      const aiHealthData = await aiHealthResponse.json();
      console.log(`✅ AI+ microservice health: ${aiHealthData.status}`);
    } catch (error) {
      console.log(`❌ AI+ microservice not responding: ${error.message}`);
    }

    // Step 7: Simulate smart categorization flow (if we have uncategorized transactions)
    if (uncategorizedCount > 0) {
      console.log('\n📋 Step 7: Testing smart categorization flow...');
      
      // Get a few uncategorized transactions
      const testTransactions = await prisma.bankTransaction.findMany({
        where: { 
          userId: user.id,
          OR: [
            { category: null },
            { category: 'Uncategorized' },
            { categoryId: null }
          ]
        },
        take: 3,
        select: {
          id: true,
          description: true,
          amount: true,
          merchant: true,
          date: true
        }
      });

      console.log(`✅ Found ${testTransactions.length} test transactions:`);
      testTransactions.forEach((tx, i) => {
        console.log(`   ${i + 1}. ${tx.description} - $${tx.amount} (${tx.merchant || 'No merchant'})`);
      });

      // Test the classification endpoint
      try {
        console.log('\n🚀 Testing classification endpoint...');
        
        // Note: This would need authentication token in real scenario
        const classifyResponse = await fetch('http://localhost:3001/api/intelligent-categorization/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            transactions: testTransactions,
            selectedCategories: ['Business Expense', 'Transportation', 'Meals']
          })
        });

        if (classifyResponse.ok) {
          const classifyData = await classifyResponse.json();
          console.log(`✅ Classification response: ${classifyData.success ? 'SUCCESS' : 'FAILED'}`);
          
          if (classifyData.analysis) {
            console.log(`   Uncategorized: ${classifyData.analysis.uncategorized}`);
            console.log(`   Need classification: ${classifyData.analysis.needClassification}`);
          }
        } else {
          console.log(`❌ Classification endpoint error: ${classifyResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ Classification test failed: ${error.message}`);
      }
    }

    // Step 8: Check for any new cache entries
    console.log('\n📋 Step 8: Final cache verification...');
    
    const finalCacheCount = await prisma.categoryIntelligenceCache.count({
      where: { userId: user.id }
    });
    
    const finalTaxCacheCount = await prisma.taxIntelligenceCache.count({
      where: { userId: user.id }
    });

    console.log(`✅ Final CategoryIntelligenceCache count: ${finalCacheCount}`);
    console.log(`✅ Final TaxIntelligenceCache count: ${finalTaxCacheCount}`);

    if (finalCacheCount > (cacheCount || 0)) {
      console.log(`🎉 NEW CACHE ENTRIES CREATED! (+${finalCacheCount - (cacheCount || 0)})`);
    }

    // Step 9: Show recent cache entries
    if (finalCacheCount > 0) {
      console.log('\n📋 Step 9: Recent cache entries...');
      
      const recentCache = await prisma.categoryIntelligenceCache.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          merchantPattern: true,
          category: true,
          confidence: true,
          usageCount: true,
          source: true,
          createdAt: true
        }
      });

      recentCache.forEach((cache, i) => {
        console.log(`   ${i + 1}. ${cache.merchantPattern} → ${cache.category} (${(cache.confidence * 100).toFixed(1)}%, source: ${cache.source})`);
      });
    }

    console.log('\n🎉 ===== VERIFICATION COMPLETE =====');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyCacheFlow().catch(console.error); 