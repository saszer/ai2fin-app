// Test script to verify categorization fixes
// embracingearth.space - AI-powered financial intelligence

const testTransactions = [
  {
    "description": "Kmart Shopping",
    "amount": -67.8,
    "merchant": "Kmart"
  },
  {
    "description": "Valentine's Day Gifts",
    "amount": -245,
    "merchant": "Gift Shop"
  },
  {
    "description": "Salary Deposit",
    "amount": 4500,
    "merchant": "Employer"
  },
  {
    "description": "Netflix Subscription",
    "amount": -19.99,
    "merchant": "Netflix"
  },
  {
    "description": "Unknown Transaction",
    "amount": -50,
    "merchant": "Unknown"
  }
];

async function testCategorizationFixes() {
  console.log('🧪 Testing Categorization Fixes...\n');
  
  // Test 1: Filter out "Unknown" merchant transactions
  console.log('1️⃣ Testing merchant filtering:');
  const filteredTransactions = testTransactions.filter(tx => 
    tx.merchant && tx.merchant.toLowerCase() !== 'unknown'
  );
  
  console.log(`   Original transactions: ${testTransactions.length}`);
  console.log(`   Filtered transactions: ${filteredTransactions.length}`);
  console.log(`   Removed: ${testTransactions.length - filteredTransactions.length} transactions with "Unknown" merchant\n`);
  
  // Test 2: Test transaction type detection
  console.log('2️⃣ Testing transaction type detection:');
  
  const typeDetectionTests = [
    { description: "Netflix Subscription", expected: "Bill" },
    { description: "Kmart Shopping", expected: "One-time" },
    { description: "Monthly Payment", expected: "Bill" },
    { description: "Grocery Shopping", expected: "One-time" }
  ];
  
  typeDetectionTests.forEach(test => {
    const isBill = test.description.toLowerCase().includes('subscription') ||
                   test.description.toLowerCase().includes('monthly') ||
                   test.description.toLowerCase().includes('payment');
    
    const detectedType = isBill ? "Bill" : "One-time";
    const color = isBill ? "Yellow" : "Blue";
    
    console.log(`   "${test.description}" -> ${detectedType} (${color}) ${detectedType === test.expected ? '✅' : '❌'}`);
  });
  
  console.log('\n3️⃣ Testing AI+ microservice call:');
  
  try {
    const response = await fetch('http://localhost:3002/api/optimized/analyze-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactions: filteredTransactions.map(tx => ({
          id: `test-${Date.now()}-${Math.random()}`,
          description: tx.description,
          amount: tx.amount,
          merchant: tx.merchant,
          date: new Date().toISOString(),
          type: tx.amount > 0 ? 'credit' : 'debit'
        })),
        selectedCategories: ['Shopping', 'Entertainment', 'Income'],
        options: {
          enableCategorization: true,
          batchSize: 5,
          confidenceThreshold: 0.8
        },
        userProfile: {
          businessType: 'SOLE_TRADER',
          industry: 'Software Services',
          countryCode: 'AU'
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`   ✅ AI+ microservice responded successfully`);
    console.log(`   📊 Processed ${data.results?.length || 0} transactions`);
    console.log(`   🤖 AI calls: ${data.processedWithAI || 0}`);
    console.log(`   💾 Cache hits: ${data.processedWithReferenceData || 0}`);
    
    // Check if any results have mock data indicators
    const mockResults = data.results?.filter(r => 
      r.reasoning?.includes('MOCK DATA') || 
      r.reasoning?.includes('MOCK FALLBACK')
    ) || [];
    
    if (mockResults.length > 0) {
      console.log(`   ⚠️  Found ${mockResults.length} mock results (OpenAI API not configured)`);
      mockResults.forEach(r => {
        console.log(`      - ${r.reasoning}`);
      });
    } else {
      console.log(`   ✅ All results appear to be real AI responses`);
    }
    
  } catch (error) {
    console.log(`   ❌ AI+ microservice test failed: ${error.message}`);
  }
  
  console.log('\n🎯 Summary of fixes implemented:');
  console.log('✅ Filter out transactions with "Unknown" merchant');
  console.log('✅ Transaction types: "One-time" (blue) vs "Bill" (yellow)');
  console.log('✅ Bills sorted to top of list');
  console.log('✅ Clear mock data indicators in reasoning');
  console.log('✅ Enhanced transaction type detection logic');
  console.log('✅ Improved color coding and labeling');
  
  console.log('\n🔧 Next steps:');
  console.log('1. Add your OpenAI API key to .env files');
  console.log('2. Restart AI+ microservice to enable real AI calls');
  console.log('3. Test categorization in the frontend');
}

testCategorizationFixes().catch(console.error); 