/**
 * 🧪 SIMPLE SMART CATEGORIZATION TEST
 * Direct test of the categorization endpoint
 */

async function testCategorization() {
  const fetch = (await import('node-fetch')).default;
  
  console.log('🧪 Testing Smart Categorization...');
  
  const testTransactions = [
    {
      id: 'test-1',
      description: 'Gas Station',
      amount: -45.2,
      merchant: 'Shell',
      date: new Date().toISOString(),
      type: 'debit'
    },
    {
      id: 'test-2', 
      description: 'Grocery Store',
      amount: -125.5,
      merchant: 'Woolworths',
      date: new Date().toISOString(),
      type: 'debit'
    }
  ];

  const selectedCategories = [
    'Fuel & Transport',
    'Groceries',
    'Office Supplies',
    'Meals & Entertainment'
  ];

  try {
    // Direct call to AI modules categorization
    console.log('🤖 Calling AI modules categorization...');
    const response = await fetch('http://localhost:3002/api/optimized/analyze-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactions: testTransactions,
        selectedCategories: selectedCategories,
        options: {
          enableCategorization: true,
          batchSize: 20,
          confidenceThreshold: 0.8
        },
        userProfile: {
          businessType: 'SOLE_TRADER',
          industry: 'Software Services',
          countryCode: 'AU'
        }
      }),
    });

    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Categorization successful!');
    console.log('📋 Results:');
    
    if (data.results && Array.isArray(data.results)) {
      data.results.forEach((result, index) => {
        const tx = testTransactions[index];
        console.log(`  ${index + 1}. ${tx.description} → ${result.category} (${result.confidence})`);
      });
    } else {
      console.log('📊 Full response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testCategorization().catch(console.error); 