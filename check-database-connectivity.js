#!/usr/bin/env node

/**
 * Database Connectivity Test Script
 * Checks connectivity for both AI2 Core App and Subscription Service
 * embracingearth.space - Enterprise database monitoring
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function checkDockerServices() {
  logHeader('DOCKER SERVICES STATUS');
  
  try {
    const dockerPs = execSync('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"', { encoding: 'utf8' });
    log('Current Docker containers:', 'bright');
    console.log(dockerPs);
    
    // Check if PostgreSQL is running
    if (dockerPs.includes('postgres') || dockerPs.includes('ai_financial_db')) {
      logSuccess('PostgreSQL container is running');
    } else {
      logError('PostgreSQL container is not running');
      return false;
    }
    
    // Check if Redis is running
    if (dockerPs.includes('redis') || dockerPs.includes('ai_financial_redis')) {
      logSuccess('Redis container is running');
    } else {
      logWarning('Redis container is not running (optional)');
    }
    
    return true;
  } catch (error) {
    logError('Failed to check Docker services: ' + error.message);
    return false;
  }
}

async function testCoreAppDatabase() {
  logHeader('AI2 CORE APP DATABASE TEST');
  
  const coreAppPath = path.join(__dirname, 'ai2-core-app');
  const envPath = path.join(coreAppPath, '.env');
  
  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    logError('.env file not found in ai2-core-app');
    logInfo('Copy env.example to .env and configure DATABASE_URL');
    return false;
  }
  
  // Read .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbUrlMatch = envContent.match(/DATABASE_URL="?([^"\n]+)"?/);
  
  if (!dbUrlMatch) {
    logError('DATABASE_URL not found in .env file');
    return false;
  }
  
  const databaseUrl = dbUrlMatch[1];
  logInfo(`Database URL: ${databaseUrl.replace(/\/\/.*@/, '//***:***@')}`);
  
  try {
    // Create Prisma client with core app schema
    process.env.DATABASE_URL = databaseUrl;
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    });
    
    // Test connection
    await prisma.$connect();
    logSuccess('Core app database connection successful');
    
    // Test basic query
    const userCount = await prisma.user.count();
    logSuccess(`Core app database accessible - ${userCount} users found`);
    
    // Check if migrations are up to date
    try {
      const migrationStatus = execSync('npx prisma migrate status', { 
        cwd: coreAppPath, 
        encoding: 'utf8' 
      });
      if (migrationStatus.includes('Database schema is up to date')) {
        logSuccess('Core app database migrations are up to date');
      } else {
        logWarning('Core app database migrations may need attention');
        console.log(migrationStatus);
      }
    } catch (migrationError) {
      logWarning('Could not check migration status: ' + migrationError.message);
    }
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    logError('Core app database connection failed: ' + error.message);
    
    if (error.code === 'P1001') {
      logInfo('Database server is not reachable. Check if PostgreSQL is running.');
    } else if (error.code === 'P1002') {
      logInfo('Database server is reachable but database does not exist.');
    } else if (error.code === 'P1003') {
      logInfo('Database does not exist. Run migrations to create it.');
    }
    
    return false;
  }
}

async function testSubscriptionServiceDatabase() {
  logHeader('SUBSCRIPTION SERVICE DATABASE TEST');
  
  const subscriptionPath = path.join(__dirname, 'ai2-subscription-service');
  const envPath = path.join(subscriptionPath, '.env');
  
  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    logError('.env file not found in ai2-subscription-service');
    logInfo('Copy env.example to .env and configure DATABASE_URL');
    return false;
  }
  
  // Read .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbUrlMatch = envContent.match(/DATABASE_URL="?([^"\n]+)"?/);
  
  if (!dbUrlMatch) {
    logError('DATABASE_URL not found in .env file');
    return false;
  }
  
  const databaseUrl = dbUrlMatch[1];
  logInfo(`Database URL: ${databaseUrl.replace(/\/\/.*@/, '//***:***@')}`);
  
  try {
    // Create Prisma client with subscription service schema
    process.env.DATABASE_URL = databaseUrl;
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    });
    
    // Test connection
    await prisma.$connect();
    logSuccess('Subscription service database connection successful');
    
    // Test basic query
    const subscriptionCount = await prisma.subscription.count();
    logSuccess(`Subscription service database accessible - ${subscriptionCount} subscriptions found`);
    
    // Check if migrations are up to date
    try {
      const migrationStatus = execSync('npx prisma migrate status', { 
        cwd: subscriptionPath, 
        encoding: 'utf8' 
      });
      if (migrationStatus.includes('Database schema is up to date')) {
        logSuccess('Subscription service database migrations are up to date');
      } else {
        logWarning('Subscription service database migrations may need attention');
        console.log(migrationStatus);
      }
    } catch (migrationError) {
      logWarning('Could not check migration status: ' + migrationError.message);
    }
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    logError('Subscription service database connection failed: ' + error.message);
    
    if (error.code === 'P1001') {
      logInfo('Database server is not reachable. Check if PostgreSQL is running.');
    } else if (error.code === 'P1002') {
      logInfo('Database server is reachable but database does not exist.');
    } else if (error.code === 'P1003') {
      logInfo('Database does not exist. Run migrations to create it.');
    }
    
    return false;
  }
}

async function startDatabaseServices() {
  logHeader('STARTING DATABASE SERVICES');
  
  const coreAppPath = path.join(__dirname, 'ai2-core-app');
  const subscriptionPath = path.join(__dirname, 'ai2-subscription-service');
  
  try {
    // Start core app database
    logInfo('Starting core app database...');
    execSync('docker-compose up -d postgres redis', { 
      cwd: coreAppPath,
      stdio: 'inherit'
    });
    
    // Wait for database to be ready
    logInfo('Waiting for database to be ready...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Run migrations for core app
    logInfo('Running core app migrations...');
    execSync('npx prisma migrate deploy', { 
      cwd: coreAppPath,
      stdio: 'inherit'
    });
    
    // Run migrations for subscription service
    logInfo('Running subscription service migrations...');
    execSync('npx prisma migrate deploy', { 
      cwd: subscriptionPath,
      stdio: 'inherit'
    });
    
    logSuccess('Database services started and migrations completed');
    return true;
    
  } catch (error) {
    logError('Failed to start database services: ' + error.message);
    return false;
  }
}

async function main() {
  logHeader('AI2 DATABASE CONNECTIVITY CHECK');
  log('Checking database connectivity for both services...', 'bright');
  
  // Check Docker services
  const dockerRunning = await checkDockerServices();
  
  if (!dockerRunning) {
    logWarning('Docker services not running. Attempting to start them...');
    const started = await startDatabaseServices();
    if (!started) {
      logError('Failed to start database services. Please check your Docker setup.');
      process.exit(1);
    }
  }
  
  // Test core app database
  const coreDbOk = await testCoreAppDatabase();
  
  // Test subscription service database
  const subsDbOk = await testSubscriptionServiceDatabase();
  
  // Summary
  logHeader('SUMMARY');
  
  if (coreDbOk && subsDbOk) {
    logSuccess('All database connections are working correctly!');
    log('Both services should be able to start successfully.', 'green');
  } else {
    logError('Database connectivity issues detected:');
    if (!coreDbOk) {
      logError('- Core app database connection failed');
    }
    if (!subsDbOk) {
      logError('- Subscription service database connection failed');
    }
    
    log('\nRecommended actions:', 'yellow');
    log('1. Ensure PostgreSQL is running on the correct port', 'yellow');
    log('2. Check .env files have correct DATABASE_URL', 'yellow');
    log('3. Run database migrations: npx prisma migrate deploy', 'yellow');
    log('4. Verify database credentials and permissions', 'yellow');
  }
  
  log('\nFor more help, check the documentation in each service directory.', 'cyan');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection at: ' + promise + ' reason: ' + reason);
  process.exit(1);
});

// Run the main function
main().catch(error => {
  logError('Script failed: ' + error.message);
  process.exit(1);
});





