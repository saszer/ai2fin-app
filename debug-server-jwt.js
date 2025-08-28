// Debug server JWT secret
const http = require('http');

// Test endpoint to check server's JWT_SECRET
async function testServerJWT() {
  console.log('🔍 Testing Server JWT Configuration...\n');
  
  // Make a request to get a token
  const postData = JSON.stringify({
    email: 'test@embracingearth.space',
    password: 'TestPass123!'
  });
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/oidc/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  try {
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
      
      const jwt = require('jsonwebtoken');
      const token = response.data.token;
      
      // Decode without verification to see the payload
      const decoded = jwt.decode(token, { complete: true });
      console.log('\n📋 Token Header:', JSON.stringify(decoded?.header, null, 2));
      console.log('\n📋 Token Payload:', JSON.stringify(decoded?.payload, null, 2));
      
      // Test with the JWT_SECRET from environment
      const testSecret = process.env.JWT_SECRET;
      console.log('\n🔑 Test JWT_SECRET available:', !!testSecret);
      console.log('🔑 Test JWT_SECRET length:', testSecret ? testSecret.length : 0);
      
      if (testSecret) {
        try {
          const verified = jwt.verify(token, testSecret, {
            algorithms: ['HS256'],
            issuer: 'ai2-platform'
          });
          console.log('\n✅ Token verified successfully with test secret!');
          console.log('Verified payload:', JSON.stringify(verified, null, 2));
        } catch (error) {
          console.log('\n❌ Token verification failed with test secret:', error.message);
          
          // Try without issuer check
          try {
            const verifiedNoIssuer = jwt.verify(token, testSecret, {
              algorithms: ['HS256']
            });
            console.log('✅ Token verified without issuer check');
          } catch (e) {
            console.log('❌ Token verification failed even without issuer:', e.message);
          }
        }
      }
      
      // Test with a few common secrets to see if we can find the right one
      const commonSecrets = [
        'aifin-super-secret-jwt-key-2024-make-it-long-and-random',
        'aifin-super-secret-jwt-key-2024-make-it-long-and-random-embracingearth-space',
        'your_super_secure_jwt_secret_minimum_32_characters_embracingearth_space',
        'default-secret'
      ];
      
      console.log('\n🔍 Testing common JWT secrets...');
      for (const secret of commonSecrets) {
        try {
          jwt.verify(token, secret, { algorithms: ['HS256'] });
          console.log(`✅ Token verified with secret: ${secret.substring(0, 20)}...`);
          break;
        } catch (e) {
          console.log(`❌ Failed with secret: ${secret.substring(0, 20)}...`);
        }
      }
      
    } else {
      console.log('❌ Login failed:', response.status, response.data);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

testServerJWT();


