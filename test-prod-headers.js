#!/usr/bin/env node
/**
 * Test Production Headers - Check Origin Lock Implementation
 * embracingearth.space - Verify if Origin Lock headers are present in production
 */

const https = require('https');

// Test configuration
const TEST_ENDPOINTS = [
  'https://api.ai2fin.com/health',
  'https://api.ai2fin.com/api/health', 
  'https://api.ai2fin.com/api/core/status',
  'https://subscription.ai2fin.com/health'
];

/**
 * Make HTTP request and capture detailed response info
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
        'User-Agent': 'Origin-Lock-Test/1.0',
        'Accept': 'application/json',
        ...options.headers
      },
      timeout: 15000
    };
    
    console.log(`🔍 Testing: ${url}`);
    console.log(`   Method: ${requestOptions.method}`);
    console.log(`   Headers:`, Object.keys(requestOptions.headers).join(', '));
    
    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url: url,
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          requestHeaders: requestOptions.headers
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
 * Analyze response for Origin Lock indicators
 */
function analyzeResponse(response) {
  const analysis = {
    url: response.url,
    statusCode: response.statusCode,
    hasOriginHeader: false,
    originHeaderValue: null,
    isBlocked: false,
    isHealthCheck: false,
    responseHeaders: Object.keys(response.headers),
    serverInfo: null
  };
  
  // Check for Origin Lock header
  const originHeaders = Object.keys(response.headers).filter(h => 
    h.toLowerCase().includes('origin') || 
    h.toLowerCase().includes('auth') ||
    h.toLowerCase().includes('cf-')
  );
  
  if (originHeaders.length > 0) {
    analysis.hasOriginHeader = true;
    analysis.originHeaderValue = originHeaders.map(h => `${h}: ${response.headers[h]}`).join(', ');
  }
  
  // Check if request was blocked (403)
  analysis.isBlocked = response.statusCode === 403;
  
  // Check if it's a health check endpoint
  analysis.isHealthCheck = response.url.includes('/health');
  
  // Extract server info
  analysis.serverInfo = {
    server: response.headers['server'],
    poweredBy: response.headers['x-powered-by'],
    cfRay: response.headers['cf-ray'],
    cfCountry: response.headers['cf-ipcountry'],
    cfConnectingIp: response.headers['cf-connecting-ip']
  };
  
  return analysis;
}

/**
 * Test all endpoints
 */
async function testProductionHeaders() {
  console.log('🔒 Testing Production Origin Lock Headers');
  console.log('==========================================\n');
  
  const results = [];
  
  for (const endpoint of TEST_ENDPOINTS) {
    try {
      console.log(`\n📡 Testing: ${endpoint}`);
      console.log('─'.repeat(50));
      
      const response = await makeRequest(endpoint);
      const analysis = analyzeResponse(response);
      results.push(analysis);
      
      // Display results
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Server: ${analysis.serverInfo.server || 'Unknown'}`);
      console.log(`   CF-Ray: ${analysis.serverInfo.cfRay || 'None'}`);
      console.log(`   CF-Country: ${analysis.serverInfo.cfCountry || 'None'}`);
      
      if (analysis.hasOriginHeader) {
        console.log(`   🔍 Origin Headers: ${analysis.originHeaderValue}`);
      } else {
        console.log(`   ❌ No Origin Headers Found`);
      }
      
      if (analysis.isBlocked) {
        console.log(`   🔒 BLOCKED - Origin Lock is working!`);
      } else if (analysis.isHealthCheck) {
        console.log(`   ✅ Health Check - Allowed (bypassed)`);
      } else {
        console.log(`   ⚠️  ALLOWED - Origin Lock may not be working`);
      }
      
      // Show response headers
      console.log(`   📋 Response Headers: ${analysis.responseHeaders.join(', ')}`);
      
      // Show response data if available
      if (response.data) {
        try {
          const jsonData = JSON.parse(response.data);
          if (jsonData.error) {
            console.log(`   🚫 Error: ${jsonData.error}`);
          } else if (jsonData.status) {
            console.log(`   ✅ Status: ${jsonData.status}`);
          }
        } catch (e) {
          // Not JSON, show first 100 chars
          const preview = response.data.substring(0, 100);
          console.log(`   📄 Response: ${preview}${response.data.length > 100 ? '...' : ''}`);
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
 * Test with Origin Lock header
 */
async function testWithOriginHeader() {
  console.log('\n\n🔐 Testing with Origin Lock Header');
  console.log('===================================\n');
  
  const testSecret = 'test-origin-lock-secret';
  const testEndpoint = 'https://api.ai2fin.com/api/core/status';
  
  try {
    console.log(`🧪 Testing with header: x-origin-auth: ${testSecret}`);
    
    const response = await makeRequest(testEndpoint, {
      headers: {
        'x-origin-auth': testSecret
      }
    });
    
    console.log(`   Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log(`   ✅ SUCCESS - Request accepted with header`);
      console.log(`   📝 This suggests Origin Lock is working and validating headers`);
    } else if (response.statusCode === 403) {
      console.log(`   🔒 BLOCKED - Even with header, request was blocked`);
      console.log(`   📝 This suggests the secret doesn't match or Origin Lock is very strict`);
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
  
  console.log(`🔒 Blocked (Origin Lock Working): ${working}`);
  console.log(`✅ Health Checks (Bypassed): ${bypassed}`);
  console.log(`⚠️  Allowed (Potential Issue): ${allowed}`);
  console.log(`❌ Errors: ${errors}`);
  
  console.log('\n🔍 Origin Lock Status:');
  
  if (working > 0) {
    console.log('   ✅ Origin Lock is ACTIVE and working');
    console.log('   🔒 Direct access is being blocked');
  } else if (allowed > 0) {
    console.log('   ⚠️  Origin Lock may NOT be working');
    console.log('   🚨 Direct access is being allowed');
  } else {
    console.log('   ❓ Unable to determine Origin Lock status');
  }
  
  console.log('\n💡 Recommendations:');
  
  if (working === 0 && allowed > 0) {
    console.log('   1. Check if ENFORCE_CF_ORIGIN_LOCK=true in production');
    console.log('   2. Verify ORIGIN_SHARED_SECRET is set');
    console.log('   3. Ensure NODE_ENV=production');
    console.log('   4. Restart the application after setting variables');
  } else if (working > 0) {
    console.log('   1. Origin Lock is working correctly');
    console.log('   2. Cloudflare rule should add the required header');
    console.log('   3. Direct access should be blocked');
  }
}

// Main execution
async function main() {
  try {
    const results = await testProductionHeaders();
    await testWithOriginHeader();
    analyzeResults(results);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testProductionHeaders, testWithOriginHeader, analyzeResults };
