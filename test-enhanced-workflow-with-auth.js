const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

let authToken = null;

// Test user credentials (using default test user)
const testUser = {
    email: 'test@example.com',
    password: 'password123'
};

async function authenticate() {
    try {
        console.log('🔐 Authenticating...');
        const response = await axios.post(`${API_BASE}/auth/login`, testUser);
        authToken = response.data.token;
        console.log('✅ Authentication successful');
        return true;
    } catch (error) {
        console.log('❌ Authentication failed:', error.response?.data || error.message);
        return false;
    }
}

async function testRecommendationsEndpoint() {
    try {
        console.log('\n1️⃣ Testing Bill Recommendations Endpoint...');
        const testTransaction = {
            transaction: {
                id: 'test-tx-123',
                description: 'Netflix Subscription',
                amount: 15.99,
                date: '2024-07-16',
                category: 'entertainment'
            }
        };
        const response = await axios.post(`${API_BASE}/bills-patterns/recommendations`, testTransaction, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Recommendations endpoint working:', response.status);
        console.log('   Response:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.log('❌ Recommendations endpoint error:', error.response?.status, error.response?.data);
        return false;
    }
}

async function testBatchClassifyEndpoint() {
    try {
        console.log('\n2️⃣ Testing Batch Classification Endpoint...');
        const testData = {
            transactionIds: ['test-id-1', 'test-id-2'],
            classification: 'bills'  // Changed from 'category' to 'classification'
        };
        const response = await axios.post(`${API_BASE}/bills-patterns/batch-classify`, testData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Batch classify endpoint working:', response.status);
        console.log('   Response:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.log('❌ Batch classify endpoint error:', error.response?.status, error.response?.data);
        return false;
    }
}

async function testCreatePatternEndpoint() {
    try {
        console.log('\n3️⃣ Testing Create Pattern Endpoint...');
        const testPattern = {
            patterns: [{
                id: 'test-pattern-1',
                name: 'Test Subscription',
                merchant: 'Test Merchant',
                frequency: 'monthly',
                baseAmount: 100,
                confidence: 0.95,
                transactions: []
            }]
        };
        const response = await axios.post(`${API_BASE}/bills-patterns/create-from-patterns`, testPattern, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Create pattern endpoint working:', response.status);
        console.log('   Response:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.log('❌ Create pattern endpoint error:', error.response?.status, error.response?.data);
        return false;
    }
}

async function runCompleteTest() {
    console.log('🧪 Testing Enhanced Pattern Workflow with Authentication...\n');

    // Step 1: Authenticate
    const authSuccess = await authenticate();
    if (!authSuccess) {
        console.log('\n💥 Cannot proceed without authentication');
        return;
    }

    // Step 2: Test all endpoints
    const results = {
        recommendations: await testRecommendationsEndpoint(),
        batchClassify: await testBatchClassifyEndpoint(),
        createPattern: await testCreatePatternEndpoint()
    };

    // Step 3: Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log('================');
    console.log('✅ Authentication:', '✅ PASSED');
    console.log('✅ Recommendations:', results.recommendations ? '✅ PASSED' : '❌ FAILED');
    console.log('✅ Batch Classify:', results.batchClassify ? '✅ PASSED' : '❌ FAILED');
    console.log('✅ Create Pattern:', results.createPattern ? '✅ PASSED' : '❌ FAILED');

    const allPassed = Object.values(results).every(result => result);
    console.log('\n🎉 OVERALL RESULT:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
    
    if (allPassed) {
        console.log('\n💡 Next Steps:');
        console.log('   1. Open http://localhost:3000 in your browser');
        console.log('   2. Navigate to All Transactions page');
        console.log('   3. Click "Bill Pattern Analysis" button');
        console.log('   4. Upload a CSV and test the enhanced workflow!');
        console.log('\n🚀 ENHANCED FEATURES NOW READY:');
        console.log('   ✅ Bill Pattern Recommendations');
        console.log('   ✅ Batch Transaction Classification');
        console.log('   ✅ Enhanced Pattern Creation Workflow');
        console.log('   ✅ Comprehensive Transaction Organization');
    } else {
        console.log('\n🔧 Debug Tips:');
        console.log('   - Check server logs for detailed error information');
        console.log('   - Verify database connections are working');
        console.log('   - Ensure all services are running properly');
    }
}

runCompleteTest().catch(console.error); 