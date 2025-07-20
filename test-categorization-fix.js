// Node.js 18+ has built-in fetch, no import needed

async function testCategorization() {
  console.log('🧪 Testing Categorization API Fix...\n');

  // Test data with user-selected categories
  const testData = {
    transactions: [
      { id: "1", description: "Woolworths Grocery", amount: -152.20, date: "2024-01-01" },
      { id: "2", description: "Shell Petrol Station", amount: -89.50, date: "2024-01-02" },
      { id: "3", description: "Facebook Ads", amount: -250.00, date: "2024-01-03" },
      { id: "4", description: "Office Depot Supplies", amount: -67.80, date: "2024-01-04" },
      { id: "5", description: "Uber Trip", amount: -23.45, date: "2024-01-05" }
    ],
    selectedCategories: ["Fuel", "Transport", "Marketing", "Office Supplies", "Food & Dining"],
    options: {
      enableCategorization: true,
      includeNewCategorySuggestions: true
    }
  };

  try {
    console.log('📋 Selected Categories:', testData.selectedCategories.join(', '));
    console.log('📊 Testing with', testData.transactions.length, 'transactions\n');

    // Call the API
    const response = await fetch('http://localhost:3002/api/optimized/analyze-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ API Call Successful!\n');
      
      console.log('📈 Processing Summary:');
      console.log(`   - Total Transactions: ${result.totalTransactions}`);
      console.log(`   - Processed with AI: ${result.processedWithAI}`);
      console.log(`   - Processing Time: ${(result.processingTimeMs / 1000).toFixed(2)}s`);
      console.log(`   - API Calls Made: ${result.apiCallsMade || 1}`);
      
      console.log('\n🎯 Categorization Results:');
      result.results.forEach(r => {
        console.log(`   ${r.transactionId}. "${r.description}" → ${r.category} (${(r.confidence * 100).toFixed(0)}% confidence)`);
        if (r.reasoning) {
          console.log(`      Reasoning: ${r.reasoning}`);
        }
      });

      // Check if categories match selected ones
      const usedCategories = [...new Set(result.results.map(r => r.category))];
      console.log('\n📊 Categories Used:', usedCategories.join(', '));
      
      const validCategories = usedCategories.filter(cat => 
        testData.selectedCategories.includes(cat) || cat === 'Other'
      );
      
      if (validCategories.length === usedCategories.length) {
        console.log('✅ All categories are from the selected list!');
      } else {
        console.log('⚠️  Some categories are not from the selected list');
      }

    } else {
      console.log('❌ API Call Failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
}

// Wait a bit for services to start, then run test
setTimeout(() => {
  testCategorization();
}, 5000);

console.log('⏳ Waiting 5 seconds for services to start...'); 