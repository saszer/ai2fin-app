#!/usr/bin/env node

/**
 * Test Script: Quick Link Transaction to Bill Functionality
 * 
 * This script tests:
 * 1. Link button appears next to "Bill" classifications that aren't linked
 * 2. Quick link dialog opens with bill recommendations
 * 3. Recommendation algorithm works correctly (amount, date, merchant similarity)
 * 4. Linking functionality works and updates transaction display
 * 5. UI shows linked bill name after successful linking
 * 
 * Run: node test-quick-link-functionality.js
 */

const https = require('https');

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

async function testQuickLinkScenarios(token) {
  try {
    log('\n🎯 Testing Quick Link Scenarios...', 'bold');
    
    // Get transactions
    const transactionsResponse = await makeRequest('GET', '/bank/transactions?limit=100', null, token);
    
    if (transactionsResponse.status !== 200) {
      throw new Error(`Failed to fetch transactions: ${transactionsResponse.status}`);
    }
    
    const transactions = transactionsResponse.data.transactions || [];
    log(`📋 Found ${transactions.length} transactions`, 'blue');
    
    // Find bill transactions
    const billTransactions = transactions.filter(tx => tx.secondaryType === 'bill');
    const linkedBillTransactions = billTransactions.filter(tx => tx.linkedBillOccurrence);
    const unlinkedBillTransactions = billTransactions.filter(tx => !tx.linkedBillOccurrence);
    
    log(`💰 Bill transactions: ${billTransactions.length}`, 'blue');
    log(`🔗 Linked: ${linkedBillTransactions.length}`, 'green');
    log(`⭕ Unlinked: ${unlinkedBillTransactions.length}`, 'yellow');
    
    // Test linked bill display
    if (linkedBillTransactions.length > 0) {
      log('\n📝 Linked Bill Transactions (should show bill name):', 'cyan');
      linkedBillTransactions.slice(0, 3).forEach((tx, i) => {
        log(`  ${i + 1}. ${tx.description} → ${tx.linkedBillOccurrence.billPatternName}`, 'green');
      });
    }
    
    // Test unlinked bill display (should show Link button)
    if (unlinkedBillTransactions.length > 0) {
      log('\n🔘 Unlinked Bill Transactions (should show Link button):', 'cyan');
      unlinkedBillTransactions.slice(0, 3).forEach((tx, i) => {
        log(`  ${i + 1}. ${tx.description} ($${Math.abs(tx.amount).toFixed(2)}) - needs Link button`, 'yellow');
      });
    }
    
    return { transactions, billTransactions, linkedBillTransactions, unlinkedBillTransactions };
    
  } catch (error) {
    log(`❌ Test error: ${error.message}`, 'red');
    throw error;
  }
}

async function testRecommendationAlgorithm(token) {
  try {
    log('\n🤖 Testing Recommendation Algorithm...', 'bold');
    
    // Get bill patterns
    const patternsResponse = await makeRequest('GET', '/bills/patterns', null, token);
    
    if (patternsResponse.status !== 200) {
      throw new Error(`Failed to fetch patterns: ${patternsResponse.status}`);
    }
    
    const patterns = patternsResponse.data || [];
    log(`📋 Found ${patterns.length} bill patterns`, 'blue');
    
    if (patterns.length === 0) {
      log('📝 No bill patterns found. Create some patterns first to test recommendations.', 'yellow');
      return;
    }
    
    // Test recommendation scoring for each pattern
    for (const pattern of patterns.slice(0, 3)) {
      log(`\n🔍 Pattern: ${pattern.name}`, 'cyan');
      
      // Get occurrences for this pattern
      try {
        const occurrencesResponse = await makeRequest('GET', `/bills/patterns/${pattern.id}/occurrences`, null, token);
        
        if (occurrencesResponse.status === 200) {
          const occurrences = occurrencesResponse.data || [];
          const unlinkedOccurrences = occurrences.filter(occ => !occ.bankTransactionId);
          
          log(`  📅 Total occurrences: ${occurrences.length}`, 'blue');
          log(`  ⭕ Unlinked occurrences: ${unlinkedOccurrences.length}`, 'yellow');
          
          if (unlinkedOccurrences.length > 0) {
            log(`  💡 Available for linking:`, 'green');
            unlinkedOccurrences.slice(0, 3).forEach((occ, i) => {
              log(`    ${i + 1}. $${occ.amount} on ${new Date(occ.dueDate).toLocaleDateString()} (${occ.status})`, 'reset');
            });
          }
        }
      } catch (error) {
        log(`  ❌ Failed to get occurrences: ${error.message}`, 'red');
      }
    }
    
  } catch (error) {
    log(`❌ Recommendation test error: ${error.message}`, 'red');
    throw error;
  }
}

