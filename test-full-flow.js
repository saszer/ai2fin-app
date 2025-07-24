const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Comprehensive test for full categorization flow
// embracingearth.space - AI-powered financial intelligence

const testTransactions = [
  {
    "id": "test-1",
    "description": "Holiday Booking",
    "amount": -1250,
    "merchant": "Unknown",
    "date": "2025-07-23",
    "type": "debit"
  },
  {
    "id": "test-2", 
    "description": "Spotify Premium",
    "amount": -11.99,
    "merchant": "Spotify",
    "date": "2025-07-23",
    "type": "debit"
  },
  {
    "id": "test-3",
    "description": "Coles Grocery",
    "amount": -141.6,
    "merchant": "Coles",
    "date": "2025-07-23",
    "type": "debit"
  },
  {
    "id": "test-4",
    "description": "Salary Deposit",
    "amount": 4500,
    "merchant": "Employer",
    "date": "2025-07-23",
    "type": "credit"
  },
  {
    "id": "test-5",
    "description": "Unknown Transaction",
    "amount": -50,
    "merchant": "Unknown",
    "date": "2025-07-23",
    "type": "debit"
  }
];

async function testFullFlow() {
  console.log('🧪 Testing Full Categorization Flow...\n');
  
  // Test 1: Check merchant filtering
  console.log('1️⃣ Testing merchant filtering:');
  const validTransactions = testTransactions.filter(tx => 
    tx.merchant && tx.merchant.toLowerCase() !== 'unknown'
  );
  
  console.log(`   Original transactions: ${testTransactions.length}`);
  console.log(`   Valid transactions: ${validTransactions.length}`);
  console.log(`   Filtered out: ${testTransactions.length - validTransactions.length} "Unknown" merchants\n`);
  
  // Test 2: Test core app categorization endpoint
  console.log('2️⃣ Testing core app categorization endpoint:');
  
  try {
    const response = await fetch('http://localhost:3001/api/intelligent-categorization/classify-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactions: testTransactions,
        selectedCategories: ['Marketing', 'Fuel & Transport', 'Meals & Entertainment', 'Office Supplies', 'Travel', 'Professional Services', 'Technology', 'Utilities'],
        userProfile: {
          businessType: 'INDIVIDUAL',
          industry: 'General',
          profession: 'General',
          countryCode: 'AU',
          aiContextInput: '',
          taxCountry: 'AU',
          currency: 'AUD',
          userPreferences: {
            aiConfidenceThreshold: 0.8,
            enableAutoClassification: true,
            preferredCategories: ['Marketing', 'Fuel & Transport', 'Meals & Entertainment', 'Office Supplies', 'Travel', 'Professional Services', 'Technology', 'Utilities']
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`   ✅ Core app responded successfully`);
    console.log(`   📊 Processed ${data.results?.length || 0} transactions`);
    
    // Check for skipped transactions
    const skippedResults = data.results?.filter(r => 
      r.reasoning?.includes('merchant is "Unknown"') ||
      r.method === 'Skipped'
    ) || [];
    
    const aiResults = data.results?.filter(r => 
      r.method === 'ai' || r.method === 'AI_Categorization'
    ) || [];
    
    console.log(`   ⏭️  Skipped transactions: ${skippedResults.length}`);
    console.log(`   🤖 AI processed transactions: ${aiResults.length}`);
    
    if (skippedResults.length > 0) {
      console.log(`   📝 Skipped reasons:`);
      skippedResults.forEach(r => {
        console.log(`      - ${r.reasoning}`);
      });
    }
    
    if (aiResults.length > 0) {
      console.log(`   🎯 AI results:`);
      aiResults.forEach(r => {
        console.log(`      - ${r.category} (${r.confidence})`);
      });
    }
    
  } catch (error) {
    console.log(`   ❌ Core app test failed: ${error.message}`);
  }
  
  // Test 3: Test AI+ microservice directly
  console.log('\n3️⃣ Testing AI+ microservice directly:');
  
  try {
    const response = await fetch('http://localhost:3002/api/optimized/analyze-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactions: validTransactions.map(tx => ({
          id: tx.id,
          description: tx.description,
          amount: tx.amount,
          merchant: tx.merchant,
          date: tx.date,
          type: tx.type
        })),
        selectedCategories: ['Marketing', 'Fuel & Transport', 'Meals & Entertainment', 'Office Supplies', 'Travel', 'Professional Services', 'Technology', 'Utilities'],
        options: {
          enableCategorization: true,
          batchSize: 10,
          confidenceThreshold: 0.8
        },
        userProfile: {
          businessType: 'INDIVIDUAL',
          industry: 'General',
          countryCode: 'AU'
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`   ✅ AI+ microservice responded successfully`);
    console.log(`   📊 Processed ${data.results?.length || 0} transactions`);
    console.log(`   🤖 AI calls: ${data.processedWithAI || 0}`);
    console.log(`   💾 Cache hits: ${data.processedWithReferenceData || 0}`);
    
    // Check for mock data indicators
    const mockResults = data.results?.filter(r => 
      r.reasoning?.includes('MOCK DATA') || 
      r.reasoning?.includes('MOCK FALLBACK')
    ) || [];
    
    if (mockResults.length > 0) {
      console.log(`   ⚠️  Found ${mockResults.length} mock results`);
      mockResults.forEach(r => {
        console.log(`      - ${r.reasoning}`);
      });
    } else {
      console.log(`   ✅ All results appear to be real AI responses`);
    }
    
  } catch (error) {
    console.log(`   ❌ AI+ microservice test failed: ${error.message}`);
  }
  
  console.log('\n🎯 Summary of fixes implemented:');
  console.log('✅ Filter out transactions with "Unknown" merchant');
  console.log('✅ Transaction types: "One-time" (blue) vs "Bill" (yellow)');
  console.log('✅ Bills sorted to top of list');
  console.log('✅ Clear mock data indicators in reasoning');
  console.log('✅ Enhanced transaction type detection logic');
  console.log('✅ Improved color coding and labeling');
  console.log('✅ Real AI calls with proper filtering');
  
  console.log('\n🔧 Expected behavior:');
  console.log('- Transactions with "Unknown" merchant should be skipped');
  console.log('- Only valid merchants should be sent to AI');
  console.log('- Real AI calls should be made (not mock data)');
  console.log('- Frontend should show proper transaction types and colors');
}

testFullFlow().catch(console.error); 