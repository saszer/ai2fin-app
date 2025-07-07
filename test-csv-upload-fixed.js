const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3001';
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const uploadApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  // Don't set Content-Type for multipart/form-data - let axios set it
});

// Test user credentials
const testUser = {
  email: 'test@example.com',
  password: 'Test123!',
  firstName: 'Test',
  lastName: 'User'
};

// Sample CSV data
const sampleCSV = `Date,Description,Amount,Account
2024-01-15,Coffee Shop Purchase,-4.50,12345
2024-01-16,Salary Deposit,2500.00,12345
2024-01-17,Grocery Store,-45.23,12345
2024-01-18,Gas Station,-35.00,12345
2024-01-19,Online Purchase,-12.99,12345`;

let authToken = null;

async function runTests() {
  console.log('🧪 Starting CSV Upload Fix Tests');
  console.log('='.repeat(50));

  try {
    // Test 1: Server Health Check
    console.log('\n1️⃣ Testing server health...');
    const healthResponse = await api.get('/api/health');
    console.log('✅ Server is healthy:', healthResponse.data);

    // Test 2: User Registration/Login
    console.log('\n2️⃣ Testing user authentication...');
    try {
      await api.post('/register', testUser);
      console.log('✅ User registered successfully');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ User already exists, continuing...');
      } else {
        throw error;
      }
    }

    const loginResponse = await api.post('/login', {
      email: testUser.email,
      password: testUser.password
    });
    authToken = loginResponse.data.token;
    console.log('✅ User logged in successfully');

    // Set auth token for subsequent requests
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    uploadApi.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    // Test 3: Simple CSV Upload Test (no middleware)
    console.log('\n3️⃣ Testing simple CSV upload endpoint...');
    try {
      const simpleResponse = await api.post('/api/bank/upload-csv-simple', {
        test: 'data'
      });
      console.log('✅ Simple CSV upload test passed:', simpleResponse.data);
    } catch (error) {
      console.error('❌ Simple CSV upload test failed:', error.response?.data || error.message);
    }

    // Test 4: CSV Upload with FormData (File Upload)
    console.log('\n4️⃣ Testing CSV upload with FormData...');
    try {
      // Create a temporary CSV file
      const tempCSVPath = path.join(__dirname, 'temp-test.csv');
      fs.writeFileSync(tempCSVPath, sampleCSV);

      const formData = new FormData();
      formData.append('file', fs.createReadStream(tempCSVPath));
      formData.append('accountNumber', '12345');
      formData.append('bankName', 'Test Bank');
      formData.append('displayName', 'Test CSV Upload');

      const uploadResponse = await uploadApi.post('/api/bank/upload-csv', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('✅ CSV upload with FormData successful:', {
        success: uploadResponse.data.success,
        transactionsCreated: uploadResponse.data.transactionsCreated,
        duplicatesSkipped: uploadResponse.data.duplicatesSkipped,
        errors: uploadResponse.data.errors,
        fileName: uploadResponse.data.fileName
      });

      // Clean up temp file
      fs.unlinkSync(tempCSVPath);

    } catch (error) {
      console.error('❌ CSV upload with FormData failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    }

    // Test 5: CSV Upload with JSON (Pasted CSV)
    console.log('\n5️⃣ Testing CSV upload with JSON (pasted CSV)...');
    try {
      const jsonUploadResponse = await api.post('/api/bank/upload-csv', {
        csvData: sampleCSV,
        accountNumber: '12345',
        bankName: 'Test Bank JSON',
        fileName: 'pasted-csv.csv',
        displayName: 'Pasted CSV Upload'
      });

      console.log('✅ CSV upload with JSON successful:', {
        success: jsonUploadResponse.data.success,
        transactionsCreated: jsonUploadResponse.data.transactionsCreated,
        duplicatesSkipped: jsonUploadResponse.data.duplicatesSkipped,
        errors: jsonUploadResponse.data.errors,
        fileName: jsonUploadResponse.data.fileName
      });

    } catch (error) {
      console.error('❌ CSV upload with JSON failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    }

    // Test 6: Verify Transactions Were Created
    console.log('\n6️⃣ Verifying transactions were created...');
    try {
      const transactionsResponse = await api.get('/transactions');
      console.log('✅ Transactions retrieved:', {
        count: transactionsResponse.data.transactions?.length || 0,
        total: transactionsResponse.data.pagination?.total || 0
      });

      if (transactionsResponse.data.transactions?.length > 0) {
        console.log('📊 Sample transaction:', {
          description: transactionsResponse.data.transactions[0].description,
          amount: transactionsResponse.data.transactions[0].amount,
          date: transactionsResponse.data.transactions[0].date
        });
      }

    } catch (error) {
      console.error('❌ Failed to retrieve transactions:', error.response?.data || error.message);
    }

    // Test 7: CSV Upload History
    console.log('\n7️⃣ Testing CSV upload history...');
    try {
      const historyResponse = await api.get('/csv-uploads');
      console.log('✅ CSV upload history retrieved:', {
        count: historyResponse.data.uploads?.length || 0
      });

      if (historyResponse.data.uploads?.length > 0) {
        console.log('📁 Latest upload:', {
          fileName: historyResponse.data.uploads[0].fileName,
          bankName: historyResponse.data.uploads[0].bankName,
          processed: historyResponse.data.uploads[0].processed
        });
      }

    } catch (error) {
      console.error('❌ Failed to retrieve CSV upload history:', error.response?.data || error.message);
    }

    console.log('\n🎉 CSV Upload Fix Tests Completed!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the tests
runTests().catch(console.error); 