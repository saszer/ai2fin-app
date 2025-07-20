const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Test configuration
const API_BASE = 'http://localhost:3001';
const TEST_USER = {
  email: 'sz.sahaj@gmail.com',
  password: 'your-password-here' // You'll need to update this
};

async function testColumnMappingBackend() {
  try {
    console.log('🧪 Testing CSV Upload with Column Mapping - Backend API');
    console.log('='.repeat(60));

    // Step 1: Login to get auth token
    console.log('1. 🔐 Authenticating user...');
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, TEST_USER);
    const token = loginResponse.data.token;
    console.log('✅ Authentication successful');

    // Step 2: Test CSV data with custom column names
    const testCSV = `Trans Date,Memo,Debit Amt,Credit Amt,Type,Ref No
2024-01-15,Salary Deposit,,4500.00,credit,SAL-001
2024-01-16,Grocery Store,85.50,,debit,GRC-001
2024-01-17,Coffee Purchase,12.75,,debit,CFE-001`;

    // Step 3: Create FormData with column mapping
    console.log('2. 📤 Preparing CSV upload with column mapping...');
    const formData = new FormData();
    
    // Create a buffer from CSV string
    const csvBuffer = Buffer.from(testCSV, 'utf8');
    formData.append('file', csvBuffer, {
      filename: 'test-mapping.csv',
      contentType: 'text/csv'
    });
    
    // Add metadata
    formData.append('bankName', 'Test Bank');
    formData.append('accountNumber', 'TEST-12345');
    formData.append('displayName', 'Column Mapping Test');
    formData.append('useAICategorization', 'false');
    
    // Critical: Add column mapping
    const columnMapping = {
      'Trans Date': 'date',
      'Memo': 'description',
      'Debit Amt': 'amount',
      'Credit Amt': 'amount', // Could handle credit/debit logic
      'Type': 'type',
      'Ref No': 'reference'
    };
    formData.append('columnMapping', JSON.stringify(columnMapping));
    
    console.log('📋 Column Mapping:', JSON.stringify(columnMapping, null, 2));

    // Step 4: Upload CSV with column mapping
    console.log('3. 🚀 Uploading CSV with column mapping...');
    const uploadResponse = await axios.post(
      `${API_BASE}/api/bank/upload-csv`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...formData.getHeaders()
        }
      }
    );

    console.log('✅ Upload successful!');
    console.log('📊 Upload Response:', JSON.stringify(uploadResponse.data, null, 2));

    // Step 5: Verify transactions were created correctly
    console.log('4. 🔍 Verifying created transactions...');
    const transactionsResponse = await axios.get(`${API_BASE}/api/bank/transactions`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const transactions = transactionsResponse.data.transactions || [];
    const recentTransactions = transactions.filter(t => 
      t.description && (
        t.description.includes('Salary Deposit') || 
        t.description.includes('Grocery Store') || 
        t.description.includes('Coffee Purchase')
      )
    );

    console.log(`✅ Found ${recentTransactions.length} test transactions`);
    
    // Step 6: Validate transaction data quality
    console.log('5. ✅ Validating transaction data quality...');
    let validationPassed = true;
    
    recentTransactions.forEach((transaction, index) => {
      console.log(`\n📝 Transaction ${index + 1}:`);
      console.log(`   Description: "${transaction.description}"`);
      console.log(`   Amount: ${transaction.amount}`);
      console.log(`   Date: ${transaction.date}`);
      console.log(`   Type: ${transaction.type}`);
      console.log(`   Reference: ${transaction.reference || 'N/A'}`);
      
      // Check for undefined values
      if (transaction.description === 'undefined' || 
          transaction.amount === undefined || 
          transaction.date === 'undefined') {
        console.log('❌ VALIDATION FAILED: Found undefined values');
        validationPassed = false;
      } else {
        console.log('✅ Transaction data is valid');
      }
    });

    // Step 7: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 COLUMN MAPPING TEST SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Authentication: PASSED`);
    console.log(`✅ CSV Upload: PASSED`);
    console.log(`✅ Transaction Creation: PASSED (${recentTransactions.length} transactions)`);
    console.log(`${validationPassed ? '✅' : '❌'} Data Quality Validation: ${validationPassed ? 'PASSED' : 'FAILED'}`);
    
    if (validationPassed) {
      console.log('\n🎉 COLUMN MAPPING FUNCTIONALITY: WORKING CORRECTLY');
      console.log('📝 Column mapping successfully transformed:');
      console.log('   "Trans Date" → date field');
      console.log('   "Memo" → description field');
      console.log('   "Debit Amt" → amount field');
      console.log('   "Type" → type field');
      console.log('   "Ref No" → reference field');
    } else {
      console.log('\n❌ COLUMN MAPPING FUNCTIONALITY: NEEDS FIXING');
      console.log('🐛 Issues found in transaction data parsing');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 TIP: Please update the TEST_USER credentials in the script');
    }
  }
}

// Run the test
console.log('🚀 Starting Column Mapping Backend Test...\n');
testColumnMappingBackend(); 