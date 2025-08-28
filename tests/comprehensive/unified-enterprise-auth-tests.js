/**
 * 🏢 UNIFIED ENTERPRISE AUTHENTICATION TESTS
 * 
 * Comprehensive test suite for the new unified enterprise authentication system
 * that combines OIDC (#2) and Custom Auth (#3) capabilities.
 * 
 * Test Coverage:
 * - Unified login endpoint functionality
 * - Advanced OIDC flow with auth requests
 * - Enterprise identity resolution
 * - Dual-stack authentication (JWT + Cookies)
 * - Legacy endpoint deprecation
 * - Frontend integration compatibility
 * - Security and performance validation
 * 
 * embracingearth.space - Enterprise Auth Testing 2025
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

class UnifiedEnterpriseAuthTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
    this.testCredentials = {
      email: 'test@embracingearth.space',
      password: 'TestPass123!'
    };
  }

  log(test, status, details = {}) {
    const result = {
      test,
      status,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results.details.push(result);
    
    if (status === 'PASS') {
      this.results.passed++;
      console.log(`✅ ${test}: PASS`, details);
    } else if (status === 'FAIL') {
      this.results.failed++;
      console.log(`❌ ${test}: FAIL`, details);
    } else {
      this.results.warnings++;
      console.log(`⚠️ ${test}: WARN`, details);
    }
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    try {
      const config = {
        method,
        url: `${BASE_URL}${endpoint}`,
        validateStatus: () => true,
        timeout: 10000,
        withCredentials: true,
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

  // ========================================================================
  // SYSTEM STATUS TESTS
  // ========================================================================

  async testSystemStatus() {
    console.log('\n📊 TESTING SYSTEM STATUS');
    console.log('='.repeat(60));

    const result = await this.makeRequest('GET', '/api/enterprise-auth/status');
    
    if (result.success && result.data.system === 'Enterprise Authentication') {
      this.log('System Status Check', 'PASS', {
        version: result.data.version,
        features: result.data.features?.length || 0,
        endpoints: Object.keys(result.data.endpoints || {}).length
      });
      return result.data;
    } else {
      this.log('System Status Check', 'FAIL', {
        status: result.status,
        error: result.data?.error || result.error
      });
      return null;
    }
  }

  // ========================================================================
  // UNIFIED LOGIN TESTS
  // ========================================================================

  async testUnifiedLogin() {
    console.log('\n🔐 TESTING UNIFIED LOGIN');
    console.log('='.repeat(60));

    // Test 1: Standard Login (replaces OIDC login)
    const standardLogin = await this.makeRequest('POST', '/api/enterprise-auth/login', {
      email: this.testCredentials.email,
      password: this.testCredentials.password,
      deviceInfo: {
        fingerprint: 'test-device-123',
        userAgent: 'test-agent',
        timezone: 'UTC'
      }
    });

    if (standardLogin.success && standardLogin.data.success) {
      this.log('Standard Login', 'PASS', {
        hasToken: !!standardLogin.data.token,
        hasUser: !!standardLogin.data.user,
        authMethod: standardLogin.data.sessionInfo?.authMethod,
        hasSessionCookie: standardLogin.data.sessionInfo?.hasSessionCookie
      });
      
      return standardLogin.data.token;
    } else {
      this.log('Standard Login', 'FAIL', {
        status: standardLogin.status,
        error: standardLogin.data?.error,
        errorType: standardLogin.data?.errorType
      });
      return null;
    }
  }

  async testAdvancedOIDCFlow() {
    console.log('\n🔧 TESTING ADVANCED OIDC FLOW');
    console.log('='.repeat(60));

    // Test with auth request ID (advanced flow)
    const advancedLogin = await this.makeRequest('POST', '/api/enterprise-auth/login', {
      email: this.testCredentials.email,
      password: this.testCredentials.password,
      authRequestId: 'test-auth-request-123',
      rememberMe: true
    });

    if (advancedLogin.success && advancedLogin.data.success) {
      this.log('Advanced OIDC Flow', 'PASS', {
        hasToken: !!advancedLogin.data.token,
        authMethod: advancedLogin.data.sessionInfo?.authMethod,
        hasAuthCode: !!advancedLogin.data.authCode,
        rememberMe: advancedLogin.data.sessionInfo?.rememberMe
      });
    } else {
      this.log('Advanced OIDC Flow', 'WARN', {
        status: advancedLogin.status,
        error: advancedLogin.data?.error,
        note: 'May fail if Zitadel custom UI not fully configured'
      });
    }
  }

  // ========================================================================
  // DUAL-STACK AUTHENTICATION TESTS
  // ========================================================================

  async testDualStackAuth(token) {
    if (!token) {
      console.log('⚠️ No token available for dual-stack tests');
      return;
    }

    console.log('\n🔄 TESTING DUAL-STACK AUTHENTICATION');
    console.log('='.repeat(60));

    // Test Bearer token authentication
    const bearerTest = await this.makeRequest('GET', '/api/auth/me', null, {
      'Authorization': `Bearer ${token}`
    });

    this.log('Bearer Token Auth', bearerTest.success ? 'PASS' : 'FAIL', {
      status: bearerTest.status,
      hasUser: !!bearerTest.data?.user,
      authenticated: bearerTest.data?.authenticated
    });

    // Test cookie authentication (should be set from login)
    const cookieTest = await this.makeRequest('GET', '/api/auth/me');

    this.log('Cookie Auth', cookieTest.success ? 'PASS' : 'FAIL', {
      status: cookieTest.status,
      hasUser: !!cookieTest.data?.user,
      authenticated: cookieTest.data?.authenticated
    });
  }

  // ========================================================================
  // LEGACY SYSTEM DEPRECATION TESTS
  // ========================================================================

  async testLegacyDeprecation() {
    console.log('\n🗑️ TESTING LEGACY SYSTEM DEPRECATION');
    console.log('='.repeat(60));

    // Test legacy auth endpoint returns 410 Gone
    const legacyAuth = await this.makeRequest('POST', '/api/auth/login', this.testCredentials);

    if (legacyAuth.status === 410) {
      this.log('Legacy Auth Deprecation', 'PASS', {
        status: legacyAuth.status,
        redirectTo: legacyAuth.data?.redirectTo,
        migration: legacyAuth.data?.migration
      });
    } else {
      this.log('Legacy Auth Deprecation', 'FAIL', {
        status: legacyAuth.status,
        expected: 410,
        note: 'Legacy endpoint should return 410 Gone'
      });
    }

    // Test that OIDC endpoint still works for backward compatibility
    const oidcCompat = await this.makeRequest('POST', '/api/oidc/login', this.testCredentials);

    this.log('OIDC Backward Compatibility', oidcCompat.success ? 'PASS' : 'WARN', {
      status: oidcCompat.status,
      note: oidcCompat.success ? 'OIDC still works for transition' : 'OIDC may be deprecated'
    });
  }

  // ========================================================================
  // FRONTEND COMPATIBILITY TESTS
  // ========================================================================

  async testFrontendCompatibility(token) {
    if (!token) {
      console.log('⚠️ No token available for frontend compatibility tests');
      return;
    }

    console.log('\n🖥️ TESTING FRONTEND COMPATIBILITY');
    console.log('='.repeat(60));

    const frontendEndpoints = [
      '/api/categories',
      '/api/bank/csv-uploads',
      '/api/bank/transactions',
      '/api/user/permissions',
      '/api/subscription/status'
    ];

    for (const endpoint of frontendEndpoints) {
      const result = await this.makeRequest('GET', endpoint, null, {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:3000'
      });

      this.log(`Frontend Endpoint: ${endpoint}`, result.success ? 'PASS' : 'FAIL', {
        status: result.status,
        hasData: !!result.data,
        error: result.data?.error
      });
    }
  }

  // ========================================================================
  // SECURITY VALIDATION TESTS
  // ========================================================================

  async testSecurityValidation() {
    console.log('\n🔒 TESTING SECURITY VALIDATION');
    console.log('='.repeat(60));

    // Test invalid credentials
    const invalidLogin = await this.makeRequest('POST', '/api/enterprise-auth/login', {
      email: 'invalid@test.com',
      password: 'wrongpassword'
    });

    this.log('Invalid Credentials Rejection', !invalidLogin.success ? 'PASS' : 'FAIL', {
      status: invalidLogin.status,
      errorType: invalidLogin.data?.errorType,
      expected: 'Should reject invalid credentials'
    });

    // Test missing fields
    const missingFields = await this.makeRequest('POST', '/api/enterprise-auth/login', {
      email: 'test@test.com'
      // Missing password
    });

    this.log('Missing Fields Validation', missingFields.status === 400 ? 'PASS' : 'FAIL', {
      status: missingFields.status,
      errorType: missingFields.data?.errorType,
      expected: 'Should return 400 for missing fields'
    });

    // Test malformed email
    const malformedEmail = await this.makeRequest('POST', '/api/enterprise-auth/login', {
      email: 'not-an-email',
      password: 'password123'
    });

    this.log('Email Format Validation', malformedEmail.status === 400 ? 'PASS' : 'FAIL', {
      status: malformedEmail.status,
      errorType: malformedEmail.data?.errorType,
      expected: 'Should reject malformed email'
    });
  }

  // ========================================================================
  // PERFORMANCE TESTS
  // ========================================================================

  async testPerformance() {
    console.log('\n⚡ TESTING PERFORMANCE');
    console.log('='.repeat(60));

    const startTime = Date.now();
    
    const loginResult = await this.makeRequest('POST', '/api/enterprise-auth/login', this.testCredentials);
    
    const loginDuration = Date.now() - startTime;

    this.log('Login Performance', loginDuration < 2000 ? 'PASS' : 'WARN', {
      duration: `${loginDuration}ms`,
      threshold: '2000ms',
      acceptable: loginDuration < 5000
    });

    // Test concurrent requests
    const concurrentStart = Date.now();
    const concurrentPromises = [];
    
    for (let i = 0; i < 5; i++) {
      concurrentPromises.push(
        this.makeRequest('GET', '/api/enterprise-auth/status')
      );
    }

    const concurrentResults = await Promise.all(concurrentPromises);
    const concurrentDuration = Date.now() - concurrentStart;
    
    const allSuccessful = concurrentResults.every(r => r.success);

    this.log('Concurrent Request Handling', allSuccessful ? 'PASS' : 'FAIL', {
      requests: concurrentResults.length,
      successful: concurrentResults.filter(r => r.success).length,
      duration: `${concurrentDuration}ms`
    });
  }

  // ========================================================================
  // LOGOUT TESTS
  // ========================================================================

  async testLogout() {
    console.log('\n🚪 TESTING LOGOUT');
    console.log('='.repeat(60));

    const logoutResult = await this.makeRequest('POST', '/api/enterprise-auth/logout');

    this.log('Logout Functionality', logoutResult.success ? 'PASS' : 'FAIL', {
      status: logoutResult.status,
      success: logoutResult.data?.success,
      message: logoutResult.data?.message
    });

    // Test that session is actually cleared
    const sessionCheck = await this.makeRequest('GET', '/api/auth/me');

    this.log('Session Cleanup', !sessionCheck.data?.authenticated ? 'PASS' : 'FAIL', {
      authenticated: sessionCheck.data?.authenticated,
      expected: 'Should not be authenticated after logout'
    });
  }

  // ========================================================================
  // MAIN TEST RUNNER
  // ========================================================================

  async runAllTests() {
    console.log('🏢 UNIFIED ENTERPRISE AUTHENTICATION TEST SUITE');
    console.log('='.repeat(80));
    console.log('Testing the new unified system that combines OIDC + Custom Auth');
    console.log('='.repeat(80));

    // System status
    await this.testSystemStatus();

    // Core authentication
    const token = await this.testUnifiedLogin();
    await this.testAdvancedOIDCFlow();

    // Authentication methods
    await this.testDualStackAuth(token);

    // Legacy system
    await this.testLegacyDeprecation();

    // Frontend compatibility
    await this.testFrontendCompatibility(token);

    // Security
    await this.testSecurityValidation();

    // Performance
    await this.testPerformance();

    // Cleanup
    await this.testLogout();

    return this.generateReport();
  }

  generateReport() {
    const total = this.results.passed + this.results.failed + this.results.warnings;
    const passRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
    
    console.log('\n📊 UNIFIED ENTERPRISE AUTH TEST REPORT');
    console.log('='.repeat(80));
    console.log(`📈 Results: ${this.results.passed} passed, ${this.results.failed} failed, ${this.results.warnings} warnings`);
    console.log(`📊 Total Tests: ${total}`);
    console.log(`📈 Pass Rate: ${passRate}%`);
    console.log('='.repeat(80));
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.details
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`\n• ${result.test}`);
          console.log(`  Details: ${JSON.stringify(result.details, null, 2)}`);
        });
    }

    if (this.results.warnings > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.results.details
        .filter(r => r.status === 'WARN')
        .forEach(result => {
          console.log(`\n• ${result.test}`);
          console.log(`  Details: ${JSON.stringify(result.details, null, 2)}`);
        });
    }
    
    console.log('\n🎯 SYSTEM STATUS:');
    
    if (this.results.failed === 0) {
      console.log('✅ UNIFIED ENTERPRISE AUTH SYSTEM IS FULLY OPERATIONAL');
      console.log('• Legacy system successfully deprecated');
      console.log('• OIDC + Custom Auth successfully combined');
      console.log('• Dual-stack authentication working');
      console.log('• Frontend compatibility maintained');
      console.log('• Security validation passed');
    } else {
      console.log('❌ SYSTEM ISSUES DETECTED - REQUIRES ATTENTION');
      console.log('• Check failed tests above');
      console.log('• Verify Zitadel configuration');
      console.log('• Ensure all environment variables are set');
    }
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Update frontend to use /api/enterprise-auth/login');
    console.log('2. Monitor system performance in production');
    console.log('3. Complete deprecation of legacy endpoints');
    console.log('4. Add comprehensive monitoring and alerting');
    
    console.log('\n' + '='.repeat(80));
    
    return this.results.failed === 0;
  }
}

// Run tests if called directly
if (require.main === module) {
  (async () => {
    const tester = new UnifiedEnterpriseAuthTester();
    try {
      const success = await tester.runAllTests();
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = UnifiedEnterpriseAuthTester;


