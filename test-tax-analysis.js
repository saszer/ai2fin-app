/**
 * Test script for tax analysis functionality
 * Uses the seeded test data to verify the tax analysis is working properly
 */

async function testTaxAnalysis() {
  console.log('🧪 Testing Tax Analysis with seeded data...\n');

  try {
    // Dynamic import for node-fetch
    const fetch = (await import('node-fetch')).default;

    // First, login to get a token
    console.log('1. Logging in with test user...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;

    console.log('✅ Login successful\n');

    // Test tax analysis endpoint
    console.log('2. Testing tax analysis endpoint...');
    const taxAnalysisResponse = await fetch('http://localhost:3001/api/intelligent-tax-deduction/analyze-for-tax-deduction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        includeAlreadyAnalyzed: false,
        filters: null,
        userContext: null
      })
    });

    if (!taxAnalysisResponse.ok) {
      throw new Error(`Tax analysis failed: ${taxAnalysisResponse.status} ${taxAnalysisResponse.statusText}`);
    }

    const taxAnalysisData = await taxAnalysisResponse.json();
    
    console.log('✅ Tax analysis response:');
    console.log(JSON.stringify(taxAnalysisData, null, 2));

    // Verify the response structure
    if (taxAnalysisData.success && taxAnalysisData.data) {
      const data = taxAnalysisData.data;
      console.log('\n📊 Analysis Summary:');
      console.log(`   Total Transactions: ${data.totalTransactions}`);
      console.log(`   Already Analyzed: ${data.alreadyAnalyzed}`);
      console.log(`   Need Analysis: ${data.needAnalysis}`);
      console.log(`   Unique Bills: ${data.uniqueBills}`);
      console.log(`   One-Time Expenses: ${data.oneTimeExpenses}`);
      
      if (data.transactions && data.transactions.length > 0) {
        console.log(`   Transactions for Analysis: ${data.transactions.length}`);
        console.log('\n   Sample transactions:');
        data.transactions.slice(0, 3).forEach((tx, i) => {
          console.log(`   ${i + 1}. ${tx.description} - $${tx.amount} (${tx.merchant})`);
        });
      }
    }

    // Test user preferences endpoint
    console.log('\n3. Testing user preferences endpoint...');
    const preferencesResponse = await fetch('http://localhost:3001/api/intelligent-tax-deduction/preferences', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (preferencesResponse.ok) {
      const preferencesData = await preferencesResponse.json();
      console.log('✅ User preferences:');
      console.log(JSON.stringify(preferencesData, null, 2));
    } else {
      console.log('⚠️ User preferences endpoint not available');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTaxAnalysis(); 