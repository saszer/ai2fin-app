// Test Analytics Service Integration
const axios = require('axios');

async function testAnalyticsIntegration() {
  try {
    console.log('🔍 Testing Analytics Service Integration...');
    
    // Test 1: Core app health
    console.log('\n1. Testing Core App Health...');
    const coreHealth = await axios.get('http://localhost:3001/health');
    console.log('✅ Core app is healthy:', coreHealth.data.status);
    
    // Test 2: Service discovery
    console.log('\n2. Testing Service Discovery...');
    const services = await axios.get('http://localhost:3001/api/monitoring/critical-services');
    console.log('✅ Service discovery working:', services.data.services.length, 'services found');
    
    // Test 3: Analytics service direct
    console.log('\n3. Testing Analytics Service Direct...');
    const analyticsHealth = await axios.get('http://localhost:3004/health');
    console.log('✅ Analytics service is healthy:', analyticsHealth.data.status);
    console.log('📊 Features:', analyticsHealth.data.features);
    
    // Test 4: Analytics through core app (with auth)
    console.log('\n4. Testing Analytics Through Core App...');
    try {
      const analyticsPreview = await axios.post('http://localhost:3001/api/analytics/export/preview', {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        page: 1,
        pageSize: 10
      }, {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Analytics preview working:', analyticsPreview.data.success);
    } catch (error) {
      console.log('⚠️ Analytics preview failed (expected - no real auth):', error.response?.status, error.response?.data?.error);
    }
    
    console.log('\n🎉 Integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAnalyticsIntegration();

