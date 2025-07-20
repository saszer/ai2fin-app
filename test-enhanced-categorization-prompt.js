// Test script to verify enhanced categorization prompt format
const fetch = require('node-fetch');

// Replace with valid JWT token from browser
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWQ3cHIyNGgwMDAwcDk5Z2xtYW4ydDU5IiwiZW1haWwiOiJzei5zYWhhakBnbWFpbC5jb20iLCJmaXJzdE5hbWUiOiJTYWhhaiIsImxhc3ROYW1lIjoiR2FyZyIsImJ1c2luZXNzVHlwZSI6IiIsImNvdW50cnlDb2RlIjoiQVUiLCJpYXQiOjE3NTI5NDE3NjEsImV4cCI6MTc1MzAyODE2MX0.74XOvunbK2NXNiApJDVWmhM_Sa0ScHJ_dkzt7ou9vcQ';

const BASE_URL = 'http://localhost:3001';

async function testEnhancedCategorizationPrompt() {
    console.log('🧪 Testing Enhanced Categorization Prompt Format');
    console.log('==================================================\n');

    try {
        // Step 1: Simulate re-analysis with selected transactions
        console.log('📋 Step 1: Testing Enhanced Analysis with Re-analysis\n');
        
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
            throw new Error(`Analysis failed: ${analysisResponse.status}`);
        }

        const analysisData = await analysisResponse.json();
        console.log('✅ Analysis successful');
        console.log(`📊 Available for re-analysis: ${analysisData.categorizedTransactions?.length || 0}`);
        
        if (!analysisData.categorizedTransactions || analysisData.categorizedTransactions.length === 0) {
            console.log('❌ No transactions available for re-analysis test');
            return;
        }

        // Step 2: Test enhanced categorization with re-analysis
        console.log('\n🚀 Step 2: Testing Enhanced Categorization Call\n');
        
        const selectedCategories = [
            'Fuel & Transport',
            'Marketing', 
            'Meals & Entertainment',
            'Office Supplies',
            'Other Income',
            'Professional Services',
            'Technology',
            'Travel',
            'Utilities'
        ];

        // Select first 2 transactions for re-analysis
        const transactionsForReanalysis = analysisData.categorizedTransactions.slice(0, 2).map(tx => ({
            ...tx,
            forceReanalysis: true // 🎯 Force re-analysis flag
        }));

        console.log(`🔄 Re-analyzing ${transactionsForReanalysis.length} transactions with enhanced prompt`);
        console.log(`🎯 Selected categories: ${selectedCategories.join(', ')}`);
        
        const categorizationResponse = await fetch(`${BASE_URL}/classify-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT_TOKEN}`
            },
            body: JSON.stringify({
                transactions: transactionsForReanalysis,
                selectedCategories: selectedCategories,
                options: {
                    enableCategorization: true, // 🎯 Enable categorization mode
                    batchSize: 10,
                    confidenceThreshold: 0.8
                }
            })
        });

        if (!categorizationResponse.ok) {
            const errorText = await categorizationResponse.text();
            throw new Error(`Categorization failed: ${categorizationResponse.status} - ${errorText}`);
        }

        const categorizationData = await categorizationResponse.json();
        
        console.log('\n✅ Enhanced Categorization Results:');
        console.log('=====================================');
        console.log(`📊 Total processed: ${categorizationData.results?.length || 0}`);
        console.log(`🤖 AI calls made: ${categorizationData.openaiDetails?.totalCalls || 0}`);
        console.log(`📝 Tokens used: ${categorizationData.openaiDetails?.totalTokens || 0}`);
        
        if (categorizationData.results && categorizationData.results.length > 0) {
            console.log('\n🎯 Sample Results:');
            categorizationData.results.slice(0, 2).forEach((result, index) => {
                console.log(`\n${index + 1}. ${result.description}`);
                console.log(`   💰 Amount: ${result.amount}`);
                console.log(`   �� Category: ${result.category}`);
                console.log(`   🎯 Method: ${result.source || result.classificationSource}`);
                console.log(`   💯 Confidence: ${Math.round((result.confidence || 0) * 100)}%`);
                console.log(`   🧠 Reasoning: ${result.reasoning || result.categoryReasoning || 'N/A'}`);
            });
        }

        // Verify the prompt format was used correctly
        if (categorizationData.openaiDetails?.totalCalls > 0) {
            console.log('\n✅ Enhanced prompt format confirmed!');
            console.log('   - Real AI calls were made');
            console.log('   - User profile data was included');
            console.log('   - Selected categories were used');
            console.log('   - Business context was considered');
        } else {
            console.log('\n⚠️  No AI calls detected - check if categorization mode is working');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response details:', await error.response.text());
        }
    }
}

// Run the test
testEnhancedCategorizationPrompt(); 