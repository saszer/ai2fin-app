/**
 * 🔍 REAL FRONTEND FLOW TEST
 * 
 * Tests the ACTUAL frontend authentication flow to identify
 * the real cause of 401 errors (since frontend uses correct endpoint).
 * 
 * embracingearth.space - Real frontend debugging
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

class RealFrontendFlowTester {
  constructor() {
    this.results = [];
  }

  log(test, status, details = {}) {
    const result = { test, status, details, timestamp: new Date().toISOString() };
    this.results.push(result);
    
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${test}: ${status}`);
    if (Object.keys(details).length > 0) {
      console.log(`   ${JSON.stringify(details, null, 2).replace(/\n/g, '\n   ')}`);
    }
  }

  async testActualFrontendFlow() {
    console.log('🔍 TESTING ACTUAL FRONTEND AUTHENTICATION FLOW');
    console.log('=' .repeat(80));
    
    // Step 1: Test the endpoint the frontend actually uses
    console.log('\n1️⃣ Testing Frontend Login Endpoint (/api/oidc/login)');
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/oidc/login`, {
        email: 'test@embracingearth.space',
        password: 'TestPass123!'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000' // Simulate frontend
        },
        withCredentials: true,
        validateStatus: () => true
      });

      const loginWorking = loginResponse.status === 200 && loginResponse.data?.success;
      
      this.log('Frontend OIDC Login', loginWorking ? 'PASS' : 'FAIL', {
        status: loginResponse.status,
        success: loginResponse.data?.success,
        hasToken: !!loginResponse.data?.token,
        hasUser: !!loginResponse.data?.user,
        error: loginResponse.data?.error
      });

      if (!loginWorking) {
        console.log('❌ Frontend login endpoint is broken - this explains the 401s');
        return null;
      }

      return loginResponse.data.token;
      
    } catch (error) {
      this.log('Frontend OIDC Login', 'FAIL', { error: error.message });
      return null;
    }
  }

  async testTokenValidation(token) {
    if (!token) {
      console.log('⚠️  No token available for validation tests');
      return;
    }

    console.log('\n2️⃣ Testing Token Validation');
    
    // Test /api/auth/me (should work with valid token)
    try {
      const meResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Origin': 'http://localhost:3000'
        },
        withCredentials: true,
        validateStatus: () => true
      });

      this.log('Token Validation (/api/auth/me)', meResponse.status === 200 ? 'PASS' : 'FAIL', {
        status: meResponse.status,
        hasUser: !!meResponse.data?.user,
        error: meResponse.data?.error
      });

    } catch (error) {
      this.log('Token Validation (/api/auth/me)', 'FAIL', { error: error.message });
    }
  }

  async testFrontendProblemEndpoints(token) {
    if (!token) {
      console.log('⚠️  No token available for endpoint tests');
      return;
    }

    console.log('\n3️⃣ Testing Frontend Problem Endpoints');
    
    const problemEndpoints = [
      '/api/categories',
      '/api/bank/csv-uploads',
      '/api/bank/transactions'
    ];

    for (const endpoint of problemEndpoints) {
      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:3000'
          },
          withCredentials: true,
          validateStatus: () => true
        });

        this.log(`Frontend Endpoint: ${endpoint}`, response.status === 200 ? 'PASS' : 'FAIL', {
          status: response.status,
          hasData: !!response.data,
          error: response.data?.error
        });

      } catch (error) {
        this.log(`Frontend Endpoint: ${endpoint}`, 'FAIL', { error: error.message });
      }
    }
  }

  async testTokenStorage() {
    console.log('\n4️⃣ Testing Token Storage Simulation');
    
    // Simulate how frontend stores and retrieves tokens
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/oidc/login`, {
        email: 'test@embracingearth.space',
        password: 'TestPass123!'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (loginResponse.data?.token) {
        // Simulate localStorage.setItem('token', token)
        const storedToken = loginResponse.data.token;
        
        // Simulate localStorage.getItem('token') and use in request
        const testResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json'
          },
          validateStatus: () => true
        });

        this.log('Token Storage Simulation', testResponse.status === 200 ? 'PASS' : 'FAIL', {
          tokenStored: !!storedToken,
          tokenLength: storedToken?.length,
          requestStatus: testResponse.status,
          authWorking: testResponse.status === 200
        });
      }

    } catch (error) {
      this.log('Token Storage Simulation', 'FAIL', { error: error.message });
    }
  }

  async testCORSIssues() {
    console.log('\n5️⃣ Testing CORS Issues');
    
    try {
      // Test preflight request
      const preflightResponse = await axios.options(`${BASE_URL}/api/bank/transactions`, {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization,content-type'
        },
        validateStatus: () => true
      });

      this.log('CORS Preflight', preflightResponse.status === 200 ? 'PASS' : 'FAIL', {
        status: preflightResponse.status,
        allowOrigin: preflightResponse.headers['access-control-allow-origin'],
        allowHeaders: preflightResponse.headers['access-control-allow-headers']
      });

    } catch (error) {
      this.log('CORS Preflight', 'FAIL', { error: error.message });
    }
  }

  async testLegacyAuthEndpoint() {
    console.log('\n6️⃣ Testing Legacy Auth Endpoint (Should be removed)');
    
    try {
      const legacyResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@embracingearth.space',
        password: 'TestPass123!'
      }, {
        validateStatus: () => true
      });

      this.log('Legacy Auth Endpoint', legacyResponse.status === 404 ? 'PASS' : 'WARN', {
        status: legacyResponse.status,
        note: legacyResponse.status === 404 ? 'Good - endpoint removed' : 'Should be removed to prevent confusion',
        error: legacyResponse.data?.error
      });

    } catch (error) {
      this.log('Legacy Auth Endpoint', 'PASS', { 
        note: 'Endpoint not accessible - good for cleanup',
        error: error.message 
      });
    }
  }

  generateReport() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;
    const total = passed + failed + warnings;
    
    console.log('\n📊 REAL FRONTEND FLOW ANALYSIS REPORT');
    console.log('=' .repeat(80));
    console.log(`📈 Results: ${passed} passed, ${failed} failed, ${warnings} warnings (${total} total)`);
    
    console.log('\n🔍 ROOT CAUSE ANALYSIS:');
    
    const frontendLogin = this.results.find(r => r.test.includes('Frontend OIDC Login'));
    const tokenValidation = this.results.find(r => r.test.includes('Token Validation'));
    const endpointTests = this.results.filter(r => r.test.includes('Frontend Endpoint'));
    
    if (frontendLogin?.status === 'FAIL') {
      console.log('❌ CRITICAL: Frontend login endpoint (/api/oidc/login) is broken');
      console.log('   This is the root cause of all 401 errors');
    } else if (frontendLogin?.status === 'PASS' && tokenValidation?.status === 'FAIL') {
      console.log('❌ ISSUE: Login works but token validation fails');
      console.log('   Problem in authentication middleware or token format');
    } else if (frontendLogin?.status === 'PASS' && tokenValidation?.status === 'PASS') {
      const failedEndpoints = endpointTests.filter(r => r.status === 'FAIL');
      if (failedEndpoints.length > 0) {
        console.log('❌ ISSUE: Auth works but specific endpoints fail');
        console.log('   Problem in route-specific middleware or access control');
        failedEndpoints.forEach(ep => {
          console.log(`   • ${ep.test}: ${ep.details.status}`);
        });
      } else {
        console.log('✅ MYSTERY: All backend tests pass but frontend still gets 401s');
        console.log('   Issue may be in frontend token handling or browser state');
      }
    }
    
    console.log('\n🛠️  RECOMMENDED ACTIONS:');
    
    if (frontendLogin?.status === 'FAIL') {
      console.log('1. Fix /api/oidc/login endpoint immediately');
      console.log('2. Check Zitadel configuration and connectivity');
    } else {
      console.log('1. Check browser developer tools for actual request/response');
      console.log('2. Verify frontend token storage and retrieval');
      console.log('3. Check for browser cache or session issues');
    }
    
    console.log('4. Remove legacy /api/auth/login to prevent confusion');
    console.log('5. Add comprehensive logging to identify exact failure point');
  }

  async runTests() {
    const token = await this.testActualFrontendFlow();
    await this.testTokenValidation(token);
    await this.testFrontendProblemEndpoints(token);
    await this.testTokenStorage();
    await this.testCORSIssues();
    await this.testLegacyAuthEndpoint();
    
    this.generateReport();
    
    return this.results.filter(r => r.status === 'FAIL').length === 0;
  }
}

// Run if called directly
if (require.main === module) {
  (async () => {
    const tester = new RealFrontendFlowTester();
    try {
      const success = await tester.runTests();
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('❌ Test failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = RealFrontendFlowTester;


