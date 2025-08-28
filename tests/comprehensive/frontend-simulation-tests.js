/**
 * Comprehensive Frontend Simulation Tests
 * Simulates real browser behavior, localStorage, cookies, and React app flows
 */

const axios = require('axios');
const { JSDOM } = require('jsdom');

class FrontendSimulationTester {
  constructor(apiBaseURL = 'http://localhost:3001', frontendURL = 'http://localhost:3000') {
    this.apiBaseURL = apiBaseURL;
    this.frontendURL = frontendURL;
    this.testResults = [];
    this.browserState = {
      localStorage: new Map(),
      sessionStorage: new Map(),
      cookies: new Map(),
      headers: {}
    };
    
    // Create axios instance that mimics browser behavior
    this.browserClient = axios.create({
      baseURL: apiBaseURL,
      withCredentials: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site'
      }
    });

    this.setupBrowserInterceptors();
  }

  setupBrowserInterceptors() {
    // Request interceptor - mimics frontend behavior
    this.browserClient.interceptors.request.use((config) => {
      // Add Origin header like browser would
      config.headers['Origin'] = this.frontendURL;
      config.headers['Referer'] = `${this.frontendURL}/`;
      
      // Add auth token from "localStorage" if available
      const token = this.browserState.localStorage.get('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        this.log(`Request Interceptor: Added token to ${config.url}`, 'INFO');
      } else {
        this.log(`Request Interceptor: No token for ${config.url}`, 'WARN');
      }
      
      // Add CSRF token for state-changing requests
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase())) {
        const csrfToken = this.browserState.cookies.get('ai2_csrf');
        if (csrfToken) {
          config.headers['x-csrf-token'] = csrfToken;
        }
      }
      
      // Add cookies
      const cookieString = Array.from(this.browserState.cookies.entries())
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
      if (cookieString) {
        config.headers['Cookie'] = cookieString;
      }
      
      return config;
    });

    // Response interceptor - mimics browser cookie handling
    this.browserClient.interceptors.response.use((response) => {
      // Handle set-cookie headers
      const setCookies = response.headers['set-cookie'];
      if (setCookies) {
        setCookies.forEach(cookie => {
          const [cookiePair] = cookie.split(';');
          const [key, value] = cookiePair.split('=');
          this.browserState.cookies.set(key.trim(), value?.trim() || '');
        });
      }
      return response;
    }, (error) => {
      return Promise.reject(error);
    });
  }

  log(message, type = 'INFO', duration = 0) {
    const result = {
      message,
      type,
      duration,
      timestamp: new Date().toISOString(),
      browserState: {
        hasToken: this.browserState.localStorage.has('token'),
        cookieCount: this.browserState.cookies.size
      }
    };
    this.testResults.push(result);
    
    const icon = type === 'PASS' ? '✅' : type === 'FAIL' ? '❌' : type === 'WARN' ? '⚠️' : 'ℹ️';
    const durationText = duration > 0 ? ` [${duration}ms]` : '';
    console.log(`${icon}${durationText} ${message}`);
  }

  // ===== BROWSER ENVIRONMENT SIMULATION =====
  async testBrowserEnvironment() {
    console.log('\n🌐 BROWSER ENVIRONMENT SIMULATION');
    console.log('='.repeat(50));

    // Test 1: CORS preflight
    try {
      const startTime = Date.now();
      const response = await axios.options(`${this.apiBaseURL}/api/auth/me`, {
        headers: {
          'Origin': this.frontendURL,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization,content-type'
        },
        validateStatus: () => true
      });
      const duration = Date.now() - startTime;

      const corsHeaders = {
        origin: response.headers['access-control-allow-origin'],
        credentials: response.headers['access-control-allow-credentials'],
        methods: response.headers['access-control-allow-methods'],
        headers: response.headers['access-control-allow-headers']
      };

      const isValidCors = corsHeaders.origin && corsHeaders.credentials === 'true';
      this.log(`CORS Preflight: ${response.status}`, isValidCors ? 'PASS' : 'FAIL', duration);
      this.log(`CORS Headers: ${JSON.stringify(corsHeaders)}`, 'INFO');
    } catch (error) {
      this.log(`CORS Preflight Error: ${error.message}`, 'FAIL');
    }

    // Test 2: Browser-like request headers
    try {
      const startTime = Date.now();
      const response = await this.browserClient.get('/health', { validateStatus: () => true });
      const duration = Date.now() - startTime;
      
      this.log(`Browser Headers Test: ${response.status}`, response.status === 200 ? 'PASS' : 'FAIL', duration);
    } catch (error) {
      this.log(`Browser Headers Error: ${error.message}`, 'FAIL');
    }
  }

  // ===== AUTHENTICATION FLOW SIMULATION =====
  async testAuthenticationFlow() {
    console.log('\n🔐 AUTHENTICATION FLOW SIMULATION');
    console.log('='.repeat(50));

    // Test 1: Initial unauthenticated state
    try {
      const startTime = Date.now();
      const response = await this.browserClient.get('/api/auth/me', { validateStatus: () => true });
      const duration = Date.now() - startTime;
      
      const isUnauthenticated = response.status === 200 && response.data.authenticated === false;
      this.log('Initial Unauthenticated State', isUnauthenticated ? 'PASS' : 'FAIL', duration);
    } catch (error) {
      this.log(`Initial Auth Check Error: ${error.message}`, 'FAIL');
    }

    // Test 2: Login simulation
    const testUser = { email: 'test@embracingearth.space', password: 'TestPass123!' };
    
    try {
      const startTime = Date.now();
      const response = await this.browserClient.post('/api/oidc/login', testUser, { validateStatus: () => true });
      const duration = Date.now() - startTime;
      
      if (response.status === 200 && response.data.success) {
        // Simulate localStorage token storage
        if (response.data.token) {
          this.browserState.localStorage.set('token', response.data.token);
          this.log('Token stored in localStorage', 'PASS');
        }
        
        // Simulate user data storage
        if (response.data.user) {
          this.browserState.localStorage.set('user_data', JSON.stringify(response.data.user));
          this.log('User data stored in localStorage', 'PASS');
        }
        
        this.log('Login Flow Simulation', 'PASS', duration);
      } else {
        this.log(`Login Failed: ${response.data?.error || response.status}`, 'FAIL', duration);
      }
    } catch (error) {
      this.log(`Login Error: ${error.message}`, 'FAIL');
    }

    // Test 3: Post-login authentication check
    try {
      const startTime = Date.now();
      const response = await this.browserClient.get('/api/auth/me', { validateStatus: () => true });
      const duration = Date.now() - startTime;
      
      const isAuthenticated = response.status === 200 && response.data.authenticated === true;
      this.log('Post-Login Auth Check', isAuthenticated ? 'PASS' : 'FAIL', duration);
      
      if (isAuthenticated && response.data.user) {
        this.log(`Authenticated User: ${response.data.user.email}`, 'INFO');
      }
    } catch (error) {
      this.log(`Post-Login Auth Error: ${error.message}`, 'FAIL');
    }
  }

  // ===== PAGE LOAD SIMULATION =====
  async testPageLoadSimulation() {
    console.log('\n📄 PAGE LOAD SIMULATION');
    console.log('='.repeat(50));

    // Simulate typical React app startup sequence
    const startupSequence = [
      { endpoint: '/api/auth/me', description: 'Initial auth check' },
      { endpoint: '/api/user/permissions', description: 'Load user permissions' },
      { endpoint: '/api/country/preferences', description: 'Load country preferences' }
    ];

    for (const { endpoint, description } of startupSequence) {
      try {
        const startTime = Date.now();
        const response = await this.browserClient.get(endpoint, { validateStatus: () => true });
        const duration = Date.now() - startTime;
        
        this.log(`${description}: ${response.status}`, response.status === 200 ? 'PASS' : 'FAIL', duration);
      } catch (error) {
        this.log(`${description} Error: ${error.message}`, 'FAIL');
      }
    }

    // Test concurrent requests (like React components loading simultaneously)
    console.log('\n🔄 Concurrent Component Loading');
    const concurrentEndpoints = [
      '/api/bank/categories',
      '/api/bank/transactions?limit=10',
      '/api/ai/profile'
    ];

    try {
      const startTime = Date.now();
      const requests = concurrentEndpoints.map(endpoint => 
        this.browserClient.get(endpoint, { validateStatus: () => true })
      );
      
      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;
      
      const successCount = responses.filter(r => r.status === 200).length;
      this.log(`Concurrent Loading: ${successCount}/${responses.length} successful`, 
               successCount === responses.length ? 'PASS' : 'WARN', duration);
      
      responses.forEach((response, index) => {
        this.log(`  ${concurrentEndpoints[index]}: ${response.status}`, 
                 response.status === 200 ? 'PASS' : 'FAIL');
      });
    } catch (error) {
      this.log(`Concurrent Loading Error: ${error.message}`, 'FAIL');
    }
  }

  // ===== SESSION PERSISTENCE SIMULATION =====
  async testSessionPersistence() {
    console.log('\n💾 SESSION PERSISTENCE SIMULATION');
    console.log('='.repeat(50));

    // Test 1: Page refresh simulation (localStorage persists)
    const originalToken = this.browserState.localStorage.get('token');
    
    if (originalToken) {
      // Simulate page refresh - cookies might be cleared but localStorage persists
      const refreshedBrowserState = {
        localStorage: new Map(this.browserState.localStorage),
        sessionStorage: new Map(), // Session storage cleared
        cookies: new Map(), // Cookies might be cleared
        headers: {}
      };

      // Create new client instance to simulate fresh page
      const refreshClient = axios.create({
        baseURL: this.apiBaseURL,
        withCredentials: true
      });

      // Add token from persisted localStorage
      const token = refreshedBrowserState.localStorage.get('token');
      
      try {
        const startTime = Date.now();
        const response = await refreshClient.get('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
          validateStatus: () => true
        });
        const duration = Date.now() - startTime;
        
        const sessionPersisted = response.status === 200 && response.data.authenticated === true;
        this.log('Page Refresh Session Persistence', sessionPersisted ? 'PASS' : 'FAIL', duration);
      } catch (error) {
        this.log(`Page Refresh Error: ${error.message}`, 'FAIL');
      }
    } else {
      this.log('Session Persistence Test', 'SKIP', 0);
    }

    // Test 2: Token expiration handling
    try {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxfQ.invalid';
      const startTime = Date.now();
      const response = await this.browserClient.get('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${expiredToken}` },
        validateStatus: () => true
      });
      const duration = Date.now() - startTime;
      
      const correctlyRejected = response.status === 401 || 
                               (response.status === 200 && response.data.authenticated === false);
      this.log('Expired Token Handling', correctlyRejected ? 'PASS' : 'FAIL', duration);
    } catch (error) {
      this.log(`Expired Token Test Error: ${error.message}`, 'FAIL');
    }
  }

  // ===== EDGE CASES SIMULATION =====
  async testEdgeCases() {
    console.log('\n🚨 EDGE CASES SIMULATION');
    console.log('='.repeat(50));

    // Test 1: Malformed requests
    const malformedTests = [
      { 
        test: 'Invalid JSON Body',
        request: () => axios.post(`${this.apiBaseURL}/api/oidc/login`, 'invalid-json', {
          headers: { 'Content-Type': 'application/json' },
          validateStatus: () => true
        })
      },
      {
        test: 'Missing Content-Type',
        request: () => this.browserClient.post('/api/oidc/login', { email: 'test', password: 'test' }, {
          headers: { 'Content-Type': '' },
          validateStatus: () => true
        })
      },
      {
        test: 'Oversized Request',
        request: () => this.browserClient.post('/api/oidc/login', {
          email: 'test@test.com',
          password: 'a'.repeat(10000)
        }, { validateStatus: () => true })
      }
    ];

    for (const { test, request } of malformedTests) {
      try {
        const startTime = Date.now();
        const response = await request();
        const duration = Date.now() - startTime;
        
        const handledGracefully = response.status >= 400 && response.status < 500;
        this.log(`${test}: ${response.status}`, handledGracefully ? 'PASS' : 'WARN', duration);
      } catch (error) {
        this.log(`${test}: ${error.message}`, 'WARN');
      }
    }

    // Test 2: Network interruption simulation
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 100); // Abort after 100ms
      
      const response = await this.browserClient.get('/api/bank/transactions?limit=1000', {
        signal: controller.signal,
        validateStatus: () => true
      });
      
      this.log('Network Interruption Handling', 'WARN', 0);
    } catch (error) {
      const isAbortError = error.code === 'ECONNABORTED' || error.message.includes('abort');
      this.log('Network Interruption Handling', isAbortError ? 'PASS' : 'FAIL');
    }
  }

  // ===== PERFORMANCE SIMULATION =====
  async testPerformanceSimulation() {
    console.log('\n⚡ PERFORMANCE SIMULATION');
    console.log('='.repeat(50));

    // Test 1: Rapid user interactions
    const rapidInteractions = [];
    for (let i = 0; i < 10; i++) {
      rapidInteractions.push(
        this.browserClient.get('/api/auth/me', { validateStatus: () => true })
      );
    }

    try {
      const startTime = Date.now();
      const responses = await Promise.all(rapidInteractions);
      const duration = Date.now() - startTime;
      
      const successCount = responses.filter(r => r.status === 200).length;
      this.log(`Rapid Interactions: ${successCount}/10 successful in ${duration}ms`, 
               successCount >= 8 ? 'PASS' : 'WARN', duration);
    } catch (error) {
      this.log(`Rapid Interactions Error: ${error.message}`, 'FAIL');
    }

    // Test 2: Memory usage simulation (multiple requests with large responses)
    try {
      const largeDataRequests = [];
      for (let i = 0; i < 5; i++) {
        largeDataRequests.push(
          this.browserClient.get('/api/bank/transactions?limit=100', { validateStatus: () => true })
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(largeDataRequests);
      const duration = Date.now() - startTime;
      
      const successCount = responses.filter(r => r.status === 200).length;
      this.log(`Large Data Requests: ${successCount}/5 successful`, 
               successCount >= 4 ? 'PASS' : 'WARN', duration);
    } catch (error) {
      this.log(`Large Data Requests Error: ${error.message}`, 'FAIL');
    }
  }

  // ===== MAIN TEST RUNNER =====
  async runAllTests() {
    console.log('🌐 COMPREHENSIVE FRONTEND SIMULATION TESTS');
    console.log('='.repeat(60));
    console.log(`API URL: ${this.apiBaseURL}`);
    console.log(`Frontend URL: ${this.frontendURL}`);
    console.log(`Started: ${new Date().toISOString()}`);
    
    const startTime = Date.now();

    try {
      await this.testBrowserEnvironment();
      await this.testAuthenticationFlow();
      await this.testPageLoadSimulation();
      await this.testSessionPersistence();
      await this.testEdgeCases();
      await this.testPerformanceSimulation();
    } catch (error) {
      console.error('❌ Frontend simulation test suite failed:', error.message);
    }

    const totalTime = Date.now() - startTime;
    this.generateReport(totalTime);
  }

  generateReport(totalTime) {
    console.log('\n📊 FRONTEND SIMULATION SUMMARY');
    console.log('='.repeat(60));

    const passed = this.testResults.filter(r => r.type === 'PASS').length;
    const failed = this.testResults.filter(r => r.type === 'FAIL').length;
    const warnings = this.testResults.filter(r => r.type === 'WARN').length;
    const skipped = this.testResults.filter(r => r.type === 'SKIP').length;
    const total = this.testResults.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed} (${(passed/total*100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failed} (${(failed/total*100).toFixed(1)}%)`);
    console.log(`⚠️ Warnings: ${warnings} (${(warnings/total*100).toFixed(1)}%)`);
    console.log(`⏭️ Skipped: ${skipped} (${(skipped/total*100).toFixed(1)}%)`);
    console.log(`⏱️ Total Time: ${totalTime}ms`);

    console.log('\n🔍 Browser State Summary:');
    console.log(`LocalStorage Items: ${this.browserState.localStorage.size}`);
    console.log(`Cookies: ${this.browserState.cookies.size}`);
    console.log(`Has Auth Token: ${this.browserState.localStorage.has('token')}`);

    // Save detailed report
    const report = {
      summary: { total, passed, failed, warnings, skipped, totalTime },
      results: this.testResults,
      browserState: {
        localStorage: Object.fromEntries(this.browserState.localStorage),
        cookies: Object.fromEntries(this.browserState.cookies)
      },
      timestamp: new Date().toISOString(),
      apiBaseURL: this.apiBaseURL,
      frontendURL: this.frontendURL
    };

    require('fs').writeFileSync(
      `frontend-simulation-report-${Date.now()}.json`,
      JSON.stringify(report, null, 2)
    );

    console.log(`\n💾 Detailed report saved: frontend-simulation-report-${Date.now()}.json`);

    // Return exit code for CI/CD
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new FrontendSimulationTester();
  tester.runAllTests();
}

module.exports = FrontendSimulationTester;
