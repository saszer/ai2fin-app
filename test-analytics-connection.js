/**
 * 🧪 ANALYTICS SERVICE CONNECTION TEST
 * 
 * This test verifies that the analytics service is properly connected
 * and the ATO export functionality works end-to-end.
 */

const axios = require('axios');

const CONFIG = {
  CORE_APP_URL: 'http://localhost:3001',
  ANALYTICS_URL: 'http://localhost:3004',
  TEST_TOKEN: 'test-token-12345' // Mock token for testing
};

async function testAnalyticsConnection() {
  console.log('🧪 Testing Analytics Service Connection...\n');
  
  try {
    // Test 1: Direct analytics service health
    console.log('1️⃣ Testing direct analytics service health...');
    const analyticsHealth = await axios.get(`${CONFIG.ANALYTICS_URL}/health`);
    console.log(`✅ Analytics service: ${analyticsHealth.data.status}`);
    console.log(`📊 Features: ${JSON.stringify(analyticsHealth.data.features)}`);
    
    // Test 2: Core app analytics status (with auth)
    console.log('\n2️⃣ Testing core app analytics status...');
    try {
      const coreAnalyticsStatus = await axios.get(`${CONFIG.CORE_APP_URL}/api/analytics/status`, {
        headers: { Authorization: `Bearer ${CONFIG.TEST_TOKEN}` }
      });
      console.log(`✅ Core app analytics status: ${coreAnalyticsStatus.data.data?.status}`);
    } catch (error) {
      console.log(`⚠️ Core app analytics status failed: ${error.response?.data?.error || error.message}`);
    }
    
    // Test 3: Service discovery status
    console.log('\n3️⃣ Testing service discovery...');
    const serviceStatus = await axios.get(`${CONFIG.CORE_APP_URL}/api/services/status`);
    const analyticsService = serviceStatus.data.services.find(s => s.name === 'analytics');
    console.log(`📡 Analytics service discovery: ${analyticsService?.status || 'not found'}`);
    console.log(`🔗 Analytics URL: ${analyticsService?.url || 'not found'}`);
    console.log(`⏰ Last checked: ${analyticsService?.lastChecked || 'never'}`);
    
    // Test 4: Export preview (with mock data)
    console.log('\n4️⃣ Testing export preview...');
    const mockData = {
      startDate: '2024-07-01',
      endDate: '2024-12-31',
      transactions: [
        {
          id: 'test-1',
          description: 'Office Supplies',
          amount: -50.00,
          date: '2024-07-15',
          primaryType: 'expense',
          isTaxDeductible: true,
          businessUsePercentage: 100,
          expenseType: 'business'
        }
      ],
      trips: [],
      vehicles: [],
      unlinkedBills: []
    };
    
    try {
      const previewResponse = await axios.post(`${CONFIG.CORE_APP_URL}/api/analytics/export/preview`, mockData, {
        headers: { 
          Authorization: `Bearer ${CONFIG.TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`✅ Export preview: ${previewResponse.data.success ? 'SUCCESS' : 'FAILED'}`);
      if (previewResponse.data.success) {
        console.log(`📊 Preview data: ${previewResponse.data.data?.expenses?.length || 0} expenses, $${previewResponse.data.data?.totalExpenses || 0} total`);
      }
    } catch (error) {
      console.log(`❌ Export preview failed: ${error.response?.data?.error || error.message}`);
    }
    
    // Test 5: Export stats
    console.log('\n5️⃣ Testing export stats...');
    try {
      const statsResponse = await axios.get(`${CONFIG.CORE_APP_URL}/api/analytics/export/stats`, {
        headers: { Authorization: `Bearer ${CONFIG.TEST_TOKEN}` }
      });
      console.log(`✅ Export stats: ${statsResponse.data.success ? 'SUCCESS' : 'FAILED'}`);
      if (statsResponse.data.success) {
        console.log(`📈 Total exports: ${statsResponse.data.data?.totalExports || 0}`);
      }
    } catch (error) {
      console.log(`❌ Export stats failed: ${error.response?.data?.error || error.message}`);
    }
    
    console.log('\n🎉 Analytics Connection Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testAnalyticsConnection();
