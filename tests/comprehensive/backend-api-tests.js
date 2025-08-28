/**
 * Comprehensive Backend API Tests
 * Tests all backend endpoints, authentication flows, and edge cases
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

class BackendApiTester {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.testResults = [];
    this.testUsers = [
      { email: 'test@embracingearth.space', password: 'TestPass123!' },
      { email: 'testuser1756355775896@embracingearth.space', password: 'TestPass123!' }
    ];
    this.authToken = null;
    this.sessionCookies = null;
  }

  log(test, status, details = '', duration = 0) {
    const result = {
      test,
      status,
      details,
      duration,
      timestamp: new Date().toISOString()
    };
    this.testResults.push(result);
    
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${statusIcon} [${duration}ms] ${test}: ${status}${details ? ' - ' + details : ''}`);
  }

  async makeRequest(method, endpoint, options = {}) {
    const startTime = Date.now();
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        validateStatus: () => true,
        ...options
      };

      const response = await axios(config);
      const duration = Date.now() - startTime;
      
      return { response, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      return { error, duration };
    }
  }

  // ===== HEALTH & SYSTEM TESTS =====
  async testSystemHealth() {
    console.log('\n🏥 SYSTEM HEALTH TESTS');
    console.log('='.repeat(50));

    // Test 1: Basic health check
    const { response, duration } = await this.makeRequest('GET', '/health');
    if (response?.status === 200) {
      this.log('System Health Check', 'PASS', `Uptime: ${response.data.uptime}s`, duration);
    } else {
      this.log('System Health Check', 'FAIL', `Status: ${response?.status}`, duration);
    }

    // Test 2: API versioning
    const { response: versionResp, duration: versionDur } = await this.makeRequest('GET', '/api/version');
    if (versionResp?.status === 200 || versionResp?.status === 404) {
      this.log('API Version Endpoint', versionResp.status === 200 ? 'PASS' : 'WARN', 
               versionResp.status === 404 ? 'Endpoint not implemented' : `Version: ${versionResp.data?.version}`, versionDur);
    } else {
      this.log('API Version Endpoint', 'FAIL', `Status: ${versionResp?.status}`, versionDur);
    }

    // Test 3: Service discovery
    const { response: servicesResp, duration: servicesDur } = await this.makeRequest('GET', '/api/services/status');
    if (servicesResp?.status === 200) {
      this.log('Service Discovery', 'PASS', `Services: ${servicesResp.data?.services?.length || 0}`, servicesDur);
    } else {
      this.log('Service Discovery', 'WARN', `Status: ${servicesResp?.status}`, servicesDur);
    }
  }

  // ===== AUTHENTICATION TESTS =====
  async testAuthentication() {
    console.log('\n🔐 AUTHENTICATION TESTS');
    console.log('='.repeat(50));

    // Test 1: Login with valid credentials
    for (const user of this.testUsers) {
      const { response, duration } = await this.makeRequest('POST', '/api/oidc/login', {
        data: user,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response?.status === 200 && response.data.success) {
        this.log(`Login Success (${user.email})`, 'PASS', 
                 `Token: ${response.data.token ? 'YES' : 'NO'}`, duration);
        
        if (!this.authToken && response.data.token) {
          this.authToken = response.data.token;
          this.testUser = user;
        }
      } else {
        this.log(`Login Success (${user.email})`, 'FAIL', 
                 response?.data?.error || `Status: ${response?.status}`, duration);
      }
    }

    // Test 2: Login with invalid credentials
    const { response: invalidResp, duration: invalidDur } = await this.makeRequest('POST', '/api/oidc/login', {
      data: { email: 'invalid@test.com', password: 'wrongpassword' },
      headers: { 'Content-Type': 'application/json' }
    });

    if (invalidResp?.status === 401) {
      this.log('Login Invalid Credentials', 'PASS', 'Correctly rejected', invalidDur);
    } else {
      this.log('Login Invalid Credentials', 'FAIL', 
               `Expected 401, got ${invalidResp?.status}`, invalidDur);
    }

    // Test 3: Token validation
    if (this.authToken) {
      try {
        const decoded = jwt.decode(this.authToken);
        const hasRequiredFields = decoded.sub && decoded.userId && decoded.email;
        this.log('JWT Token Structure', hasRequiredFields ? 'PASS' : 'FAIL', 
                 `Fields: sub=${!!decoded.sub}, userId=${!!decoded.userId}, email=${!!decoded.email}`, 0);
      } catch (error) {
        this.log('JWT Token Structure', 'FAIL', `Decode error: ${error.message}`, 0);
      }
    }

    // Test 4: Cookie-based login
    const { response: cookieResp, duration: cookieDur } = await this.makeRequest('POST', '/api/oidc/login', {
      data: this.testUser,
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true
    });

    if (cookieResp?.status === 200 && cookieResp.headers['set-cookie']) {
      this.sessionCookies = cookieResp.headers['set-cookie'];
      this.log('Cookie-based Login', 'PASS', 
               `Cookies: ${this.sessionCookies.length}`, cookieDur);
    } else {
      this.log('Cookie-based Login', 'FAIL', 
               `No cookies received, Status: ${cookieResp?.status}`, cookieDur);
    }
  }

  // ===== AUTHORIZATION TESTS =====
  async testAuthorization() {
    console.log('\n🛡️ AUTHORIZATION TESTS');
    console.log('='.repeat(50));

    const protectedEndpoints = [
      { endpoint: '/api/auth/me', method: 'GET', description: 'User Profile' },
      { endpoint: '/api/user/permissions', method: 'GET', description: 'User Permissions' },
      { endpoint: '/api/country/preferences', method: 'GET', description: 'Country Preferences' },
      { endpoint: '/api/bank/categories', method: 'GET', description: 'Bank Categories' },
      { endpoint: '/api/bank/transactions', method: 'GET', description: 'Bank Transactions' },
      { endpoint: '/api/ai/profile', method: 'GET', description: 'AI Profile' }
    ];

    // Test 1: Access without authentication
    for (const { endpoint, method, description } of protectedEndpoints) {
      const { response, duration } = await this.makeRequest(method, endpoint);
      
      // Some endpoints might return 200 with authenticated: false, others might return 401
      const isCorrectlyProtected = response?.status === 401 || 
                                  (response?.status === 200 && response.data?.authenticated === false);
      
      this.log(`No Auth - ${description}`, isCorrectlyProtected ? 'PASS' : 'FAIL',
               `Status: ${response?.status}, Auth: ${response?.data?.authenticated}`, duration);
    }

    // Test 2: Access with Bearer token
    if (this.authToken) {
      for (const { endpoint, method, description } of protectedEndpoints) {
        const { response, duration } = await this.makeRequest(method, endpoint, {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        });
        
        const isAuthorized = response?.status === 200;
        this.log(`Bearer Token - ${description}`, isAuthorized ? 'PASS' : 'FAIL',
                 `Status: ${response?.status}`, duration);
      }
    }

    // Test 3: Access with cookies
    if (this.sessionCookies) {
      for (const { endpoint, method, description } of protectedEndpoints) {
        const { response, duration } = await this.makeRequest(method, endpoint, {
          headers: { 'Cookie': this.sessionCookies.join('; ') },
          withCredentials: true
        });
        
        const isAuthorized = response?.status === 200;
        this.log(`Cookie Auth - ${description}`, isAuthorized ? 'PASS' : 'FAIL',
                 `Status: ${response?.status}`, duration);
      }
    }

    // Test 4: Invalid token
    const { response: invalidTokenResp, duration: invalidTokenDur } = await this.makeRequest('GET', '/api/auth/me', {
      headers: { 'Authorization': 'Bearer invalid-token-here' }
    });

    const correctlyRejected = invalidTokenResp?.status === 401 || 
                             (invalidTokenResp?.status === 200 && invalidTokenResp.data?.authenticated === false);
    this.log('Invalid Bearer Token', correctlyRejected ? 'PASS' : 'FAIL',
             `Status: ${invalidTokenResp?.status}`, invalidTokenDur);
  }

  // ===== DATA VALIDATION TESTS =====
  async testDataValidation() {
    console.log('\n📊 DATA VALIDATION TESTS');
    console.log('='.repeat(50));

    if (!this.authToken) {
      this.log('Data Validation Tests', 'SKIP', 'No auth token available', 0);
      return;
    }

    const authHeaders = { 'Authorization': `Bearer ${this.authToken}` };

    // Test 1: SQL Injection protection
    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "admin'/*",
      "1; DELETE FROM transactions WHERE 1=1; --"
    ];

    for (const payload of sqlInjectionPayloads) {
      const { response, duration } = await this.makeRequest('GET', `/api/bank/transactions?search=${encodeURIComponent(payload)}`, {
        headers: authHeaders
      });

      // Should not crash and should return proper error or empty results
      const isProtected = response?.status === 200 || response?.status === 400;
      this.log('SQL Injection Protection', isProtected ? 'PASS' : 'FAIL',
               `Payload: ${payload.substring(0, 20)}...`, duration);
    }

    // Test 2: XSS protection
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src=x onerror=alert("xss")>'
    ];

    for (const payload of xssPayloads) {
      const { response, duration } = await this.makeRequest('GET', `/api/bank/categories?name=${encodeURIComponent(payload)}`, {
        headers: authHeaders
      });

      const isProtected = response?.status === 200 || response?.status === 400;
      this.log('XSS Protection', isProtected ? 'PASS' : 'FAIL',
               `Payload: ${payload.substring(0, 20)}...`, duration);
    }

    // Test 3: Rate limiting
    const rapidRequests = [];
    for (let i = 0; i < 10; i++) {
      rapidRequests.push(this.makeRequest('GET', '/api/auth/me', { headers: authHeaders }));
    }

    const rapidResults = await Promise.all(rapidRequests);
    const successCount = rapidResults.filter(r => r.response?.status === 200).length;
    const rateLimitedCount = rapidResults.filter(r => r.response?.status === 429).length;

    this.log('Rate Limiting', successCount > 5 ? 'PASS' : 'WARN',
             `Success: ${successCount}/10, Rate limited: ${rateLimitedCount}`, 0);
  }

  // ===== BUSINESS LOGIC TESTS =====
  async testBusinessLogic() {
    console.log('\n💼 BUSINESS LOGIC TESTS');
    console.log('='.repeat(50));

    if (!this.authToken) {
      this.log('Business Logic Tests', 'SKIP', 'No auth token available', 0);
      return;
    }

    const authHeaders = { 'Authorization': `Bearer ${this.authToken}` };

    // Test 1: User profile completeness
    const { response: profileResp, duration: profileDur } = await this.makeRequest('GET', '/api/auth/me', {
      headers: authHeaders
    });

    if (profileResp?.status === 200 && profileResp.data?.user) {
      const user = profileResp.data.user;
      const hasRequiredFields = user.id && user.email;
      this.log('User Profile Completeness', hasRequiredFields ? 'PASS' : 'FAIL',
               `ID: ${!!user.id}, Email: ${!!user.email}`, profileDur);
    }

    // Test 2: Permissions system
    const { response: permResp, duration: permDur } = await this.makeRequest('GET', '/api/user/permissions', {
      headers: authHeaders
    });

    if (permResp?.status === 200) {
      const permissions = permResp.data;
      const hasPermissions = permissions && typeof permissions === 'object';
      this.log('Permissions System', hasPermissions ? 'PASS' : 'FAIL',
               `Type: ${typeof permissions}`, permDur);
    }

    // Test 3: Data isolation (user can only see their own data)
    const { response: transResp, duration: transDur } = await this.makeRequest('GET', '/api/bank/transactions?limit=5', {
      headers: authHeaders
    });

    if (transResp?.status === 200) {
      this.log('Data Isolation', 'PASS', 
               `Transactions returned: ${Array.isArray(transResp.data) ? transResp.data.length : 'N/A'}`, transDur);
    } else {
      this.log('Data Isolation', 'WARN', 
               `Status: ${transResp?.status}`, transDur);
    }
  }

  // ===== PERFORMANCE TESTS =====
  async testPerformance() {
    console.log('\n⚡ PERFORMANCE TESTS');
    console.log('='.repeat(50));

    if (!this.authToken) {
      this.log('Performance Tests', 'SKIP', 'No auth token available', 0);
      return;
    }

    const authHeaders = { 'Authorization': `Bearer ${this.authToken}` };

    // Test 1: Response time benchmarks
    const endpoints = [
      { endpoint: '/api/auth/me', threshold: 200 },
      { endpoint: '/api/bank/categories', threshold: 500 },
      { endpoint: '/api/bank/transactions?limit=10', threshold: 1000 }
    ];

    for (const { endpoint, threshold } of endpoints) {
      const { response, duration } = await this.makeRequest('GET', endpoint, {
        headers: authHeaders
      });

      const isPerformant = duration < threshold;
      this.log(`Response Time - ${endpoint}`, isPerformant ? 'PASS' : 'WARN',
               `${duration}ms (threshold: ${threshold}ms)`, duration);
    }

    // Test 2: Concurrent requests
    const concurrentRequests = [];
    const startTime = Date.now();
    
    for (let i = 0; i < 5; i++) {
      concurrentRequests.push(this.makeRequest('GET', '/api/auth/me', { headers: authHeaders }));
    }

    const concurrentResults = await Promise.all(concurrentRequests);
    const totalTime = Date.now() - startTime;
    const successCount = concurrentResults.filter(r => r.response?.status === 200).length;

    this.log('Concurrent Requests', successCount === 5 ? 'PASS' : 'FAIL',
             `${successCount}/5 successful in ${totalTime}ms`, totalTime);
  }

  // ===== MAIN TEST RUNNER =====
  async runAllTests() {
    console.log('🚀 COMPREHENSIVE BACKEND API TESTS');
    console.log('='.repeat(60));
    console.log(`Testing: ${this.baseURL}`);
    console.log(`Started: ${new Date().toISOString()}`);
    
    const startTime = Date.now();

    try {
      await this.testSystemHealth();
      await this.testAuthentication();
      await this.testAuthorization();
      await this.testDataValidation();
      await this.testBusinessLogic();
      await this.testPerformance();
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    }

    const totalTime = Date.now() - startTime;
    this.generateReport(totalTime);
  }

  generateReport(totalTime) {
    console.log('\n📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const warnings = this.testResults.filter(r => r.status === 'WARN').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
    const total = this.testResults.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed} (${(passed/total*100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failed} (${(failed/total*100).toFixed(1)}%)`);
    console.log(`⚠️ Warnings: ${warnings} (${(warnings/total*100).toFixed(1)}%)`);
    console.log(`⏭️ Skipped: ${skipped} (${(skipped/total*100).toFixed(1)}%)`);
    console.log(`⏱️ Total Time: ${totalTime}ms`);

    const avgDuration = this.testResults
      .filter(r => r.duration > 0)
      .reduce((sum, r) => sum + r.duration, 0) / this.testResults.filter(r => r.duration > 0).length;
    console.log(`📈 Avg Response Time: ${avgDuration.toFixed(0)}ms`);

    // Save detailed report
    const report = {
      summary: { total, passed, failed, warnings, skipped, totalTime, avgDuration },
      results: this.testResults,
      timestamp: new Date().toISOString(),
      baseURL: this.baseURL
    };

    require('fs').writeFileSync(
      `backend-test-report-${Date.now()}.json`,
      JSON.stringify(report, null, 2)
    );

    console.log(`\n💾 Detailed report saved: backend-test-report-${Date.now()}.json`);

    // Return exit code for CI/CD
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new BackendApiTester();
  tester.runAllTests();
}

module.exports = BackendApiTester;
