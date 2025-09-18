/**
 * 🧪 FRONTEND ANALYTICS ACCESS TEST
 * 
 * This test verifies that the frontend UI can access the analytics service
 * through the core app, even if service discovery shows it as offline.
 */

const axios = require('axios');

const CONFIG = {
  CORE_APP_URL: 'http://localhost:3001',
  ANALYTICS_URL: 'http://localhost:3004',
  TEST_TOKEN: 'test-token-12345'
};

async function testFrontendAnalyticsAccess() {
  console.log('🧪 Testing Frontend Analytics Access...\n');
  
  try {
    // Test 1: Check if analytics service is directly accessible
    console.log('1️⃣ Testing direct analytics service access...');
    const directHealth = await axios.get(`${CONFIG.ANALYTICS_URL}/health`);
    console.log(`✅ Direct analytics: ${directHealth.data.status}`);
    
    // Test 2: Check service discovery status
    console.log('\n2️⃣ Testing service discovery status...');
    const serviceStatus = await axios.get(`${CONFIG.CORE_APP_URL}/api/services/status`);
    const analyticsService = serviceStatus.data.services.find(s => s.name === 'analytics');
    console.log(`📡 Service discovery: ${analyticsService?.status || 'not found'}`);
    console.log(`🔗 Analytics URL: ${analyticsService?.url || 'not found'}`);
    
    // Test 3: Test core app analytics status endpoint
    console.log('\n3️⃣ Testing core app analytics status endpoint...');
    try {
      const coreAnalyticsStatus = await axios.get(`${CONFIG.CORE_APP_URL}/api/analytics/status`, {
        headers: { Authorization: `Bearer ${CONFIG.TEST_TOKEN}` }
      });
      console.log(`✅ Core app analytics status: ${coreAnalyticsStatus.data.data?.status || 'unknown'}`);
    } catch (error) {
      console.log(`❌ Core app analytics status failed: ${error.response?.data?.error || error.message}`);
    }
    
    // Test 4: Test export preview through core app (this is what frontend calls)
    console.log('\n4️⃣ Testing export preview through core app...');
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
      console.log(`✅ Export preview through core app: ${previewResponse.data.success ? 'SUCCESS' : 'FAILED'}`);
      if (previewResponse.data.success) {
        console.log(`📊 Preview data: ${previewResponse.data.data?.expenses?.length || 0} expenses`);
      }
    } catch (error) {
      console.log(`❌ Export preview through core app failed: ${error.response?.data?.error || error.message}`);
      
      // Check if it's a service discovery issue
      if (error.response?.status === 503) {
        console.log('🔍 This is a service discovery issue - analytics service not detected by core app');
        console.log('💡 Solution: Need to fix service discovery or bypass it');
      }
    }
    
    // Test 5: Test direct call to analytics service (bypassing core app)
    console.log('\n5️⃣ Testing direct analytics service call...');
    try {
      const directPreviewResponse = await axios.post(`${CONFIG.ANALYTICS_URL}/api/analytics/export/preview`, mockData);
      console.log(`✅ Direct analytics preview: ${directPreviewResponse.data.success ? 'SUCCESS' : 'FAILED'}`);
      if (directPreviewResponse.data.success) {
        console.log(`📊 Direct preview data: ${directPreviewResponse.data.data?.expenses?.length || 0} expenses`);
      }
    } catch (error) {
      console.log(`❌ Direct analytics preview failed: ${error.message}`);
    }
    
    // Test 6: Check if we can force service discovery to detect analytics
    console.log('\n6️⃣ Testing service discovery workaround...');
    console.log('💡 Attempting to trigger service discovery refresh...');
    
    // Wait a moment and check again
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const serviceStatus2 = await axios.get(`${CONFIG.CORE_APP_URL}/api/services/status`);
    const analyticsService2 = serviceStatus2.data.services.find(s => s.name === 'analytics');
    console.log(`📡 Updated analytics status: ${analyticsService2?.status || 'not found'}`);
    console.log(`⏰ Last checked: ${analyticsService2?.lastChecked || 'never'}`);
    
    console.log('\n🎯 ===== DIAGNOSIS =====');
    
    if (analyticsService2?.status === 'online') {
      console.log('✅ Service discovery is working - analytics detected');
      console.log('✅ Frontend should be able to access analytics through core app');
    } else {
      console.log('❌ Service discovery is not detecting analytics service');
      console.log('🔧 Root cause: Service discovery timeout or connection issue');
      console.log('💡 Solutions:');
      console.log('   1. Fix service discovery configuration');
      console.log('   2. Restart core app to refresh service discovery');
      console.log('   3. Use direct analytics service calls (bypass core app)');
      console.log('   4. Implement fallback mechanism in frontend');
    }
    
    console.log('\n🎉 Frontend Analytics Access Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testFrontendAnalyticsAccess();




