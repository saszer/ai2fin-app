const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWQzMHpmYnMwMDAwcDlpd2pmcGo4MWRvIiwiZW1haWwiOiJzei5zaGFqQGdtYWlsLmNvbSIsImZpcnN0TmFtZSI6IlNhaGFqIiwibGFzdE5hbWUiOiJHYXJnIiwiYnVzaW5lc3NUeXBlIjoiU09MRV9UUkFERVIiLCJjb3VudHJ5Q29kZSI6IkFVIiwiaWF0IjoxNzUyNjMwMDUwLCJleHAiOjE3NTI3MTY0NTB9.nTZILl-p3nZlmtNX0tZojPSgvLzLPjOB3TnR0XZSl8E';

const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await axios({
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': AUTH_TOKEN,
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 30000,
      ...options
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

// Test the enhanced workflow
async function testEnhancedPatternWorkflow() {
  console.log('🚀 Testing Enhanced Pattern Analysis Workflow\n');

  try {
    // Step 1: Get user transactions
    console.log('📋 Step 1: Fetching user transactions...');
    const transactions = await apiCall('/api/bank/transactions');
    console.log(`✅ Found ${transactions.length} transactions\n`);

    if (transactions.length === 0) {
      console.log('❌ No transactions found. Please upload some test data first.');
      return;
    }

    // Step 2: Analyze patterns (this would be done by the frontend modal)
    console.log('🔍 Step 2: Analyzing transaction patterns...');
    const analysisResult = await apiCall('/api/bills-patterns/analyze-patterns', {
      method: 'POST',
      data: { transactions: transactions.slice(0, 20) } // Use subset for testing
    });
    
    console.log(`✅ Pattern analysis complete:`);
    console.log(`   • Found ${analysisResult.patterns?.length || 0} patterns`);
    console.log(`   • Analysis took ${analysisResult.processingTime || 'N/A'}\n`);

    if (!analysisResult.patterns || analysisResult.patterns.length === 0) {
      console.log('📝 No patterns detected in current transactions.');
      console.log('🧪 Creating synthetic patterns for testing...\n');
      
      // Create synthetic patterns for testing
      const syntheticPatterns = [
        {
          id: 'test-pattern-1',
          name: 'Test Streaming Service',
          merchant: 'Netflix',
          frequency: 'MONTHLY',
          baseAmount: 15.99,
          transactions: transactions.slice(0, 2).map(tx => ({
            id: tx.id,
            description: tx.description,
            amount: tx.amount,
            date: tx.date
          }))
        }
      ];

      // Step 3: Test bill creation endpoint
      console.log('🏗️ Step 3: Testing bill pattern creation...');
      const createResult = await apiCall('/api/bills-patterns/create-from-patterns', {
        method: 'POST',
        data: { patterns: syntheticPatterns }
      });

      console.log(`✅ Bill creation result:`, createResult);

      // Step 4: Test transaction classification (batch update)
      console.log('🏷️ Step 4: Testing transaction classification...');
      
      const billTransactionIds = syntheticPatterns[0].transactions.map(tx => tx.id);
      const remainingTransactions = transactions.filter(tx => !billTransactionIds.includes(tx.id));

      // Test: Mark bill transactions as "bill" classification
      if (billTransactionIds.length > 0) {
        console.log(`   📌 Classifying ${billTransactionIds.length} transactions as "bills"...`);
        
        const billUpdates = billTransactionIds.map(id => ({
          id,
          secondaryType: 'bill',
          primaryType: 'expense',
          classificationSource: 'bill_pattern_creation',
          userClassifiedAt: new Date().toISOString()
        }));

        try {
          const billClassifyResult = await apiCall('/api/bank/transactions/batch', {
            method: 'PUT',
            data: { updates: billUpdates }
          });
          console.log(`   ✅ Bill classification successful:`, billClassifyResult.results?.filter(r => r.success).length || 0, 'updated');
        } catch (error) {
          console.log(`   ❌ Bill classification failed:`, error.message);
        }
      }

      // Test: Mark remaining transactions as "one-time expense"
      if (remainingTransactions.length > 0) {
        console.log(`   📌 Classifying ${Math.min(remainingTransactions.length, 5)} transactions as "one-time expenses"...`);
        
        const oneTimeUpdates = remainingTransactions.slice(0, 5).map(tx => ({
          id: tx.id,
          secondaryType: 'one-time expense',
          primaryType: 'expense',
          classificationSource: 'user_bulk_classification',
          userClassifiedAt: new Date().toISOString()
        }));

        try {
          const oneTimeClassifyResult = await apiCall('/api/bank/transactions/batch', {
            method: 'PUT',
            data: { updates: oneTimeUpdates }
          });
          console.log(`   ✅ One-time expense classification successful:`, oneTimeClassifyResult.results?.filter(r => r.success).length || 0, 'updated');
        } catch (error) {
          console.log(`   ❌ One-time expense classification failed:`, error.message);
        }
      }

      // Step 5: Verify classifications
      console.log('\n📊 Step 5: Verifying final transaction classifications...');
      const updatedTransactions = await apiCall('/api/bank/transactions');
      
      const classificationStats = {
        bills: updatedTransactions.filter(tx => tx.secondaryType === 'bill').length,
        oneTimeExpenses: updatedTransactions.filter(tx => tx.secondaryType === 'one-time expense').length,
        unclassified: updatedTransactions.filter(tx => !tx.secondaryType || tx.secondaryType === null).length,
        total: updatedTransactions.length
      };

      console.log('✅ Classification Summary:');
      console.log(`   • Bills: ${classificationStats.bills}`);
      console.log(`   • One-time Expenses: ${classificationStats.oneTimeExpenses}`);
      console.log(`   • Unclassified: ${classificationStats.unclassified}`);
      console.log(`   • Total: ${classificationStats.total}`);

      console.log('\n🎉 Enhanced Pattern Workflow Test Complete!');
      console.log('\n📋 Next Steps:');
      console.log('   1. Open the frontend application');
      console.log('   2. Go to All Transactions page');
      console.log('   3. Click "Analyze Patterns" button');
      console.log('   4. Follow the enhanced workflow with classification');
      console.log('   5. Verify that transactions are properly classified as bills/one-time expenses');

    } else {
      console.log('✅ Real patterns detected! The workflow should work with actual pattern data.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEnhancedPatternWorkflow(); 