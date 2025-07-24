/**
 * 🔍 CHECK: CSV Uploads in Database
 * 
 * This script checks the database directly for CSV uploads
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCSVUploadsInDB() {
  console.log('🔍 Checking CSV Uploads in Database\n');

  try {
    // Check all CSV uploads
    const uploads = await prisma.cSVUpload.findMany({
      include: {
        _count: {
          select: {
            bankTransactions: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Total CSV uploads in database: ${uploads.length}`);

    if (uploads.length > 0) {
      console.log('\n📋 CSV Upload Details:');
      uploads.forEach((upload, index) => {
        console.log(`\n${index + 1}. Upload ID: ${upload.id}`);
        console.log(`   File Name: ${upload.fileName}`);
        console.log(`   Display Name: ${upload.displayName || 'Not set'}`);
        console.log(`   Bank: ${upload.bankName || 'Not set'}`);
        console.log(`   Account: ${upload.accountNumber || 'Not set'}`);
        console.log(`   User: ${upload.user.email} (${upload.user.id})`);
        console.log(`   Transactions: ${upload._count.bankTransactions}`);
        console.log(`   Upload Date: ${upload.uploadDate || upload.createdAt}`);
        console.log(`   Processed: ${upload.processed}`);
        console.log(`   Total Transactions: ${upload.totalTransactions || 0}`);
        console.log(`   Successful: ${upload.successfulTransactions || 0}`);
        console.log(`   Failed: ${upload.failedTransactions || 0}`);
        console.log(`   Duplicates Skipped: ${upload.duplicatesSkipped || 0}`);
        console.log(`   Errors: ${upload.errors || 0}`);
        console.log(`   AI Analysis Count: ${upload.aiAnalysisCount || 0}`);
      });

      // Check transactions for first upload
      const firstUpload = uploads[0];
      console.log(`\n🔍 Checking transactions for first upload (${firstUpload.id}):`);
      
      const transactions = await prisma.bankTransaction.findMany({
        where: {
          csvUploadId: firstUpload.id,
        },
        take: 5, // Show first 5 transactions
        orderBy: {
          date: 'desc',
        },
      });

      console.log(`   Found ${transactions.length} transactions for this upload`);
      
      if (transactions.length > 0) {
        console.log('   Sample transactions:');
        transactions.forEach((tx, index) => {
          console.log(`   ${index + 1}. ${tx.description} - $${tx.amount} (${tx.date})`);
        });
      }

    } else {
      console.log('⚠️  No CSV uploads found in database');
      console.log('\n💡 Possible reasons:');
      console.log('   - No CSV files have been uploaded yet');
      console.log('   - CSV uploads were deleted');
      console.log('   - Database is empty');
      console.log('   - Wrong database connection');
    }

    // Check total transactions
    const totalTransactions = await prisma.bankTransaction.count();
    console.log(`\n📊 Total transactions in database: ${totalTransactions}`);

    // Check transactions without CSV upload ID
    const orphanedTransactions = await prisma.bankTransaction.count({
      where: {
        csvUploadId: null,
      },
    });
    console.log(`📊 Transactions without CSV upload ID: ${orphanedTransactions}`);

    // Check transactions with CSV upload ID
    const linkedTransactions = await prisma.bankTransaction.count({
      where: {
        csvUploadId: {
          not: null,
        },
      },
    });
    console.log(`📊 Transactions with CSV upload ID: ${linkedTransactions}`);

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkCSVUploadsInDB(); 