/**
 * 🔍 SYSTEM STATUS TEST - Verify Intelligent Categorization Services
 * Tests basic connectivity and service health without authentication
 * // embracingearth.space - AI-powered financial intelligence
 */

const axios = require('axios');

// Test configuration
const SERVICES = {
  'Core App': 'http://localhost:3001',
  'AI Modules': 'http://localhost:3002',
  'Frontend': 'http://localhost:3000'
};

async function testSystemStatus() {
  console.log('\n🔍 INTELLIGENT CATEGORIZATION SYSTEM - STATUS CHECK');
  console.log('=' .repeat(60));
  
  const results = {};
  
  for (const [serviceName, url] of Object.entries(SERVICES)) {
    console.log(`\n📊 Testing ${serviceName} (${url})...`);
    
    try {
      // Test basic connectivity
      const startTime = Date.now();
      const response = await axios.get(`${url}/health`, { timeout: 5000 });
      const responseTime = Date.now() - startTime;
      
      results[serviceName] = {
        status: 'ONLINE',
        responseTime,
        data: response.data
      };
      
      console.log(`✅ ${serviceName}: ONLINE (${responseTime}ms)`);
      if (response.data) {
        console.log(`   Status: ${response.data.status || 'OK'}`);
        if (response.data.uptime) {
          console.log(`   Uptime: ${response.data.uptime}`);
        }
        if (response.data.version) {
          console.log(`   Version: ${response.data.version}`);
        }
      }
      
    } catch (error) {
      results[serviceName] = {
        status: 'OFFLINE',
        error: error.message
      };
      
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${serviceName}: OFFLINE (connection refused)`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`⏱️ ${serviceName}: TIMEOUT (>${error.timeout}ms)`);
      } else {
        console.log(`❌ ${serviceName}: ERROR (${error.message})`);
      }
    }
  }
  
  // Test specific intelligent categorization endpoints (if core app is online)
  if (results['Core App']?.status === 'ONLINE') {
    console.log('\n🧠 Testing Intelligent Categorization Endpoints...');
    
    const endpoints = [
      { path: '/intelligent-categorization/preferences', method: 'GET', requiresAuth: true },
      { path: '/intelligent-categorization/analytics', method: 'GET', requiresAuth: true }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${SERVICES['Core App']}${endpoint.path}`, { 
          timeout: 3000,
          validateStatus: function (status) {
            // Accept 401 as valid response (endpoint exists but requires auth)
            return status < 500;
          }
        });
        
        if (response.status === 401) {
          console.log(`✅ ${endpoint.path}: Available (requires authentication)`);
        } else if (response.status === 200) {
          console.log(`✅ ${endpoint.path}: OK`);
        } else {
          console.log(`📝 ${endpoint.path}: HTTP ${response.status}`);
        }
        
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`✅ ${endpoint.path}: Available (requires authentication)`);
        } else {
          console.log(`❌ ${endpoint.path}: ${error.message}`);
        }
      }
    }
  }
  
  // Summary
  console.log('\n📋 SYSTEM STATUS SUMMARY');
  console.log('=' .repeat(40));
  
  const onlineServices = Object.values(results).filter(r => r.status === 'ONLINE').length;
  const totalServices = Object.keys(results).length;
  
  for (const [service, result] of Object.entries(results)) {
    const status = result.status === 'ONLINE' ? '✅ ONLINE' : '❌ OFFLINE';
    const time = result.responseTime ? ` (${result.responseTime}ms)` : '';
    console.log(`${service}: ${status}${time}`);
  }
  
  console.log(`\n🔗 Services Online: ${onlineServices}/${totalServices}`);
  
  if (onlineServices === totalServices) {
    console.log('🎉 All services are running! System ready for intelligent categorization.');
  } else {
    console.log('⚠️ Some services are offline. Check service startup.');
  }
  
  // Test frontend accessibility
  if (results['Frontend']?.status === 'ONLINE') {
    console.log('\n🌐 Frontend available at: http://localhost:3000');
    console.log('   Navigate to "All Transactions" to see the new AI categorization features!');
  }
  
  return results;
}

/**
 * Test a simple transaction classification (mock/development mode)
 */
async function testSimpleClassification() {
  if (!SERVICES['Core App']) return;
  
  console.log('\n🧪 Testing Simple Classification (Development Mode)...');
  
  const mockTransaction = {
    description: 'UBER TRIP 123456',
    amount: -23.50,
    merchant: 'Uber',
    date: '2025-01-15'
  };
  
  try {
    // This should work without auth in development mode
    const response = await axios.post(
      `${SERVICES['Core App']}/intelligent-categorization/classify-transaction`,
      mockTransaction,
      { 
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500; // Accept any non-server-error status
        }
      }
    );
    
    if (response.status === 401) {
      console.log('🔐 Classification endpoint requires authentication (production mode)');
    } else if (response.data?.success) {
      console.log('✅ Mock classification successful!');
      console.log(`   Category: ${response.data.result?.category || 'Unknown'}`);
      console.log(`   Confidence: ${((response.data.result?.confidence || 0) * 100).toFixed(1)}%`);
    } else {
      console.log('📝 Classification endpoint responded:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Classification test failed:', error.message);
  }
}

// Run the tests
async function main() {
  const statusResults = await testSystemStatus();
  
  // Only test classification if core app is online
  if (statusResults['Core App']?.status === 'ONLINE') {
    await testSimpleClassification();
  }
  
  console.log('\n✨ Status check complete!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testSystemStatus }; 