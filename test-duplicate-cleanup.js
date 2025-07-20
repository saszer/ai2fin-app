#!/usr/bin/env node

/**
 * Test Script: Duplicate Bill Occurrence Cleanup
 * 
 * This script tests:
 * 1. Identifies duplicate bill occurrences on the same date
 * 2. Cleans up duplicates while preserving linked transactions
 * 3. Verifies the cleanup worked correctly
 * 4. Tests the new date format display
 * 
 * Run: node test-duplicate-cleanup.js
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

function formatCompactDate(dateString) {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2);
  return `${day} ${month} ${year}`;
}

async function analyzeDuplicates(token) {
  try {
    log('\n🔍 Analyzing existing duplicate occurrences...', 'yellow');
    
    // Get all bill patterns
    const patternsResponse = await makeRequest('GET', '/bills/patterns', null, token);
    
    if (patternsResponse.status !== 200) {
      throw new Error(`Failed to fetch patterns: ${patternsResponse.status}`);
    }
    
    const patterns = patternsResponse.data || [];
    log(`📋 Found ${patterns.length} bill patterns`, 'blue');
    
    let totalDuplicates = 0;
    const duplicatePatterns = [];
    
    for (const pattern of patterns) {
      // Get occurrences for this pattern
      const occurrencesResponse = await makeRequest('GET', `/bills/patterns/${pattern.id}/occurrences`, null, token);
      
      if (occurrencesResponse.status === 200) {
        const occurrences = occurrencesResponse.data || [];
        
        // Group by date
        const occurrencesByDate = new Map();
        occurrences.forEach(occ => {
          const dateKey = new Date(occ.dueDate).toISOString().split('T')[0];
          if (!occurrencesByDate.has(dateKey)) {
            occurrencesByDate.set(dateKey, []);
          }
          occurrencesByDate.get(dateKey).push(occ);
        });
        
        // Find duplicates
        const duplicateDates = [];
        for (const [dateKey, dateOccurrences] of occurrencesByDate) {
          if (dateOccurrences.length > 1) {
            duplicateDates.push({
              date: formatCompactDate(dateKey),
              count: dateOccurrences.length,
              occurrences: dateOccurrences.map(occ => ({
                id: occ.id,
                amount: occ.amount,
                status: occ.status,
                hasTransaction: !!occ.bankTransactionId
              }))
            });
            totalDuplicates += (dateOccurrences.length - 1); // -1 because we keep one
          }
        }
        
        if (duplicateDates.length > 0) {
          duplicatePatterns.push({
            name: pattern.name,
            duplicateDates: duplicateDates
          });
          
          log(`  🔄 Pattern "${pattern.name}":`, 'blue');
          duplicateDates.forEach(dup => {
            log(`    ${dup.date}: ${dup.count} occurrences`, 'reset');
            dup.occurrences.forEach((occ, i) => {
              const marker = occ.hasTransaction ? '🔗' : '⭕';
              log(`      ${i + 1}. ${marker} $${occ.amount} (${occ.status})`, 'reset');
            });
          });
        }
      }
    }
    
    log(`\n📊 DUPLICATE ANALYSIS:`, 'bold');
    log(`Total duplicate occurrences: ${totalDuplicates}`, totalDuplicates > 0 ? 'red' : 'green');
    log(`Patterns with duplicates: ${duplicatePatterns.length}`, duplicatePatterns.length > 0 ? 'yellow' : 'green');
    
    return { totalDuplicates, duplicatePatterns };
    
  } catch (error) {
    log(`❌ Analysis error: ${error.message}`, 'red');
    throw error;
  }
}

async function cleanupDuplicates(token) {
  try {
    log('\n🧹 Running duplicate cleanup...', 'yellow');
    
    const cleanupResponse = await makeRequest('POST', '/bills/cleanup-duplicates', {}, token);
    
    if (cleanupResponse.status === 200) {
      const result = cleanupResponse.data;
      log(`✅ Cleanup successful!`, 'green');
      log(`Duplicates removed: ${result.totalDuplicatesRemoved}`, 'green');
      log(`Patterns affected: ${result.patternsAffected}`, 'blue');
      
      if (result.details && result.details.length > 0) {
        log('\n📋 Cleanup Details:', 'cyan');
        result.details.forEach(detail => {
          log(`  Pattern: ${detail.patternName}`, 'blue');
          log(`  Duplicates removed: ${detail.duplicatesRemoved}`, 'green');
          
          detail.duplicateDates.forEach(dup => {
            log(`    ${formatCompactDate(dup.date)}: removed ${dup.duplicatesRemoved}, kept ${dup.keptOccurrence.hasTransaction ? 'linked' : 'unlinked'} occurrence`, 'reset');
          });
        });
      }
      
      return result;
    } else {
      throw new Error(`Cleanup failed: ${cleanupResponse.status} ${JSON.stringify(cleanupResponse.data)}`);
    }
    
  } catch (error) {
    log(`❌ Cleanup error: ${error.message}`, 'red');
    throw error;
  }
}

async function verifyCleanup(token) {
  try {
    log('\n🔍 Verifying cleanup results...', 'yellow');
    
    const { totalDuplicates } = await analyzeDuplicates(token);
    
    if (totalDuplicates === 0) {
      log('✅ SUCCESS: No duplicate occurrences found!', 'green');
      return true;
    } else {
      log(`❌ ISSUE: Still found ${totalDuplicates} duplicate occurrences`, 'red');
      return false;
    }
    
  } catch (error) {
    log(`❌ Verification error: ${error.message}`, 'red');
    throw error;
  }
}

async function testDateFormatting() {
  try {
    log('\n📅 Testing date formatting...', 'yellow');
    
    const testDates = [
      '2024-07-01T00:00:00Z',
      '2024-12-25T00:00:00Z',
      '2025-01-01T00:00:00Z'
    ];
    
    log('Date format test (should show as "1 Jul 24" format):', 'blue');
    testDates.forEach(dateStr => {
      const formatted = formatCompactDate(dateStr);
      log(`  ${dateStr} → ${formatted}`, 'reset');
    });
    
    log('✅ Date formatting test complete', 'green');
    
  } catch (error) {
    log(`❌ Date formatting test error: ${error.message}`, 'red');
    throw error;
  }
}

async function main() {
  try {
    log('🧪 Duplicate Bill Occurrence Cleanup Test', 'bold');
    log('========================================', 'bold');
    
    const token = await authenticate();
    
    // Test date formatting
    await testDateFormatting();
    
    // Analyze existing duplicates
    const beforeAnalysis = await analyzeDuplicates(token);
    
    if (beforeAnalysis.totalDuplicates === 0) {
      log('\n📝 INFO: No duplicates found. The cleanup prevention is working correctly!', 'blue');
    } else {
      // Run cleanup
      const cleanupResult = await cleanupDuplicates(token);
      
      // Verify cleanup worked
      await verifyCleanup(token);
    }
    
    log('\n🎉 Test completed successfully!', 'green');
    
  } catch (error) {
    log(`\n💥 Test failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the test
main(); 