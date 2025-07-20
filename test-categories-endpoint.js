const axios = require('axios');

async function testCategoriesEndpoint() {
  console.log('🎯 Testing AI Modules Categories Endpoint...');
  
  try {
    const response = await axios.get('http://localhost:3002/api/categories');
    
    console.log('✅ Response Status:', response.status);
    console.log('📊 Categories Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      const categories = response.data.data;
      
      console.log('\n🔍 Analysis:');
      console.log('📂 Expense Categories:', categories.expense_categories?.length || 0);
      console.log('💰 Income Categories:', categories.income_categories?.length || 0);
      console.log('🔄 Transfer Categories:', categories.transfer_categories?.length || 0);
      
      if (categories.expense_categories) {
        console.log('\n📋 Sample Expense Categories:');
        categories.expense_categories.slice(0, 3).forEach(cat => {
          console.log(`  • ${cat.name} (${cat.subcategories?.length || 0} subcategories)`);
        });
      }
      
      // Check if it's mock or real data
      if (JSON.stringify(response.data).includes('[MOCK]')) {
        console.log('\n❌ This is MOCK data (no OpenAI API key)');
      } else {
        console.log('\n✅ This appears to be REAL category data');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📊 Error Response:', error.response.data);
    }
  }
}

testCategoriesEndpoint(); 