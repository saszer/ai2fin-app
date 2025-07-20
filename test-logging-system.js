const path = require('path');
const fs = require('fs');

// Test the logging system
console.log('🧪 Testing AI2 Logging System');
console.log('==============================');

// Test 1: Test basic logging functionality
console.log('1. Testing basic logging functionality...');

// Create a simple test that mimics what the OpenAI service does
const testLogEntry = {
  timestamp: new Date().toISOString(),
  sessionId: 'test-session-123',
  requestId: 'test-req-456',
  service: 'TestService',
  method: 'testMethod',
  request: {
    prompt: 'Test prompt for logging',
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7
  },
  response: {
    content: '{"test": "response"}',
    tokensUsed: 50,
    processingTimeMs: 1500,
    success: true,
    finishReason: 'completed'
  },
  metadata: {
    userId: 'test-user',
    transactionCount: 1,
    costEstimate: 0.025
  }
};

// Test 2: Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'ai2-ai-modules', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Created logs directory');
} else {
  console.log('✅ Logs directory exists');
}

// Test 3: Write a test log entry
const logFile = path.join(logsDir, 'api-requests.log');
const logLine = JSON.stringify(testLogEntry) + '\n';

try {
  fs.appendFileSync(logFile, logLine);
  console.log('✅ Successfully wrote test log entry');
} catch (error) {
  console.error('❌ Failed to write log entry:', error);
}

// Test 4: Read back the log entry
try {
  const logContent = fs.readFileSync(logFile, 'utf8');
  const lines = logContent.split('\n').filter(line => line.trim());
  console.log(`✅ Log file contains ${lines.length} entries`);
  
  if (lines.length > 0) {
    const lastEntry = JSON.parse(lines[lines.length - 1]);
    console.log('📝 Last log entry:', {
      timestamp: lastEntry.timestamp,
      service: lastEntry.service,
      method: lastEntry.method,
      success: lastEntry.response?.success
    });
  }
} catch (error) {
  console.error('❌ Failed to read log file:', error);
}

// Test 5: Test the actual logging system if available
console.log('\n2. Testing actual logging system...');

try {
  // Try to import the logging system
  const { apiLogger } = require('./ai2-ai-modules/dist/services/APILogger');
  
  // Test logging a request
  const requestId = apiLogger.logRequest(
    'TestService',
    'testLogging',
    'Test prompt for API logger',
    { model: 'gpt-3.5-turbo', maxTokens: 1000, temperature: 0.7 },
    { userId: 'test-user', transactionCount: 1, costEstimate: 0.025 }
  );
  
  console.log('✅ Successfully logged request with ID:', requestId);
  
  // Test logging a response
  apiLogger.logResponse(
    requestId,
    { test: 'response from logging system' },
    1200,
    45
  );
  
  console.log('✅ Successfully logged response');
  
  // Check if logs were written
  const logContent = fs.readFileSync(logFile, 'utf8');
  const lines = logContent.split('\n').filter(line => line.trim());
  console.log(`✅ Log file now contains ${lines.length} entries`);
  
} catch (error) {
  console.error('❌ Failed to test actual logging system:', error.message);
  console.log('ℹ️  This might be because the TypeScript hasn\'t been compiled yet');
}

console.log('\n3. Checking log file status...');
try {
  const stats = fs.statSync(logFile);
  console.log('✅ Log file size:', stats.size, 'bytes');
  console.log('✅ Log file last modified:', stats.mtime);
} catch (error) {
  console.error('❌ Log file not found:', error.message);
}

console.log('\n🎉 Logging system test completed!');
console.log('📁 Log file location:', logFile);
console.log('💡 To view logs: node ai2-ai-modules/log-viewer.js dashboard'); 