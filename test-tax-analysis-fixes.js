const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test user credentials
const TEST_USERS = [
  { email: 'test@example.com', password: 'password123' },
  { email: 'testuser@example.com', password: 'password123' },
  { email: 'demo@example.com', password: 'password123' }
];

async function testTaxAnalysisFixes() {
  try {
    console.log('🔧 Testing Tax Analysis Fixes...\n');

    // Step 1: Login to get auth token
    console.log('🔐 Step 1: Logging in...');
    let token = null;
    
    for (const user of TEST_USERS) {
      try {
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, user);
        token = loginResponse.data.token;
        console.log(`✅ Login successful with ${user.email}`);
        break;
      } catch (error) {
        console.log(`❌ Login failed for ${user.email}: ${error.response?.data?.error || error.message}`);
      }
    }

    if (!token) {
      console.log('❌ All login attempts failed. Stopping test.');
      return;
    }
    
    // Configure axios with auth token
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Step 2: Test batch analysis with reanalysis toggle
    console.log('\n🔄 Step 2: Testing batch analysis with enhanced data...');
    
    const analysisResponse = await axios.post(`${BASE_URL}/api/intelligent-tax-deduction/analyze-batch`, {
      transactions: [
        {
          id: 'test-1',
          description: 'Office supplies from Officeworks',
          amount: -150.00,
          date: '2024-01-15T00:00:00.000Z',
          category: 'Office Supplies',
          primaryType: 'expense',
          secondaryType: 'expense',
          merchant: 'Officeworks'
        },
        {
          id: 'test-2', 
          description: 'Client lunch meeting at restaurant',
          amount: -85.50,
          date: '2024-01-16T00:00:00.000Z',
          category: 'Meals & Entertainment',
          primaryType: 'expense',
          secondaryType: 'expense',
          merchant: 'Restaurant ABC'
        },
        {
          id: 'test-3',
          description: 'Internet bill monthly',
          amount: -99.00,
          date: '2024-01-17T00:00:00.000Z',
          category: 'Utilities',
          primaryType: 'bill',
          secondaryType: 'bill',
          merchant: 'Telstra'
        }
      ],
      userContext: {
        businessType: 'SOLE_TRADER',
        countryCode: 'AU',
        occupation: 'Software Developer',
        industry: 'Technology'
      }
    });

    if (analysisResponse.data.success) {
      console.log('✅ Batch analysis successful');
      console.log(`📊 Summary: ${analysisResponse.data.summary.totalTransactions} transactions analyzed`);
      console.log(`   - AI calls: ${analysisResponse.data.summary.aiCalls}`);
      console.log(`   - Cache hits: ${analysisResponse.data.summary.cacheHits}`);
      console.log(`   - Pattern matches: ${analysisResponse.data.summary.patternMatches}`);
      
      console.log('\n📋 Detailed Results Analysis:');
      analysisResponse.data.results.forEach((result, index) => {
        console.log(`\n   ${index + 1}. Transaction Analysis:`);
        
        // ✅ FIX 1: Check if Date and Description are showing correctly
        console.log(`      📅 Date: ${result.date || 'N/A'} (${result.date ? 'FIXED' : 'STILL N/A'})`);
        console.log(`      📝 Description: "${result.description || 'N/A'}" (${result.description ? 'FIXED' : 'STILL N/A'})`);
        console.log(`      💰 Amount: $${Math.abs(result.amount || 0).toFixed(2)}`);
        
        // ✅ FIX 2: Check if Database Category is showing (not AI tax category)
        console.log(`      🏷️  Database Category: "${result.category || 'N/A'}" (${result.category ? 'FIXED' : 'MISSING'})`);
        console.log(`      🤖 AI Tax Category: "${result.taxCategory || 'N/A'}" (for reference)`);
        
        // ✅ FIX 3: Check if Phase 1&2 cache-first approach is working with proper source indication
        console.log(`      🔍 Source: ${result.source || 'unknown'} (${result.source ? 'FIXED' : 'MISSING'})`);
        console.log(`      🎯 Tax Deductible: ${result.isTaxDeductible ? 'YES' : 'NO'}`);
        console.log(`      📊 Confidence: ${Math.round((result.confidence || 0) * 100)}%`);
        console.log(`      💼 Business Use: ${result.businessUsePercentage || 0}%`);
        console.log(`      💭 Reasoning: "${result.reasoning || 'No reasoning'}"`);
      });
      
      // Verify fixes
      console.log('\n🔍 Fix Verification:');
      const results = analysisResponse.data.results;
      
      // Fix 1: Date and Description
      const hasValidDates = results.every(r => r.date && r.date !== 'N/A');
      const hasValidDescriptions = results.every(r => r.description && r.description !== 'N/A');
      console.log(`✅ Fix 1 - Date/Description: ${hasValidDates && hasValidDescriptions ? 'WORKING' : 'NEEDS ATTENTION'}`);
      
      // Fix 2: Database Category (not AI category)
      const hasDbCategories = results.every(r => r.category && r.category !== 'N/A');
      console.log(`✅ Fix 2 - Database Category: ${hasDbCategories ? 'WORKING' : 'NEEDS ATTENTION'}`);
      
      // Fix 3: Source indication (cache-first approach)
      const hasSources = results.every(r => r.source && ['cache', 'ai', 'pattern', 'fallback'].includes(r.source));
      console.log(`✅ Fix 3 - Source Indication: ${hasSources ? 'WORKING' : 'NEEDS ATTENTION'}`);
      
      // Summary
      const allFixesWorking = hasValidDates && hasValidDescriptions && hasDbCategories && hasSources;
      console.log(`\n🎯 Overall Status: ${allFixesWorking ? '✅ ALL FIXES WORKING!' : '❌ SOME FIXES NEED ATTENTION'}`);
      
    } else {
      console.log('❌ Batch analysis failed:', analysisResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testTaxAnalysisFixes(); 