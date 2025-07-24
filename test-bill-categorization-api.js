/**
 * 🧪 TEST: Bill Categorization API
 * 
 * This script tests the actual bill categorization API endpoints
 * to identify why bill transactions are showing as "Uncategorized".
 */

const testTransactions = [
  {
    id: 'test-bill-1',
    description: 'Netflix Monthly Subscription',
    amount: -19.99,
    merchant: 'Netflix',
    date: '2024-12-15',
    type: 'debit',
    linkedBillOccurrence: {
      id: 'bill-occ-1',
      billPatternId: 'bill-pattern-1',
      billPatternName: 'Netflix Monthly Subscription'
    }
  },
  {
    id: 'test-bill-2',
    description: 'Telstra Mobile Bill',
    amount: -89.99,
    merchant: 'Telstra',
    date: '2024-12-20',
    type: 'debit',
    linkedBillOccurrence: {
      id: 'bill-occ-2',
      billPatternId: 'bill-pattern-2',
      billPatternName: 'Telstra Mobile Bill'
    }
  }
];

async function testBillCategorizationAPI() {
  console.log('🧪 Testing Bill Categorization API');
  console.log('==================================');
  
  // Test 1: Check if core app is running
  console.log('\n1️⃣ Testing core app connectivity...');
  try {
    const healthResponse = await fetch('http://localhost:3001/health');
    if (healthResponse.ok) {
      console.log('✅ Core app is running on port 3001');
    } else {
      console.log('❌ Core app health check failed');
      return;
    }
  } catch (error) {
    console.log('❌ Core app is not running on port 3001');
    console.log('   Error:', error.message);
    return;
  }
  
  // Test 2: Check if AI+ microservice is running
  console.log('\n2️⃣ Testing AI+ microservice connectivity...');
  try {
    const aiHealthResponse = await fetch('http://localhost:3002/health');
    if (aiHealthResponse.ok) {
      console.log('✅ AI+ microservice is running on port 3002');
    } else {
      console.log('❌ AI+ microservice health check failed');
    }
  } catch (error) {
    console.log('❌ AI+ microservice is not running on port 3002');
    console.log('   Error:', error.message);
    console.log('   This could be why bill categorization is failing!');
  }
  
  // Test 3: Test bill pattern classification endpoint
  console.log('\n3️⃣ Testing bill pattern classification...');
  
  // Mock authentication token (you'll need to replace this with a real token)
  const mockToken = 'mock-jwt-token';
  
  try {
    const billClassificationResponse = await fetch('http://localhost:3001/api/intelligent-categorization/classify-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify({
        transactions: testTransactions,
        selectedCategories: ['Entertainment', 'Telecommunications', 'Utilities'],
        options: {
          enableBillDetection: true,
          enableCategorization: true
        },
        userProfile: {
          businessType: 'INDIVIDUAL',
          industry: 'Technology',
          countryCode: 'AU'
        }
      })
    });
    
    if (billClassificationResponse.ok) {
      const result = await billClassificationResponse.json();
      console.log('✅ Bill classification API call successful');
      console.log('📊 Results:', JSON.stringify(result, null, 2));
      
      // Check if bill transactions got categorized
      if (result.results) {
        const billResults = result.results.filter(r => r.secondaryType === 'bill');
        const uncategorizedBills = billResults.filter(r => 
          !r.category || r.category === 'Uncategorized' || r.category === ''
        );
        
        console.log(`📊 Bill classification results:`);
        console.log(`   • Total bill transactions: ${billResults.length}`);
        console.log(`   • Categorized bills: ${billResults.length - uncategorizedBills.length}`);
        console.log(`   • Uncategorized bills: ${uncategorizedBills.length}`);
        
        if (uncategorizedBills.length > 0) {
          console.log('\n❌ ISSUE FOUND: Some bill transactions are uncategorized');
          uncategorizedBills.forEach(tx => {
            console.log(`   • Transaction "${tx.description}" → Category: "${tx.category}"`);
            console.log(`     - Source: ${tx.source}`);
            console.log(`     - Reasoning: ${tx.reasoning}`);
          });
        } else {
          console.log('\n✅ All bill transactions are properly categorized!');
        }
      }
    } else {
      console.log('❌ Bill classification API call failed');
      const errorText = await billClassificationResponse.text();
      console.log('   Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Bill classification API call failed');
    console.log('   Error:', error.message);
  }
  
  // Test 4: Test individual bill pattern classification
  console.log('\n4️⃣ Testing individual bill pattern classification...');
  
  try {
    const individualResponse = await fetch('http://localhost:3001/api/intelligent-categorization/classify-bill-pattern', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify({
        billPatternId: 'bill-pattern-1',
        selectedCategories: ['Entertainment', 'Telecommunications'],
        userProfile: {
          businessType: 'INDIVIDUAL',
          industry: 'Technology',
          countryCode: 'AU'
        }
      })
    });
    
    if (individualResponse.ok) {
      const result = await individualResponse.json();
      console.log('✅ Individual bill pattern classification successful');
      console.log('📊 Result:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Individual bill pattern classification failed');
      const errorText = await individualResponse.text();
      console.log('   Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Individual bill pattern classification failed');
    console.log('   Error:', error.message);
  }
  
  // Test 5: Check database state (if possible)
  console.log('\n5️⃣ Database state analysis...');
  console.log('   • Check if bill patterns exist in database');
  console.log('   • Check if bill patterns have categories assigned');
  console.log('   • Check if transactions are linked to bill patterns');
  console.log('   • Check if category table has the expected categories');
  
  // Test 6: Frontend data flow
  console.log('\n6️⃣ Frontend data flow analysis...');
  console.log('   • Check if frontend is calling the correct API endpoints');
  console.log('   • Check if frontend is receiving updated category data');
  console.log('   • Check if frontend is properly displaying bill categories');
  console.log('   • Check if there are any JavaScript errors in browser console');
  
  console.log('\n🎯 Summary of potential issues:');
  console.log('1. AI+ microservice not running (most likely)');
  console.log('2. Authentication/authorization issues');
  console.log('3. Database connectivity or update issues');
  console.log('4. Frontend not calling the right endpoints');
  console.log('5. Bill pattern linking not working correctly');
  
  console.log('\n🔧 Recommended fixes:');
  console.log('1. Start the AI+ microservice: cd ai2-ai-modules && npm start');
  console.log('2. Check database for bill patterns and categories');
  console.log('3. Verify authentication tokens are valid');
  console.log('4. Test API endpoints with real authentication');
  console.log('5. Check frontend API calls and error handling');
  
  console.log('\n✅ API testing completed!');
}

testBillCategorizationAPI().catch(console.error); 