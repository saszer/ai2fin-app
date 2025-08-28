const axios = require('axios');

async function createFrontendUser() {
  console.log('🔧 Creating Frontend User...\n');
  
  const baseURL = 'http://localhost:3001';
  
  // User that the frontend is trying to use
  const frontendUser = {
    email: 'sz.sahaj@gmail.com',
    password: 'TestPass123!',
    firstName: 'Sahaj',
    lastName: 'Singh'
  };
  
  try {
    console.log('1️⃣ Creating user:', frontendUser.email);
    
    // Register the user
    const registerResponse = await axios.post(`${baseURL}/api/oidc/register`, frontendUser, {
      validateStatus: () => true
    });
    
    console.log('Register Status:', registerResponse.status);
    console.log('Register Response:', registerResponse.data);
    
    if (registerResponse.status === 200 || registerResponse.status === 201) {
      console.log('✅ User created successfully!');
      
      // Test login immediately
      console.log('\n2️⃣ Testing login with new user...');
      const loginResponse = await axios.post(`${baseURL}/api/oidc/login`, {
        email: frontendUser.email,
        password: frontendUser.password
      }, {
        validateStatus: () => true
      });
      
      console.log('Login Status:', loginResponse.status);
      
      if (loginResponse.status === 200) {
        console.log('✅ Login successful!');
        console.log('Token received:', !!loginResponse.data.token);
        
        // Test protected endpoint
        if (loginResponse.data.token) {
          console.log('\n3️⃣ Testing protected endpoint...');
          const testResponse = await axios.get(`${baseURL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${loginResponse.data.token}` },
            validateStatus: () => true
          });
          
          console.log(`/api/auth/me: ${testResponse.status} - authenticated: ${testResponse.data?.authenticated}`);
          
          if (testResponse.data?.authenticated) {
            console.log('✅ User is fully functional!');
            console.log('User data:', testResponse.data.user);
          }
        }
      } else {
        console.log('❌ Login failed:', loginResponse.data);
      }
      
    } else if (registerResponse.status === 409) {
      console.log('ℹ️ User already exists, trying different approach...');
      
      // Try to login with existing user using different passwords
      const passwords = ['TestPass123!', 'password123', 'Password123!'];
      
      for (const password of passwords) {
        console.log(`\n🔑 Trying password: ${password}`);
        
        const loginResponse = await axios.post(`${baseURL}/api/oidc/login`, {
          email: frontendUser.email,
          password: password
        }, {
          validateStatus: () => true
        });
        
        if (loginResponse.status === 200) {
          console.log('✅ Found working password!');
          console.log('Use this password in frontend:', password);
          return;
        }
      }
      
      console.log('❌ No working password found for existing user');
    } else {
      console.log('❌ Registration failed:', registerResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testWithWorkingUser() {
  console.log('\n🧪 Testing with known working user...\n');
  
  const baseURL = 'http://localhost:3001';
  const workingUser = {
    email: 'test@embracingearth.space',
    password: 'TestPass123!'
  };
  
  try {
    console.log('🔑 Testing login with:', workingUser.email);
    
    const loginResponse = await axios.post(`${baseURL}/api/oidc/login`, workingUser, {
      validateStatus: () => true
    });
    
    console.log('Login Status:', loginResponse.status);
    
    if (loginResponse.status === 200) {
      console.log('✅ Working user login successful');
      console.log('Token received:', !!loginResponse.data.token);
      
      // Test a few key endpoints
      const endpoints = [
        '/api/auth/me',
        '/api/country/preferences',
        '/api/user/permissions'
      ];
      
      console.log('\n📡 Testing key endpoints:');
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${baseURL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${loginResponse.data.token}` },
            validateStatus: () => true
          });
          
          const status = response.status === 200 ? '✅' : '❌';
          console.log(`  ${status} ${endpoint}: ${response.status}`);
          
        } catch (error) {
          console.log(`  ❌ ${endpoint}: ERROR`);
        }
      }
    } else {
      console.log('❌ Working user login failed:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error testing working user:', error.message);
  }
}

async function main() {
  await testWithWorkingUser();
  await createFrontendUser();
}

main();
