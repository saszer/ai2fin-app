const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

// Test user credentials
const testUser = {
  email: 'csvtest@example.com',
  password: 'Test123!',
  firstName: 'CSV',
  lastName: 'Test'
};

async function testMinimal() {
  console.log('🧪 Minimal CSV Upload Test');
  console.log('='.repeat(30));

  try {
    // Step 1: Register user (if not exists)
    console.log('\n1️⃣ Registering user...');
    try {
      await axios.post(`${API_BASE_URL}/register`, testUser);
      console.log('✅ User registered successfully');
    } catch (error) {
      if (error.response?.status === 409 || error.response?.status === 400) {
        console.log('ℹ️ User already exists, continuing...');
      } else {
        throw error;
      }
    }

    // Step 2: Login
    console.log('\n2️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/login`, {
      email: testUser.email,
      password: testUser.password
    });
    const authToken = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 3: Test simple CSV upload endpoint (no middleware)
    console.log('\n3️⃣ Testing simple CSV upload endpoint...');
    try {
      const simpleResponse = await axios.post(`${API_BASE_URL}/api/bank/upload-csv-simple`, {
        test: 'data'
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Simple CSV upload successful:', simpleResponse.data);
    } catch (error) {
      console.error('❌ Simple CSV upload failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }

    // Step 4: Test CSV upload with JSON (no file upload)
    console.log('\n4️⃣ Testing CSV upload with JSON...');
    try {
      const jsonResponse = await axios.post(`${API_BASE_URL}/api/bank/upload-csv`, {
        csvData: 'Date,Description,Amount\n2024-01-01,Test,-10.00',
        accountNumber: '12345',
        bankName: 'Test Bank',
        fileName: 'test.csv',
        displayName: 'Test Upload'
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ JSON CSV upload successful:', {
        success: jsonResponse.data.success,
        transactionsCreated: jsonResponse.data.transactionsCreated
      });
    } catch (error) {
      console.error('❌ JSON CSV upload failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }

    console.log('\n🎉 Minimal test completed!');

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testMinimal().catch(console.error); 