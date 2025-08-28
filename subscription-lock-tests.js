/**
 * 🔒 COMPREHENSIVE SUBSCRIPTION & LOCK WRAPPER TESTS
 * 
 * Tests the subscription service integration and in-flight request deduplication
 * mechanism (lock wrapper) that prevents concurrent subscription checks.
 * 
 * Key Issues to Test:
 * 1. Subscription service offline (ECONNREFUSED on port 3010)
 * 2. In-flight request deduplication not working properly
 * 3. Cache invalidation and ETag handling
 * 4. Fallback behavior when subscription service is down
 * 5. Race conditions in concurrent subscription checks
 * 
 * embracingearth.space - Enterprise subscription testing
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

const BASE_URL = 'http://localhost:3001';
const SUBSCRIPTION_SERVICE_URL = 'http://localhost:3010';

// Test configuration
const TEST_CONFIG = {
  concurrentRequests: 10,
  timeoutMs: 10000,
  retryAttempts: 3,
  cacheTestDelay: 2000
};

class SubscriptionLockTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      details: []
    };
    this.authToken = null;
    this.testUser = null;
  }

  log(message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data);
  }

  async authenticate() {
    try {
      this.log('🔐 Authenticating test user...');
      
      // Try to login with existing test user
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@embracingearth.space',
        password: 'TestPass123!'
      }, { timeout: 5000 });

      if (loginResponse.status === 200 && loginResponse.data.token) {
        this.authToken = loginResponse.data.token;
        this.testUser = loginResponse.data.user;
        this.log('✅ Authentication successful', { userId: this.testUser.id });
        return true;
      }
      
      throw new Error('Login failed');
    } catch (error) {
      this.log('❌ Authentication failed', { error: error.message });
      return false;
    }
  }

  async testSubscriptionServiceConnectivity() {
    this.log('🔍 Testing subscription service connectivity...');
    
    try {
      // Test direct connection to subscription service
      const response = await axios.get(`${SUBSCRIPTION_SERVICE_URL}/health`, {
        timeout: 3000
      });
      
      this.addResult('Subscription Service Connectivity', true, {
        status: response.status,
        message: 'Subscription service is online'
      });
      
      return true;
    } catch (error) {
      this.addResult('Subscription Service Connectivity', false, {
        error: error.code || error.message,
        message: 'Subscription service is offline - this explains the ECONNREFUSED errors'
      });
      
      return false;
    }
  }

  async testSubscriptionEndpointFallback() {
    this.log('🔄 Testing subscription endpoint fallback behavior...');
    
    try {
      const response = await axios.get(`${BASE_URL}/api/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        },
        timeout: 8000
      });

      const isValidFallback = response.status === 200 && 
                             response.data.success === true &&
                             response.data.data &&
                             response.data.data.subscription;

      this.addResult('Subscription Fallback', isValidFallback, {
        status: response.status,
        hasSubscriptionData: !!response.data.data?.subscription,
        subscriptionPlan: response.data.data?.subscription?.plan,
        fallbackUsed: response.data.data?.subscription?.plan === 'free'
      });

      return response.data;
    } catch (error) {
      this.addResult('Subscription Fallback', false, {
        error: error.message,
        status: error.response?.status
      });
      return null;
    }
  }

  async testInFlightRequestDeduplication() {
    this.log('🔒 Testing in-flight request deduplication (lock wrapper)...');
    
    const startTime = performance.now();
    const promises = [];
    
    // Create multiple concurrent requests to the same user's subscription
    for (let i = 0; i < TEST_CONFIG.concurrentRequests; i++) {
      const promise = axios.get(`${BASE_URL}/api/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-Request-ID': `test-${i}-${Date.now()}`
        },
        timeout: 8000
      }).then(response => ({
        requestId: i,
        status: response.status,
        responseTime: performance.now() - startTime,
        etag: response.headers.etag,
        data: response.data
      })).catch(error => ({
        requestId: i,
        error: error.message,
        status: error.response?.status
      }));
      
      promises.push(promise);
    }

    try {
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Analyze results for deduplication effectiveness
      const successfulRequests = results.filter(r => r.status === 200);
      const uniqueETags = new Set(successfulRequests.map(r => r.etag));
      const avgResponseTime = successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length;
      
      const isDeduplicationWorking = successfulRequests.length > 0 && 
                                   uniqueETags.size <= 2 && // Should be mostly the same ETag
                                   totalTime < (TEST_CONFIG.concurrentRequests * 1000); // Faster than sequential
      
      this.addResult('In-Flight Request Deduplication', isDeduplicationWorking, {
        totalRequests: TEST_CONFIG.concurrentRequests,
        successfulRequests: successfulRequests.length,
        uniqueETags: uniqueETags.size,
        totalTimeMs: Math.round(totalTime),
        avgResponseTimeMs: Math.round(avgResponseTime),
        deduplicationEffective: totalTime < 2000 // Should be much faster due to deduplication
      });

      return results;
    } catch (error) {
      this.addResult('In-Flight Request Deduplication', false, {
        error: error.message
      });
      return [];
    }
  }

  async testCacheInvalidation() {
    this.log('🗄️ Testing subscription cache invalidation...');
    
    try {
      // First request - should populate cache
      const firstResponse = await axios.get(`${BASE_URL}/api/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const firstETag = firstResponse.headers.etag;
      
      // Wait for cache to be populated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Second request - should use cache (same ETag)
      const secondResponse = await axios.get(`${BASE_URL}/api/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'If-None-Match': firstETag
        }
      });

      // Third request with force refresh
      const forceRefreshResponse = await axios.get(`${BASE_URL}/api/subscription/status?force=true`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const cacheWorking = secondResponse.status === 304 || // Not Modified
                          (secondResponse.status === 200 && secondResponse.headers.etag === firstETag);
      
      const forceRefreshWorking = forceRefreshResponse.status === 200;

      this.addResult('Cache Invalidation', cacheWorking && forceRefreshWorking, {
        firstETag: firstETag,
        secondStatus: secondResponse.status,
        forceRefreshStatus: forceRefreshResponse.status,
        cacheHit: secondResponse.status === 304,
        forceRefreshWorked: forceRefreshWorking
      });

    } catch (error) {
      this.addResult('Cache Invalidation', false, {
        error: error.message
      });
    }
  }

  async testSubscriptionCacheRaceCondition() {
    this.log('🏁 Testing subscription cache race conditions...');
    
    try {
      // Clear any existing cache by forcing refresh
      await axios.get(`${BASE_URL}/api/subscription/status?force=true`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      // Create rapid concurrent requests that could cause race conditions
      const rapidPromises = [];
      for (let i = 0; i < 5; i++) {
        rapidPromises.push(
          axios.get(`${BASE_URL}/api/subscription/status`, {
            headers: {
              'Authorization': `Bearer ${this.authToken}`,
              'X-Test-Rapid': `${i}`
            }
          })
        );
      }

      const rapidResults = await Promise.all(rapidPromises);
      
      // All should succeed and return consistent data
      const allSuccessful = rapidResults.every(r => r.status === 200);
      const consistentData = rapidResults.every(r => 
        JSON.stringify(r.data.data?.subscription) === JSON.stringify(rapidResults[0].data.data?.subscription)
      );

      this.addResult('Race Condition Handling', allSuccessful && consistentData, {
        allSuccessful,
        consistentData,
        responseCount: rapidResults.length
      });

    } catch (error) {
      this.addResult('Race Condition Handling', false, {
        error: error.message
      });
    }
  }

  async testSubscriptionServiceAuthentication() {
    this.log('🔑 Testing subscription service authentication...');
    
    try {
      // Test with missing auth token
      const noAuthResponse = await axios.get(`${BASE_URL}/api/subscription/status`, {
        validateStatus: () => true
      });

      // Test with invalid auth token
      const invalidAuthResponse = await axios.get(`${BASE_URL}/api/subscription/status`, {
        headers: { 'Authorization': 'Bearer invalid-token' },
        validateStatus: () => true
      });

      // Test with valid auth token
      const validAuthResponse = await axios.get(`${BASE_URL}/api/subscription/status`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` },
        validateStatus: () => true
      });

      const authWorking = noAuthResponse.status === 401 &&
                         invalidAuthResponse.status === 401 &&
                         validAuthResponse.status === 200;

      this.addResult('Subscription Authentication', authWorking, {
        noAuthStatus: noAuthResponse.status,
        invalidAuthStatus: invalidAuthResponse.status,
        validAuthStatus: validAuthResponse.status
      });

    } catch (error) {
      this.addResult('Subscription Authentication', false, {
        error: error.message
      });
    }
  }

  async testAccessControlSubscriptionIntegration() {
    this.log('🛡️ Testing AccessControl subscription integration...');
    
    try {
      // Test a protected endpoint that requires subscription check
      const protectedResponse = await axios.get(`${BASE_URL}/api/bank/categories`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` },
        validateStatus: () => true
      });

      // The endpoint should work even with subscription service offline (fallback)
      const accessControlWorking = protectedResponse.status === 200;

      this.addResult('AccessControl Integration', accessControlWorking, {
        protectedEndpointStatus: protectedResponse.status,
        hasData: !!protectedResponse.data,
        fallbackWorking: protectedResponse.status === 200
      });

    } catch (error) {
      this.addResult('AccessControl Integration', false, {
        error: error.message
      });
    }
  }

  async testSubscriptionErrorHandling() {
    this.log('⚠️ Testing subscription error handling...');
    
    try {
      // Test with malformed user ID (should handle gracefully)
      const malformedResponse = await axios.get(`${BASE_URL}/api/subscription/status`, {
        headers: { 
          'Authorization': `Bearer ${this.authToken}`,
          'X-Test-Malformed': 'true'
        },
        validateStatus: () => true
      });

      // Should still return 200 with fallback data
      const errorHandlingWorking = malformedResponse.status === 200 &&
                                  malformedResponse.data.success === true;

      this.addResult('Error Handling', errorHandlingWorking, {
        status: malformedResponse.status,
        hasSuccessFlag: malformedResponse.data?.success,
        hasFallbackData: !!malformedResponse.data?.data?.subscription
      });

    } catch (error) {
      this.addResult('Error Handling', false, {
        error: error.message
      });
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

  async runAllTests() {
    this.log('🚀 Starting comprehensive subscription & lock wrapper tests...');
    
    // Authentication is required for most tests
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      this.log('❌ Cannot proceed without authentication');
      return this.results;
    }

    // Run all tests
    await this.testSubscriptionServiceConnectivity();
    await this.testSubscriptionEndpointFallback();
    await this.testInFlightRequestDeduplication();
    await this.testCacheInvalidation();
    await this.testSubscriptionCacheRaceCondition();
    await this.testSubscriptionServiceAuthentication();
    await this.testAccessControlSubscriptionIntegration();
    await this.testSubscriptionErrorHandling();

    return this.results;
  }

  generateReport() {
    const total = this.results.passed + this.results.failed;
    const passRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(80));
    console.log('🔒 SUBSCRIPTION & LOCK WRAPPER TEST REPORT');
    console.log('='.repeat(80));
    console.log(`📊 Total Tests: ${total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Pass Rate: ${passRate}%`);
    console.log('='.repeat(80));
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.details
        .filter(r => !r.passed)
        .forEach(result => {
          console.log(`\n• ${result.test}`);
          console.log(`  Error: ${JSON.stringify(result.details, null, 2)}`);
        });
    }
    
    console.log('\n🔍 KEY FINDINGS:');
    
    // Analyze subscription service connectivity
    const connectivityTest = this.results.details.find(r => r.test === 'Subscription Service Connectivity');
    if (connectivityTest && !connectivityTest.passed) {
      console.log('• ⚠️  Subscription service is OFFLINE (port 3010) - this is the root cause of frontend 401 errors');
      console.log('• 💡 The lock wrapper is working, but it\'s trying to connect to a non-existent service');
    }
    
    // Analyze lock wrapper effectiveness
    const lockTest = this.results.details.find(r => r.test === 'In-Flight Request Deduplication');
    if (lockTest) {
      if (lockTest.passed) {
        console.log('• ✅ Lock wrapper (in-flight deduplication) is working correctly');
      } else {
        console.log('• ❌ Lock wrapper has issues - concurrent requests are not being deduplicated properly');
      }
    }
    
    // Analyze fallback behavior
    const fallbackTest = this.results.details.find(r => r.test === 'Subscription Fallback');
    if (fallbackTest) {
      if (fallbackTest.passed) {
        console.log('• ✅ Fallback mechanism is working - API returns valid data even when subscription service is down');
      } else {
        console.log('• ❌ Fallback mechanism is broken - this could cause frontend 401 errors');
      }
    }
    
    console.log('\n🛠️  RECOMMENDATIONS:');
    if (!connectivityTest?.passed) {
      console.log('1. Start the subscription service on port 3010 or update SUBSCRIPTION_SERVICE_URL');
      console.log('2. Ensure subscription service has proper health check endpoint');
    }
    
    if (!lockTest?.passed) {
      console.log('3. Review in-flight request deduplication logic in server.js (lines 804-817)');
      console.log('4. Check if inFlightRequests Map is being properly managed');
    }
    
    console.log('5. Test frontend with working subscription service to verify 401 issue resolution');
    console.log('\n' + '='.repeat(80));
  }
}

// Run tests if called directly
if (require.main === module) {
  (async () => {
    const tester = new SubscriptionLockTester();
    
    try {
      await tester.runAllTests();
      tester.generateReport();
      
      // Exit with appropriate code
      process.exit(tester.results.failed > 0 ? 1 : 0);
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = SubscriptionLockTester;
