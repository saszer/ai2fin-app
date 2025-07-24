/**
 * 🧪 TEST: Category Deletion Issue Analysis
 * 
 * This script helps identify duplicate categories and test deletion constraints
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = 'test-user-001';

async function testCategoryDeletionIssue() {
  console.log('🧪 Testing Category Deletion Issue\n');

  try {
    // Test 1: Get all categories
    console.log('1. Fetching all categories:');
    
    const response = await axios.get(`${BASE_URL}/api/bank/categories`, {
      headers: {
        'Authorization': `Bearer test-token`,
        'Content-Type': 'application/json'
      }
    });

    const categories = response.data.categories || [];
    console.log(`   📊 Total categories: ${categories.length}`);
    
    // Test 2: Check for duplicates
    console.log('\n2. Checking for duplicate categories:');
    
    const categoryNames = categories.map(cat => cat.name);
    const duplicates = categoryNames.filter((name, index) => categoryNames.indexOf(name) !== index);
    const uniqueDuplicates = [...new Set(duplicates)];
    
    if (uniqueDuplicates.length > 0) {
      console.log('   ❌ Found duplicate category names:');
      uniqueDuplicates.forEach(name => {
        const duplicateCategories = categories.filter(cat => cat.name === name);
        console.log(`      - "${name}" (${duplicateCategories.length} instances):`);
        duplicateCategories.forEach(cat => {
          console.log(`        * ID: ${cat.id}, Created: ${cat.createdAt}, Active: ${cat.isActive}`);
        });
      });
    } else {
      console.log('   ✅ No duplicate category names found');
    }
    
    // Test 3: Check for categories with similar names (case-insensitive)
    console.log('\n3. Checking for similar category names (case-insensitive):');
    
    const similarNames = [];
    for (let i = 0; i < categories.length; i++) {
      for (let j = i + 1; j < categories.length; j++) {
        if (categories[i].name.toLowerCase() === categories[j].name.toLowerCase() && 
            categories[i].name !== categories[j].name) {
          similarNames.push({
            name1: categories[i].name,
            name2: categories[j].name,
            id1: categories[i].id,
            id2: categories[j].id
          });
        }
      }
    }
    
    if (similarNames.length > 0) {
      console.log('   ⚠️  Found categories with similar names:');
      similarNames.forEach(pair => {
        console.log(`      - "${pair.name1}" vs "${pair.name2}"`);
        console.log(`        * ID1: ${pair.id1}, ID2: ${pair.id2}`);
      });
    } else {
      console.log('   ✅ No similar category names found');
    }
    
    // Test 4: Test category deletion (if duplicates found)
    if (uniqueDuplicates.length > 0) {
      console.log('\n4. Testing category deletion for duplicates:');
      
      for (const duplicateName of uniqueDuplicates) {
        const duplicateCategories = categories.filter(cat => cat.name === duplicateName);
        
        // Try to delete the most recent duplicate (keep the oldest)
        const toDelete = duplicateCategories.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )[0];
        
        console.log(`   🗑️  Attempting to delete duplicate: "${toDelete.name}" (ID: ${toDelete.id})`);
        
        try {
          const deleteResponse = await axios.delete(`${BASE_URL}/api/bank/categories/${toDelete.id}`, {
            headers: {
              'Authorization': `Bearer test-token`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`      ✅ Successfully deleted: ${deleteResponse.data.message}`);
        } catch (deleteError) {
          console.log(`      ❌ Failed to delete: ${deleteError.response?.data?.message || deleteError.message}`);
          
          // Check if it's a foreign key constraint error
          if (deleteError.response?.data?.message?.includes('foreign key') || 
              deleteError.message?.includes('foreign key')) {
            console.log(`      🔍 This category is likely being used by transactions, bills, or other entities`);
          }
        }
      }
    }
    
    // Test 5: Check for categories that might be in use
    console.log('\n5. Analyzing category usage patterns:');
    
    const categoriesWithUsage = [];
    for (const category of categories) {
      try {
        // Check if category is used in transactions
        const transactionsResponse = await axios.get(`${BASE_URL}/api/bank/transactions?categoryId=${category.id}`, {
          headers: {
            'Authorization': `Bearer test-token`,
            'Content-Type': 'application/json'
          }
        });
        
        const transactionCount = transactionsResponse.data.transactions?.length || 0;
        
        if (transactionCount > 0) {
          categoriesWithUsage.push({
            category,
            usage: {
              transactions: transactionCount,
              type: 'transactions'
            }
          });
        }
      } catch (error) {
        // Ignore errors for this test
      }
    }
    
    if (categoriesWithUsage.length > 0) {
      console.log('   📊 Categories currently in use:');
      categoriesWithUsage.forEach(item => {
        console.log(`      - "${item.category.name}" (ID: ${item.category.id}): ${item.usage.transactions} transactions`);
      });
    } else {
      console.log('   ✅ No categories appear to be in use');
    }
    
    // Test 6: Summary and recommendations
    console.log('\n6. Summary and Recommendations:');
    
    if (uniqueDuplicates.length > 0) {
      console.log('   🚨 ISSUES FOUND:');
      console.log(`      - ${uniqueDuplicates.length} duplicate category names detected`);
      console.log(`      - ${uniqueDuplicates.length} categories need to be cleaned up`);
      
      console.log('\n   💡 RECOMMENDATIONS:');
      console.log('      1. Delete duplicate categories that are not in use');
      console.log('      2. Merge transactions from duplicate categories to the primary category');
      console.log('      3. Update any references to use the primary category ID');
      console.log('      4. Consider implementing a category merge feature');
      
      console.log('\n   🔧 POSSIBLE SOLUTIONS:');
      console.log('      1. Add foreign key cascade delete to Category model');
      console.log('      2. Implement category merge functionality');
      console.log('      3. Add validation to prevent duplicate category creation');
      console.log('      4. Create a category cleanup utility');
    } else {
      console.log('   ✅ No duplicate categories found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

// Run the test
testCategoryDeletionIssue(); 