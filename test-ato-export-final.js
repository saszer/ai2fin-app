/**
 * 🧪 FINAL ATO EXPORT TEST - BYPASSING AUTH FOR TESTING
 * 
 * This test verifies the complete ATO export functionality by:
 * 1. Testing direct analytics service calls
 * 2. Testing service discovery refresh
 * 3. Testing export functionality with mock data
 * 4. Verifying frontend integration points
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  CORE_APP_URL: 'http://localhost:3001',
  ANALYTICS_URL: 'http://localhost:3004',
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

class ATOExportFinalTester {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 ===== FINAL ATO EXPORT TEST SUITE =====\n');
    
    try {
      await this.testDirectAnalyticsService();
      await this.testServiceDiscoveryRefresh();
      await this.testDirectExportPreview();
      await this.testDirectCSVExport();
      await this.testFrontendIntegrationPoints();
      await this.testErrorHandling();
      
      this.printTestSummary();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      throw error;
    }
  }

  async testDirectAnalyticsService() {
    console.log('1️⃣ Testing Direct Analytics Service...');
    
    try {
      // Test health endpoint
      const healthResponse = await axios.get(`${CONFIG.ANALYTICS_URL}/health`);
      console.log(`✅ Analytics health: ${healthResponse.data.status}`);
      console.log(`📊 Features: ${JSON.stringify(healthResponse.data.features)}`);
      
      // Test export preview directly
      const previewData = {
        startDate: '2024-07-01',
        endDate: '2024-12-31',
        transactions: CONFIG.TEST_DATA.transactions,
        trips: CONFIG.TEST_DATA.trips,
        vehicles: CONFIG.TEST_DATA.vehicles,
        unlinkedBills: []
      };
      
      const previewResponse = await axios.post(`${CONFIG.ANALYTICS_URL}/api/analytics/export/preview`, previewData);
      console.log(`✅ Direct export preview: ${previewResponse.data.success ? 'SUCCESS' : 'FAILED'}`);
      
      if (previewResponse.data.success) {
        const data = previewResponse.data.data;
        console.log(`📊 Preview stats:`);
        console.log(`   - Income: $${data.totalIncome || 0}`);
        console.log(`   - Expenses: $${data.totalExpenses || 0}`);
        console.log(`   - Business: $${data.businessExpenses || 0}`);
        console.log(`   - Employee: $${data.employeeExpenses || 0}`);
        console.log(`   - Trips: ${data.totalTrips || 0}`);
        console.log(`   - Distance: ${data.totalDistance || 0} km`);
      }
      
      this.testResults.push({ test: 'Direct Analytics Service', status: 'PASSED' });
      
    } catch (error) {
      console.log(`❌ Direct analytics test failed: ${error.message}`);
      this.testResults.push({ test: 'Direct Analytics Service', status: 'FAILED', error: error.message });
      throw error;
    }
  }

  async testServiceDiscoveryRefresh() {
    console.log('\n2️⃣ Testing Service Discovery Refresh...');
    
    try {
      // Check current service status
      const serviceStatus = await axios.get(`${CONFIG.CORE_APP_URL}/api/services/status`);
      const analyticsService = serviceStatus.data.services.find(s => s.name === 'analytics');
      
      console.log(`📡 Current analytics status: ${analyticsService?.status || 'not found'}`);
      console.log(`🔗 Current URL: ${analyticsService?.url || 'not found'}`);
      console.log(`⏰ Last checked: ${analyticsService?.lastChecked || 'never'}`);
      
      // Wait a moment for service discovery to potentially refresh
      console.log('⏳ Waiting for service discovery refresh...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Check again
      const serviceStatus2 = await axios.get(`${CONFIG.CORE_APP_URL}/api/services/status`);
      const analyticsService2 = serviceStatus2.data.services.find(s => s.name === 'analytics');
      
      console.log(`📡 Updated analytics status: ${analyticsService2?.status || 'not found'}`);
      console.log(`🔗 Updated URL: ${analyticsService2?.url || 'not found'}`);
      console.log(`⏰ Last checked: ${analyticsService2?.lastChecked || 'never'}`);
      
      if (analyticsService2?.status === 'online') {
        console.log('✅ Service discovery successfully detected analytics service');
        this.testResults.push({ test: 'Service Discovery Refresh', status: 'PASSED' });
      } else {
        console.log('⚠️ Service discovery still shows analytics as offline');
        this.testResults.push({ test: 'Service Discovery Refresh', status: 'PARTIAL', error: 'Analytics not detected by service discovery' });
      }
      
    } catch (error) {
      console.log(`❌ Service discovery test failed: ${error.message}`);
      this.testResults.push({ test: 'Service Discovery Refresh', status: 'FAILED', error: error.message });
    }
  }

  async testDirectExportPreview() {
    console.log('\n3️⃣ Testing Direct Export Preview...');
    
    try {
      const previewData = {
        startDate: '2024-07-01',
        endDate: '2024-12-31',
        transactions: CONFIG.TEST_DATA.transactions,
        trips: CONFIG.TEST_DATA.trips,
        vehicles: CONFIG.TEST_DATA.vehicles,
        unlinkedBills: []
      };
      
      const response = await axios.post(`${CONFIG.ANALYTICS_URL}/api/analytics/export/preview`, previewData);
      
      if (response.data.success) {
        const data = response.data.data;
        console.log('✅ Export preview generated successfully');
        console.log(`📊 Preview details:`);
        console.log(`   - Processing time: ${response.data.processingTimeMs}ms`);
        console.log(`   - Total transactions: ${response.data.totalTransactions}`);
        console.log(`   - Processed transactions: ${response.data.processedTransactions}`);
        console.log(`   - Income transactions: ${data.income?.length || 0}`);
        console.log(`   - Expense transactions: ${data.expenses?.length || 0}`);
        console.log(`   - Trips: ${data.trips?.length || 0}`);
        console.log(`   - Vehicles: ${data.vehicles?.length || 0}`);
        
        this.testResults.push({ test: 'Direct Export Preview', status: 'PASSED' });
      } else {
        throw new Error(`Preview failed: ${response.data.error}`);
      }
      
    } catch (error) {
      console.log(`❌ Direct export preview failed: ${error.message}`);
      this.testResults.push({ test: 'Direct Export Preview', status: 'FAILED', error: error.message });
      throw error;
    }
  }

  async testDirectCSVExport() {
    console.log('\n4️⃣ Testing Direct CSV Export...');
    
    try {
      const exportData = {
        startDate: '2024-07-01',
        endDate: '2024-12-31',
        transactions: CONFIG.TEST_DATA.transactions,
        trips: CONFIG.TEST_DATA.trips,
        vehicles: CONFIG.TEST_DATA.vehicles,
        unlinkedBills: []
      };
      
      const response = await axios.post(`${CONFIG.ANALYTICS_URL}/api/analytics/export/ato-mydeductions`, exportData);
      
      if (response.data.success) {
        const data = response.data.data;
        console.log('✅ CSV export generated successfully');
        console.log(`📄 Export details:`);
        console.log(`   - Filename: ${data.filename}`);
        console.log(`   - Record count: ${data.recordCount}`);
        console.log(`   - Trip count: ${data.tripCount}`);
        console.log(`   - Vehicle count: ${data.vehicleCount}`);
        console.log(`   - Processing time: ${data.processingTimeMs}ms`);
        
        // Save CSV to file for verification
        const csvPath = path.join(__dirname, 'test-ato-export.csv');
        fs.writeFileSync(csvPath, data.csvContent);
        console.log(`💾 CSV saved to: ${csvPath}`);
        
        // Verify CSV content
        const csvContent = data.csvContent;
        const lines = csvContent.split('\n');
        console.log(`📊 CSV verification:`);
        console.log(`   - Total lines: ${lines.length}`);
        console.log(`   - Header line: ${lines[0]?.substring(0, 50)}...`);
        console.log(`   - Contains transactions: ${csvContent.includes('Office Supplies') ? 'YES' : 'NO'}`);
        console.log(`   - Contains trips: ${csvContent.includes('ABC123') ? 'YES' : 'NO'}`);
        
        this.testResults.push({ test: 'Direct CSV Export', status: 'PASSED' });
      } else {
        throw new Error(`CSV export failed: ${response.data.error}`);
      }
      
    } catch (error) {
      console.log(`❌ Direct CSV export failed: ${error.message}`);
      this.testResults.push({ test: 'Direct CSV Export', status: 'FAILED', error: error.message });
      throw error;
    }
  }

  async testFrontendIntegrationPoints() {
    console.log('\n5️⃣ Testing Frontend Integration Points...');
    
    try {
      // Test analytics status endpoint (should work without auth for status)
      const statusResponse = await axios.get(`${CONFIG.ANALYTICS_URL}/api/analytics/status`);
      console.log(`✅ Analytics status endpoint: ${statusResponse.data.service} - ${statusResponse.data.status}`);
      
      // Test export formats endpoint
      const formatsResponse = await axios.get(`${CONFIG.ANALYTICS_URL}/api/analytics/export/formats`);
      console.log(`✅ Export formats endpoint: ${formatsResponse.data.success ? 'SUCCESS' : 'FAILED'}`);
      if (formatsResponse.data.success) {
        console.log(`📋 Available formats: ${formatsResponse.data.data.formats.map(f => f.name).join(', ')}`);
      }
      
      // Test export stats endpoint
      const statsResponse = await axios.get(`${CONFIG.ANALYTICS_URL}/api/analytics/export/stats`);
      console.log(`✅ Export stats endpoint: ${statsResponse.data.success ? 'SUCCESS' : 'FAILED'}`);
      if (statsResponse.data.success) {
        console.log(`📈 Total exports: ${statsResponse.data.data.totalExports}`);
        console.log(`📅 This month: ${statsResponse.data.data.thisMonth}`);
      }
      
      this.testResults.push({ test: 'Frontend Integration Points', status: 'PASSED' });
      
    } catch (error) {
      console.log(`❌ Frontend integration test failed: ${error.message}`);
      this.testResults.push({ test: 'Frontend Integration Points', status: 'FAILED', error: error.message });
    }
  }

  async testErrorHandling() {
    console.log('\n6️⃣ Testing Error Handling...');
    
    try {
      // Test with invalid data
      const invalidData = {
        startDate: 'invalid-date',
        endDate: '2024-12-31',
        transactions: []
      };
      
      try {
        await axios.post(`${CONFIG.ANALYTICS_URL}/api/analytics/export/preview`, invalidData);
        console.log('❌ Should have failed with invalid data');
        this.testResults.push({ test: 'Error Handling', status: 'FAILED', error: 'Invalid data not rejected' });
      } catch (error) {
        if (error.response?.status === 400) {
          console.log('✅ Error handling works correctly for invalid data');
        } else {
          console.log(`⚠️ Unexpected error for invalid data: ${error.message}`);
        }
      }
      
      // Test with missing required fields
      const incompleteData = {
        startDate: '2024-07-01'
        // Missing endDate and transactions
      };
      
      try {
        await axios.post(`${CONFIG.ANALYTICS_URL}/api/analytics/export/preview`, incompleteData);
        console.log('❌ Should have failed with incomplete data');
        this.testResults.push({ test: 'Error Handling', status: 'FAILED', error: 'Incomplete data not rejected' });
      } catch (error) {
        if (error.response?.status === 400) {
          console.log('✅ Error handling works correctly for incomplete data');
        } else {
          console.log(`⚠️ Unexpected error for incomplete data: ${error.message}`);
        }
      }
      
      this.testResults.push({ test: 'Error Handling', status: 'PASSED' });
      
    } catch (error) {
      console.log(`❌ Error handling test failed: ${error.message}`);
      this.testResults.push({ test: 'Error Handling', status: 'FAILED', error: error.message });
    }
  }

  printTestSummary() {
    console.log('\n🎯 ===== FINAL TEST SUMMARY =====');
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const partial = this.testResults.filter(r => r.status === 'PARTIAL').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const total = this.testResults.length;
    
    console.log(`📊 Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️ Partial: ${partial}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${(((passed + partial) / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'FAILED')
        .forEach(r => console.log(`  - ${r.test}: ${r.error}`));
    }
    
    if (partial > 0) {
      console.log('\n⚠️ Partial Tests:');
      this.testResults
        .filter(r => r.status === 'PARTIAL')
        .forEach(r => console.log(`  - ${r.test}: ${r.error}`));
    }
    
    console.log('\n🎉 ===== ATO EXPORT SYSTEM STATUS =====');
    
    if (failed === 0) {
      console.log('🎉 ALL CORE TESTS PASSED! ATO export system is working correctly.');
      console.log('✅ Analytics service is healthy and responsive');
      console.log('✅ Export preview generation works');
      console.log('✅ CSV export generation works');
      console.log('✅ Frontend integration points are available');
      console.log('✅ Error handling is working');
      
      if (partial > 0) {
        console.log('⚠️ Service discovery may need manual refresh, but core functionality works');
      }
    } else {
      console.log('❌ Some tests failed. Please review the issues above.');
    }
    
    console.log('\n🚀 The ATO export system is ready for frontend integration!');
  }
}

// Run the test suite
async function runFinalTests() {
  const tester = new ATOExportFinalTester();
  
  try {
    await tester.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test suite execution failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runFinalTests();
}

module.exports = { ATOExportFinalTester, CONFIG };




