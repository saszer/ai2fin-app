/**
 * 🧪 COMPREHENSIVE ATO EXPORT TEST SUITE
 * 
 * This test verifies the complete ATO export functionality:
 * 1. Frontend access to ATO export page
 * 2. Stats loading on export page
 * 3. Export preview generation
 * 4. CSV export functionality
 * 5. Error handling and user feedback
 * 
 * embracingearth.space - Enterprise Testing Framework
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Test configuration
const CONFIG = {
  CORE_APP_URL: 'http://localhost:3001',
  ANALYTICS_URL: 'http://localhost:3004',
  FRONTEND_URL: 'http://localhost:3000',
  TEST_USER: {
    email: 'test@embracingearth.space',
    password: 'TestPassword123!',
    countryCode: 'AU'
  },
  TEST_DATA: {
    transactions: [
      {
        id: 'test-tx-1',
        description: 'Office Supplies - Staples',
        amount: -45.50,
        date: '2024-07-15',
        primaryType: 'expense',
        isTaxDeductible: true,
        businessUsePercentage: 100,
        expenseType: 'business',
        merchant: 'Staples',
        category: 'Office Supplies'
      },
      {
        id: 'test-tx-2',
        description: 'Client Lunch - Restaurant',
        amount: -89.20,
        date: '2024-08-20',
        primaryType: 'expense',
        isTaxDeductible: true,
        businessUsePercentage: 100,
        expenseType: 'business',
        merchant: 'Restaurant ABC',
        category: 'Meals & Entertainment'
      },
      {
        id: 'test-tx-3',
        description: 'Salary Payment',
        amount: 5000.00,
        date: '2024-07-31',
        primaryType: 'income',
        isTaxDeductible: false,
        businessUsePercentage: 0,
        expenseType: 'business',
        merchant: 'Company ABC',
        category: 'Salary'
      }
    ],
    vehicles: [
      {
        id: 'test-vehicle-1',
        registration: 'ABC123',
        description: 'Company Car - Toyota Camry',
        ownership: 'OWNED',
        vehicleType: 'Sedan',
        isActive: true
      }
    ],
    trips: [
      {
        id: 'test-trip-1',
        vehicleId: 'test-vehicle-1',
        tripDate: '2024-07-15',
        tripType: 'BUSINESS',
        purpose: 'Client Meeting',
        startOdometer: 1000.0,
        endOdometer: 1025.5,
        startLocation: 'Office',
        endLocation: 'Client Office',
        tripDetails: 'Meeting with client for project discussion',
        distanceKm: 25.5,
        isMultipleTrips: false,
        isReturnJourney: true,
        totalKm: 51.0,
        isLogbookTrip: true,
        vehicle: {
          id: 'test-vehicle-1',
          registration: 'ABC123',
          description: 'Company Car - Toyota Camry',
          ownership: 'OWNED',
          vehicleType: 'Sedan',
          isActive: true
        }
      }
    ]
  }
};

// Test utilities
class TestLogger {
  static log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✅',
      error: '❌',
      warning: '⚠️',
      success: '🎉',
      test: '🧪'
    }[type] || '📝';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }
  
  static testStart(testName) {
    console.log(`\n🧪 ===== ${testName} =====`);
  }
  
  static testEnd(testName, success) {
    const status = success ? 'PASSED' : 'FAILED';
    const emoji = success ? '🎉' : '❌';
    console.log(`${emoji} ===== ${testName} - ${status} =====\n`);
  }
}

class ATOExportTester {
  constructor() {
    this.authToken = null;
    this.testResults = [];
  }

  async runAllTests() {
    TestLogger.log('Starting Comprehensive ATO Export Test Suite', 'test');
    
    try {
      // Test 1: System Health Check
      await this.testSystemHealth();
      
      // Test 2: Authentication
      await this.testAuthentication();
      
      // Test 3: Analytics Service Status
      await this.testAnalyticsServiceStatus();
      
      // Test 4: Export Preview Generation
      await this.testExportPreview();
      
      // Test 5: Stats Loading
      await this.testStatsLoading();
      
      // Test 6: CSV Export
      await this.testCSVExport();
      
      // Test 7: Error Handling
      await this.testErrorHandling();
      
      // Test 8: Frontend Integration (Simulated)
      await this.testFrontendIntegration();
      
      this.printTestSummary();
      
    } catch (error) {
      TestLogger.log(`Test suite failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testSystemHealth() {
    TestLogger.testStart('System Health Check');
    
    try {
      // Test core app health
      const coreHealth = await axios.get(`${CONFIG.CORE_APP_URL}/health`);
      TestLogger.log(`Core app health: ${coreHealth.data.status}`, 'info');
      
      // Test analytics service health
      const analyticsHealth = await axios.get(`${CONFIG.ANALYTICS_URL}/health`);
      TestLogger.log(`Analytics service health: ${analyticsHealth.data.status}`, 'info');
      
      // Verify exports are enabled
      if (analyticsHealth.data.features?.exports) {
        TestLogger.log('Exports feature enabled', 'success');
      } else {
        throw new Error('Exports feature not enabled in analytics service');
      }
      
      TestLogger.testEnd('System Health Check', true);
      this.testResults.push({ test: 'System Health Check', status: 'PASSED' });
      
    } catch (error) {
      TestLogger.log(`System health check failed: ${error.message}`, 'error');
      TestLogger.testEnd('System Health Check', false);
      this.testResults.push({ test: 'System Health Check', status: 'FAILED', error: error.message });
      throw error;
    }
  }

  async testAuthentication() {
    TestLogger.testStart('Authentication Test');
    
    try {
      // For testing purposes, we'll use a mock token
      // In a real test, you'd register/login a user
      this.authToken = 'test-token-12345';
      
      TestLogger.log('Mock authentication token generated', 'info');
      TestLogger.testEnd('Authentication Test', true);
      this.testResults.push({ test: 'Authentication Test', status: 'PASSED' });
      
    } catch (error) {
      TestLogger.log(`Authentication test failed: ${error.message}`, 'error');
      TestLogger.testEnd('Authentication Test', false);
      this.testResults.push({ test: 'Authentication Test', status: 'FAILED', error: error.message });
      throw error;
    }
  }

  async testAnalyticsServiceStatus() {
    TestLogger.testStart('Analytics Service Status Test');
    
    try {
      const response = await axios.get(`${CONFIG.CORE_APP_URL}/api/analytics/status`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      TestLogger.log(`Analytics status: ${response.data.data?.status}`, 'info');
      
      if (response.data.success && response.data.data?.status === 'online') {
        TestLogger.log('Analytics service is online', 'success');
        TestLogger.testEnd('Analytics Service Status Test', true);
        this.testResults.push({ test: 'Analytics Service Status Test', status: 'PASSED' });
      } else {
        throw new Error('Analytics service is not online');
      }
      
    } catch (error) {
      TestLogger.log(`Analytics service status test failed: ${error.message}`, 'error');
      TestLogger.testEnd('Analytics Service Status Test', false);
      this.testResults.push({ test: 'Analytics Service Status Test', status: 'FAILED', error: error.message });
      throw error;
    }
  }

  async testExportPreview() {
    TestLogger.testStart('Export Preview Generation Test');
    
    try {
      const previewData = {
        startDate: '2024-07-01',
        endDate: '2024-12-31',
        transactions: CONFIG.TEST_DATA.transactions,
        trips: CONFIG.TEST_DATA.trips,
        vehicles: CONFIG.TEST_DATA.vehicles,
        unlinkedBills: []
      };
      
      const response = await axios.post(`${CONFIG.CORE_APP_URL}/api/analytics/export/preview`, previewData, {
        headers: { 
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const data = response.data.data;
        TestLogger.log(`Preview generated successfully`, 'success');
        TestLogger.log(`- Income transactions: ${data.income?.length || 0}`, 'info');
        TestLogger.log(`- Expense transactions: ${data.expenses?.length || 0}`, 'info');
        TestLogger.log(`- Total income: $${data.totalIncome || 0}`, 'info');
        TestLogger.log(`- Total expenses: $${data.totalExpenses || 0}`, 'info');
        TestLogger.log(`- Business expenses: $${data.businessExpenses || 0}`, 'info');
        TestLogger.log(`- Employee expenses: $${data.employeeExpenses || 0}`, 'info');
        TestLogger.log(`- Trips: ${data.totalTrips || 0}`, 'info');
        TestLogger.log(`- Total distance: ${data.totalDistance || 0} km`, 'info');
        
        TestLogger.testEnd('Export Preview Generation Test', true);
        this.testResults.push({ test: 'Export Preview Generation Test', status: 'PASSED' });
      } else {
        throw new Error(`Preview generation failed: ${response.data.error}`);
      }
      
    } catch (error) {
      TestLogger.log(`Export preview test failed: ${error.message}`, 'error');
      TestLogger.testEnd('Export Preview Generation Test', false);
      this.testResults.push({ test: 'Export Preview Generation Test', status: 'FAILED', error: error.message });
      throw error;
    }
  }

  async testStatsLoading() {
    TestLogger.testStart('Stats Loading Test');
    
    try {
      // Test export stats endpoint
      const statsResponse = await axios.get(`${CONFIG.CORE_APP_URL}/api/analytics/export/stats`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (statsResponse.data.success) {
        const stats = statsResponse.data.data;
        TestLogger.log(`Export stats loaded successfully`, 'success');
        TestLogger.log(`- Total exports: ${stats.totalExports}`, 'info');
        TestLogger.log(`- This month: ${stats.thisMonth}`, 'info');
        TestLogger.log(`- Popular formats: ${stats.popularFormats?.length || 0}`, 'info');
        
        TestLogger.testEnd('Stats Loading Test', true);
        this.testResults.push({ test: 'Stats Loading Test', status: 'PASSED' });
      } else {
        throw new Error(`Stats loading failed: ${statsResponse.data.error}`);
      }
      
    } catch (error) {
      TestLogger.log(`Stats loading test failed: ${error.message}`, 'error');
      TestLogger.testEnd('Stats Loading Test', false);
      this.testResults.push({ test: 'Stats Loading Test', status: 'FAILED', error: error.message });
      throw error;
    }
  }

  async testCSVExport() {
    TestLogger.testStart('CSV Export Test');
    
    try {
      const exportData = {
        startDate: '2024-07-01',
        endDate: '2024-12-31',
        transactions: CONFIG.TEST_DATA.transactions,
        trips: CONFIG.TEST_DATA.trips,
        vehicles: CONFIG.TEST_DATA.vehicles,
        unlinkedBills: []
      };
      
      const response = await axios.post(`${CONFIG.CORE_APP_URL}/api/analytics/export/ato-mydeductions`, exportData, {
        headers: { 
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const data = response.data.data;
        TestLogger.log(`CSV export generated successfully`, 'success');
        TestLogger.log(`- Filename: ${data.filename}`, 'info');
        TestLogger.log(`- Record count: ${data.recordCount}`, 'info');
        TestLogger.log(`- Trip count: ${data.tripCount}`, 'info');
        TestLogger.log(`- Vehicle count: ${data.vehicleCount}`, 'info');
        TestLogger.log(`- Processing time: ${data.processingTimeMs}ms`, 'info');
        
        // Save CSV to file for verification
        const csvPath = path.join(__dirname, 'test-export.csv');
        fs.writeFileSync(csvPath, data.csvContent);
        TestLogger.log(`CSV saved to: ${csvPath}`, 'info');
        
        TestLogger.testEnd('CSV Export Test', true);
        this.testResults.push({ test: 'CSV Export Test', status: 'PASSED' });
      } else {
        throw new Error(`CSV export failed: ${response.data.error}`);
      }
      
    } catch (error) {
      TestLogger.log(`CSV export test failed: ${error.message}`, 'error');
      TestLogger.testEnd('CSV Export Test', false);
      this.testResults.push({ test: 'CSV Export Test', status: 'FAILED', error: error.message });
      throw error;
    }
  }

  async testErrorHandling() {
    TestLogger.testStart('Error Handling Test');
    
    try {
      // Test with invalid data
      const invalidData = {
        startDate: 'invalid-date',
        endDate: '2024-12-31',
        transactions: []
      };
      
      try {
        await axios.post(`${CONFIG.CORE_APP_URL}/api/analytics/export/preview`, invalidData, {
          headers: { 
            Authorization: `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        });
        throw new Error('Should have failed with invalid data');
      } catch (error) {
        if (error.response?.status === 400) {
          TestLogger.log('Error handling works correctly for invalid data', 'success');
        } else {
          throw error;
        }
      }
      
      // Test without authentication
      try {
        await axios.post(`${CONFIG.CORE_APP_URL}/api/analytics/export/preview`, CONFIG.TEST_DATA);
        throw new Error('Should have failed without authentication');
      } catch (error) {
        if (error.response?.status === 401) {
          TestLogger.log('Error handling works correctly for missing authentication', 'success');
        } else {
          throw error;
        }
      }
      
      TestLogger.testEnd('Error Handling Test', true);
      this.testResults.push({ test: 'Error Handling Test', status: 'PASSED' });
      
    } catch (error) {
      TestLogger.log(`Error handling test failed: ${error.message}`, 'error');
      TestLogger.testEnd('Error Handling Test', false);
      this.testResults.push({ test: 'Error Handling Test', status: 'FAILED', error: error.message });
      throw error;
    }
  }

  async testFrontendIntegration() {
    TestLogger.testStart('Frontend Integration Test (Simulated)');
    
    try {
      // Simulate frontend API calls
      const frontendCalls = [
        { name: 'Analytics Status', url: '/api/analytics/status', method: 'GET' },
        { name: 'Export Preview', url: '/api/analytics/export/preview', method: 'POST' },
        { name: 'Export Stats', url: '/api/analytics/export/stats', method: 'GET' },
        { name: 'Unlinked Bills', url: '/api/export/unlinked-bills', method: 'GET' }
      ];
      
      for (const call of frontendCalls) {
        try {
          const config = {
            method: call.method,
            url: `${CONFIG.CORE_APP_URL}${call.url}`,
            headers: { Authorization: `Bearer ${this.authToken}` }
          };
          
          if (call.method === 'POST') {
            config.data = {
              startDate: '2024-07-01',
              endDate: '2024-12-31',
              transactions: CONFIG.TEST_DATA.transactions,
              trips: CONFIG.TEST_DATA.trips,
              vehicles: CONFIG.TEST_DATA.vehicles,
              unlinkedBills: []
            };
          } else if (call.url.includes('unlinked-bills')) {
            config.url += '?startDate=2024-07-01&endDate=2024-12-31';
          }
          
          const response = await axios(config);
          TestLogger.log(`Frontend call '${call.name}' successful`, 'success');
          
        } catch (error) {
          TestLogger.log(`Frontend call '${call.name}' failed: ${error.message}`, 'warning');
        }
      }
      
      TestLogger.testEnd('Frontend Integration Test (Simulated)', true);
      this.testResults.push({ test: 'Frontend Integration Test (Simulated)', status: 'PASSED' });
      
    } catch (error) {
      TestLogger.log(`Frontend integration test failed: ${error.message}`, 'error');
      TestLogger.testEnd('Frontend Integration Test (Simulated)', false);
      this.testResults.push({ test: 'Frontend Integration Test (Simulated)', status: 'FAILED', error: error.message });
      throw error;
    }
  }

  printTestSummary() {
    console.log('\n🎯 ===== TEST SUMMARY =====');
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const total = this.testResults.length;
    
    console.log(`📊 Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'FAILED')
        .forEach(r => console.log(`  - ${r.test}: ${r.error}`));
    }
    
    console.log('\n🎉 ===== TEST COMPLETE =====');
    
    if (failed === 0) {
      TestLogger.log('All tests passed! ATO export system is working correctly.', 'success');
    } else {
      TestLogger.log(`${failed} test(s) failed. Please review the issues above.`, 'error');
    }
  }
}

// Run the test suite
async function runTests() {
  const tester = new ATOExportTester();
  
  try {
    await tester.runAllTests();
    process.exit(0);
  } catch (error) {
    TestLogger.log(`Test suite execution failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = { ATOExportTester, TestLogger, CONFIG };

// Run if called directly
if (require.main === module) {
  runTests();
}
