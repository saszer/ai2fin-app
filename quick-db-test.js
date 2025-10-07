#!/usr/bin/env node

/**
 * Quick Database Connectivity Test
 * embracingearth.space - Simple database health check
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkDocker() {
  log('🐳 Checking Docker status...', 'blue');
  try {
    const result = execSync('docker ps --format "table {{.Names}}\t{{.Status}}"', { encoding: 'utf8' });
    log('✅ Docker is running', 'green');
    
    if (result.includes('postgres')) {
      log('✅ PostgreSQL container found', 'green');
      return true;
    } else {
      log('⚠️  PostgreSQL container not found', 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ Docker is not running', 'red');
    log('Please start Docker Desktop first', 'yellow');
    return false;
  }
}

async function testConnection(databaseUrl, serviceName) {
  log(`\n🔍 Testing ${serviceName} database connection...`, 'blue');
  
  try {
    // Simple connection test using psql if available
    const connectionTest = `psql "${databaseUrl}" -c "SELECT 1;"`;
    execSync(connectionTest, { stdio: 'pipe' });
    log(`✅ ${serviceName} database connection successful`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${serviceName} database connection failed`, 'red');
    return false;
  }
}

async function main() {
  log('🚀 AI2 Database Quick Test', 'cyan');
  log('==========================', 'cyan');
  
  // Check Docker
  const dockerOk = await checkDocker();
  if (!dockerOk) {
    log('\n💡 To fix this:', 'yellow');
    log('1. Start Docker Desktop', 'yellow');
    log('2. Run: .\\start-databases.ps1', 'yellow');
    process.exit(1);
  }
  
  // Test connections
  const coreDbUrl = 'postgresql://postgres:password@127.0.0.1:5432/ai_financial_controller';
  const subsDbUrl = 'postgresql://postgres:password@127.0.0.1:5432/ai2_subscription';
  
  const coreOk = await testConnection(coreDbUrl, 'Core App');
  const subsOk = await testConnection(subsDbUrl, 'Subscription Service');
  
  // Summary
  log('\n📊 Test Results:', 'cyan');
  log('================', 'cyan');
  
  if (coreOk && subsOk) {
    log('🎉 All databases are accessible!', 'green');
    log('You can now start your services:', 'blue');
    log('  • Core App: npm start', 'blue');
    log('  • Subscription Service: npm start', 'blue');
  } else {
    log('⚠️  Some databases are not accessible', 'yellow');
    if (!coreOk) log('  • Core App database needs attention', 'red');
    if (!subsOk) log('  • Subscription Service database needs attention', 'red');
    
    log('\n💡 Try running: .\\start-databases.ps1', 'yellow');
  }
}

main().catch(error => {
  log(`❌ Test failed: ${error.message}`, 'red');
  process.exit(1);
});





