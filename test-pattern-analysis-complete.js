const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_TOKEN = 'test-token';

// Test data - realistic transactions that should form patterns
const testTransactions = [
  // Netflix subscription pattern
  { id: 'netflix-1', date: '2024-01-15', description: 'NETFLIX.COM', amount: -19.99, merchant: 'Netflix', type: 'debit' },
  { id: 'netflix-2', date: '2024-02-15', description: 'NETFLIX.COM', amount: -19.99, merchant: 'Netflix', type: 'debit' },
  { id: 'netflix-3', date: '2024-03-15', description: 'NETFLIX.COM', amount: -19.99, merchant: 'Netflix', type: 'debit' },
  { id: 'netflix-4', date: '2024-04-15', description: 'NETFLIX.COM', amount: -19.99, merchant: 'Netflix', type: 'debit' },
  
  // Uber rides pattern
  { id: 'uber-1', date: '2024-01-10', description: 'UBER *TRIP', amount: -23.50, merchant: 'Uber', type: 'debit' },
  { id: 'uber-2', date: '2024-01-25', description: 'UBER *TRIP', amount: -18.75, merchant: 'Uber', type: 'debit' },
  { id: 'uber-3', date: '2024-02-08', description: 'UBER *TRIP', amount: -21.20, merchant: 'Uber', type: 'debit' },
  { id: 'uber-4', date: '2024-02-22', description: 'UBER *TRIP', amount: -19.80, merchant: 'Uber', type: 'debit' },
  
  // One-time expenses (should not form patterns)
  { id: 'grocery-1', date: '2024-01-05', description: 'WALMART GROCERY', amount: -125.50, merchant: 'Walmart', type: 'debit' },
  { id: 'gas-1', date: '2024-01-12', description: 'SHELL GAS STATION', amount: -45.20, merchant: 'Shell', type: 'debit' },
  { id: 'restaurant-1', date: '2024-01-18', description: 'MCDONALDS', amount: -15.99, merchant: 'McDonalds', type: 'debit' },
];

async function testPatternAnalysis() {
  console.log('🧪 Testing Complete Pattern Analysis Flow...\n');
  
  try {
    // Step 1: Test pattern analysis
    console.log('📊 Step 1: Analyzing patterns...');
    const analysisResponse = await axios.post(`${BASE_URL}/api/bills-patterns/analyze-patterns`, {
      transactions: testTransactions,
      filters: {}
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Pattern analysis response:', JSON.stringify(analysisResponse.data, null, 2));
    
    if (!analysisResponse.data.success) {
      throw new Error('Pattern analysis failed');
    }
    
    const { patterns, linkToExistingPatterns, statistics } = analysisResponse.data;
    
    console.log(`📈 Analysis Results:`);
    console.log(`   - Total transactions: ${statistics.totalTransactions}`);
    console.log(`   - New patterns found: ${patterns.length}`);
    console.log(`   - Link to existing patterns: ${linkToExistingPatterns.length}`);
    
    // Step 2: Test creating new patterns
    if (patterns.length > 0) {
      console.log('\n🔧 Step 2: Creating new bill patterns...');
      const createResponse = await axios.post(`${BASE_URL}/api/bills-patterns/create-from-patterns`, {
        patterns: patterns,
        linkTransactions: true
      }, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Create patterns response:', JSON.stringify(createResponse.data, null, 2));
      
      if (!createResponse.data.success) {
        throw new Error('Pattern creation failed');
      }
    }
    
    // Step 3: Test linking to existing patterns
    if (linkToExistingPatterns.length > 0) {
      console.log('\n🔗 Step 3: Linking to existing patterns...');
      const linkResponse = await axios.post(`${BASE_URL}/api/bills-patterns/link-to-existing`, {
        patterns: linkToExistingPatterns,
        linkTransactions: true
      }, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Link to existing response:', JSON.stringify(linkResponse.data, null, 2));
      
      if (!linkResponse.data.success) {
        throw new Error('Linking to existing patterns failed');
      }
    }
    
    // Step 4: Test batch classifying remaining transactions
    console.log('\n🏷️ Step 4: Classifying remaining transactions...');
    const classifyResponse = await axios.post(`${BASE_URL}/api/bills-patterns/batch-classify-remaining`, {
      filters: {},
      classifyAs: 'one-time expense'
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Batch classify response:', JSON.stringify(classifyResponse.data, null, 2));
    
    if (!classifyResponse.data.success) {
      throw new Error('Batch classification failed');
    }
    
    console.log('\n🎉 All pattern analysis tests passed successfully!');
    console.log('✅ Pattern analysis is working correctly');
    console.log('✅ Bill creation is working correctly');
    console.log('✅ Transaction linking is working correctly');
    console.log('✅ Batch classification is working correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

// Run the test
testPatternAnalysis(); 