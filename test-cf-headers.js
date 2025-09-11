#!/usr/bin/env node
/**
 * Test Cloudflare Header Injection
 * embracingearth.space - Debug what headers Cloudflare is actually sending
 */

const https = require('https');

// Test configuration
const TEST_ENDPOINTS = [
  'https://api.ai2fin.com/health',
  'https://api.ai2fin.com/',
  'https://api.ai2fin.com/api/health'
];

/**
 * Make HTTP request and capture all response details
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Cloudflare-Header-Test/1.0',
        'Accept': 'application/json',
        ...options.headers
      },
      timeout: 15000
    };
    
    console.log(`🔍 Testing: ${url}`);
    console.log(`   Method: ${requestOptions.method}`);
    console.log(`   Request Headers:`, Object.keys(requestOptions.headers).join(', '));
    
    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url: url,
          statusCode: res.statusCode,
          responseHeaders: res.headers,
          requestHeaders: requestOptions.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Request Error: ${error.message}`);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.log(`   ⏰ Request Timeout`);
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Analyze headers for Origin Lock indicators
 */
function analyzeHeaders(response) {
  const analysis = {
    url: response.url,
    statusCode: response.statusCode,
    hasOriginHeader: false,
    originHeaderValue: null,
    cfHeaders: [],
    allHeaders: Object.keys(response.responseHeaders),
    isBlocked: response.statusCode === 403,
    isHealthCheck: response.url.includes('/health')
  };
  
  // Check for Origin Lock header
  const originHeaders = Object.keys(response.responseHeaders).filter(h => 
    h.toLowerCase().includes('origin') || 
    h.toLowerCase().includes('auth') ||
    h.toLowerCase().includes('cf-')
  );
  
  if (originHeaders.length > 0) {
    analysis.hasOriginHeader = true;
    analysis.originHeaderValue = originHeaders.map(h => `${h}: ${response.responseHeaders[h]}`).join(', ');
  }
  
  // Check for Cloudflare headers
  analysis.cfHeaders = Object.keys(response.responseHeaders).filter(h => 
    h.toLowerCase().startsWith('cf-') ||
    h.toLowerCase().includes('cloudflare')
  );
  
  return analysis;
}

/**
 * Test all endpoints and show detailed header analysis
 */
