const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

// Test user credentials
const testUser = {
  email: 'csvtest@example.com',
  password: 'Test123!',
  firstName: 'CSV',
  lastName: 'Test'
};

// Sample CSV data
const sampleCSV = `Date,Description,Amount
2024-01-15,Coffee Shop Purchase,-4.50
2024-01-16,Salary Deposit,2500.00
2024-01-17,Grocery Store,-45.23
2024-01-18,Gas Station,-35.00
2024-01-19,Online Purchase,-12.99`;

async function testCSVFinal() {
  console.log('🧪 Final CSV Upload Test (JSON Format)');
  console.log('='.repeat(50));

  try {
    // Step 1: Login
    console.log('\n1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/login`, {
      email: testUser.email,
      password: testUser.password
    });
    const authToken = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 2: Test CSV upload with JSON format
    console.log('\n2️⃣ Testing CSV upload with JSON format...');
    try {
      const csvResponse = await axios.post(`${API_BASE_URL}/api/bank/upload-csv`, {
        csvData: sampleCSV,
        accountNumber: '12345',
        bankName: 'Test Bank',
        fileName: 'test-transactions.csv',
        displayName: 'Test Transaction Upload'
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ CSV upload successful!');
      console.log('📊 Results:', {
        success: csvResponse.data.success,
        transactionsCreated: csvResponse.data.transactionsCreated,
        duplicatesSkipped: csvResponse.data.duplicatesSkipped,
        errors: csvResponse.data.errors,
        fileName: csvResponse.data.fileName,
        csvUploadId: csvResponse.data.csvUploadId
      });

    } catch (error) {
      console.error('❌ CSV upload failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        error: error.response?.data?.error,
        debug: error.response?.data?.debug
      });
    }

    // Step 3: Verify transactions were created
    console.log('\n3️⃣ Verifying transactions...');
    try {
      const transactionsResponse = await axios.get(`${API_BASE_URL}/transactions`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('✅ Transactions retrieved:', {
        count: transactionsResponse.data.transactions?.length || 0,
        total: transactionsResponse.data.pagination?.total || 0
      });

      if (transactionsResponse.data.transactions?.length > 0) {
        console.log('📋 Sample transactions:');
        transactionsResponse.data.transactions.slice(0, 3).forEach((tx, i) => {
          console.log(`  ${i + 1}. ${tx.description}: $${tx.amount} (${tx.date})`);
        });
      }

    } catch (error) {
      console.error('❌ Failed to retrieve transactions:', error.response?.data || error.message);
    }

    // Step 4: Check CSV upload history
    console.log('\n4️⃣ Checking CSV upload history...');
    try {
      const historyResponse = await axios.get(`${API_BASE_URL}/csv-uploads`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('✅ CSV upload history:', {
        count: historyResponse.data.uploads?.length || 0
      });

      if (historyResponse.data.uploads?.length > 0) {
        const latest = historyResponse.data.uploads[0];
        console.log('📁 Latest upload:', {
          fileName: latest.fileName,
          bankName: latest.bankName,
          processed: latest.processed,
          duplicatesSkipped: latest.duplicatesSkipped,
          errors: latest.errors
        });
      }

    } catch (error) {
      console.error('❌ Failed to retrieve upload history:', error.response?.data || error.message);
    }

    console.log('\n🎉 CSV Upload Test Complete!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testCSVFinal().catch(console.error); 