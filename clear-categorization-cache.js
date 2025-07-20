const axios = require('axios');

async function clearCategorizationCache() {
  console.log('🧹 Clearing Categorization Cache Data');
  console.log('=====================================');
  
  try {
    // First login to get token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Clear ALL cache entries for this user
    console.log('\n🧹 Clearing cache data...');
    const clearResponse = await axios.delete('http://localhost:3001/api/intelligent-categorization/cache?type=all', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Cache clearing response:', clearResponse.data);
    console.log(`🗑️  Deleted ${clearResponse.data.deletedCount} cache entries`);
    
    if (clearResponse.data.deletedCount > 0) {
      console.log('\n🎯 Cache cleared successfully!');
      console.log('📝 What this means:');
      console.log('   • Next categorization will make fresh OpenAI API calls');
      console.log('   • You should see Method: AI with OpenAI calls > 0');
      console.log('   • Then running again should show Method: Cache with calls = 0');
      console.log('   • This will test the smart mapping logic properly');
    } else {
      console.log('\n ℹ️ No cache entries found to delete');
      console.log('📝 This could mean:');
      console.log('   • Cache was already empty');
      console.log('   • Different user account');
      console.log('   • Transactions were never cached');
    }
    
    console.log('\n🧪 Next steps to test:');
    console.log('1. Open AI Categorization Analysis modal');
    console.log('2. First run should show: Method=AI, OpenAI calls>0');
    console.log('3. Second run should show: Method=Cache, OpenAI calls=0');
    
  } catch (error) {
    console.error('❌ Failed to clear cache:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

clearCategorizationCache(); 