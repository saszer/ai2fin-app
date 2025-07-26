/**
 * Test script to verify tax analysis endpoint functionality
 */

async function testTaxEndpoint() {
  console.log('🧪 Testing Tax Analysis Endpoint...\n');

  try {
    // Test 1: Check if backend is running
    console.log('1. Checking backend health...');
    const healthResponse = await fetch('http://localhost:3001/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend is running:', healthData.status);
    } else {
      throw new Error('Backend is not responding');
    }
    console.log();

    // Test 2: Try to login to get a token
    console.log('2. Testing login...');
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

    // Test 3: Test tax analysis endpoint
    console.log('3. Testing tax analysis endpoint...');
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

    // Test 4: Test with includeAlreadyAnalyzed: true
    console.log('\n4. Testing with includeAlreadyAnalyzed: true...');
    const taxAnalysisResponse2 = await fetch('http://localhost:3001/api/intelligent-tax-deduction/analyze-for-tax-deduction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        includeAlreadyAnalyzed: true,
        filters: null,
        userContext: null
      })
    });

    if (taxAnalysisResponse2.ok) {
      const taxAnalysisData2 = await taxAnalysisResponse2.json();
      console.log('✅ Tax analysis with already analyzed:');
      console.log(JSON.stringify(taxAnalysisData2, null, 2));
    }

    console.log('\n🎉 All endpoint tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTaxEndpoint(); 