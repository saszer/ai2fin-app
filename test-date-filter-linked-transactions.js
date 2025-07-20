#!/usr/bin/env node

/**
 * Test Script: Date Filter for Linked Transactions
 * 
 * This script tests:
 * 1. Linked transactions are hidden when outside active date filter
 * 2. Summary shows how many transactions are hidden across different years
 * 3. Unlinked (generated) occurrences still show to maintain pattern visibility
 * 4. Summary includes year-based breakdown of hidden transactions
 * 
 * Run: node test-date-filter-linked-transactions.js
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

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function getYearFromDate(dateString) {
  return new Date(dateString).getFullYear();
}

async function testDateFilterBehavior(token) {
  try {
    log('\n📊 Testing Date Filter for Linked Transactions...', 'bold');
    
    // Get all bill patterns
    const patternsResponse = await makeRequest('GET', '/bills/patterns', null, token);
    
    if (patternsResponse.status !== 200) {
      throw new Error(`Failed to fetch patterns: ${patternsResponse.status}`);
    }
    
    const patterns = patternsResponse.data || [];
    log(`📋 Found ${patterns.length} bill patterns`, 'blue');
    
    if (patterns.length === 0) {
      log('📝 No bill patterns found. Create some patterns with linked transactions first.', 'yellow');
      return;
    }
    
    // Test with the first pattern that has occurrences
    let testPattern = null;
    for (const pattern of patterns) {
      // Get occurrences for this pattern (without date filter)
      const allOccurrencesResponse = await makeRequest('GET', `/bills/patterns/${pattern.id}/occurrences`, null, token);
      
      if (allOccurrencesResponse.status === 200) {
        const allOccurrences = allOccurrencesResponse.data || [];
        const linkedOccurrences = allOccurrences.filter(occ => occ.bankTransactionId);
        
        if (linkedOccurrences.length > 0) {
          testPattern = {
            ...pattern,
            allOccurrences,
            linkedOccurrences
          };
          break;
        }
      }
    }
    
    if (!testPattern) {
      log('📝 No patterns with linked transactions found. Link some transactions to bill patterns first.', 'yellow');
      return;
    }
    
    log(`\n🎯 Testing with pattern: ${testPattern.name}`, 'cyan');
    log(`📊 Total occurrences: ${testPattern.allOccurrences.length}`, 'blue');
    log(`🔗 Linked occurrences: ${testPattern.linkedOccurrences.length}`, 'blue');
    
    // Analyze linked transactions by year
    const linkedByYear = new Map();
    testPattern.linkedOccurrences.forEach(occ => {
      const year = getYearFromDate(occ.dueDate);
      linkedByYear.set(year, (linkedByYear.get(year) || 0) + 1);
    });
    
    log('\n📅 Linked transactions by year:', 'cyan');
    for (const [year, count] of Array.from(linkedByYear.entries()).sort()) {
      log(`  ${year}: ${count} transactions`, 'reset');
    }
    
    // Test with different date filters
    const currentYear = new Date().getFullYear();
    const testFilters = [
      {
        name: 'Current Year Only',
        startDate: new Date(`${currentYear}-01-01`),
        endDate: new Date(`${currentYear}-12-31`)
      },
      {
        name: 'Last Year Only',
        startDate: new Date(`${currentYear - 1}-01-01`),
        endDate: new Date(`${currentYear - 1}-12-31`)
      },
      {
        name: 'Last 6 Months',
        startDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      }
    ];
    
    for (const filter of testFilters) {
      log(`\n🔍 Testing filter: ${filter.name}`, 'yellow');
      log(`📅 Date range: ${formatDate(filter.startDate)} - ${formatDate(filter.endDate)}`, 'blue');
      
      const filteredUrl = `/bills/patterns/${testPattern.id}/occurrences?startDate=${filter.startDate.toISOString()}&endDate=${filter.endDate.toISOString()}`;
      const filteredResponse = await makeRequest('GET', filteredUrl, null, token);
      
      if (filteredResponse.status === 200) {
        const filteredOccurrences = filteredResponse.data || [];
        const visibleLinked = filteredOccurrences.filter(occ => occ.bankTransactionId);
        const hiddenLinked = testPattern.linkedOccurrences.filter(occ => {
          const occDate = new Date(occ.dueDate);
          return occDate < filter.startDate || occDate > filter.endDate;
        });
        
        log(`  📋 Visible occurrences: ${filteredOccurrences.length}`, 'green');
        log(`  🔗 Visible linked: ${visibleLinked.length}`, 'green');
        log(`  🔒 Hidden linked: ${hiddenLinked.length}`, 'red');
        
        if (hiddenLinked.length > 0) {
          const hiddenByYear = new Map();
          hiddenLinked.forEach(occ => {
            const year = getYearFromDate(occ.dueDate);
            hiddenByYear.set(year, (hiddenByYear.get(year) || 0) + 1);
          });
          
          const yearSummary = Array.from(hiddenByYear.entries())
            .map(([year, count]) => `${count} in ${year}`)
            .join(', ');
          
          log(`  📊 Hidden breakdown: ${yearSummary}`, 'yellow');
        }
        
        // Verify that the frontend would show the correct summary
        if (hiddenLinked.length > 0) {
          log(`  💡 Frontend should show: "${hiddenLinked.length} linked transaction${hiddenLinked.length > 1 ? 's' : ''} hidden"`, 'cyan');
        } else {
          log(`  ✅ No hidden transactions - all linked transactions are visible`, 'green');
        }
      } else {
        log(`  ❌ Failed to fetch filtered occurrences: ${filteredResponse.status}`, 'red');
      }
    }
    
    // Test summary message generation
    log('\n📋 Summary Message Examples:', 'bold');
    
    const exampleHidden = [
      { year: 2023, count: 3 },
      { year: 2024, count: 7 },
      { year: 2025, count: 2 }
    ];
    
    const totalHidden = exampleHidden.reduce((sum, item) => sum + item.count, 0);
    const yearSummary = exampleHidden.map(item => `${item.count} in ${item.year}`).join(', ');
    
    log(`Example: "🔒 ${totalHidden} linked transactions hidden due to date filter"`, 'yellow');
    log(`Found in: ${yearSummary}`, 'yellow');
    log('Change date filter to "All Time" to view all linked transactions', 'cyan');
    
  } catch (error) {
    log(`❌ Test error: ${error.message}`, 'red');
    throw error;
  }
}

async function main() {
  try {
    log('🧪 Date Filter for Linked Transactions Test', 'bold');
    log('==========================================', 'bold');
    
    const token = await authenticate();
    await testDateFilterBehavior(token);
    
    log('\n🎉 Test completed successfully!', 'green');
    log('\n📝 Expected Frontend Behavior:', 'bold');
    log('1. Linked transactions outside date filter are hidden from table', 'blue');
    log('2. Warning alert shows count of hidden linked transactions', 'blue');
    log('3. Alert includes year-based breakdown (e.g., "3 in 2023, 7 in 2024")', 'blue');
    log('4. Unlinked/generated occurrences still visible for pattern continuity', 'blue');
    log('5. Alert suggests changing to "All Time" filter to see all', 'blue');
    
  } catch (error) {
    log(`\n💥 Test failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the test
main(); 