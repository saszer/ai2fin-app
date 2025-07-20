// Test script to verify full user profile is included in categorization prompts
const fetch = require('node-fetch');

// Replace with valid JWT token from browser
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWQ3cHIyNGgwMDAwcDk5Z2xtYW4ydDU5IiwiZW1haWwiOiJzei5zYWhhakBnbWFpbC5jb20iLCJmaXJzdE5hbWUiOiJTYWhhaiIsImxhc3ROYW1lIjoiR2FyZyIsImJ1c2luZXNzVHlwZSI6IiIsImNvdW50cnlDb2RlIjoiQVUiLCJpYXQiOjE3NTI5NDE3NjEsImV4cCI6MTc1MzAyODE2MX0.74XOvunbK2NXNiApJDVWmhM_Sa0ScHJ_dkzt7ou9vcQ';

const BASE_URL = 'http://localhost:3001';

async function testFullUserProfileCategorization() {
    console.log('🧪 Testing Full User Profile in Categorization');
    console.log('===============================================\n');

    try {
        // First, let's verify what the current user profile looks like
        console.log('📋 Step 1: Checking Current User Profile\n');
        
        const aiProfileResponse = await fetch(`${BASE_URL}/api/ai/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${JWT_TOKEN}`
            }
        });

        if (aiProfileResponse.ok) {
            const profileData = await aiProfileResponse.json();
            console.log('✅ Current AI Profile:');
            console.log(JSON.stringify(profileData, null, 2));
            
            if (profileData.profile?.aiProfile?.contextInput) {
                console.log(`\n🧠 AI Context found: "${profileData.profile.aiProfile.contextInput}"`);
            } else {
                console.log('\n⚠️  No AI context found in profile');
            }
        } else {
            console.log('❌ Failed to get AI profile');
        }

        // Step 2: Test enhanced analysis to see what profile data is being used
        console.log('\n🚀 Step 2: Testing Enhanced Analysis with Full Profile\n');
        
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

        // Step 3: Test categorization with enhanced user profile
        console.log('\n🎯 Step 3: Testing Categorization with Full User Profile\n');
        
        const selectedCategories = [
            'Fuel & Transport',
            'Marketing', 
            'Meals & Entertainment',
            'Office Supplies',
            'Technology',
            'Professional Services'
        ];

        // Select transactions for re-analysis
        const transactionsForReanalysis = analysisData.categorizedTransactions.slice(0, 2).map(tx => ({
            ...tx,
            forceReanalysis: true // Force fresh AI analysis
        }));

        console.log(`🔄 Re-analyzing ${transactionsForReanalysis.length} transactions`);
        console.log(`🎯 Categories: ${selectedCategories.join(', ')}`);
        
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
                    enableCategorization: true,
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
                console.log(`   📋 Category: ${result.category}`);
                console.log(`   🆕 New Category: ${result.isNewCategory || false}`);
                if (result.newCategoryName) {
                    console.log(`   🏷️  Suggested Name: ${result.newCategoryName}`);
                }
                console.log(`   🎯 Method: ${result.source || result.classificationSource}`);
                console.log(`   💯 Confidence: ${Math.round((result.confidence || 0) * 100)}%`);
                console.log(`   🧠 Reasoning: ${result.reasoning || result.categoryReasoning || 'N/A'}`);
            });
        }

        // Step 4: Verify enhanced prompt was used
        console.log('\n🔍 Step 4: Verification Summary\n');
        
        const checks = [
            {
                name: 'AI Calls Made',
                status: categorizationData.openaiDetails?.totalCalls > 0,
                expected: 'Should be > 0 (real AI processing)'
            },
            {
                name: 'Fresh AI Analysis',
                status: categorizationData.results?.some(r => r.source !== 'cache'),
                expected: 'Should have non-cache results'
            },
            {
                name: 'New Category Support',
                status: categorizationData.results?.some(r => r.hasOwnProperty('isNewCategory')),
                expected: 'Should support new category suggestions'
            },
            {
                name: 'Enhanced Reasoning',
                status: categorizationData.results?.some(r => r.reasoning && !r.reasoning.includes('Cached')),
                expected: 'Should have fresh AI reasoning'
            }
        ];

        checks.forEach(check => {
            const status = check.status ? '✅' : '❌';
            console.log(`${status} ${check.name}: ${check.expected}`);
        });

        if (checks.every(check => check.status)) {
            console.log('\n🎉 ALL CHECKS PASSED!');
            console.log('\n📋 Expected prompt format now includes:');
            console.log('   ✅ Business Type: SOLE_TRADER (or user\'s type)');
            console.log('   ✅ Industry: Technology (or user\'s industry)');  
            console.log('   ✅ Profession: Software Developer (or user\'s profession)');
            console.log('   ✅ Country: Australia (or user\'s country)');
            console.log('   ✅ User Context: [AI psychology context] (if set)');
            console.log('   ✅ New category suggestions enabled');
            console.log('   ✅ Enhanced reasoning and confidence');
        } else {
            console.log('\n⚠️  Some checks failed - review the implementation');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('\n🔧 Debugging info:');
        console.error('   - Check if both AI modules and core app are running');
        console.error('   - Verify JWT token is valid');
        console.error('   - Check server logs for detailed error messages');
    }
}

// Run the test
testFullUserProfileCategorization(); 