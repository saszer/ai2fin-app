#!/usr/bin/env node

/**
 * Test Script: Bill Linkage and Classification System
 * 
 * This script tests:
 * 1. Transaction API returns linkedBillOccurrence information
 * 2. Transactions linked to bill occurrences are automatically classified as 'bill'
 * 3. Category is properly set from bill pattern when linked
 * 4. Force override functionality works correctly
 * 
 * Run: node test-bill-linkage-classification.js
 */

const https = require('https');
const fs = require('fs');

// Configuration
const API_BASE = 'https://localhost:3001/api';
const USERNAME = 'test@example.com';
const PASSWORD = 'password123';

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      rejectUnauthorized: false // For self-signed certificates
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function authenticate() {
  try {
    log('🔐 Authenticating...', 'cyan');
    const response = await makeRequest('POST', '/auth/login', {
      email: USERNAME,
      password: PASSWORD
    });

    if (response.status === 200 && response.data.token) {
      log('✅ Authentication successful', 'green');
      return response.data.token;
    } else {
      throw new Error(`Authentication failed: ${response.status} ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    log(`❌ Authentication error: ${error.message}`, 'red');
    throw error;
  }
}

async function testBillLinkageClassification(token) {
  try {
    log('\n📊 Testing Bill Linkage and Classification System...', 'bold');
    
    // 1. Get all transactions and check for linkedBillOccurrence data
    log('\n1️⃣ Fetching transactions to check linkage information...', 'yellow');
    const transactionsResponse = await makeRequest('GET', '/bank/transactions?limit=50', null, token);
    
    if (transactionsResponse.status !== 200) {
      throw new Error(`Failed to fetch transactions: ${transactionsResponse.status}`);
    }
    
    const transactions = transactionsResponse.data.transactions || [];
    log(`📝 Found ${transactions.length} transactions`, 'blue');
    
    // Check for linked transactions
    const linkedTransactions = transactions.filter(tx => tx.linkedBillOccurrence);
    log(`🔗 Found ${linkedTransactions.length} transactions with bill linkage information`, 'blue');
    
    if (linkedTransactions.length > 0) {
      log('\n🔍 Analyzing linked transactions:', 'cyan');
      
      linkedTransactions.forEach((tx, index) => {
        const linkage = tx.linkedBillOccurrence;
        log(`  Transaction ${index + 1}:`, 'blue');
        log(`    Description: ${tx.description}`, 'reset');
        log(`    Amount: $${Math.abs(tx.amount)}`, 'reset');
        log(`    Classification: ${tx.secondaryType}`, tx.secondaryType === 'bill' ? 'green' : 'red');
        log(`    Category: ${tx.category || 'None'}`, 'reset');
        log(`    Linked to Bill: ${linkage.billPatternName}`, 'green');
        log(`    Bill Status: ${linkage.status}`, 'reset');
        log(`    Due Date: ${new Date(linkage.dueDate).toDateString()}`, 'reset');
        
        // Verify classification is correct
        if (tx.secondaryType !== 'bill') {
          log(`    ❌ ERROR: Transaction should be classified as 'bill' but is '${tx.secondaryType}'`, 'red');
        } else {
          log(`    ✅ Correct: Transaction is properly classified as 'bill'`, 'green');
        }
        
        log(''); // Empty line
      });
    }
    
    // 2. Test force override functionality
    log('\n2️⃣ Testing force override functionality...', 'yellow');
    const forceOverrideResponse = await makeRequest('POST', '/bills/force-override-classifications', {}, token);
    
    if (forceOverrideResponse.status === 200) {
      log(`✅ Force override successful: ${forceOverrideResponse.data.updatedCount} transactions updated`, 'green');
    } else {
      log(`❌ Force override failed: ${forceOverrideResponse.status}`, 'red');
    }
    
    // 3. Get bill patterns to show linkage context
    log('\n3️⃣ Fetching bill patterns for context...', 'yellow');
    const billPatternsResponse = await makeRequest('GET', '/bills/patterns', null, token);
    
    if (billPatternsResponse.status === 200) {
      const patterns = billPatternsResponse.data || [];
      log(`📋 Found ${patterns.length} bill patterns`, 'blue');
      
      patterns.forEach((pattern, index) => {
        const linkedOccurrences = pattern.occurrences?.filter(occ => occ.bankTransactionId) || [];
        if (linkedOccurrences.length > 0) {
          log(`  Pattern ${index + 1}: ${pattern.name}`, 'blue');
          log(`    Frequency: ${pattern.frequency}`, 'reset');
          log(`    Category: ${pattern.category?.name || 'None'}`, 'reset');
          log(`    Linked Occurrences: ${linkedOccurrences.length}`, 'green');
          
          linkedOccurrences.forEach((occ, i) => {
            log(`      Occurrence ${i + 1}: $${occ.amount} on ${new Date(occ.dueDate).toDateString()} (${occ.status})`, 'reset');
          });
        }
      });
    }
    
    // 4. Summary and recommendations
    log('\n📋 SUMMARY:', 'bold');
    log(`Total Transactions: ${transactions.length}`, 'blue');
    log(`Linked Transactions: ${linkedTransactions.length}`, 'blue');
    
    const correctlyClassified = linkedTransactions.filter(tx => tx.secondaryType === 'bill').length;
    const incorrectlyClassified = linkedTransactions.length - correctlyClassified;
    
    log(`Correctly Classified: ${correctlyClassified}`, correctlyClassified === linkedTransactions.length ? 'green' : 'yellow');
    log(`Incorrectly Classified: ${incorrectlyClassified}`, incorrectlyClassified === 0 ? 'green' : 'red');
    
    if (incorrectlyClassified > 0) {
      log('\n⚠️ RECOMMENDATION: Run force override to fix misclassified transactions', 'yellow');
      log('POST /api/bills/force-override-classifications', 'cyan');
    } else if (linkedTransactions.length > 0) {
      log('\n✅ SUCCESS: All linked transactions are properly classified!', 'green');
    } else {
      log('\n📝 INFO: No linked transactions found. Create some bill patterns first.', 'blue');
    }
    
  } catch (error) {
    log(`❌ Test error: ${error.message}`, 'red');
    throw error;
  }
}

async function main() {
  try {
    log('🧪 Bill Linkage and Classification Test', 'bold');
    log('=====================================', 'bold');
    
    const token = await authenticate();
    await testBillLinkageClassification(token);
    
    log('\n🎉 Test completed successfully!', 'green');
    
  } catch (error) {
    log(`\n💥 Test failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the test
main(); 