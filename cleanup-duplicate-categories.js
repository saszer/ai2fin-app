/**
 * 🧹 CLEANUP: Duplicate Categories Removal
 * 
 * This script removes all duplicate categories from the database
 * and implements prevention measures
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDuplicateCategories() {
  console.log('🧹 Starting Duplicate Categories Cleanup\n');

  try {
    // Get all categories
    const allCategories = await prisma.category.findMany({
      orderBy: { createdAt: 'asc' }
    });

    console.log(`📊 Total categories found: ${allCategories.length}`);

    // Find duplicates (case-insensitive)
    const duplicates = [];
    const processed = new Set();

    for (let i = 0; i < allCategories.length; i++) {
      if (processed.has(allCategories[i].id)) continue;

      const sameNameCategories = allCategories.filter(cat => 
        cat.name.toLowerCase() === allCategories[i].name.toLowerCase()
      );

      if (sameNameCategories.length > 1) {
        duplicates.push(sameNameCategories);
        sameNameCategories.forEach(cat => processed.add(cat.id));
      }
    }

    if (duplicates.length === 0) {
      console.log('✅ No duplicate categories found');
      return;
    }

    console.log(`🚨 Found ${duplicates.length} groups of duplicate categories:`);
    
    let totalMerged = 0;
    let totalErrors = 0;

    // Process each group of duplicates
    for (const duplicateGroup of duplicates) {
      console.log(`\n📝 Processing duplicate group: "${duplicateGroup[0].name}"`);
      console.log(`   Categories in group: ${duplicateGroup.length}`);
      
      // Keep the oldest category, merge others into it
      const [keepCategory, ...mergeCategories] = duplicateGroup.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      console.log(`   ✅ Keeping: ${keepCategory.name} (ID: ${keepCategory.id}, Created: ${keepCategory.createdAt})`);

      // Merge each duplicate into the kept category
      for (const mergeCategory of mergeCategories) {
        console.log(`   🔄 Merging: ${mergeCategory.name} (ID: ${mergeCategory.id}) into ${keepCategory.name}`);
        
        try {
          const mergeResult = await prisma.$transaction(async (tx) => {
            const updates = [];

            // Update bank transactions
            const transactionUpdate = await tx.bankTransaction.updateMany({
              where: { categoryId: mergeCategory.id },
              data: { categoryId: keepCategory.id }
            });
            if (transactionUpdate.count > 0) {
              updates.push({ type: 'transactions', count: transactionUpdate.count });
            }

            // Update expenses
            const expenseUpdate = await tx.expense.updateMany({
              where: { categoryId: mergeCategory.id },
              data: { categoryId: keepCategory.id }
            });
            if (expenseUpdate.count > 0) {
              updates.push({ type: 'expenses', count: expenseUpdate.count });
            }

            // Update bills
            const billUpdate = await tx.bill.updateMany({
              where: { categoryId: mergeCategory.id },
              data: { categoryId: keepCategory.id }
            });
            if (billUpdate.count > 0) {
              updates.push({ type: 'bills', count: billUpdate.count });
            }

            // Update bill patterns
            const billPatternUpdate = await tx.billPattern.updateMany({
              where: { categoryId: mergeCategory.id },
              data: { categoryId: keepCategory.id }
            });
            if (billPatternUpdate.count > 0) {
              updates.push({ type: 'billPatterns', count: billPatternUpdate.count });
            }

            // Update recurring patterns
            const recurringPatternUpdate = await tx.recurringPattern.updateMany({
              where: { categoryId: mergeCategory.id },
              data: { categoryId: keepCategory.id }
            });
            if (recurringPatternUpdate.count > 0) {
              updates.push({ type: 'recurringPatterns', count: recurringPatternUpdate.count });
            }

            // Update categorization patterns
            const categorizationPatternUpdate = await tx.categorizationPattern.updateMany({
              where: { categoryId: mergeCategory.id },
              data: { categoryId: keepCategory.id }
            });
            if (categorizationPatternUpdate.count > 0) {
              updates.push({ type: 'categorizationPatterns', count: categorizationPatternUpdate.count });
            }

            // Update category intelligence cache
            const cacheUpdate = await tx.categoryIntelligenceCache.updateMany({
              where: { categoryId: mergeCategory.id },
              data: { categoryId: keepCategory.id }
            });
            if (cacheUpdate.count > 0) {
              updates.push({ type: 'categoryIntelligenceCache', count: cacheUpdate.count });
            }

            // Update tax intelligence cache
            const taxCacheUpdate = await tx.taxIntelligenceCache.updateMany({
              where: { categoryId: mergeCategory.id },
              data: { categoryId: keepCategory.id }
            });
            if (taxCacheUpdate.count > 0) {
              updates.push({ type: 'taxIntelligenceCache', count: taxCacheUpdate.count });
            }

            // Delete the duplicate category
            await tx.category.delete({
              where: { id: mergeCategory.id }
            });

            return updates;
          });

          const totalEntitiesMoved = mergeResult.reduce((sum, item) => sum + item.count, 0);
          console.log(`      ✅ Successfully merged ${totalEntitiesMoved} entities`);
          totalMerged++;

        } catch (error) {
          console.log(`      ❌ Error merging: ${error.message}`);
          totalErrors++;
        }
      }
    }

    console.log(`\n📋 Cleanup Summary:`);
    console.log(`   - Duplicate groups processed: ${duplicates.length}`);
    console.log(`   - Categories successfully merged: ${totalMerged}`);
    console.log(`   - Errors encountered: ${totalErrors}`);

    // Verify cleanup
    const remainingCategories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });

    console.log(`\n✅ Verification:`);
    console.log(`   - Categories remaining: ${remainingCategories.length}`);
    
    // Check for any remaining duplicates
    const categoryNames = remainingCategories.map(cat => cat.name.toLowerCase());
    const remainingDuplicates = categoryNames.filter((name, index) => categoryNames.indexOf(name) !== index);
    
    if (remainingDuplicates.length > 0) {
      console.log(`   ⚠️  Warning: ${remainingDuplicates.length} duplicate names still exist`);
    } else {
      console.log(`   ✅ No duplicate names remaining`);
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDuplicateCategories(); 