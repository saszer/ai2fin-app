const axios = require('axios');

async function testTotalTransactions() {
  try {
    console.log('🧪 Testing Total Transactions Count...');
    
    // Test 1: Get transactions with pagination info
    console.log('\n1️⃣ Testing transactions endpoint with pagination...');
    const response = await axios.get('http://localhost:3001/api/bank/transactions?page=1&limit=10', {
      headers: {
        'Authorization': 'Bearer test-token', // You'll need a real token
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Transactions response structure:', {
      hasData: !!response.data.data,
      dataLength: response.data.data?.length || 0,
      hasPagination: !!response.data.pagination,
      paginationKeys: response.data.pagination ? Object.keys(response.data.pagination) : [],
      total: response.data.pagination?.total || 'NOT_FOUND',
      page: response.data.pagination?.page || 'NOT_FOUND',
      limit: response.data.pagination?.limit || 'NOT_FOUND',
      totalPages: response.data.pagination?.totalPages || 'NOT_FOUND'
    });

    // Test 2: Test with different filters
    console.log('\n2️⃣ Testing with date filter...');
    const filterResponse = await axios.get('http://localhost:3001/api/bank/transactions?page=1&limit=10&datePreset=thisMonth', {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Filtered transactions response:', {
      total: filterResponse.data.pagination?.total || 'NOT_FOUND',
      dataLength: filterResponse.data.data?.length || 0,
      filters: 'thisMonth'
    });

    // Test 3: Test with search query
    console.log('\n3️⃣ Testing with search query...');
    const searchResponse = await axios.get('http://localhost:3001/api/bank/transactions?page=1&limit=10&searchQuery=netflix', {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Search transactions response:', {
      total: searchResponse.data.pagination?.total || 'NOT_FOUND',
      dataLength: searchResponse.data.data?.length || 0,
      searchQuery: 'netflix'
    });

    console.log('\n✅ Total transactions tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Note: You need to provide a valid authentication token for this test');
    }
  }
}

// Run the test
testTotalTransactions(); 