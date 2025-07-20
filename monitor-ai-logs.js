/**
 * 📊 AI API Log Monitor
 * 
 * Real-time monitoring of AI API calls logged to /logs/ folder
 */

const fs = require('fs');
const path = require('path');

console.log('📊 AI API Log Monitor');
console.log('='.repeat(50));

const logsDir = path.join(process.cwd(), 'logs');
const apiLogFile = path.join(logsDir, 'api-requests.log');
const errorLogFile = path.join(logsDir, 'api-errors.log');

console.log(`📁 Monitoring: ${logsDir}`);
console.log(`📝 API Requests: ${apiLogFile}`);
console.log(`❌ API Errors: ${errorLogFile}`);
console.log();

// Statistics
let totalRequests = 0;
let totalErrors = 0;
let totalTokens = 0;
let totalCost = 0;

/**
 * Parse and display a log entry
 */
function displayLogEntry(line, isError = false) {
  try {
    const entry = JSON.parse(line);
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    
    if (entry.service && entry.method) {
      // Request entry
      console.log(`🔵 [${timestamp}] REQUEST`);
      console.log(`   Service: ${entry.service}`);
      console.log(`   Method: ${entry.method}`);
      console.log(`   Model: ${entry.request?.model || 'N/A'}`);
      console.log(`   Tokens: ${entry.request?.maxTokens || 'N/A'}`);
      console.log(`   User: ${entry.metadata?.userId || 'N/A'}`);
      if (entry.metadata?.transactionCount) {
        console.log(`   Transactions: ${entry.metadata.transactionCount}`);
      }
      totalRequests++;
    } else if (entry.response) {
      // Response entry
      const icon = entry.response.success ? '✅' : '❌';
      console.log(`${icon} [${timestamp}] RESPONSE`);
      console.log(`   Success: ${entry.response.success}`);
      console.log(`   Time: ${entry.response.processingTimeMs}ms`);
      if (entry.response.tokensUsed) {
        console.log(`   Tokens Used: ${entry.response.tokensUsed}`);
        totalTokens += entry.response.tokensUsed;
        totalCost += (entry.response.tokensUsed * 0.00002); // Rough estimate
      }
      if (!entry.response.success) {
        totalErrors++;
      }
    } else if (entry.error) {
      // Error entry
      console.log(`❌ [${timestamp}] ERROR`);
      console.log(`   Message: ${entry.error.message}`);
      console.log(`   Code: ${entry.error.code || 'N/A'}`);
      totalErrors++;
    }
    
    console.log();
    
  } catch (error) {
    console.log(`⚠️ Failed to parse log entry: ${line.substring(0, 50)}...`);
  }
}

/**
 * Display statistics
 */
function displayStats() {
  console.log('📊 STATISTICS');
  console.log('-'.repeat(30));
  console.log(`   Total Requests: ${totalRequests}`);
  console.log(`   Total Errors: ${totalErrors}`);
  console.log(`   Total Tokens: ${totalTokens}`);
  console.log(`   Estimated Cost: $${totalCost.toFixed(4)}`);
  console.log(`   Success Rate: ${totalRequests > 0 ? ((totalRequests - totalErrors) / totalRequests * 100).toFixed(1) : 0}%`);
  console.log();
}

/**
 * Read existing log entries
 */
function readExistingLogs() {
  console.log('📖 Reading existing log entries...');
  
  if (fs.existsSync(apiLogFile)) {
    const content = fs.readFileSync(apiLogFile, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l.trim());
    
    console.log(`Found ${lines.length} existing entries\n`);
    
    if (lines.length > 0) {
      console.log('📋 Recent entries:');
      console.log('-'.repeat(30));
      
      // Show last 3 entries
      lines.slice(-3).forEach(line => {
        displayLogEntry(line);
      });
    }
  } else {
    console.log('📝 No existing api-requests.log file found');
  }
  
  displayStats();
}

/**
 * Watch for new log entries
 */
function watchLogs() {
  console.log('👀 Watching for new AI API calls...');
  console.log('   (Press Ctrl+C to stop)\n');
  
  // Ensure log file exists
  if (!fs.existsSync(apiLogFile)) {
    fs.writeFileSync(apiLogFile, '');
  }
  
  let lastSize = fs.statSync(apiLogFile).size;
  
  setInterval(() => {
    try {
      const currentSize = fs.statSync(apiLogFile).size;
      
      if (currentSize > lastSize) {
        // New content added
        const stream = fs.createReadStream(apiLogFile, {
          start: lastSize,
          end: currentSize - 1
        });
        
        let buffer = '';
        stream.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          
          // Process complete lines
          for (let i = 0; i < lines.length - 1; i++) {
            if (lines[i].trim()) {
              console.log('🆕 NEW API CALL:');
              displayLogEntry(lines[i]);
              displayStats();
            }
          }
          
          // Keep incomplete line for next chunk
          buffer = lines[lines.length - 1];
        });
        
        lastSize = currentSize;
      }
    } catch (error) {
      console.error('Error watching log file:', error.message);
    }
  }, 1000);
}

/**
 * Handle process exit
 */
process.on('SIGINT', () => {
  console.log('\n📊 Final Statistics:');
  displayStats();
  console.log('👋 AI API Log Monitor stopped');
  process.exit(0);
});

// Main execution
readExistingLogs();
watchLogs(); 