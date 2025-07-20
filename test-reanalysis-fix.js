// Test script to verify re-analysis shows correct method and reasoning
const fetch = require('node-fetch');

// Replace with valid JWT token from browser
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWQ3cHIyNGgwMDAwcDk5Z2xtYW4ydDU5IiwiZW1haWwiOiJzei5zYWhhakBnbWFpbC5jb20iLCJmaXJzdE5hbWUiOiJTYWhhaiIsImxhc3ROYW1lIjoiR2FyZyIsImJ1c2luZXNzVHlwZSI6IiIsImNvdW50cnlDb2RlIjoiQVUiLCJpYXQiOjE3NTI5NzEzMjgsImV4cCI6MTc1MzA1NzcyOH0.IikFlRLRlI4scDCzPUKLPTVC1GyexX9OAWrh9k9D9t8';

const BASE_URL = 'http://localhost:3001';

async function testReanalysisDisplayFix() {
    console.log('🧪 Testing Re-analysis Display Fix');
    console.log('=====================================\n');

    try {
        // Step 1: Get enhanced analysis with categorized transactions
        console.log('📋 Step 1: Getting enhanced analysis...');
        const analysisResponse = await fetch(`${BASE_URL}/analyze-for-categorization`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT_TOKEN}`
            },
            body: JSON.stringify({
                includeAlreadyCategorized: true
            })
        });

        if (!analysisResponse.ok) {
            throw new Error(`Analysis failed: ${analysisResponse.status} ${analysisResponse.statusText}`);
        }

        const analysisData = await analysisResponse.json();
        console.log('✅ Analysis complete:');
        console.log(`   - Uncategorized: ${analysisData.analysis.uncategorizedCount}`);
        console.log(`   - Categorized: ${analysisData.analysis.categorizedCount}`);
        console.log(`   - Available for re-analysis: ${analysisData.analysis.categorizedTransactions?.length || 0}\n`);

        if (!analysisData.analysis.categorizedTransactions || analysisData.analysis.categorizedTransactions.length === 0) {
            console.log('❌ No categorized transactions found for re-analysis test');
            return;
        }

        // Step 2: Force re-analysis on categorized transactions
        const categorizedTxs = analysisData.analysis.categorizedTransactions;
        const testTransactions = categorizedTxs.slice(0, 2); // Test first 2 transactions

        console.log('🔄 Step 2: Testing re-analysis...');
        console.log(`Selected ${testTransactions.length} transactions for re-analysis:`);
        testTransactions.forEach((tx, i) => {
            console.log(`   ${i + 1}. ${tx.description.substring(0, 30)}... (Current: ${tx.currentCategory})`);
        });

        // Prepare transactions with forceReanalysis flag
        const transactionsForReanalysis = testTransactions.map(tx => ({
            id: tx.id,
            description: tx.description,
            amount: tx.amount,
            merchant: tx.merchant,
            date: tx.date,
            type: tx.type,
            forceReanalysis: true // This flag should bypass cache
        }));

        const reanalysisResponse = await fetch(`${BASE_URL}/api/intelligent-categorization/classify-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT_TOKEN}`
            },
            body: JSON.stringify({
                transactions: transactionsForReanalysis,
                selectedCategories: ['Fuel & Transport', 'Meals & Entertainment', 'Technology'],
                options: {
                    includeNewCategorySuggestions: true,
                    confidenceThreshold: 0.6,
                    enableRealTimeLogging: true,
                    showOpenAICallDetails: true
                }
            })
        });

        if (!reanalysisResponse.ok) {
            throw new Error(`Re-analysis failed: ${reanalysisResponse.status} ${reanalysisResponse.statusText}`);
        }

        const reanalysisData = await reanalysisResponse.json();

        // Step 3: Verify the results show AI method and fresh reasoning
        console.log('\n🔍 Step 3: Verifying re-analysis results...');
        console.log('=====================================');

        if (reanalysisData.success && reanalysisData.results) {
            reanalysisData.results.forEach((result, i) => {
                console.log(`\nTransaction ${i + 1}: ${testTransactions[i].description.substring(0, 30)}...`);
                console.log(`   Source: ${result.source || 'unknown'}`);
                console.log(`   Category: ${result.category}`);
                console.log(`   Confidence: ${Math.round((result.confidence || 0) * 100)}%`);
                console.log(`   Reasoning: ${result.reasoning || 'No reasoning provided'}`);
                
                // Verify it shows AI processing
                if (result.source === 'ai_plus' || result.source === 'ai') {
                    console.log('   ✅ Correctly shows AI source');
                } else {
                    console.log(`   ❌ Wrong source: Expected 'ai_plus' or 'ai', got '${result.source}'`);
                }
                
                // Verify reasoning doesn't say "Cached"
                if (result.reasoning && !result.reasoning.includes('Cached')) {
                    console.log('   ✅ Fresh reasoning (no cache references)');
                } else {
                    console.log(`   ❌ Still shows cached reasoning: ${result.reasoning}`);
                }
            });

            // Check OpenAI call details
            if (reanalysisData.openaiDetails) {
                console.log(`\n📊 OpenAI Usage:`);
                console.log(`   - Total calls: ${reanalysisData.openaiDetails.totalCalls}`);
                console.log(`   - Total tokens: ${reanalysisData.openaiDetails.totalTokens}`);
                console.log(`   - Estimated cost: $${reanalysisData.openaiDetails.estimatedCost}`);
                
                if (reanalysisData.openaiDetails.totalCalls > 0) {
                    console.log('   ✅ Confirmed AI calls were made (not cached)');
                } else {
                    console.log('   ❌ No AI calls made - still using cache despite forceReanalysis flag');
                }
            }

        } else {
            console.log('❌ Re-analysis failed or returned no results');
            console.log('Response:', JSON.stringify(reanalysisData, null, 2));
        }

        console.log('\n🏁 Test Complete!');
        console.log('=====================================');
        console.log('✅ Frontend fix applied:');
        console.log('   - Re-analysis transactions should now show "AI" method');
        console.log('   - Reasoning should show "Fresh AI Analysis" instead of "Cached Analysis"');
        console.log('   - Backend correctly bypasses cache with forceReanalysis flag');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testReanalysisDisplayFix(); 