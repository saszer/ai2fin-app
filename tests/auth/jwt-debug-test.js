// JWT Token Debug Test
// embracingearth.space - JWT verification testing for CI/CD
const jwt = require('jsonwebtoken');

/**
 * Debug JWT Token verification
 * @param {string} token - JWT token to debug
 * @param {string} secret - JWT secret for verification
 * @returns {Object} Debug results
 */
function debugJWTToken(token, secret) {
  const results = {
    timestamp: new Date().toISOString(),
    token: token ? token.substring(0, 50) + '...' : 'No token provided',
    secretAvailable: !!secret,
    secretLength: secret ? secret.length : 0,
    decoded: null,
    verified: null,
    errors: []
  };

  console.log('🔍 Debugging JWT Token...\n');
  console.log('JWT_SECRET available:', results.secretAvailable);
  console.log('JWT_SECRET length:', results.secretLength);

  if (!secret) {
    const error = 'JWT_SECRET not found in environment';
    console.log('❌', error);
    results.errors.push(error);
    return results;
  }

  if (!token) {
    const error = 'No token provided for debugging';
    console.log('❌', error);
    results.errors.push(error);
    return results;
  }

  try {
    // Decode without verification first
    const decoded = jwt.decode(token, { complete: true });
    results.decoded = decoded;
    console.log('\n📋 Token Header:', JSON.stringify(decoded?.header, null, 2));
    console.log('\n📋 Token Payload:', JSON.stringify(decoded?.payload, null, 2));
    
    // Try to verify
    const verified = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'ai2-platform'
    });
    
    results.verified = verified;
    console.log('\n✅ Token Verification Successful!');
    console.log('Verified Payload:', JSON.stringify(verified, null, 2));
    
    // Check what user ID fields are available
    console.log('\n🔍 User ID Fields:');
    console.log('- sub:', verified.sub);
    console.log('- userId:', verified.userId);
    console.log('- id:', verified.id);
    
  } catch (error) {
    console.log('\n❌ Token Verification Failed:', error.message);
    results.errors.push(`Verification failed: ${error.message}`);
    
    // Try without issuer check
    try {
      const verifiedWithoutIssuer = jwt.verify(token, secret, {
        algorithms: ['HS256']
      });
      console.log('\n✅ Token verified without issuer check');
      console.log('Payload:', JSON.stringify(verifiedWithoutIssuer, null, 2));
      results.verified = verifiedWithoutIssuer;
    } catch (e) {
      console.log('❌ Token verification failed even without issuer check:', e.message);
      results.errors.push(`Verification without issuer failed: ${e.message}`);
    }
  }

  return results;
}

/**
 * Test JWT token from login endpoint
 * @param {string} baseUrl - Base URL for API
 * @param {Object} testUser - Test user credentials
 * @param {string} jwtSecret - JWT secret for verification
 */
async function testJWTFromLogin(baseUrl = 'http://localhost:3001', testUser = { email: 'test@embracingearth.space', password: 'TestPass123!' }, jwtSecret) {
  console.log('\n🎫 Testing JWT from Login Endpoint...');
  
  const http = require('http');
  const { URL } = require('url');
  
  try {
    // Make login request
    const loginUrl = `${baseUrl}/api/oidc/login`;
    const urlObj = new URL(loginUrl);
    
    const postData = JSON.stringify(testUser);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, data: jsonData });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
    
    if (response.status === 200 && response.data.token) {
      console.log('✅ Login successful, token received');
      return debugJWTToken(response.data.token, jwtSecret);
    } else {
      console.log('❌ Login failed:', response.status, response.data);
      return {
        timestamp: new Date().toISOString(),
        errors: [`Login failed: ${response.status} - ${JSON.stringify(response.data)}`]
      };
    }
  } catch (error) {
    console.log('❌ Login request failed:', error.message);
    return {
      timestamp: new Date().toISOString(),
      errors: [`Login request failed: ${error.message}`]
    };
  }
}

// Export for use in other tests
module.exports = { debugJWTToken, testJWTFromLogin };

// Run test if called directly
if (require.main === module) {
  const jwtSecret = process.env.JWT_SECRET;
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3001';
  const testUser = {
    email: process.env.TEST_USER_EMAIL || 'test@embracingearth.space',
    password: process.env.TEST_USER_PASSWORD || 'TestPass123!'
  };
  
  testJWTFromLogin(baseUrl, testUser, jwtSecret).then(results => {
    // Write results to file for CI/CD
    const fs = require('fs');
    fs.writeFileSync('jwt-debug-results.json', JSON.stringify(results, null, 2));
    
    const hasErrors = results.errors && results.errors.length > 0;
    process.exit(hasErrors ? 1 : 0);
  }).catch(error => {
    console.error('❌ JWT debug test failed:', error);
    process.exit(1);
  });
}


