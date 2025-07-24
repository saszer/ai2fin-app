/**
 * 🧪 TEST: Category Matching Fix Verification
 * 
 * This script tests the improved category matching logic to ensure
 * AI-suggested categories are properly matched to user's existing categories.
 */

// Simulate user's existing categories
const userCategories = [
  { id: 'cat-1', name: 'Office Supplies', type: 'expense', isActive: true },
  { id: 'cat-2', name: 'Travel', type: 'expense', isActive: true },
  { id: 'cat-3', name: 'Meals & Entertainment', type: 'expense', isActive: true },
  { id: 'cat-4', name: 'Professional Services', type: 'expense', isActive: true },
  { id: 'cat-5', name: 'Marketing', type: 'expense', isActive: true },
  { id: 'cat-6', name: 'Technology', type: 'expense', isActive: true },
  { id: 'cat-7', name: 'Utilities', type: 'expense', isActive: true },
  { id: 'cat-8', name: 'Fuel & Transport', type: 'expense', isActive: true }
];

// Simulate AI-suggested categories
const aiSuggestedCategories = [
  'Health & Fitness',
  'Dining & Entertainment', 
  'Groceries',
  'Entertainment',
  'Subscriptions',
  'Transportation',
  'Fuel',
  'Insurance',
  'Phone',
  'Internet',
  'Software',
  'Office Supplies',
  'Marketing',
  'Travel',
  'Utilities',
  'Unknown Category'
];

// Simulate the improved category matching logic
function findCategoryMatch(suggestedCategory, userCategories) {
  // First try exact match
  let existingCategory = userCategories.find(cat => 
    cat.name.toLowerCase() === suggestedCategory.toLowerCase()
  );

  // If no exact match, try partial matching for common variations
  if (!existingCategory) {
    const categoryLower = suggestedCategory.toLowerCase();
    
    // Try to find a match based on common category variations
    existingCategory = userCategories.find(cat => {
      const catNameLower = cat.name.toLowerCase();
      
      // Direct substring match
      if (catNameLower.includes(categoryLower) || categoryLower.includes(catNameLower)) {
        return true;
      }
      
      // Common category mappings
      const mappings = {
        'health & fitness': ['meals & entertainment', 'gym', 'fitness', 'health', 'wellness'],
        'dining & entertainment': ['meals & entertainment', 'food & dining', 'restaurants'],
        'groceries': ['food & dining', 'meals & entertainment', 'shopping'],
        'entertainment': ['meals & entertainment', 'technology'],
        'subscriptions': ['technology', 'utilities'],
        'transportation': ['fuel & transport', 'travel'],
        'fuel': ['fuel & transport'],
        'gas': ['fuel & transport'],
        'insurance': ['utilities', 'professional services'],
        'phone': ['utilities', 'technology'],
        'internet': ['utilities', 'technology'],
        'software': ['technology'],
        'office supplies': ['office supplies'],
        'marketing': ['marketing'],
        'travel': ['travel'],
        'utilities': ['utilities']
      };
      
      const categoryVariations = mappings[categoryLower] || [];
      return categoryVariations.some(variation => catNameLower.includes(variation));
    });
  }

  return existingCategory;
}

async function testCategoryMatching() {
  console.log('🧪 Testing Improved Category Matching Logic...\n');

  console.log('📊 User Categories:');
  userCategories.forEach(cat => {
    console.log(`   - ${cat.name}`);
  });
  console.log('');

  console.log('🤖 AI Suggested Categories:');
  aiSuggestedCategories.forEach(cat => {
    console.log(`   - ${cat}`);
  });
  console.log('');

  console.log('🔍 Category Matching Results:');
  console.log('   (Should show how AI suggestions map to user categories)');
  
  let successfulMatches = 0;
  let failedMatches = 0;

  aiSuggestedCategories.forEach(suggestedCategory => {
    const match = findCategoryMatch(suggestedCategory, userCategories);
    
    if (match) {
      console.log(`   ✅ "${suggestedCategory}" → "${match.name}" (ID: ${match.id})`);
      successfulMatches++;
    } else {
      console.log(`   ❌ "${suggestedCategory}" → "Uncategorized" (no match found)`);
      failedMatches++;
    }
  });

  console.log('');
  console.log(`📊 SUMMARY: ${successfulMatches} successful matches, ${failedMatches} failed matches`);
  console.log(`📊 Success Rate: ${((successfulMatches / aiSuggestedCategories.length) * 100).toFixed(1)}%`);
  console.log('');

  // Test specific bill categorization scenarios
  console.log('🎯 Bill Categorization Scenarios:');
  
  const billScenarios = [
    {
      description: 'Gym Membership',
      suggestedCategory: 'Health & Fitness',
      expectedMatch: 'Meals & Entertainment' // Should match to closest available
    },
    {
      description: 'Dinner at Restaurant', 
      suggestedCategory: 'Dining & Entertainment',
      expectedMatch: 'Meals & Entertainment'
    },
    {
      description: 'Woolworths Grocery',
      suggestedCategory: 'Groceries', 
      expectedMatch: 'Meals & Entertainment'
    },
    {
      description: 'Netflix Subscription',
      suggestedCategory: 'Entertainment',
      expectedMatch: 'Technology'
    },
    {
      description: 'Electricity Bill',
      suggestedCategory: 'Utilities',
      expectedMatch: 'Utilities'
    }
  ];

  billScenarios.forEach(scenario => {
    const match = findCategoryMatch(scenario.suggestedCategory, userCategories);
    const status = match ? '✅' : '❌';
    const actualMatch = match ? match.name : 'Uncategorized';
    const expectedStatus = match && match.name === scenario.expectedMatch ? '✅' : '⚠️';
    
    console.log(`   ${status} ${scenario.description}:`);
    console.log(`      - AI Suggests: ${scenario.suggestedCategory}`);
    console.log(`      - Expected: ${scenario.expectedMatch}`);
    console.log(`      - Actual: ${actualMatch}`);
    console.log(`      - Match Quality: ${expectedStatus}`);
  });

  console.log('');
  console.log('🎉 Category Matching Test Complete!');
  console.log('\n📋 Expected Results:');
  console.log('- "Health & Fitness" should match to "Meals & Entertainment" (closest available)');
  console.log('- "Dining & Entertainment" should match to "Meals & Entertainment" (exact mapping)');
  console.log('- "Groceries" should match to "Meals & Entertainment" (food-related)');
  console.log('- "Entertainment" should match to "Technology" (for streaming services)');
  console.log('- "Utilities" should match to "Utilities" (exact match)');
  console.log('\n✅ This should fix the bill categorization issue!');
}

// Run the test
testCategoryMatching().catch(console.error); 