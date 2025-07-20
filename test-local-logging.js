/**
 * 🧪 Local AI API Logging Test Script
 * 
 * This script tests that all OpenAI API calls are being logged to the /logs/ folder
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Local AI API Logging');
console.log('='.repeat(50));

// Test configuration
const testConfig = {
  aiModulesUrl: process.env.AI_MODULES_URL || 'http://localhost:3002',
  openaiConfigured: !!process.env.OPENAI_API_KEY,
  gptModel: process.env.AI_MODEL || 'gpt-4',
  logsDir: path.join(process.cwd(), 'logs')
};

console.log('📋 Configuration:');
console.log(`   🤖 AI Modules: ${testConfig.aiModulesUrl}`);
console.log(`   🔑 OpenAI Key: ${testConfig.openaiConfigured ? '✅ Configured' : '❌ Missing'}`);
console.log(`   🧠 GPT Model: ${testConfig.gptModel}`);
console.log(`   📁 Logs Directory: ${testConfig.logsDir}`);
console.log();

/**
 * Check log files
 */
function checkLogFiles() {
  console.log('📁 Checking log files...');
  
  const logFiles = [
    'api-requests.log',
    'api-errors.log', 
    'api-performance.log'
  ];
  
  logFiles.forEach(file => {
    const filePath = path.join(testConfig.logsDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(l => l.trim()).length;
      console.log(`   ✅ ${file}: ${stats.size} bytes, ${lines} entries`);
    } else {
      console.log(`   ❌ ${file}: Not found`);
    }
  });
  
  console.log();
}

/**
 * Watch log file for new entries
 */
function watchLogFile(callback) {
  const logFile = path.join(testConfig.logsDir, 'api-requests.log');
  
  if (!fs.existsSync(logFile)) {
    console.log('❌ api-requests.log not found, creating empty file...');
    fs.writeFileSync(logFile, '');
  }
  
  const initialLines = fs.readFileSync(logFile, 'utf-8').split('\n').filter(l => l.trim()).length;
  console.log(`📊 Starting log watch... Current entries: ${initialLines}`);
  
  let checkCount = 0;
  const maxChecks = 20; // Check for 20 seconds
  
  const watcher = setInterval(() => {
    checkCount++;
    const currentLines = fs.readFileSync(logFile, 'utf-8').split('\n').filter(l => l.trim()).length;
    
    if (currentLines > initialLines) {
      console.log(`🆕 New log entries detected! Total: ${currentLines} (+${currentLines - initialLines})`);
      clearInterval(watcher);
      callback(true);
    } else if (checkCount >= maxChecks) {
      console.log(`⏰ Timeout reached. No new entries detected.`);
      clearInterval(watcher);
      callback(false);
    } else {
      process.stdout.write('.');
    }
  }, 1000);
}

/**
 * Test single transaction classification
 */
async function testSingleTransaction() {
  console.log('🧪 Test: Single Transaction Classification');
  console.log('-'.repeat(40));
  
  const testTransaction = {
    description: 'Test Coffee Shop Purchase for Logging',
    amount: -4.50,
    date: new Date().toISOString(),
    merchant: 'Test Starbucks',
    userId: 'test-user-' + Date.now()
  };
  
  console.log(`📤 Sending transaction: ${testTransaction.description}`);
  console.log(`🔍 Watching logs for AI API calls...`);
  
  // Start watching logs
  const logPromise = new Promise((resolve) => {
    watchLogFile(resolve);
  });
  
  // Make AI request
  const requestPromise = axios.post(`${testConfig.aiModulesUrl}/api/ai/classify`, testTransaction, {
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' }
  }).catch(error => {
    console.error(`❌ Request failed: ${error.message}`);
    return null;
  });
  
  // Wait for both
  const [logDetected, response] = await Promise.all([logPromise, requestPromise]);
  
  if (logDetected) {
    console.log('\n✅ AI API call successfully logged!');
  } else {
    console.log('\n⚠️ No new log entries detected');
  }
  
  if (response) {
    console.log(`✅ Classification successful: ${response.data.result?.category || 'N/A'}`);
  }
  
  console.log();
}

/**
 * Show recent log entries
 */
function showRecentLogs() {
  console.log('📖 Recent Log Entries');
  console.log('-'.repeat(40));
  
  const logFile = path.join(testConfig.logsDir, 'api-requests.log');
  
  if (!fs.existsSync(logFile)) {
    console.log('❌ No api-requests.log file found');
    return;
  }
  
  const content = fs.readFileSync(logFile, 'utf-8');
  const lines = content.trim().split('\n').filter(l => l.trim()).slice(-3); // Last 3 entries
  
  if (lines.length === 0) {
    console.log('📝 No log entries found');
    return;
  }
  
  lines.forEach((line, index) => {
    try {
      const entry = JSON.parse(line);
      console.log(`📋 Entry ${index + 1}:`);
      console.log(`   🕒 Time: ${entry.timestamp}`);
      console.log(`   🔧 Service: ${entry.service}`);
      console.log(`   ⚙️ Method: ${entry.method}`);
      console.log(`   🤖 Model: ${entry.request?.model || 'N/A'}`);
      if (entry.response) {
        console.log(`   ✅ Success: ${entry.response.success}`);
        console.log(`   ⏱️ Time: ${entry.response.processingTimeMs}ms`);
        console.log(`   🎯 Tokens: ${entry.response.tokensUsed || 'N/A'}`);
      }
      console.log();
    } catch (error) {
      console.log(`   ❌ Failed to parse entry: ${line.substring(0, 100)}...`);
    }
  });
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🚀 Starting Local AI API Logging Tests...\n');
  
  // Check if AI modules service is available
  try {
    const response = await axios.get(`${testConfig.aiModulesUrl}/api/ai/health`, { timeout: 5000 });
    console.log('✅ AI Modules service is online');
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Features: ${response.data.features?.join(', ') || 'N/A'}\n`);
  } catch (error) {
    console.error('❌ AI Modules service is offline');
    console.log('   Please start it: cd ai2-ai-modules && npm start\n');
    return;
  }
  
  // Check existing log files
  checkLogFiles();
  
  // Test single transaction and log detection
  await testSingleTransaction();
  
  // Show recent logs
  showRecentLogs();
  
  console.log('🎉 Local AI API Logging Test Complete!');
  console.log('='.repeat(50));
  console.log();
  console.log('📁 Check your log files:');
  console.log(`   Main logs: ${path.join(testConfig.logsDir, 'api-requests.log')}`);
  console.log(`   Error logs: ${path.join(testConfig.logsDir, 'api-errors.log')}`);
  console.log(`   Performance: ${path.join(testConfig.logsDir, 'api-performance.log')}`);
  console.log();
  console.log('📖 To monitor logs in real-time:');
  console.log(`   tail -f ${path.join(testConfig.logsDir, 'api-requests.log')}`);
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test execution failed:', error.message);
  process.exit(1);
}); 