// Test the new Standalone Pattern Engine
// Copy this into browser console to test the fixed pattern analysis

async function testStandalonePatternEngine() {
  console.log('🚀 Testing Standalone Pattern Engine...\n');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ Please log in first');
    return;
  }

  console.log('✅ Auth token found');

  // Test with transactions that should create patterns
  const testTransactions = [
    // Netflix monthly pattern
    { id: 'test1', description: 'Netflix Subscription', amount: -14.99, date: '2024-07-01', merchant: 'Netflix' },
    { id: 'test2', description: 'Netflix Subscription', amount: -14.99, date: '2024-06-01', merchant: 'Netflix' },
    { id: 'test3', description: 'Netflix Subscription', amount: -14.99, date: '2024-05-01', merchant: 'Netflix' },
    
    // Spotify monthly pattern  
    { id: 'test4', description: 'Spotify Premium', amount: -9.99, date: '2024-07-05', merchant: 'Spotify' },
    { id: 'test5', description: 'Spotify Premium', amount: -9.99, date: '2024-06-05', merchant: 'Spotify' },
    
    // Weekly coffee pattern
    { id: 'test6', description: 'Coffee Shop', amount: -5.50, date: '2024-07-01', merchant: 'Starbucks' },
    { id: 'test7', description: 'Coffee Shop', amount: -5.50, date: '2024-07-08', merchant: 'Starbucks' },
    { id: 'test8', description: 'Coffee Shop', amount: -5.50, date: '2024-07-15', merchant: 'Starbucks' },
    { id: 'test9', description: 'Coffee Shop', amount: -5.50, date: '2024-07-22', merchant: 'Starbucks' },
  ];

  console.log('📤 Sending test request to /api/bills/analyze-patterns...');
  console.log('📊 Test transactions:', testTransactions.length, 'transactions');

  const startTime = performance.now();

  try {
    const response = await fetch('/api/bills/analyze-patterns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        transactions: testTransactions
      })
    });

    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    console.log(`📥 Response received in ${responseTime}ms`);
    console.log('📊 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Request failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return;
    }

    const data = await response.json();
    console.log('✅ SUCCESS! Response data:', data);

    if (data.success && data.patterns) {
      console.log(`🎉 PATTERNS DETECTED: ${data.patterns.length}`);
      
      data.patterns.forEach((pattern, index) => {
        console.log(`\n${index + 1}. ${pattern.name}`);
        console.log(`   📊 Confidence: ${pattern.confidence}`);
        console.log(`   🔄 Frequency: ${pattern.frequency}`);
        console.log(`   💰 Average Amount: $${pattern.averageAmount.toFixed(2)}`);
        console.log(`   📝 Transactions: ${pattern.transactionCount}`);
        console.log(`   🎯 Recommended: ${pattern.isRecommended ? 'Yes' : 'No'}`);
        console.log(`   💡 Reasoning: ${pattern.reasoning}`);
        if (pattern.nextPredictedDate) {
          console.log(`   📅 Next Date: ${pattern.nextPredictedDate}`);
        }
      });

      // Performance analysis
      console.log(`\n⚡ PERFORMANCE METRICS:`);
      console.log(`   ⏱️  Response Time: ${responseTime}ms`);
      console.log(`   🎯 Target: <100ms for small datasets`);
      console.log(`   📊 Status: ${responseTime < 100 ? '✅ EXCELLENT' : responseTime < 500 ? '✅ GOOD' : '⚠️ SLOW'}`);
      
      // Expected patterns
      const expectedPatterns = ['Netflix', 'Spotify', 'Starbucks'];
      const foundMerchants = data.patterns.map(p => p.merchant);
      
      console.log(`\n🔍 PATTERN DETECTION ACCURACY:`);
      expectedPatterns.forEach(merchant => {
        const found = foundMerchants.some(found => found.toUpperCase().includes(merchant.toUpperCase()));
        console.log(`   ${merchant}: ${found ? '✅ DETECTED' : '❌ MISSED'}`);
      });
      
    } else {
      console.log('⚠️ No patterns found or analysis failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Auto-run the test
console.log('🧪 Standalone Pattern Engine Test Ready!');
console.log('📋 Copy and paste this entire script into your browser console to run the test');
console.log('🚀 Or call: testStandalonePatternEngine()');

// Make function available globally
window.testStandalonePatternEngine = testStandalonePatternEngine; 