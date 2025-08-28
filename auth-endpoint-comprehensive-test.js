/**
 * 🔍 COMPREHENSIVE AUTH ENDPOINT TEST
 * 
 * Tests all authentication endpoints to identify the exact issue
 * and provide a solution for the frontend 401 errors.
 * 
 * embracingearth.space - Complete auth debugging
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

class AuthEndpointTester {
  constructor() {
    this.results = [];
    this.testCredentials = {
      email: 'test@embracingearth.space',
      password: 'TestPass123!'
    };
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

  async testEndpoint(method, path, data = null, headers = {}) {
    try {
      const config = {
        method,
        url: `${BASE_URL}${path}`,
        validateStatus: () => true,
        timeout: 5000,
        headers: { 'Content-Type': 'application/json', ...headers }
      };
      
      if (data) config.data = data;
      
      const response = await axios(config);
      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
        success: response.status >= 200 && response.status < 300
      };
    } catch (error) {
      return {
        error: error.message,
        success: false
      };
    }
  }

  async testAllAuthEndpoints() {
    console.log('🔍 COMPREHENSIVE AUTH ENDPOINT ANALYSIS');
    console.log('=' .repeat(80));
    
    // Test 1: OIDC Login (what tests use)
    console.log('\n🔧 TESTING: /api/oidc/login (Used by tests)');
    const oidcResult = await this.testEndpoint('POST', '/api/oidc/login', this.testCredentials);
    
    if (oidcResult.success) {
      this.log('OIDC Login', 'PASS', {
        status: oidcResult.status,
        hasToken: !!oidcResult.data?.token,
        hasUser: !!oidcResult.data?.user,
        userEmail: oidcResult.data?.user?.email
      });
    } else {
      this.log('OIDC Login', 'FAIL', {
        status: oidcResult.status,
        error: oidcResult.data?.error || oidcResult.error
      });
    }
    
    // Test 2: Auth Login (what frontend likely uses)
    console.log('\n🖥️  TESTING: /api/auth/login (Used by frontend)');
    const authResult = await this.testEndpoint('POST', '/api/auth/login', this.testCredentials);
    
    if (authResult.success) {
      this.log('Auth Login', 'PASS', {
        status: authResult.status,
        hasToken: !!authResult.data?.token,
        hasUser: !!authResult.data?.user
      });
    } else {
      this.log('Auth Login', 'FAIL', {
        status: authResult.status,
        error: authResult.data?.error,
        errorType: authResult.data?.errorType,
        userMessage: authResult.data?.userMessage
      });
    }
    
    // Test 3: Custom Auth Login
    console.log('\n🔧 TESTING: Custom auth login');
    const customAuthResult = await this.testEndpoint('POST', '/api/custom-auth/login', this.testCredentials);
    
    if (customAuthResult.success) {
      this.log('Custom Auth Login', 'PASS', {
        status: customAuthResult.status
      });
    } else {
      this.log('Custom Auth Login', 'FAIL', {
        status: customAuthResult.status,
        error: customAuthResult.data?.error || customAuthResult.error
      });
    }
    
    return { oidcResult, authResult, customAuthResult };
  }

  async testWithWorkingToken(token) {
    console.log('\n🔑 TESTING FRONTEND ENDPOINTS WITH WORKING TOKEN');
    console.log('-'.repeat(80));
    
    const frontendEndpoints = [
      '/api/categories',
      '/api/bank/csv-uploads',
      '/api/bank/transactions',
      '/api/auth/me',
      '/api/user/permissions'
    ];
    
    for (const endpoint of frontendEndpoints) {
      const result = await this.testEndpoint('GET', endpoint, null, {
        'Authorization': `Bearer ${token}`
      });
      
      if (result.success) {
        this.log(`Frontend Endpoint: ${endpoint}`, 'PASS', {
          status: result.status,
          hasData: !!result.data
        });
      } else {
        this.log(`Frontend Endpoint: ${endpoint}`, 'FAIL', {
          status: result.status,
          error: result.data?.error || result.error
        });
      }
    }
  }

  async investigateUserDatabase() {
    console.log('\n🗄️  INVESTIGATING USER DATABASE ISSUE');
    console.log('-'.repeat(80));
    
    // Try to register the same user to see what happens
    const registerResult = await this.testEndpoint('POST', '/api/auth/register', {
      ...this.testCredentials,
      name: 'Test User'
    });
    
    if (registerResult.status === 409) {
      this.log('User Database Check', 'INFO', {
        finding: 'User already exists in local database',
        implication: 'Password mismatch or bcrypt issue'
      });
    } else if (registerResult.success) {
      this.log('User Database Check', 'INFO', {
        finding: 'User was successfully registered',
        implication: 'User did not exist in local database'
      });
    } else {
      this.log('User Database Check', 'WARN', {
        status: registerResult.status,
        error: registerResult.data?.error
      });
    }
  }

  async runComprehensiveTest() {
    const { oidcResult, authResult } = await this.testAllAuthEndpoints();
    
    await this.investigateUserDatabase();
    
    // If OIDC works, test frontend endpoints with that token
    if (oidcResult.success && oidcResult.data?.token) {
      await this.testWithWorkingToken(oidcResult.data.token);
    }
    
    this.generateReport(oidcResult, authResult);
  }

  generateReport(oidcResult, authResult) {
    console.log('\n📊 COMPREHENSIVE ANALYSIS REPORT');
    console.log('=' .repeat(80));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = passed + failed;
    
    console.log(`📈 Test Results: ${passed}/${total} passed (${((passed/total)*100).toFixed(1)}%)`);
    
    console.log('\n🔍 ROOT CAUSE ANALYSIS:');
    
    if (oidcResult.success && !authResult.success) {
      console.log('✅ ISSUE IDENTIFIED: Endpoint Mismatch');
      console.log('   • /api/oidc/login works (tests use this)');
      console.log('   • /api/auth/login fails (frontend uses this)');
      console.log('   • This explains why tests pass but frontend gets 401s');
      
      if (authResult.data?.errorType === 'USER_NOT_FOUND') {
        console.log('   • User exists in OIDC but not in local database');
      } else if (authResult.data?.errorType === 'INCORRECT_PASSWORD') {
        console.log('   • Password mismatch between OIDC and local database');
      }
    } else if (!oidcResult.success && !authResult.success) {
      console.log('❌ CRITICAL: Both auth endpoints are broken');
    } else if (oidcResult.success && authResult.success) {
      console.log('✅ Both endpoints work - issue may be elsewhere');
    }
    
    console.log('\n🛠️  RECOMMENDED SOLUTIONS:');
    console.log('1. IMMEDIATE FIX: Update frontend to use /api/oidc/login');
    console.log('2. LONG-TERM: Sync user data between OIDC and local database');
    console.log('3. ALTERNATIVE: Make /api/auth/login redirect to OIDC internally');
    console.log('4. UPDATE TESTS: Use same endpoint as frontend for accurate testing');
    
    console.log('\n💻 FRONTEND CODE CHANGE NEEDED:');
    console.log('Change from: POST /api/auth/login');
    console.log('Change to:   POST /api/oidc/login');
    console.log('This should immediately fix the 401 errors.');
    
    console.log('\n🧪 TEST SUITE IMPROVEMENTS:');
    console.log('• Update tests to use /api/auth/login to match frontend');
    console.log('• Add endpoint consistency validation');
    console.log('• Test both authentication methods for redundancy');
  }
}

// Run comprehensive test
if (require.main === module) {
  (async () => {
    const tester = new AuthEndpointTester();
    try {
      await tester.runComprehensiveTest();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = AuthEndpointTester;


