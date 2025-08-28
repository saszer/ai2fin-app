/**
 * 🎯 CORRECTED FRONTEND-MATCHING TESTS
 * 
 * Tests that exactly match what the frontend does to prevent false positives.
 * This replaces the incorrect tests that were using /api/oidc/login while
 * the frontend uses /api/auth/login.
 * 
 * embracingearth.space - Accurate frontend testing
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

class FrontendMatchingTester {
  constructor() {
    this.results = { passed: 0, failed: 0, details: [] };
    this.authToken = null;
  }

  log(test, passed, details = {}) {
    this.results.details.push({ test, passed, details, timestamp: new Date().toISOString() });
    
    if (passed) {
      this.results.passed++;
      console.log(`✅ ${test}: PASS`, details);
    } else {
      this.results.failed++;
      console.log(`❌ ${test}: FAIL`, details);
    }
  }

  async testFrontendAuthFlow() {
    console.log('🎯 TESTING EXACT FRONTEND AUTHENTICATION FLOW');
    console.log('=' .repeat(70));
    
    // Test 1: Frontend Login Endpoint (the one that's actually broken)
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@embracingearth.space',
        password: 'TestPass123!'
      }, {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
        timeout: 5000
      });

      const loginWorking = loginResponse.status === 200 && loginResponse.data?.token;
      
      this.log('Frontend Login Endpoint (/api/auth/login)', loginWorking, {
        status: loginResponse.status,
        hasToken: !!loginResponse.data?.token,
        error: loginResponse.data?.error,
        errorType: loginResponse.data?.errorType
      });

      if (loginWorking) {
        this.authToken = loginResponse.data.token;
      }
      
      return loginWorking;
    } catch (error) {
      this.log('Frontend Login Endpoint (/api/auth/login)', false, {
        error: error.message
      });
      return false;
    }
  }

  async testFrontendEndpoints() {
    console.log('\n📱 TESTING FRONTEND ENDPOINTS (Exact same as browser)');
    console.log('-'.repeat(70));
    
    if (!this.authToken) {
      console.log('⚠️  No auth token available - testing without auth (should get 401s)');
    }

    const frontendEndpoints = [
      { path: '/api/categories', name: 'Categories' },
      { path: '/api/bank/csv-uploads', name: 'CSV Uploads' },
      { path: '/api/bank/transactions', name: 'Bank Transactions' },
      { path: '/api/auth/me', name: 'User Profile' },
      { path: '/api/user/permissions', name: 'User Permissions' }
    ];

    for (const endpoint of frontendEndpoints) {
      try {
        const headers = {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000' // Simulate frontend origin
        };
        
        if (this.authToken) {
          headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        const response = await axios.get(`${BASE_URL}${endpoint.path}`, {
          headers,
          withCredentials: true, // Simulate frontend credentials
          validateStatus: () => true,
          timeout: 5000
        });

        const shouldWork = !!this.authToken;
        const actuallyWorks = response.status === 200;
        const testPassed = shouldWork ? actuallyWorks : response.status === 401;

        this.log(`Frontend ${endpoint.name}`, testPassed, {
          status: response.status,
          expected: shouldWork ? '200' : '401',
          hasData: !!response.data,
          authTokenUsed: !!this.authToken
        });

      } catch (error) {
        this.log(`Frontend ${endpoint.name}`, false, {
          error: error.message
        });
      }
    }
  }

  async testWorkingAlternative() {
    console.log('\n🔧 TESTING WORKING ALTERNATIVE (What tests currently use)');
    console.log('-'.repeat(70));
    
    try {
      // Test the OIDC endpoint that actually works
      const oidcResponse = await axios.post(`${BASE_URL}/api/oidc/login`, {
        email: 'test@embracingearth.space',
        password: 'TestPass123!'
      }, {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true
      });

      const oidcWorks = oidcResponse.status === 200 && oidcResponse.data?.token;
      
      this.log('Alternative OIDC Login (/api/oidc/login)', oidcWorks, {
        status: oidcResponse.status,
        hasToken: !!oidcResponse.data?.token,
        note: 'This is why tests were passing'
      });

      // Test frontend endpoints with OIDC token
      if (oidcWorks && oidcResponse.data?.token) {
        console.log('\n🔑 Testing frontend endpoints with OIDC token:');
        
        const oidcToken = oidcResponse.data.token;
        const testEndpoint = '/api/bank/transactions';
        
        const endpointResponse = await axios.get(`${BASE_URL}${testEndpoint}`, {
          headers: {
            'Authorization': `Bearer ${oidcToken}`,
            'Origin': 'http://localhost:3000'
          },
          validateStatus: () => true
        });

        this.log('Frontend Endpoint with OIDC Token', endpointResponse.status === 200, {
          endpoint: testEndpoint,
          status: endpointResponse.status,
          note: 'This proves OIDC tokens work for frontend endpoints'
        });
      }

    } catch (error) {
      this.log('Alternative OIDC Login', false, {
        error: error.message
      });
    }
  }

  generateReport() {
    const total = this.results.passed + this.results.failed;
    const passRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
    
    console.log('\n📊 CORRECTED TEST REPORT');
    console.log('=' .repeat(70));
    console.log(`📈 Results: ${this.results.passed}/${total} passed (${passRate}%)`);
    
    console.log('\n🔍 FINDINGS:');
    
    const frontendLoginTest = this.results.details.find(r => r.test.includes('Frontend Login Endpoint'));
    const oidcLoginTest = this.results.details.find(r => r.test.includes('Alternative OIDC Login'));
    
    if (frontendLoginTest && !frontendLoginTest.passed && oidcLoginTest && oidcLoginTest.passed) {
      console.log('✅ CONFIRMED: Endpoint mismatch is the root cause');
      console.log('   • Frontend uses /api/auth/login (broken)');
      console.log('   • Tests use /api/oidc/login (working)');
      console.log('   • This explains the false positive test results');
    }
    
    console.log('\n🛠️  IMMEDIATE FIXES NEEDED:');
    console.log('1. Update frontend to use /api/oidc/login');
    console.log('2. OR fix /api/auth/login to work with OIDC users');
    console.log('3. Update test suite to use same endpoint as frontend');
    
    console.log('\n💻 FRONTEND CODE CHANGE:');
    console.log('// In your login component:');
    console.log('- const response = await axios.post("/api/auth/login", credentials);');
    console.log('+ const response = await axios.post("/api/oidc/login", credentials);');
    
    console.log('\n🧪 TEST SUITE FIXES:');
    console.log('• Change tests from /api/oidc/login to /api/auth/login');
    console.log('• Add endpoint consistency validation');
    console.log('• Test both endpoints to ensure redundancy');
  }

  async runTests() {
    const loginWorking = await this.testFrontendAuthFlow();
    await this.testFrontendEndpoints();
    await this.testWorkingAlternative();
    this.generateReport();
    
    return this.results.failed === 0;
  }
}

// Run if called directly
if (require.main === module) {
  (async () => {
    const tester = new FrontendMatchingTester();
    try {
      const success = await tester.runTests();
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('❌ Test failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = FrontendMatchingTester;
