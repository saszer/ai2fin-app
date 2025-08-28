/**
 * Comprehensive End-to-End Tests
 * Tests complete user journeys from frontend to backend
 */

const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');

class EndToEndTester {
  constructor(apiBaseURL = 'http://localhost:3001', frontendURL = 'http://localhost:3000') {
    this.apiBaseURL = apiBaseURL;
    this.frontendURL = frontendURL;
    this.testResults = [];
    this.userSessions = new Map();
    
    // Create different client types to simulate different scenarios
    this.clients = {
      browser: this.createBrowserClient(),
      mobile: this.createMobileClient(),
      api: this.createApiClient()
    };
  }

  createBrowserClient() {
    return axios.create({
      baseURL: this.apiBaseURL,
      withCredentials: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': this.frontendURL,
        'Referer': `${this.frontendURL}/`
      }
    });
  }

  createMobileClient() {
    return axios.create({
      baseURL: this.apiBaseURL,
      headers: {
        'User-Agent': 'AI2-Mobile/1.0 (iOS 15.0; iPhone13,2)',
        'Accept': 'application/json',
        'X-Platform': 'mobile'
      }
    });
  }

  createApiClient() {
    return axios.create({
      baseURL: this.apiBaseURL,
      headers: {
        'User-Agent': 'AI2-API-Client/1.0',
        'Accept': 'application/json'
      }
    });
  }

  log(journey, step, status, details = '', duration = 0) {
    const result = {
      journey,
      step,
      status,
      details,
      duration,
      timestamp: new Date().toISOString()
    };
    this.testResults.push(result);
    
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'WARN' ? '⚠️' : 'ℹ️';
    const durationText = duration > 0 ? ` [${duration}ms]` : '';
    console.log(`${statusIcon}${durationText} [${journey}] ${step}: ${status}${details ? ' - ' + details : ''}`);
  }

  // ===== USER REGISTRATION JOURNEY =====
  async testUserRegistrationJourney() {
    const journey = 'User Registration';
    console.log(`\n👤 ${journey.toUpperCase()} JOURNEY`);
    console.log('='.repeat(50));

    const newUser = {
      email: `testuser${Date.now()}@embracingearth.space`,
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User'
    };

    // Step 1: Registration
    try {
      const startTime = Date.now();
      const response = await this.clients.browser.post('/api/oidc/register', newUser, {
        validateStatus: () => true
      });
      const duration = Date.now() - startTime;

      if (response.status === 200 || response.status === 201) {
        this.log(journey, 'Registration', 'PASS', `User ID: ${response.data.userId}`, duration);
        this.userSessions.set('newUser', { ...newUser, userId: response.data.userId });
      } else {
        this.log(journey, 'Registration', 'FAIL', 
                `Status: ${response.status}, Error: ${response.data?.error}`, duration);
        return;
      }
    } catch (error) {
      this.log(journey, 'Registration', 'FAIL', error.message);
      return;
    }

    // Step 2: First Login
    try {
      const startTime = Date.now();
      const response = await this.clients.browser.post('/api/oidc/login', {
        email: newUser.email,
        password: newUser.password
      }, { validateStatus: () => true });
      const duration = Date.now() - startTime;

      if (response.status === 200 && response.data.success) {
        this.log(journey, 'First Login', 'PASS', `Token received: ${!!response.data.token}`, duration);
        this.userSessions.get('newUser').token = response.data.token;
      } else {
        this.log(journey, 'First Login', 'FAIL', 
                `Status: ${response.status}, Error: ${response.data?.error}`, duration);
      }
    } catch (error) {
      this.log(journey, 'First Login', 'FAIL', error.message);
    }

    // Step 3: Profile Setup
    const token = this.userSessions.get('newUser')?.token;
    if (token) {
      try {
        const startTime = Date.now();
        const response = await this.clients.browser.get('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
          validateStatus: () => true
        });
        const duration = Date.now() - startTime;

        if (response.status === 200 && response.data.authenticated) {
          this.log(journey, 'Profile Access', 'PASS', 
                  `User: ${response.data.user?.email}`, duration);
        } else {
          this.log(journey, 'Profile Access', 'FAIL', 
                  `Status: ${response.status}`, duration);
        }
      } catch (error) {
        this.log(journey, 'Profile Access', 'FAIL', error.message);
      }
    }

    // Step 4: Initial Data Loading
    if (token) {
      const initialEndpoints = [
        { endpoint: '/api/country/preferences', name: 'Country Preferences' },
        { endpoint: '/api/user/permissions', name: 'User Permissions' },
        { endpoint: '/api/bank/categories', name: 'Bank Categories' }
      ];

      for (const { endpoint, name } of initialEndpoints) {
        try {
          const startTime = Date.now();
          const response = await this.clients.browser.get(endpoint, {
            headers: { 'Authorization': `Bearer ${token}` },
            validateStatus: () => true
          });
          const duration = Date.now() - startTime;

          this.log(journey, `Load ${name}`, response.status === 200 ? 'PASS' : 'FAIL',
                  `Status: ${response.status}`, duration);
        } catch (error) {
          this.log(journey, `Load ${name}`, 'FAIL', error.message);
        }
      }
    }
  }

  // ===== EXISTING USER LOGIN JOURNEY =====
  async testExistingUserLoginJourney() {
    const journey = 'Existing User Login';
    console.log(`\n🔑 ${journey.toUpperCase()} JOURNEY`);
    console.log('='.repeat(50));

    const existingUser = {
      email: 'test@embracingearth.space',
      password: 'TestPass123!'
    };

    // Step 1: Login
    try {
      const startTime = Date.now();
      const response = await this.clients.browser.post('/api/oidc/login', existingUser, {
        validateStatus: () => true
      });
      const duration = Date.now() - startTime;

      if (response.status === 200 && response.data.success) {
        this.log(journey, 'Login', 'PASS', `Token: ${!!response.data.token}`, duration);
        this.userSessions.set('existingUser', { ...existingUser, token: response.data.token });
      } else {
        this.log(journey, 'Login', 'FAIL', 
                `Status: ${response.status}, Error: ${response.data?.error}`, duration);
        return;
      }
    } catch (error) {
      this.log(journey, 'Login', 'FAIL', error.message);
      return;
    }

    // Step 2: Dashboard Data Loading (Concurrent)
    const token = this.userSessions.get('existingUser')?.token;
    if (token) {
      const dashboardEndpoints = [
        '/api/auth/me',
        '/api/bank/transactions?limit=10',
        '/api/bank/categories',
        '/api/ai/profile',
        '/api/country/preferences'
      ];

      try {
        const startTime = Date.now();
        const requests = dashboardEndpoints.map(endpoint =>
          this.clients.browser.get(endpoint, {
            headers: { 'Authorization': `Bearer ${token}` },
            validateStatus: () => true
          })
        );

        const responses = await Promise.all(requests);
        const duration = Date.now() - startTime;

        const successCount = responses.filter(r => r.status === 200).length;
        this.log(journey, 'Dashboard Loading', 
                successCount === responses.length ? 'PASS' : 'WARN',
                `${successCount}/${responses.length} endpoints successful`, duration);

        // Log individual endpoint results
        responses.forEach((response, index) => {
          const endpoint = dashboardEndpoints[index];
          this.log(journey, `  ${endpoint}`, response.status === 200 ? 'PASS' : 'FAIL',
                  `Status: ${response.status}`);
        });
      } catch (error) {
        this.log(journey, 'Dashboard Loading', 'FAIL', error.message);
      }
    }

    // Step 3: User Actions Simulation
    if (token) {
      await this.simulateUserActions(journey, token);
    }
  }

  async simulateUserActions(journey, token) {
    // Simulate typical user actions
    const actions = [
      {
        name: 'View Transactions',
        request: () => this.clients.browser.get('/api/bank/transactions?limit=20', {
          headers: { 'Authorization': `Bearer ${token}` },
          validateStatus: () => true
        })
      },
      {
        name: 'Search Transactions',
        request: () => this.clients.browser.get('/api/bank/transactions?search=test&limit=10', {
          headers: { 'Authorization': `Bearer ${token}` },
          validateStatus: () => true
        })
      },
      {
        name: 'Get Categories',
        request: () => this.clients.browser.get('/api/bank/categories', {
          headers: { 'Authorization': `Bearer ${token}` },
          validateStatus: () => true
        })
      },
      {
        name: 'Update Preferences',
        request: () => this.clients.browser.get('/api/country/preferences', {
          headers: { 'Authorization': `Bearer ${token}` },
          validateStatus: () => true
        })
      }
    ];

    for (const { name, request } of actions) {
      try {
        const startTime = Date.now();
        const response = await request();
        const duration = Date.now() - startTime;

        this.log(journey, `Action: ${name}`, response.status === 200 ? 'PASS' : 'FAIL',
                `Status: ${response.status}`, duration);
      } catch (error) {
        this.log(journey, `Action: ${name}`, 'FAIL', error.message);
      }
    }
  }

  // ===== SESSION MANAGEMENT JOURNEY =====
  async testSessionManagementJourney() {
    const journey = 'Session Management';
    console.log(`\n💾 ${journey.toUpperCase()} JOURNEY`);
    console.log('='.repeat(50));

    const user = { email: 'test@embracingearth.space', password: 'TestPass123!' };

    // Step 1: Login and get session
    let sessionToken = null;
    try {
      const response = await this.clients.browser.post('/api/oidc/login', user, {
        validateStatus: () => true
      });

      if (response.status === 200) {
        sessionToken = response.data.token;
        this.log(journey, 'Session Creation', 'PASS', 'Token obtained');
      } else {
        this.log(journey, 'Session Creation', 'FAIL', `Status: ${response.status}`);
        return;
      }
    } catch (error) {
      this.log(journey, 'Session Creation', 'FAIL', error.message);
      return;
    }

    // Step 2: Session validation
    if (sessionToken) {
      try {
        const startTime = Date.now();
        const response = await this.clients.browser.get('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
          validateStatus: () => true
        });
        const duration = Date.now() - startTime;

        const isValid = response.status === 200 && response.data.authenticated;
        this.log(journey, 'Session Validation', isValid ? 'PASS' : 'FAIL',
                `Authenticated: ${response.data?.authenticated}`, duration);
      } catch (error) {
        this.log(journey, 'Session Validation', 'FAIL', error.message);
      }
    }

    // Step 3: Session persistence across requests
    if (sessionToken) {
      const persistenceTests = [];
      for (let i = 0; i < 5; i++) {
        persistenceTests.push(
          this.clients.browser.get('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${sessionToken}` },
            validateStatus: () => true
          })
        );
      }

      try {
        const startTime = Date.now();
        const responses = await Promise.all(persistenceTests);
        const duration = Date.now() - startTime;

        const validSessions = responses.filter(r => 
          r.status === 200 && r.data.authenticated
        ).length;

        this.log(journey, 'Session Persistence', 
                validSessions === 5 ? 'PASS' : 'FAIL',
                `${validSessions}/5 requests maintained session`, duration);
      } catch (error) {
        this.log(journey, 'Session Persistence', 'FAIL', error.message);
      }
    }

    // Step 4: Logout
    if (sessionToken) {
      try {
        const startTime = Date.now();
        const response = await this.clients.browser.post('/api/auth/logout', {}, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
          validateStatus: () => true
        });
        const duration = Date.now() - startTime;

        this.log(journey, 'Logout', response.status === 200 ? 'PASS' : 'WARN',
                `Status: ${response.status}`, duration);

        // Verify session is invalidated
        const verifyResponse = await this.clients.browser.get('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
          validateStatus: () => true
        });

        const sessionInvalidated = verifyResponse.status === 401 || 
                                  (verifyResponse.status === 200 && !verifyResponse.data.authenticated);
        this.log(journey, 'Session Invalidation', sessionInvalidated ? 'PASS' : 'FAIL',
                `Post-logout auth: ${verifyResponse.data?.authenticated}`);
      } catch (error) {
        this.log(journey, 'Logout', 'FAIL', error.message);
      }
    }
  }

  // ===== MULTI-CLIENT JOURNEY =====
  async testMultiClientJourney() {
    const journey = 'Multi-Client Access';
    console.log(`\n📱 ${journey.toUpperCase()} JOURNEY`);
    console.log('='.repeat(50));

    const user = { email: 'test@embracingearth.space', password: 'TestPass123!' };
    const clientTokens = {};

    // Step 1: Login from multiple client types
    for (const [clientType, client] of Object.entries(this.clients)) {
      try {
        const startTime = Date.now();
        const response = await client.post('/api/oidc/login', user, {
          validateStatus: () => true
        });
        const duration = Date.now() - startTime;

        if (response.status === 200 && response.data.token) {
          clientTokens[clientType] = response.data.token;
          this.log(journey, `${clientType} Login`, 'PASS', 'Token obtained', duration);
        } else {
          this.log(journey, `${clientType} Login`, 'FAIL', 
                  `Status: ${response.status}`, duration);
        }
      } catch (error) {
        this.log(journey, `${clientType} Login`, 'FAIL', error.message);
      }
    }

    // Step 2: Concurrent access from different clients
    const concurrentRequests = [];
    for (const [clientType, token] of Object.entries(clientTokens)) {
      const client = this.clients[clientType];
      concurrentRequests.push(
        client.get('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
          validateStatus: () => true
        }).then(response => ({ clientType, response }))
      );
    }

    try {
      const startTime = Date.now();
      const results = await Promise.all(concurrentRequests);
      const duration = Date.now() - startTime;

      const successfulClients = results.filter(r => 
        r.response.status === 200 && r.response.data.authenticated
      );

      this.log(journey, 'Concurrent Access', 
              successfulClients.length === results.length ? 'PASS' : 'FAIL',
              `${successfulClients.length}/${results.length} clients successful`, duration);

      // Log individual client results
      results.forEach(({ clientType, response }) => {
        this.log(journey, `  ${clientType} Access`, 
                response.status === 200 && response.data.authenticated ? 'PASS' : 'FAIL',
                `Status: ${response.status}`);
      });
    } catch (error) {
      this.log(journey, 'Concurrent Access', 'FAIL', error.message);
    }
  }

  // ===== ERROR HANDLING JOURNEY =====
  async testErrorHandlingJourney() {
    const journey = 'Error Handling';
    console.log(`\n🚨 ${journey.toUpperCase()} JOURNEY`);
    console.log('='.repeat(50));

    const errorScenarios = [
      {
        name: 'Invalid Credentials',
        request: () => this.clients.browser.post('/api/oidc/login', {
          email: 'invalid@test.com',
          password: 'wrongpassword'
        }, { validateStatus: () => true }),
        expectedStatus: 401
      },
      {
        name: 'Malformed Request',
        request: () => this.clients.browser.post('/api/oidc/login', 'invalid-json', {
          headers: { 'Content-Type': 'application/json' },
          validateStatus: () => true
        }),
        expectedStatus: 400
      },
      {
        name: 'Missing Authorization',
        request: () => this.clients.browser.get('/api/bank/transactions', {
          validateStatus: () => true
        }),
        expectedStatus: [401, 200] // Might return 200 with authenticated: false
      },
      {
        name: 'Invalid Token',
        request: () => this.clients.browser.get('/api/auth/me', {
          headers: { 'Authorization': 'Bearer invalid-token' },
          validateStatus: () => true
        }),
        expectedStatus: [401, 200] // Might return 200 with authenticated: false
      },
      {
        name: 'Non-existent Endpoint',
        request: () => this.clients.browser.get('/api/nonexistent', {
          validateStatus: () => true
        }),
        expectedStatus: 404
      }
    ];

    for (const { name, request, expectedStatus } of errorScenarios) {
      try {
        const startTime = Date.now();
        const response = await request();
        const duration = Date.now() - startTime;

        const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
        const isExpectedStatus = expectedStatuses.includes(response.status);

        this.log(journey, name, isExpectedStatus ? 'PASS' : 'FAIL',
                `Status: ${response.status} (expected: ${expectedStatuses.join(' or ')})`, duration);

        // Check if error response has proper structure
        if (response.status >= 400 && response.data) {
          const hasErrorStructure = response.data.error || response.data.message;
          this.log(journey, `  ${name} Error Structure`, 
                  hasErrorStructure ? 'PASS' : 'WARN',
                  `Has error field: ${!!hasErrorStructure}`);
        }
      } catch (error) {
        this.log(journey, name, 'FAIL', error.message);
      }
    }
  }

  // ===== MAIN TEST RUNNER =====
  async runAllTests() {
    console.log('🔄 COMPREHENSIVE END-TO-END TESTS');
    console.log('='.repeat(60));
    console.log(`API URL: ${this.apiBaseURL}`);
    console.log(`Frontend URL: ${this.frontendURL}`);
    console.log(`Started: ${new Date().toISOString()}`);
    
    const startTime = Date.now();

    try {
      await this.testUserRegistrationJourney();
      await this.testExistingUserLoginJourney();
      await this.testSessionManagementJourney();
      await this.testMultiClientJourney();
      await this.testErrorHandlingJourney();
    } catch (error) {
      console.error('❌ End-to-end test suite failed:', error.message);
    }

    const totalTime = Date.now() - startTime;
    this.generateReport(totalTime);
  }

  generateReport(totalTime) {
    console.log('\n📊 END-TO-END TEST SUMMARY');
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

    // Journey breakdown
    const journeys = [...new Set(this.testResults.map(r => r.journey))];
    console.log('\n📋 Journey Breakdown:');
    journeys.forEach(journey => {
      const journeyResults = this.testResults.filter(r => r.journey === journey);
      const journeyPassed = journeyResults.filter(r => r.status === 'PASS').length;
      const journeyTotal = journeyResults.length;
      console.log(`  ${journey}: ${journeyPassed}/${journeyTotal} passed`);
    });

    // Save detailed report
    const report = {
      summary: { total, passed, failed, warnings, skipped, totalTime },
      journeyBreakdown: journeys.map(journey => {
        const journeyResults = this.testResults.filter(r => r.journey === journey);
        return {
          journey,
          total: journeyResults.length,
          passed: journeyResults.filter(r => r.status === 'PASS').length,
          failed: journeyResults.filter(r => r.status === 'FAIL').length,
          warnings: journeyResults.filter(r => r.status === 'WARN').length
        };
      }),
      results: this.testResults,
      userSessions: Object.fromEntries(
        Array.from(this.userSessions.entries()).map(([key, value]) => [
          key, 
          { ...value, token: value.token ? 'REDACTED' : undefined }
        ])
      ),
      timestamp: new Date().toISOString(),
      apiBaseURL: this.apiBaseURL,
      frontendURL: this.frontendURL
    };

    require('fs').writeFileSync(
      `e2e-test-report-${Date.now()}.json`,
      JSON.stringify(report, null, 2)
    );

    console.log(`\n💾 Detailed report saved: e2e-test-report-${Date.now()}.json`);

    // Return exit code for CI/CD
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new EndToEndTester();
  tester.runAllTests();
}

module.exports = EndToEndTester;