async function testCloudflareHeaders() {
  console.log('🔍 Testing Cloudflare Header Injection');
  console.log('=====================================\n');
  
  const results = [];
  
  for (const endpoint of TEST_ENDPOINTS) {
    try {
      console.log(`\n📡 Testing: ${endpoint}`);
      console.log('─'.repeat(60));
      
      const response = await makeRequest(endpoint);
      const analysis = analyzeHeaders(response);
      results.push(analysis);
      
      // Display results
      console.log(`   Status: ${response.statusCode}`);
      
      if (analysis.isBlocked) {
        console.log(`   🔒 BLOCKED - Origin Lock is working`);
      } else if (analysis.isHealthCheck) {
        console.log(`   ✅ Health Check - Allowed (bypassed)`);
      } else {
        console.log(`   ✅ ALLOWED - Request succeeded`);
      }
      
      // Show all response headers
      console.log(`   📋 All Response Headers:`);
      Object.keys(response.responseHeaders).forEach(header => {
        const value = response.responseHeaders[header];
        console.log(`      ${header}: ${value}`);
      });
      
      // Highlight Origin Lock headers
      if (analysis.hasOriginHeader) {
        console.log(`   🔍 Origin Lock Headers Found:`);
        console.log(`      ${analysis.originHeaderValue}`);
      } else {
        console.log(`   ❌ No Origin Lock Headers Found`);
      }
      
      // Highlight Cloudflare headers
      if (analysis.cfHeaders.length > 0) {
        console.log(`   ☁️  Cloudflare Headers:`);
        analysis.cfHeaders.forEach(header => {
          console.log(`      ${header}: ${response.responseHeaders[header]}`);
        });
      }
      
      // Show response data if available
      if (response.data) {
        try {
          const jsonData = JSON.parse(response.data);
          console.log(`   📄 Response Data:`, JSON.stringify(jsonData, null, 2));
        } catch (e) {
          const preview = response.data.substring(0, 200);
          console.log(`   📄 Response: ${preview}${response.data.length > 200 ? '...' : ''}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      results.push({
        url: endpoint,
        error: error.message,
        statusCode: 'ERROR'
      });
    }
  }
  
  return results;
}

/**
 * Test with manual header to compare
 */
async function testWithManualHeader() {
  console.log('\n\n🔐 Testing with Manual Header');
  console.log('=============================\n');
  
  const testSecret = 'j5tNRc1kQpCUFwnY9cMcPpYrL2ShjQe7blN0Qhyf9rxl'; // From your CF rule
  const testEndpoint = 'https://api.ai2fin.com/health';
  
  try {
    console.log(`🧪 Testing with manual header: x-origin-auth: ${testSecret}`);
    
    const response = await makeRequest(testEndpoint, {
      headers: {
        'x-origin-auth': testSecret
      }
    });
    
    console.log(`   Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log(`   ✅ SUCCESS - Manual header works!`);
      console.log(`   📝 This confirms the secret is correct`);
    } else if (response.statusCode === 403) {
      console.log(`   🔒 BLOCKED - Even with manual header`);
      console.log(`   📝 This suggests the secret is wrong or there's another issue`);
    } else {
      console.log(`   ❓ Unexpected status: ${response.statusCode}`);
    }
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
}

/**
 * Summary analysis
 */
function analyzeResults(results) {
  console.log('\n\n📊 Analysis Summary');
  console.log('==================\n');
  
  const working = results.filter(r => r.isBlocked && !r.isHealthCheck).length;
  const bypassed = results.filter(r => r.isHealthCheck).length;
  const allowed = results.filter(r => !r.isBlocked && !r.isHealthCheck).length;
  const errors = results.filter(r => r.error).length;
  const hasOriginHeaders = results.filter(r => r.hasOriginHeader).length;
  
  console.log(`🔒 Blocked (Origin Lock Working): ${working}`);
  console.log(`✅ Health Checks (Bypassed): ${bypassed}`);
  console.log(`⚠️  Allowed (Potential Issue): ${allowed}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`🔍 Requests with Origin Headers: ${hasOriginHeaders}`);
  
  console.log('\n🔍 Cloudflare Header Analysis:');
  
  if (hasOriginHeaders > 0) {
    console.log('   ✅ Cloudflare IS adding Origin Lock headers');
    console.log('   🔍 Check if the header value matches your backend secret');
  } else {
    console.log('   ❌ Cloudflare is NOT adding Origin Lock headers');
    console.log('   🚨 Check your Cloudflare rule configuration');
  }
  
  console.log('\n💡 Recommendations:');
  
  if (hasOriginHeaders === 0) {
    console.log('   1. Check if Cloudflare rule is enabled');
    console.log('   2. Verify rule scope covers your domains');
    console.log('   3. Check if rule is in correct order');
    console.log('   4. Test rule with Cloudflare\'s rule tester');
  } else if (working === 0 && allowed > 0) {
    console.log('   1. Origin Lock headers are present but not working');
    console.log('   2. Check if header value matches ORIGIN_SHARED_SECRET');
    console.log('   3. Verify backend Origin Lock is enabled');
  } else if (working > 0) {
    console.log('   1. Origin Lock is working correctly');
    console.log('   2. Cloudflare is adding headers properly');
  }
}

// Main execution
async function main() {
  try {
    const results = await testCloudflareHeaders();
    await testWithManualHeader();
    analyzeResults(results);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testCloudflareHeaders, testWithManualHeader, analyzeResults };
