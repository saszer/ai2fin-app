const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testNewFeatures() {
  console.log('🧪 Testing New Enhanced Workflow Features...\n');

  try {
    // Test 1: Check if bill recommendations endpoint exists
    console.log('1️⃣ Testing Bill Recommendations Endpoint...');
    const sampleTransaction = {
      id: 'test-123',
      description: 'Netflix Payment',
      amount: 14.99,
      date: '2024-01-15',
      category: 'entertainment'
    };

    const billRecommendationsResponse = await axios.post(`${BASE_URL}/api/bills-patterns/recommendations`, {
      transaction: sampleTransaction
    }).catch(err => ({ status: err.response?.status, data: err.response?.data }));

    console.log('   Bill Recommendations:', billRecommendationsResponse.status);
    if (billRecommendationsResponse.data) {
      console.log('   Response:', JSON.stringify(billRecommendationsResponse.data, null, 2));
    }

    // Test 2: Check batch classification endpoint
    console.log('\n2️⃣ Testing Batch Classification Endpoint...');
    const batchClassifyResponse = await axios.post(`${BASE_URL}/api/transactions/batch-classify`, {
      transactionIds: ['test-123', 'test-456'],
      classification: 'bill'
    }).catch(err => ({ status: err.response?.status, data: err.response?.data }));

    console.log('   Batch Classification:', batchClassifyResponse.status);

    // Test 3: Check bill pattern creation endpoint
    console.log('\n3️⃣ Testing Enhanced Bill Pattern Creation...');
    const createBillResponse = await axios.post(`${BASE_URL}/api/bills-patterns/create-from-patterns`, {
      patterns: [{
        id: 'pattern-test',
        merchant: 'Netflix',
        averageAmount: 14.99,
        frequency: 'monthly',
        transactions: [sampleTransaction],
        confidence: 0.85
      }]
    }).catch(err => ({ status: err.response?.status, data: err.response?.data }));

    console.log('   Bill Creation:', createBillResponse.status);

    // Test 4: Check frontend components
    console.log('\n4️⃣ Checking Frontend Components...');
    
    // Check if PatternAnalysisModal has the new features
    const fs = require('fs');
    const modalContent = fs.readFileSync('./ai2-core-app/client/src/components/PatternAnalysisModal.tsx', 'utf8');
    
    const hasFeatures = {
      billRecommendations: modalContent.includes('showBillRecommendationsDialog'),
      enhancedWorkflow: modalContent.includes('Enhanced workflow for transaction classification'),
      batchClassification: modalContent.includes('batch-classify'),
      oneTimeExpenses: modalContent.includes('One-Time Expenses'),
      comprehensiveSummary: modalContent.includes('comprehensive summary')
    };

    console.log('   Frontend Features Present:');
    Object.entries(hasFeatures).forEach(([feature, present]) => {
      console.log(`   ✓ ${feature}: ${present ? '✅ YES' : '❌ NO'}`);
    });

    // Test 5: Check service availability
    console.log('\n5️⃣ Testing Service Availability...');
    
    const healthChecks = await Promise.allSettled([
      axios.get(`${BASE_URL}/health`),
      axios.get('http://localhost:3000/').catch(() => ({ data: 'Frontend check' })),
      axios.get('http://localhost:3002/health').catch(() => ({ data: 'AI modules check' }))
    ]);

    console.log('   Core App (3001):', healthChecks[0].status === 'fulfilled' ? '✅ ONLINE' : '❌ OFFLINE');
    console.log('   Frontend (3000):', healthChecks[1].status === 'fulfilled' ? '✅ ONLINE' : '❌ OFFLINE');
    console.log('   AI Modules (3002):', healthChecks[2].status === 'fulfilled' ? '✅ ONLINE' : '❌ OFFLINE');

    console.log('\n🔍 DIAGNOSIS:');
    console.log('================');

    if (hasFeatures.billRecommendations && hasFeatures.enhancedWorkflow) {
      console.log('✅ New features are present in the code');
      
      if (healthChecks[0].status === 'fulfilled' && healthChecks[1].status === 'fulfilled') {
        console.log('✅ Services are running');
        console.log('\n💡 SOLUTION: Try these steps:');
        console.log('   1. Clear browser cache (Ctrl+Shift+R)');
        console.log('   2. Open browser dev tools and check console for errors');
        console.log('   3. Navigate to http://localhost:3000/all-transactions');
        console.log('   4. Click "Bill Pattern Analysis" button');
        console.log('   5. Upload transactions and follow the enhanced workflow');
      } else {
        console.log('❌ Services not running properly');
        console.log('\n💡 SOLUTION: Restart services:');
        console.log('   1. cd ai2-core-app && npm start (backend)');
        console.log('   2. cd ai2-core-app && npm run dev (frontend)');
        console.log('   3. cd ai2-ai-modules && npm start (AI services)');
      }
    } else {
      console.log('❌ New features missing from code');
      console.log('\n💡 SOLUTION: Reapply the enhanced workflow changes');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNewFeatures(); 