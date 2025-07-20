const fs = require('fs');

console.log('🧪 Testing CSV Upload Authentication...');

// Test 1: Upload without authentication (should fail with 401)
async function testWithoutAuth() {
  const FormData = require('form-data');
  
  const form = new FormData();
  form.append('bankName', 'Test Bank');
  form.append('accountNumber', '123456');
  form.append('displayName', 'Test Upload');
  form.append('useAICategorization', 'false');
  form.append('columnMapping', '{}');
  
  // Create a simple CSV content
  const csvContent = 'Date,Description,Amount\n2025-01-01,Test Transaction,100.00';
  form.append('file', csvContent, {
    filename: 'test.csv',
    contentType: 'text/csv'
  });

  try {
    const response = await fetch('http://localhost:3001/api/bank/upload-csv', {
      method: 'POST',
      body: form
    });
    
    console.log('❌ Without Auth - Status:', response.status);
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Without Auth - Error:', error);
    }
  } catch (error) {
    console.error('❌ Without Auth - Request failed:', error.message);
  }
}

// Test 2: Upload with authentication (should succeed)
async function testWithAuth() {
  const FormData = require('form-data');
  
  // Get token from localStorage simulation (you'd need to replace with actual token)
  const token = 'your-jwt-token-here'; // You'll need to get this from the browser
  
  const form = new FormData();
  form.append('bankName', 'Test Bank');
  form.append('accountNumber', '123456');
  form.append('displayName', 'Test Upload');
  form.append('useAICategorization', 'false');
  form.append('columnMapping', '{}');
  
  // Create a simple CSV content
  const csvContent = 'Date,Description,Amount\n2025-01-01,Test Transaction,100.00';
  form.append('file', csvContent, {
    filename: 'test.csv',
    contentType: 'text/csv'
  });

  try {
    const response = await fetch('http://localhost:3001/api/bank/upload-csv', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form
    });
    
    console.log('✅ With Auth - Status:', response.status);
    if (response.ok) {
      const result = await response.json();
      console.log('✅ With Auth - Success:', result);
    } else {
      const error = await response.text();
      console.log('❌ With Auth - Error:', error);
    }
  } catch (error) {
    console.error('❌ With Auth - Request failed:', error.message);
  }
}

async function runTests() {
  console.log('\n🧪 Test 1: Upload without authentication');
  await testWithoutAuth();
  
  console.log('\n🧪 Test 2: Upload with authentication (token needed)');
  console.log('⚠️  To test with auth, get your JWT token from browser localStorage and update this script');
  // await testWithAuth();
}

runTests().catch(console.error); 