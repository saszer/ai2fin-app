#!/usr/bin/env node

// --- 📦 MICROSERVICES SECURITY AUDIT ---
// Tests authentication and connectivity for all services
// embracingearth.space

const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const chalk = require('chalk');

// Service configuration
const SERVICES = [
  { name: 'Core App', port: 3001, healthPath: '/health' },
  { name: 'AI Modules', port: 3002, healthPath: '/health' },
  { name: 'Connectors', port: 3003, healthPath: '/health' },
  { name: 'Analytics', port: 3004, healthPath: '/health' },
  { name: 'Notifications', port: 3005, healthPath: '/health' },
  { name: 'Subscription', port: 3010, healthPath: '/health' }
];

// Test endpoints requiring authentication
const PROTECTED_ENDPOINTS = [
  { service: 'Core App', port: 3001, path: '/api/user/profile', method: 'GET' },
  { service: 'AI Modules', port: 3002, path: '/api/ai/analyze', method: 'POST' },
  { service: 'Connectors', port: 3003, path: '/api/connectors/bank/connect', method: 'POST' },
  { service: 'Analytics', port: 3004, path: '/api/analytics/export', method: 'GET' },
  { service: 'Notifications', port: 3005, path: '/api/notifications/send', method: 'POST' },
  { service: 'Subscription', port: 3010, path: '/api/subscription/status', method: 'GET' }
];

// Audit results
const results = {
  services: {},
  security: {
    jwtSecret: false,
    serviceSecret: false,
    hardcodedSecrets: []
  },
  authentication: {},
  connectivity: {}
};

// Generate test JWT token
function generateTestToken() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error(chalk.red('❌ JWT_SECRET not configured'));
    return null;
  }
  
  return jwt.sign({
    userId: 'test_user_123',
    email: 'test@embracingearth.space',
    firstName: 'Test',
    lastName: 'User',
    businessType: 'business',
    countryCode: 'AU'
  }, secret, {
    algorithm: 'HS256',
    issuer: 'ai2-platform',
    expiresIn: '1h'
  });
}

// Test service health
async function testServiceHealth(service) {
  const url = `http://localhost:${service.port}${service.healthPath}`;
  
  try {
    const response = await fetch(url, { timeout: 5000 });
    const data = await response.json();
    
    return {
      online: response.ok,
      status: response.status,
      version: data.version || 'unknown',
      features: data.features || {}
    };
  } catch (error) {
    return {
      online: false,
      error: error.message
    };
  }
}

