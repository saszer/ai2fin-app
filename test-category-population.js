// Test Category Population
// embracingearth.space - AI-powered financial intelligence

// Load environment variables
require('dotenv').config({ path: './ai2-ai-modules/.env' });
require('dotenv').config({ path: './.env' });

const testTransactions = [
  {
    "id": "category-test-1",
    "description": "Salary Deposit",
    "amount": 4500,
    "merchant": "Employer",
    "date": "2025-07-23",
    "type": "credit"
  },
  {
    "id": "category-test-2",
    "description": "Netflix Subscription",
    "amount": -17.99,
    "merchant": "Netflix",
    "date": "2025-07-23",
    "type": "debit"
  },
  {
    "id": "category-test-3",
    "description": "Christmas Gifts",
    "amount": -150,
    "merchant": "Amazon",
    "date": "2025-07-23",
    "type": "debit"
  }
];

async function testCategoryPopulation() {
  console.log('🧪 Testing Category Population...\n');
  
  try {
    // Test AI+ microservice directly
    console.log('1️⃣ Testing AI+ microservice category population:');
    
    const aiResponse = await fetch('http://localhost:3002/api/optimized/analyze-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactions: testTransactions,
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

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.log(`   ❌ AI+ microservice failed: ${aiResponse.status} ${aiResponse.statusText}`);
      console.log(`   Error details: ${errorText}`);
      return;
    }

    const aiData = await aiResponse.json();
    console.log(`   ✅ AI+ microservice call successful!`);
    console.log(`   📊 Processed ${aiData.results?.length || 0} transactions`);
    
    // Check category population
    console.log(`   📋 Category Population Check:`);
    aiData.results?.forEach((r, i) => {
      console.log(`      ${i+1}. "${r.description}"`);
      console.log(`         Category: ${r.category || 'NULL'} (${typeof r.category})`);
      console.log(`         IsNewCategory: ${r.isNewCategory}`);
      console.log(`         NewCategoryName: ${r.newCategoryName || 'NULL'}`);
      console.log(`         Reasoning: ${r.reasoning}`);
      console.log(`         Confidence: ${r.confidence}`);
      console.log(`         ---`);
    });

    // Check for null categories
    const nullCategories = aiData.results?.filter(r => !r.category) || [];
    const newCategories = aiData.results?.filter(r => r.isNewCategory && r.newCategoryName) || [];
    
    console.log(`   🎯 Analysis:`);
    console.log(`      Null categories: ${nullCategories.length}`);
    console.log(`      New category suggestions: ${newCategories.length}`);
    
    if (nullCategories.length > 0) {
      console.log(`   ⚠️  Found ${nullCategories.length} transactions with null categories:`);
      nullCategories.forEach(r => {
        console.log(`      - "${r.description}": ${r.reasoning}`);
      });
    }
    
    if (newCategories.length > 0) {
      console.log(`   ✅ Found ${newCategories.length} new category suggestions:`);
      newCategories.forEach(r => {
        console.log(`      - "${r.description}": ${r.newCategoryName} (${r.reasoning})`);
      });
    }

    // Test frontend transformation
    console.log('\n2️⃣ Testing frontend transformation:');
    
    const mockUserCategories = [
      { id: 'cat1', name: 'Technology', color: '#1976d2' },
      { id: 'cat2', name: 'Meals & Entertainment', color: '#2e7d32' },
      { id: 'cat3', name: 'Marketing', color: '#ed6c02' },
      { id: 'cat4', name: 'Income', color: '#9c27b0' }
    ];

    const transformedResults = aiData.results?.map((result) => {
      const suggestedCategory = result.category || result.suggestedCategory || 'Uncategorized';
      const method = result.source === 'ai_plus' ? 'AI' : 
                    result.source === 'cache' ? 'Cache' : 
                    result.source === 'pattern' ? 'Fallback' : 'uncategorized';
      
      return {
        transactionId: result.transactionId || result.description,
        description: result.description,
        amount: -100,
        originalCategory: 'uncategorized',
        suggestedCategory: suggestedCategory,
        method: method,
        confidence: result.confidence || 0,
        reasoning: result.reasoning || 'No reasoning provided',
        isTaxDeductible: false,
        businessUsePercentage: 0,
        type: 'one-time',
        applied: false,
        categoryId: result.categoryId || suggestedCategory,
        primaryType: 'expense',
        secondaryType: 'one-time expense',
        newCategoryName: result.newCategoryName,
        newCategoryReason: result.reasoning
      };
    }) || [];

    console.log(`   ✅ Frontend transformation successful!`);
    console.log(`   📊 Transformed ${transformedResults.length} results`);
    transformedResults.forEach((r, i) => {
      console.log(`      ${i+1}. "${r.description}"`);
      console.log(`         Suggested Category: ${r.suggestedCategory}`);
      console.log(`         Method: ${r.method}`);
      console.log(`         Confidence: ${r.confidence}`);
      console.log(`         ---`);
    });

    // Test category matching
    console.log('\n3️⃣ Testing category matching:');
    
    transformedResults.forEach((r, i) => {
      const matchingCategory = mockUserCategories.find(cat => 
        cat.name.toLowerCase().includes(r.suggestedCategory.toLowerCase()) ||
        r.suggestedCategory.toLowerCase().includes(cat.name.toLowerCase())
      );
      
      console.log(`   ${i+1}. "${r.description}"`);
      console.log(`      AI suggests: ${r.suggestedCategory}`);
      console.log(`      Matches user category: ${matchingCategory ? matchingCategory.name : 'NO MATCH'}`);
      console.log(`      ---`);
    });

  } catch (error) {
    console.error('❌ Category population test failed:', error);
  }
  
  console.log('\n🎯 Category Population Summary:');
  console.log('✅ AI+ microservice should populate category field');
  console.log('✅ New category suggestions should use newCategoryName as category');
  console.log('✅ Frontend should display AI suggestions in dropdown');
  console.log('✅ Users can create new categories from AI suggestions');
}

testCategoryPopulation().catch(console.error); 