/**
 * 🧪 TEST: Frontend Category Delete Simulation
 * 
 * Simulates what happens when user clicks trash icon on http://localhost:3000/#/categories
 * https://embracingearth.space
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_USER = {
  email: 'sz.sahaj@gmail.com',
  password: 'demo123'
};

let authToken = null;

async function authenticateUser() {
  console.log('🔐 Step 1: Authenticating as sz.sahaj@gmail.com...\n');
  
  try {
    // Try OIDC login first
    const loginResponse = await axios.post(`${BASE_URL}/api/oidc/login`, TEST_USER);
    
    if (loginResponse.data.success && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      console.log('✅ Authentication successful\n');
      return true;
    }
  } catch (error) {
    console.log(`⚠️  OIDC login failed: ${error.response?.data?.error || error.message}`);
    console.log('   This might be why you cannot delete categories!\n');
    
    // Show user what to do
    console.log('💡 SOLUTION:');
    console.log('   1. Make sure you are logged in at http://localhost:3000');
    console.log('   2. Check browser console (F12) for authentication errors');
    console.log('   3. Try logging out and logging back in\n');
    return false;
  }
}

async function testFrontendCategoryDelete() {
  console.log('🗑️  TEST: Frontend Category Delete Simulation');
  console.log('=' .repeat(70));
  console.log('Testing: http://localhost:3000/#/categories (trash icon click)\n');

  // Step 1: Authenticate
  const authenticated = await authenticateUser();
  if (!authenticated) {
    console.log('❌ Cannot proceed without authentication\n');
    return;
  }

  try {
    // Step 2: Get categories (same as frontend does)
    console.log('📋 Step 2: Fetching categories from /api/categories...\n');
    
    const categoriesResponse = await axios.get(`${BASE_URL}/api/categories`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const categories = categoriesResponse.data.categories || [];
    console.log(`✅ Found ${categories.length} categories\n`);

    if (categories.length === 0) {
      console.log('⚠️  No categories found to delete\n');
      return;
    }

    // Display categories
    console.log('Available categories:');
    categories.slice(0, 10).forEach((cat, idx) => {
      console.log(`   ${idx + 1}. "${cat.name}" (ID: ${cat.id}, Type: ${cat.type})`);
    });
    console.log('');

    // Step 3: Try to delete the first category (simulating trash icon click)
    const categoryToDelete = categories[0];
    console.log('=' .repeat(70));
    console.log(`🗑️  Step 3: Attempting to DELETE "${categoryToDelete.name}"...`);
    console.log(`   Using endpoint: DELETE /api/categories/${categoryToDelete.id}\n`);

    try {
      const deleteResponse = await axios.delete(
        `${BASE_URL}/api/categories/${categoryToDelete.id}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ DELETE SUCCESSFUL!');
      console.log(`   Response: ${deleteResponse.data.message}\n`);

    } catch (deleteError) {
      console.log('❌ DELETE FAILED!');
      console.log(`   Status: ${deleteError.response?.status || 'Unknown'}`);
      console.log(`   Error: ${deleteError.response?.data?.error || deleteError.message}\n`);

      // Detailed error analysis
      if (deleteError.response?.status === 401) {
        console.log('🔍 DIAGNOSIS: Authentication Error (401 Unauthorized)');
        console.log('   CAUSE: Your auth token is not valid or has expired\n');
        console.log('💡 SOLUTIONS:');
        console.log('   1. Log out and log back in at http://localhost:3000');
        console.log('   2. Clear browser cache and cookies');
        console.log('   3. Check if session expired (look for "Session expired" message)\n');

      } else if (deleteError.response?.status === 403) {
        console.log('🔍 DIAGNOSIS: Permission Denied (403 Forbidden)');
        console.log('   CAUSE: User does not have permission to delete categories\n');
        console.log('💡 SOLUTIONS:');
        console.log('   1. Check your subscription plan (free tier might have restrictions)');
        console.log('   2. Verify your user role/permissions\n');

      } else if (deleteError.response?.status === 400 && deleteError.response?.data?.usage) {
        console.log('🔍 DIAGNOSIS: Category In Use (400 Bad Request)');
        console.log('   CAUSE: Category is being used by transactions/bills/expenses\n');
        
        const usage = deleteError.response.data.usage;
        console.log('   Usage details:');
        if (usage.transactionCount > 0) console.log(`     - ${usage.transactionCount} transactions`);
        if (usage.expenseCount > 0) console.log(`     - ${usage.expenseCount} expenses`);
        if (usage.billCount > 0) console.log(`     - ${usage.billCount} bills`);
        if (usage.billPatternCount > 0) console.log(`     - ${usage.billPatternCount} bill patterns`);
        console.log(`     - Total: ${usage.totalUsage} entities\n`);
        
        console.log('💡 SOLUTIONS:');
        console.log('   1. Reassign transactions to another category first');
        console.log('   2. Mark as inactive instead of deleting');
        console.log('   3. Use force delete with reassignment (advanced)\n');

      } else if (deleteError.response?.status === 404) {
        console.log('🔍 DIAGNOSIS: Category Not Found (404)');
        console.log('   CAUSE: Category was already deleted or does not exist\n');
        console.log('💡 SOLUTION: Refresh the page to see current categories\n');

      } else {
        console.log('🔍 DIAGNOSIS: Unknown Error');
        console.log('   Full error response:');
        console.log(JSON.stringify(deleteError.response?.data, null, 2));
        console.log('');
      }

      // Show request details for debugging
      console.log('📊 REQUEST DETAILS:');
      console.log(`   URL: DELETE ${BASE_URL}/api/categories/${categoryToDelete.id}`);
      console.log(`   Auth: Bearer ${authToken.substring(0, 20)}...`);
      console.log(`   Headers: ${JSON.stringify(deleteError.config?.headers || {}, null, 2)}`);
      console.log('');
    }

    // Step 4: Check backend logs recommendation
    console.log('=' .repeat(70));
    console.log('📝 DEBUGGING TIPS:\n');
    console.log('1. Check browser console (F12) when clicking trash icon');
    console.log('2. Look at Network tab to see actual request/response');
    console.log('3. Check backend server logs for detailed error messages');
    console.log('4. Verify you are logged in with correct user account\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('=' .repeat(70));
}

// Run test
testFrontendCategoryDelete().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});