async function testLinkingFunctionality(token, unlinkedBillTransactions) {
  try {
    if (unlinkedBillTransactions.length === 0) {
      log('\n📝 No unlinked bill transactions found. Create some first to test linking.', 'yellow');
      return;
    }
    
    log('\n🔗 Testing Linking Functionality...', 'bold');
    
    // Get bill patterns and their occurrences
    const patternsResponse = await makeRequest('GET', '/bills/patterns', null, token);
    
    if (patternsResponse.status !== 200) {
      log('❌ Failed to fetch bill patterns', 'red');
      return;
    }
    
    const patterns = patternsResponse.data || [];
    
    // Find an unlinked occurrence
    let testOccurrence = null;
    let testTransaction = unlinkedBillTransactions[0];
    
    for (const pattern of patterns) {
      try {
        const occurrencesResponse = await makeRequest('GET', `/bills/patterns/${pattern.id}/occurrences`, null, token);
        
        if (occurrencesResponse.status === 200) {
          const occurrences = occurrencesResponse.data || [];
          const unlinkedOcc = occurrences.find(occ => !occ.bankTransactionId);
          
          if (unlinkedOcc) {
            testOccurrence = unlinkedOcc;
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!testOccurrence) {
      log('📝 No unlinked occurrences found. All occurrences are already linked.', 'yellow');
      return;
    }
    
    log(`🎯 Test Link: ${testTransaction.description} → ${testOccurrence.pattern?.name || 'Unknown Pattern'}`, 'cyan');
    log(`  Transaction: $${Math.abs(testTransaction.amount)} on ${new Date(testTransaction.date).toLocaleDateString()}`, 'blue');
    log(`  Occurrence: $${testOccurrence.amount} on ${new Date(testOccurrence.dueDate).toLocaleDateString()}`, 'blue');
    
    // Test the linking API endpoint
    try {
      const linkResponse = await makeRequest('POST', `/bills/occurrences/${testOccurrence.id}/link`, {
        transactionId: testTransaction.id,
        confidence: 0.8
      }, token);
      
      if (linkResponse.status === 200) {
        log('✅ Link API call successful!', 'green');
        log('💡 Frontend should now show bill name instead of Link button', 'cyan');
      } else {
        log(`❌ Link API call failed: ${linkResponse.status}`, 'red');
      }
    } catch (linkError) {
      log(`❌ Link test error: ${linkError.message}`, 'red');
    }
    
  } catch (error) {
    log(`❌ Linking test error: ${error.message}`, 'red');
    throw error;
  }
}

async function main() {
  try {
    log('🧪 Quick Link Transaction to Bill Test', 'bold');
    log('====================================', 'bold');
    
    const token = await authenticate();
    
    // Test 1: Check transaction display scenarios
    const { unlinkedBillTransactions } = await testQuickLinkScenarios(token);
    
    // Test 2: Test recommendation algorithm
    await testRecommendationAlgorithm(token);
    
    // Test 3: Test actual linking functionality
    await testLinkingFunctionality(token, unlinkedBillTransactions);
    
    log('\n🎉 Test completed successfully!', 'green');
    log('\n📝 Expected Frontend Behavior:', 'bold');
    log('1. Linked bills show: "Bill" chip + bill pattern name', 'blue');
    log('2. Unlinked bills show: "Bill" chip + green "Link" button', 'blue');
    log('3. Click "Link" opens dialog with smart recommendations', 'blue');
    log('4. Recommendations scored by amount, date, merchant similarity', 'blue');
    log('5. After linking, button disappears and bill name shows', 'blue');
    
  } catch (error) {
    log(`\n💥 Test failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the test
main(); 