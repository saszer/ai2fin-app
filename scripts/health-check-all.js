#!/usr/bin/env node

const https = require('http');
const { featureFlags } = require('../shared/dist/index.js');

// Service endpoints configuration
const services = [
  { name: 'Core App', url: 'http://localhost:3001/health', emoji: '🏛️', required: true },
  { name: 'AI Modules', url: 'http://localhost:3002/health', emoji: '🤖', required: false },
  { name: 'Analytics', url: 'http://localhost:3004/health', emoji: '📊', required: false },
  { name: 'Connectors', url: 'http://localhost:3005/health', emoji: '🔗', required: false },
  { name: 'Notifications', url: 'http://localhost:3006/health', emoji: '🔔', required: false },
  { name: 'Subscription', url: 'http://localhost:3010/health', emoji: '💳', required: false },
];

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

function colorize(text, color) {
  return colors[color] + text + colors.reset;
}

function checkService(service) {
  return new Promise((resolve) => {
    const url = new URL(service.url);
    
    const req = https.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            ...service,
            status: 'healthy',
            responseTime: Date.now() - startTime,
            data: parsed
          });
        } catch (error) {
          resolve({
            ...service,
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            error: 'Invalid JSON response'
          });
        }
      });
    });

    const startTime = Date.now();
    
    req.on('error', (error) => {
      resolve({
        ...service,
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        ...service,
        status: 'timeout',
        responseTime: 5000,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

async function runHealthCheck() {
  console.log(colorize('\n🏥 AI2 Enterprise Platform Health Check', 'cyan'));
  console.log(colorize('==========================================\n', 'cyan'));

  // Show current deployment configuration
  console.log(colorize('📋 Deployment Configuration:', 'yellow'));
  
  try {
    const deploymentType = process.env.DEPLOYMENT_TYPE || 'DEFAULT';
    const businessModel = featureFlags.getBusinessModel();
    
    console.log(colorize(`   Deployment Type: ${deploymentType}`, 'white'));
    console.log(colorize(`   Business Model:  ${businessModel.toUpperCase()}`, 'white'));
    console.log(colorize(`   Node Environment: ${process.env.NODE_ENV || 'development'}`, 'white'));
    
    const enabledModules = featureFlags.getEnabledModules();
    console.log(colorize(`   Enabled Modules: ${enabledModules.join(', ')}`, 'white'));
    
  } catch (error) {
    console.log(colorize(`   ⚠️  Could not load feature flags: ${error.message}`, 'yellow'));
  }
  
  console.log('');

  // Check all services
  console.log(colorize('🔍 Checking Services:', 'yellow'));
  console.log('');

  const results = await Promise.all(services.map(checkService));

  // Display results
  let allHealthy = true;
  let coreHealthy = false;

  results.forEach(result => {
    const statusIcon = {
      'healthy': '✅',
      'unhealthy': '⚠️',
      'down': '❌',
      'timeout': '⏰'
    }[result.status] || '❓';

    const statusColor = {
      'healthy': 'green',
      'unhealthy': 'yellow',
      'down': 'red',
      'timeout': 'magenta'
    }[result.status] || 'gray';

    const serviceInfo = `${result.emoji} ${result.name}`.padEnd(20);
    const statusInfo = `${statusIcon} ${result.status.toUpperCase()}`.padEnd(15);
    const responseInfo = result.responseTime ? `(${result.responseTime}ms)` : '';

    console.log(
      colorize(serviceInfo, 'white') + 
      colorize(statusInfo, statusColor) + 
      colorize(responseInfo, 'gray')
    );

    if (result.name === 'Core App' && result.status === 'healthy') {
      coreHealthy = true;
    }

    if (result.required && result.status !== 'healthy') {
      allHealthy = false;
    }

    if (result.status !== 'healthy') {
      console.log(colorize(`    └─ ${result.error || 'Unknown error'}`, 'gray'));
    } else if (result.data && result.data.features) {
      const features = Object.entries(result.data.features)
        .filter(([_, enabled]) => enabled)
        .map(([name]) => name)
        .join(', ');
      
      if (features) {
        console.log(colorize(`    └─ Features: ${features}`, 'gray'));
      }
    }
  });

  console.log('');

  // Summary
  if (coreHealthy && allHealthy) {
    console.log(colorize('🎉 System Status: HEALTHY', 'green'));
    console.log(colorize('   All required services are operational', 'green'));
  } else if (coreHealthy) {
    console.log(colorize('⚠️  System Status: DEGRADED', 'yellow'));
    console.log(colorize('   Core service is healthy but some optional services are down', 'yellow'));
  } else {
    console.log(colorize('🚨 System Status: CRITICAL', 'red'));
    console.log(colorize('   Core service is not responding', 'red'));
  }

  console.log('');

  // Service URLs
  console.log(colorize('🌐 Service URLs:', 'cyan'));
  results.filter(r => r.status === 'healthy').forEach(result => {
    const baseUrl = result.url.replace('/health', '');
    console.log(colorize(`   ${result.emoji} ${result.name}: ${baseUrl}`, 'white'));
  });

  if (coreHealthy) {
    console.log(colorize('   🌐 Frontend: http://localhost:3000', 'white'));
  }

  console.log('');

  // Feature breakdown
  console.log(colorize('✨ Available Features:', 'cyan'));
  
  try {
    const flags = featureFlags.getFeatureFlags();
    const enabledFeatures = Object.entries(flags)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name.replace('enable', ''))
      .join(', ');
    
    console.log(colorize(`   ${enabledFeatures}`, 'white'));
    
    const businessModel = featureFlags.getBusinessModel();
    if (businessModel === 'core') {
      console.log(colorize('   💡 Upgrade available: Add AI, Analytics, or Enterprise features', 'yellow'));
    }
    
  } catch (error) {
    console.log(colorize('   ⚠️  Could not determine available features', 'yellow'));
  }

  console.log('');

  // Recommendations
  const downServices = results.filter(r => r.status !== 'healthy' && !r.required);
  if (downServices.length > 0) {
    console.log(colorize('💡 Recommendations:', 'cyan'));
    downServices.forEach(service => {
      console.log(colorize(`   • Start ${service.name} service for additional features`, 'white'));
    });
    console.log('');
  }

  // Exit code
  process.exit(coreHealthy ? 0 : 1);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error(colorize('❌ Unhandled error:', 'red'), error.message);
  process.exit(1);
});

// Run the health check
runHealthCheck().catch(error => {
  console.error(colorize('❌ Health check failed:', 'red'), error.message);
  process.exit(1);
}); 