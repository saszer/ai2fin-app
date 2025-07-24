/**
 * 🧪 TEST: CSV Uploads Fix Verification
 * 
 * This script tests the CSV uploads endpoint to verify data buckets are being returned
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001';

async function testCSVUploadsFix() {
  console.log('🧪 Testing CSV Uploads Fix\n');

  try {
    // Test 1: Get all CSV uploads
    console.log('1. Testing CSV uploads endpoint:');
    
    const response = await axios.get(`${BASE_URL}/api/bank/csv-uploads`, {
      headers: {
        'Authorization': `Bearer test-token`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   📊 Response status:', response.status);
    console.log('   📊 Response data:', response.data);
    
    const uploads = response.data.uploads || [];
    console.log(`   📊 Total uploads found: ${uploads.length}`);
    
    if (uploads.length > 0) {
      console.log('   ✅ CSV uploads are being returned correctly');
      
      // Show details of first upload
      const firstUpload = uploads[0];
      console.log('   📋 First upload details:');
      console.log(`      - ID: ${firstUpload.id}`);
      console.log(`      - File Name: ${firstUpload.fileName}`);
      console.log(`      - Display Name: ${firstUpload.displayName}`);
      console.log(`      - Bank: ${firstUpload.bankName}`);
      console.log(`      - Account: ${firstUpload.accountNumber}`);
      console.log(`      - Transaction Count: ${firstUpload.transactionCount}`);
      console.log(`      - Uploaded: ${firstUpload.uploadedAt}`);
      console.log(`      - Processed: ${firstUpload.processed}`);
      
      // Test 2: Get specific upload details
      console.log('\n2. Testing specific upload details:');
      
      const detailResponse = await axios.get(`${BASE_URL}/api/bank/csv-uploads/${firstUpload.id}`, {
        headers: {
          'Authorization': `Bearer test-token`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('   📊 Detail response status:', detailResponse.status);
      const uploadDetail = detailResponse.data.upload;
      console.log(`   📊 Upload transactions: ${uploadDetail.transactions?.length || 0}`);
      
      if (uploadDetail.transactions && uploadDetail.transactions.length > 0) {
        console.log('   ✅ Upload details are being returned correctly');
        console.log(`   📋 Sample transaction: ${uploadDetail.transactions[0].description} - $${uploadDetail.transactions[0].amount}`);
      } else {
        console.log('   ⚠️  No transactions found in upload details');
      }
      
    } else {
      console.log('   ⚠️  No CSV uploads found in database');
      console.log('   💡 This could mean:');
      console.log('      - No CSV files have been uploaded yet');
      console.log('      - The user has no uploads');
      console.log('      - Database connection issues');
    }
    
    // Test 3: Check database directly
    console.log('\n3. Checking database for CSV uploads:');
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      const dbUploads = await prisma.cSVUpload.findMany({
        include: {
          _count: {
            select: {
              bankTransactions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      console.log(`   📊 Database uploads: ${dbUploads.length}`);
      
      if (dbUploads.length > 0) {
        console.log('   📋 Database upload details:');
        dbUploads.forEach((upload, index) => {
          console.log(`      ${index + 1}. ${upload.fileName} (${upload._count.bankTransactions} transactions)`);
        });
      } else {
        console.log('   ⚠️  No uploads found in database');
      }
      
    } catch (dbError) {
      console.log('   ❌ Database error:', dbError.message);
    } finally {
      await prisma.$disconnect();
    }
    
    console.log('\n📋 Summary:');
    if (uploads.length > 0) {
      console.log('   ✅ CSV uploads endpoint is working correctly');
      console.log('   ✅ Data buckets should now be visible in the UI');
    } else {
      console.log('   ⚠️  No CSV uploads found - users need to upload CSV files first');
      console.log('   💡 To test: Upload a CSV file through the UI');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

// Run the test
testCSVUploadsFix(); 