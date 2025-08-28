/**
 * 🔍 AUTHENTICATION MISROUTING DIAGNOSIS
 * 
 * Diagnoses why the frontend is getting 401 errors on all API endpoints
 * even though the user appears to be authenticated.
 * 
 * Issues to investigate:
 * 1. Token format mismatch (Bearer vs cookie auth)
 * 2. CORS preflight issues
 * 3. Authentication middleware routing problems
 * 4. Token validation failures
 * 5. User session state inconsistencies
 * 
 * embracingearth.space - Enterprise authentication debugging
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

class AuthMisroutingDiagnoser {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      details: []
    };
    this.authToken = null;
    this.sessionCookie = null;
    this.testUser = null;
  }

  log(message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data);
  }

  async testDirectLogin() {
    this.log('🔐 Testing direct login to get fresh tokens...');
    
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@embracingearth.space',
        password: 'TestPass123!'
      }, { 
        timeout: 5000,
        withCredentials: true // Enable cookies
      });

      if (response.status === 200 && response.data.token) {
        this.authToken = response.data.token;
        this.testUser = response.data.user;
        
        // Extract session cookie if present
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader) {
          const sessionCookie = setCookieHeader.find(cookie => cookie.includes('ai2_sess'));
          if (sessionCookie) {
            this.sessionCookie = sessionCookie.split(';')[0]; // Get just the cookie value
          }
        }
        
        this.addResult('Direct Login', true, {
          hasToken: !!this.authToken,
          hasCookie: !!this.sessionCookie,
          userId: this.testUser?.id,
          tokenLength: this.authToken?.length
        });
        
        return true;
      }
      
      throw new Error('Login response missing token');
    } catch (error) {
      this.addResult('Direct Login', false, {
        error: error.message,
        status: error.response?.status
      });
      return false;
    }
  }

  async testFrontendProblemEndpoints() {
    this.log('🎯 Testing the specific endpoints that are failing in frontend...');
    
    const problemEndpoints = [
      '/api/categories',
      '/api/bank/csv-uploads', 
      '/api/bank/transactions'
    ];
    
    const results = {};
    
    for (const endpoint of problemEndpoints) {
      try {
        // Test with Bearer token
        const bearerResponse = await axios.get(`${BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000,
          validateStatus: () => true
        });
        
        // Test with cookie (if available)
        let cookieResponse = null;
        if (this.sessionCookie) {
          cookieResponse = await axios.get(`${BASE_URL}${endpoint}`, {
            headers: {
              'Cookie': this.sessionCookie,
              'Content-Type': 'application/json'
            },
            timeout: 5000,
            validateStatus: () => true
          });
        }
        
        results[endpoint] = {
          bearerStatus: bearerResponse.status,
          cookieStatus: cookieResponse?.status || 'N/A',
          bearerAuth: bearerResponse.status !== 401,
          cookieAuth: cookieResponse ? cookieResponse.status !== 401 : false
        };
        
      } catch (error) {
        results[endpoint] = {
          error: error.message,
          bearerAuth: false,
          cookieAuth: false
        };
      }
    }
    
    const allEndpointsWorking = Object.values(results).every(r => r.bearerAuth || r.cookieAuth);
    
    this.addResult('Frontend Problem Endpoints', allEndpointsWorking, results);
    
    return results;
  }

  async testAuthMiddlewareFlow() {
    this.log('🛡️ Testing authentication middleware flow...');
    
    try {
      // Test /api/auth/me endpoint (should always work if auth is correct)
      const meResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        },
        timeout: 5000,
        validateStatus: () => true
      });
      
      // Test a public endpoint that shouldn't require auth
      const healthResponse = await axios.get(`${BASE_URL}/health`, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      // Test version endpoint (should be public)
      const versionResponse = await axios.get(`${BASE_URL}/api/version`, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      const middlewareWorking = meResponse.status === 200 && 
                               healthResponse.status === 200 &&
                               versionResponse.status === 200;
      
      this.addResult('Auth Middleware Flow', middlewareWorking, {
        meEndpoint: meResponse.status,
        healthEndpoint: healthResponse.status,
        versionEndpoint: versionResponse.status,
        userDataPresent: !!meResponse.data?.user
      });
      
      return middlewareWorking;
    } catch (error) {
      this.addResult('Auth Middleware Flow', false, {
        error: error.message
      });
      return false;
    }
  }

  async testTokenValidation() {
    this.log('🔑 Testing token validation details...');
    
    try {
      // Test with valid token
      const validResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        },
        validateStatus: () => true
      });
      
      // Test with malformed token
      const malformedResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer invalid-token-format`
        },
        validateStatus: () => true
      });
      
      // Test with missing Bearer prefix
      const noBearerResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': this.authToken
        },
        validateStatus: () => true
      });
      
      // Test with no Authorization header
      const noAuthResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
        validateStatus: () => true
      });
      
      const tokenValidationWorking = validResponse.status === 200 &&
                                   malformedResponse.status === 401 &&
                                   noBearerResponse.status === 401 &&
                                   noAuthResponse.status === 401;
      
      this.addResult('Token Validation', tokenValidationWorking, {
        validToken: validResponse.status,
        malformedToken: malformedResponse.status,
        noBearerPrefix: noBearerResponse.status,
        noAuth: noAuthResponse.status
      });
      
      return tokenValidationWorking;
    } catch (error) {
      this.addResult('Token Validation', false, {
        error: error.message
      });
      return false;
    }
  }

  async testCORSAndPreflight() {
    this.log('🌐 Testing CORS and preflight requests...');
    
    try {
      // Simulate a preflight request
      const preflightResponse = await axios.options(`${BASE_URL}/api/bank/transactions`, {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization,content-type'
        },
        validateStatus: () => true
      });
      
      // Test actual request with CORS headers
      const corsResponse = await axios.get(`${BASE_URL}/api/bank/transactions`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Origin': 'http://localhost:3000'
        },
        validateStatus: () => true
      });
      
      const corsWorking = preflightResponse.status === 200 &&
                         preflightResponse.headers['access-control-allow-origin'] &&
                         corsResponse.status !== 403; // Should not be blocked by CORS
      
      this.addResult('CORS and Preflight', corsWorking, {
        preflightStatus: preflightResponse.status,
        corsAllowOrigin: preflightResponse.headers['access-control-allow-origin'],
        actualRequestStatus: corsResponse.status,
        corsBlocked: corsResponse.status === 403
      });
      
      return corsWorking;
    } catch (error) {
      this.addResult('CORS and Preflight', false, {
        error: error.message
      });
      return false;
    }
  }

  async testUserSessionConsistency() {
    this.log('👤 Testing user session consistency...');
    
    try {
      // Get user info multiple times to check consistency
      const requests = [];
      for (let i = 0; i < 3; i++) {
        requests.push(
          axios.get(`${BASE_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${this.authToken}`
            }
          })
        );
      }
      
      const responses = await Promise.all(requests);
      
      // Check if all responses are consistent
      const firstUser = responses[0].data.user;
      const allConsistent = responses.every(r => 
        r.data.user?.id === firstUser?.id &&
        r.data.user?.email === firstUser?.email
      );
      
      this.addResult('User Session Consistency', allConsistent, {
        allResponsesSuccessful: responses.every(r => r.status === 200),
        userIdConsistent: allConsistent,
        userId: firstUser?.id,
        userEmail: firstUser?.email
      });
      
      return allConsistent;
    } catch (error) {
      this.addResult('User Session Consistency', false, {
        error: error.message
      });
      return false;
    }
  }

  async testFrontendSimulation() {
    this.log('🖥️ Simulating exact frontend behavior...');
    
    try {
      // Simulate the exact sequence the frontend would do
      
      // 1. Check if user is authenticated
      const authCheckResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Origin': 'http://localhost:3000'
        },
        withCredentials: true,
        validateStatus: () => true
      });
      
      // 2. Load categories (first failing endpoint)
      const categoriesResponse = await axios.get(`${BASE_URL}/api/categories`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Origin': 'http://localhost:3000',
          'Content-Type': 'application/json'
        },
        withCredentials: true,
        validateStatus: () => true
      });
      
      // 3. Load bank transactions (second failing endpoint)
      const transactionsResponse = await axios.get(`${BASE_URL}/api/bank/transactions`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Origin': 'http://localhost:3000',
          'Content-Type': 'application/json'
        },
        withCredentials: true,
        validateStatus: () => true
      });
      
      const frontendSimulationWorking = authCheckResponse.status === 200 &&
                                       categoriesResponse.status === 200 &&
                                       transactionsResponse.status === 200;
      
      this.addResult('Frontend Simulation', frontendSimulationWorking, {
        authCheck: authCheckResponse.status,
        categories: categoriesResponse.status,
        transactions: transactionsResponse.status,
        authCheckHasUser: !!authCheckResponse.data?.user,
        categoriesHasData: !!categoriesResponse.data,
        transactionsHasData: !!transactionsResponse.data
      });
      
      return frontendSimulationWorking;
    } catch (error) {
      this.addResult('Frontend Simulation', false, {
        error: error.message
      });
      return false;
    }
  }

  addResult(testName, passed, details = {}) {
    const result = {
      test: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results.details.push(result);
    
    if (passed) {
      this.results.passed++;
      this.log(`✅ ${testName}: PASS`, details);
    } else {
      this.results.failed++;
      this.log(`❌ ${testName}: FAIL`, details);
    }
  }

  async runDiagnosis() {
    this.log('🚀 Starting authentication misrouting diagnosis...');
    
    // Step 1: Get fresh authentication
    const authSuccess = await this.testDirectLogin();
    if (!authSuccess) {
      this.log('❌ Cannot proceed without authentication');
      return this.results;
    }

    // Step 2: Run all diagnostic tests
    await this.testAuthMiddlewareFlow();
    await this.testTokenValidation();
    await this.testFrontendProblemEndpoints();
    await this.testCORSAndPreflight();
    await this.testUserSessionConsistency();
    await this.testFrontendSimulation();

    return this.results;
  }

  generateDiagnosisReport() {
    const total = this.results.passed + this.results.failed;
    const passRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(80));
    console.log('🔍 AUTHENTICATION MISROUTING DIAGNOSIS REPORT');
    console.log('='.repeat(80));
    console.log(`📊 Total Tests: ${total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Pass Rate: ${passRate}%`);
    console.log('='.repeat(80));
    
    // Analyze specific issues
    console.log('\n🔍 DIAGNOSIS ANALYSIS:');
    
    const frontendEndpointsTest = this.results.details.find(r => r.test === 'Frontend Problem Endpoints');
    if (frontendEndpointsTest && !frontendEndpointsTest.passed) {
      console.log('\n❌ FRONTEND ENDPOINTS FAILING:');
      Object.entries(frontendEndpointsTest.details).forEach(([endpoint, result]) => {
        if (typeof result === 'object' && !result.bearerAuth && !result.cookieAuth) {
          console.log(`  • ${endpoint}: Bearer=${result.bearerStatus}, Cookie=${result.cookieStatus}`);
        }
      });
    }
    
    const tokenTest = this.results.details.find(r => r.test === 'Token Validation');
    if (tokenTest && !tokenTest.passed) {
      console.log('\n❌ TOKEN VALIDATION ISSUES:');
      console.log(`  • Valid token response: ${tokenTest.details.validToken}`);
      console.log(`  • This suggests the token format or validation logic has problems`);
    }
    
    const corsTest = this.results.details.find(r => r.test === 'CORS and Preflight');
    if (corsTest && !corsTest.passed) {
      console.log('\n❌ CORS CONFIGURATION ISSUES:');
      console.log(`  • Preflight status: ${corsTest.details.preflightStatus}`);
      console.log(`  • CORS blocked: ${corsTest.details.corsBlocked}`);
    }
    
    const frontendSimTest = this.results.details.find(r => r.test === 'Frontend Simulation');
    if (frontendSimTest) {
      console.log('\n🖥️ FRONTEND SIMULATION RESULTS:');
      console.log(`  • Auth check: ${frontendSimTest.details.authCheck}`);
      console.log(`  • Categories: ${frontendSimTest.details.categories}`);
      console.log(`  • Transactions: ${frontendSimTest.details.transactions}`);
      
      if (!frontendSimTest.passed) {
        console.log('  • This confirms the frontend authentication issue');
      }
    }
    
    console.log('\n🛠️ RECOMMENDED FIXES:');
    
    if (!tokenTest?.passed) {
      console.log('1. Check JWT token validation in authMiddleware');
      console.log('2. Verify JWT_SECRET is consistent between login and validation');
      console.log('3. Check token expiration and format');
    }
    
    if (!frontendEndpointsTest?.passed) {
      console.log('4. Review route-specific authentication middleware');
      console.log('5. Check if AccessControlService is blocking requests incorrectly');
      console.log('6. Verify subscription service integration is not causing auth failures');
    }
    
    if (!corsTest?.passed) {
      console.log('7. Fix CORS configuration for frontend origin');
      console.log('8. Ensure preflight requests are handled correctly');
    }
    
    console.log('\n💡 NEXT STEPS:');
    console.log('• Run this diagnosis again after each fix to verify resolution');
    console.log('• Check server logs for detailed error messages during failed requests');
    console.log('• Test with browser developer tools to see exact request/response headers');
    
    console.log('\n' + '='.repeat(80));
  }
}

// Run diagnosis if called directly
if (require.main === module) {
  (async () => {
    const diagnoser = new AuthMisroutingDiagnoser();
    
    try {
      await diagnoser.runDiagnosis();
      diagnoser.generateDiagnosisReport();
      
      // Exit with appropriate code
      process.exit(diagnoser.results.failed > 0 ? 1 : 0);
    } catch (error) {
      console.error('❌ Diagnosis failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = AuthMisroutingDiagnoser;