// Test protected endpoint
async function testProtectedEndpoint(endpoint, token) {
  const url = `http://localhost:${endpoint.port}${endpoint.path}`;
  
  try {
    // Test without token
    const noAuthResponse = await fetch(url, {
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' },
      body: endpoint.method === 'POST' ? JSON.stringify({}) : undefined,
      timeout: 5000
    });
    
    // Test with token
    const authResponse = await fetch(url, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: endpoint.method === 'POST' ? JSON.stringify({}) : undefined,
      timeout: 5000
    });
    
    return {
      withoutAuth: {
        status: noAuthResponse.status,
        rejected: noAuthResponse.status === 401 || noAuthResponse.status === 403
      },
      withAuth: {
        status: authResponse.status,
        authorized: authResponse.ok || authResponse.status !== 401
      }
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}

// Check for hardcoded secrets
function checkSecurityConfig() {
  const jwtSecret = process.env.JWT_SECRET;
  const serviceSecret = process.env.SERVICE_SECRET;
  
  results.security.jwtSecret = !!jwtSecret && jwtSecret.length > 32;
  results.security.serviceSecret = !!serviceSecret && serviceSecret.length > 16;
  
  // Check for common insecure patterns
  if (jwtSecret?.includes('default') || jwtSecret?.includes('secret-key')) {
    results.security.hardcodedSecrets.push('JWT_SECRET contains default value');
  }
  
  if (serviceSecret?.includes('default') || serviceSecret?.includes('secret')) {
    results.security.hardcodedSecrets.push('SERVICE_SECRET contains default value');
  }
}

// Main audit function
async function runAudit() {
  console.log(chalk.cyan('\n🔒 MICROSERVICES SECURITY AUDIT\n'));
  console.log(chalk.gray('=' .repeat(50)));
  
  // Check security configuration
  console.log(chalk.yellow('\n📋 Security Configuration:'));
  checkSecurityConfig();
  
  console.log(`  JWT Secret: ${results.security.jwtSecret ? chalk.green('✅ Configured') : chalk.red('❌ Missing/Weak')}`);
  console.log(`  Service Secret: ${results.security.serviceSecret ? chalk.green('✅ Configured') : chalk.red('❌ Missing/Weak')}`);
  
  if (results.security.hardcodedSecrets.length > 0) {
    console.log(chalk.red('  ⚠️  Security Issues:'));
    results.security.hardcodedSecrets.forEach(issue => {
      console.log(chalk.red(`    - ${issue}`));
    });
  }
  
  // Test service health
  console.log(chalk.yellow('\n🏥 Service Health Check:'));
  
  for (const service of SERVICES) {
    const health = await testServiceHealth(service);
    results.services[service.name] = health;
    
    const status = health.online 
      ? chalk.green(`✅ Online (v${health.version})`)
      : chalk.red(`❌ Offline${health.error ? ` - ${health.error}` : ''}`);
    
    console.log(`  ${service.name}: ${status}`);
  }
  
  // Test authentication
  console.log(chalk.yellow('\n🔐 Authentication Tests:'));
  
  const testToken = generateTestToken();
  if (!testToken) {
    console.log(chalk.red('  ❌ Cannot test - JWT_SECRET not configured'));
    return;
  }
  
  for (const endpoint of PROTECTED_ENDPOINTS) {
    const result = await testProtectedEndpoint(endpoint, testToken);
    results.authentication[`${endpoint.service}:${endpoint.path}`] = result;
    
    if (result.error) {
      console.log(`  ${endpoint.service} ${endpoint.path}: ${chalk.red('❌ Error -')} ${result.error}`);
    } else {
      const authStatus = result.withoutAuth.rejected 
        ? chalk.green('✅ Properly rejects unauthenticated')
        : chalk.red('❌ Allows unauthenticated access');
      
      const tokenStatus = result.withAuth.authorized
        ? chalk.green('✅ Accepts valid token')
        : chalk.red('❌ Rejects valid token');
      
      console.log(`  ${endpoint.service} ${endpoint.path}:`);
      console.log(`    Without auth: ${authStatus}`);
      console.log(`    With token: ${tokenStatus}`);
    }
  }
  
  // Summary
  console.log(chalk.yellow('\n📊 Audit Summary:'));
  console.log(chalk.gray('=' .repeat(50)));
  
  const onlineServices = Object.values(results.services).filter(s => s.online).length;
  const totalServices = Object.keys(results.services).length;
  const secureEndpoints = Object.values(results.authentication).filter(
    a => !a.error && a.withoutAuth?.rejected && a.withAuth?.authorized
  ).length;
  const totalEndpoints = Object.keys(results.authentication).length;
  
  console.log(`  Services Online: ${onlineServices}/${totalServices}`);
  console.log(`  Secure Endpoints: ${secureEndpoints}/${totalEndpoints}`);
  console.log(`  Security Config: ${results.security.jwtSecret && results.security.serviceSecret ? chalk.green('✅ Complete') : chalk.red('❌ Incomplete')}`);
  
  // Final verdict
  const isSecure = 
    results.security.jwtSecret && 
    results.security.serviceSecret && 
    results.security.hardcodedSecrets.length === 0 &&
    secureEndpoints === totalEndpoints;
  
  console.log(chalk.gray('=' .repeat(50)));
  if (isSecure) {
    console.log(chalk.green.bold('\n✅ AUDIT PASSED - System is secure for production\n'));
  } else {
    console.log(chalk.red.bold('\n❌ AUDIT FAILED - Security issues detected\n'));
    console.log(chalk.yellow('Fix all issues before deploying to production'));
  }
  
  // Export results
  require('fs').writeFileSync(
    'audit-results.json',
    JSON.stringify(results, null, 2)
  );
  console.log(chalk.gray('\nDetailed results saved to audit-results.json'));
}

// Run the audit
runAudit().catch(error => {
  console.error(chalk.red('Audit failed:'), error);
  process.exit(1);
});





