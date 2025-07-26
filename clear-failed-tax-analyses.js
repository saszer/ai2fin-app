const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearFailedTaxAnalyses() {
  try {
    console.log('🔧 Clearing failed tax analyses from database...\n');

    // Find all transactions with failed analyses
    const transactions = await prisma.bankTransaction.findMany({
      where: {
        aiTaxAnalysis: {
          not: null
        }
      },
      select: {
        id: true,
        description: true,
        aiTaxAnalysis: true
      }
    });

    console.log(`📊 Found ${transactions.length} transactions with analysis data`);

    let failedCount = 0;
    let clearedCount = 0;

    for (const tx of transactions) {
      try {
        const analysis = JSON.parse(tx.aiTaxAnalysis);
        
        // Check if the analysis failed
        const isFailed = analysis.reasoning?.includes('Analysis failed') || 
                         analysis.reasoning?.includes('requires manual') ||
                         !analysis.reasoning ||
                         analysis.reasoning === 'No reasoning provided';

        if (isFailed) {
          failedCount++;
          console.log(`❌ Failed analysis found: "${tx.description}" - ${analysis.reasoning}`);
          
          // Clear the failed analysis
          await prisma.bankTransaction.update({
            where: { id: tx.id },
            data: {
              aiTaxAnalysis: null,
              aiAnalyzedAt: null,
              isTaxDeductible: null,
              businessUsePercentage: null
            }
          });
          
          clearedCount++;
        }
      } catch (error) {
        // If we can't parse the analysis, consider it failed and clear it
        failedCount++;
        console.log(`❌ Unparseable analysis found: "${tx.description}"`);
        
        await prisma.bankTransaction.update({
          where: { id: tx.id },
          data: {
            aiTaxAnalysis: null,
            aiAnalyzedAt: null,
            isTaxDeductible: null,
            businessUsePercentage: null
          }
        });
        
        clearedCount++;
      }
    }

    console.log(`\n✅ Cleanup completed:`);
    console.log(`   - Total transactions checked: ${transactions.length}`);
    console.log(`   - Failed analyses found: ${failedCount}`);
    console.log(`   - Failed analyses cleared: ${clearedCount}`);
    console.log(`   - Successful analyses kept: ${transactions.length - failedCount}`);

    if (clearedCount > 0) {
      console.log(`\n🔄 You can now retry the tax analysis - these ${clearedCount} transactions will be reanalyzed.`);
    } else {
      console.log(`\n✨ No failed analyses found - all analyses appear to be successful.`);
    }

  } catch (error) {
    console.error('❌ Error clearing failed analyses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
clearFailedTaxAnalyses(); 