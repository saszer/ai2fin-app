// Simple auth test using built-in Node.js modules
const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3001';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request({
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testAuth() {
  console.log('🔍 Testing Authentication Flows...\n');
  
  // Test 1: Health check
  try {
    const health = await makeRequest(`${BASE_URL}/health`);
    console.log(`✅ Health Check: ${health.status} - ${health.status === 200 ? 'PASS' : 'FAIL'}`);
  } catch (e) {
    console.log(`❌ Health Check: FAIL - ${e.message}`);
  }
  
  // Test 2: /api/auth/me without auth
  try {
    const me = await makeRequest(`${BASE_URL}/api/auth/me`);
    console.log(`✅ /api/auth/me (no auth): ${me.status} - ${me.status === 200 && me.data.authenticated === false ? 'PASS' : 'FAIL'}`);
    console.log(`   Response: ${JSON.stringify(me.data)}`);
  } catch (e) {
    console.log(`❌ /api/auth/me (no auth): FAIL - ${e.message}`);
  }
  
  // Test 3: Protected endpoint without auth
  try {
    const permissions = await makeRequest(`${BASE_URL}/api/user/permissions`);
    console.log(`✅ /api/user/permissions (no auth): ${permissions.status} - ${permissions.status === 401 ? 'PASS' : 'FAIL'}`);
  } catch (e) {
    console.log(`❌ /api/user/permissions (no auth): FAIL - ${e.message}`);
  }
  
  // Test 4: Login attempt
  try {
    const login = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'test@example.com', password: 'testpassword123' }
    });
    console.log(`✅ Login attempt: ${login.status} - ${login.status === 200 ? 'PASS' : 'FAIL'}`);
    console.log(`   Response: ${JSON.stringify(login.data)}`);
    
    if (login.status === 200 && login.data.token) {
      // Test 5: Use Bearer token
      const meWithToken = await makeRequest(`${BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${login.data.token}` }
      });
      console.log(`✅ /api/auth/me (with token): ${meWithToken.status} - ${meWithToken.status === 200 && meWithToken.data.authenticated === true ? 'PASS' : 'FAIL'}`);
      console.log(`   Response: ${JSON.stringify(meWithToken.data)}`);
    }
  } catch (e) {
    console.log(`❌ Login attempt: FAIL - ${e.message}`);
  }
  
  console.log('\n🔍 Test Complete');
}

testAuth().catch(console.error);
