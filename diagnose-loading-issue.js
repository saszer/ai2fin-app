/**
 * Loading Issue Diagnostic Script
 * 
 * Tests all critical API endpoints to identify why pages are stuck loading
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

// SECURITY FIX: SSRF protection for diagnostic script - embracingearth.space
function validateUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const protocol = urlObj.protocol.toLowerCase();
    
    // Only allow http and https
    if (protocol !== 'http:' && protocol !== 'https:') {
      return false;
    }
    
    // Only allow localhost for diagnostic script (prevents SSRF)
    const allowedHosts = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
    const isAllowed = allowedHosts.some(host => hostname === host || hostname.startsWith(host + '.'));
    
    // Block private IP ranges
    if (!isAllowed) {
      const privateIpPatterns = [
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[01])\./,
        /^192\.168\./,
        /^169\.254\./,
      ];
      if (privateIpPatterns.some(pattern => pattern.test(hostname))) {
        return false;
      }
    }
    
    return isAllowed;
  } catch (error) {
    return false;
  }
}

async function testEndpoint(url, description, headers = {}) {
  // SECURITY: Validate URL before making request (SSRF protection)
  if (!validateUrl(url)) {
    console.log(`   🚨 BLOCKED: ${description} - URL blocked by SSRF protection`);
    return null;
  }
  
  try {
    console.log(`🧪 Testing: ${description}`);
    const response = await axios.get(url, { 
      headers,
      timeout: 5000,
      validateStatus: () => true // Accept all status codes
    });
    
    if (response.status === 200) {
      console.log(`   ✅ SUCCESS (${response.status}): ${description}`);
      if (response.data && typeof response.data === 'object') {
        if (response.data.transactions) {
          console.log(`   📊 Data: ${response.data.transactions.length} transactions`);
        } else if (response.data.categories) {
          console.log(`   📊 Data: ${response.data.categories.length} categories`);
        } else if (response.data.status) {
          console.log(`   📊 Status: ${response.data.status}`);
        }
      }
    } else {
      console.log(`   ❌ FAILED (${response.status}): ${description}`);
      console.log(`   Error: ${response.data?.message || response.statusText}`);
    }
    return response;
  } catch (error) {
    console.log(`   💥 ERROR: ${description}`);
    console.log(`   Details: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log(`   🔌 Connection refused - service not running`);
    }
    return null;
  }
}

async function diagnoseLoadingIssue() {
  console.log('🔍 DIAGNOSING LOADING ISSUE');
  console.log('============================\n');

  console.log('📡 TESTING BACKEND SERVICES:');
  console.log('-----------------------------');
  
  // Test basic health
  await testEndpoint(`${BASE_URL}/health`, 'Backend Health Check');
  
  // Test API endpoints that frontend needs
  await testEndpoint(`${BASE_URL}/api/health`, 'API Health Check');
  await testEndpoint(`${BASE_URL}/api/bank/transactions`, 'Bank Transactions (Unauthenticated)');
  await testEndpoint(`${BASE_URL}/api/bank/categories`, 'Bank Categories (Unauthenticated)');
  await testEndpoint(`${BASE_URL}/api/bank/csv-uploads`, 'CSV Uploads (Unauthenticated)');
  
  console.log('\n🔐 TESTING WITH MOCK AUTH:');
  console.log('---------------------------');
  
  // Test with mock authorization header
  const mockAuthHeaders = { 'Authorization': 'Bearer mock-token' };
  await testEndpoint(`${BASE_URL}/api/bank/transactions`, 'Bank Transactions (With Auth)', mockAuthHeaders);
  await testEndpoint(`${BASE_URL}/api/bank/categories`, 'Bank Categories (With Auth)', mockAuthHeaders);
  
  console.log('\n🎯 TESTING BILL PATTERN ENDPOINTS:');
  console.log('-----------------------------------');
  
  // Test bill pattern endpoints that might be causing issues
  await testEndpoint(`${BASE_URL}/api/bills/patterns`, 'Bill Patterns');
  await testEndpoint(`${BASE_URL}/api/bills/analyze-patterns`, 'Pattern Analysis (GET)');
  
  console.log('\n🖥️ TESTING FRONTEND:');
  console.log('--------------------');
  
  await testEndpoint(`${FRONTEND_URL}`, 'Frontend App');
  
  console.log('\n📊 SUMMARY:');
  console.log('===========');
  
  try {
    // Get detailed health status
    // SECURITY: Validate URL before making request (SSRF protection)
    if (!validateUrl(`${BASE_URL}/health`)) {
      console.log('❌ Health check URL blocked by SSRF protection');
      return;
    }
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    const health = healthResponse.data;
    
    console.log(`Backend Status: ${health.status}`);
    console.log(`Service: ${health.service} v${health.version}`);
    console.log(`Uptime: ${Math.round(health.health?.uptime || 0)} seconds`);
    
    if (health.status === 'unhealthy') {
      console.log('\n🚨 BACKEND IS UNHEALTHY:');
      console.log('This is likely why pages are stuck loading!');
      
      if (health.health?.checks) {
        Object.entries(health.health.checks).forEach(([check, result]) => {
          console.log(`   ${result.status === 'healthy' ? '✅' : '❌'} ${check}: ${result.status}`);
        });
      }
    }
    
  } catch (error) {
    console.log('❌ Could not get detailed health status');
  }
  
  console.log('\n🛠️ RECOMMENDED ACTIONS:');
  console.log('=======================');
  console.log('1. If backend is unhealthy: Restart core app');
  console.log('2. If authentication failing: Check auth service');
  console.log('3. If pattern endpoints failing: Check bill pattern implementation');
  console.log('4. If database issues: Check Prisma connection');
  console.log('5. Clear browser cache and hard refresh');
  
  console.log('\n🚀 TO FIX:');
  console.log('==========');
  console.log('cd ai2-core-app && npm start');
  console.log('Then refresh browser and check developer console');
}

if (require.main === module) {
  diagnoseLoadingIssue().catch(error => {
    console.error('Diagnostic failed:', error.message);
  });
}

module.exports = { diagnoseLoadingIssue }; 