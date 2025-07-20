// Test script to verify GPT-4 usage and user profile data in AI categorization prompts
const fetch = require('node-fetch');

// Replace with valid JWT token from browser
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWQ3cHIyNGgwMDAwcDk5Z2xtYW4ydDU5IiwiZW1haWwiOiJzei5zYWhhakBnbWFpbC5jb20iLCJmaXJzdE5hbWUiOiJTYWhhaiIsImxhc3ROYW1lIjoiR2FyZyIsImJ1c2luZXNzVHlwZSI6IiIsImNvdW50cnlDb2RlIjoiQVUiLCJpYXQiOjE3NTI5NDE3NjEsImV4cCI6MTc1MzAyODE2MX0.74XOvunbK2NXNiApJDVWmhM_Sa0ScHJ_dkzt7ou9vcQ';

const BASE_URL = 'http://localhost:3001';

async function testGPT4AndUserProfile() {
    console.log('🔍 Testing GPT-4 Usage & User Profile in AI Prompts');
    console.log('===================================================\n');

    try {
        // Step 1: Verify current user profile
        console.log('📋 Step 1: Checking Complete User Profile\n');
        
        const aiProfileResponse = await fetch(`${BASE_URL}/api/ai/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${JWT_TOKEN}`
            }
        });

        if (aiProfileResponse.ok) {
            const profileData = await aiProfileResponse.json();
            console.log('✅ Current Complete AI Profile:');
            console.log(JSON.stringify(profileData, null, 2));
            
            const profile = profileData.profile;
            console.log('\n📊 Profile Summary:');
            console.log(`   🏢 Business Type: ${profile?.businessContext?.businessType || 'Not set'}`);
            console.log(`   🏭 Industry: ${profile?.businessContext?.industry || 'Not set'}`);
            console.log(`   👨‍💻 Profession: ${profile?.businessContext?.profession || 'Not set'}`);
            console.log(`   🌍 Country: ${profile?.businessContext?.countryCode || 'Not set'}`);
            console.log(`   🧠 AI Context: ${profile?.aiProfile?.contextInput || 'Not set'}`);
        } else {
            console.log('❌ Failed to get AI profile');
            return;
        }

        // Step 2: Force fresh AI analysis to trigger debugging
        console.log('\n🚀 Step 2: Triggering Fresh AI Analysis for Debugging\n');
        
        const analysisResponse = await fetch(`${BASE_URL}/analyze-for-categorization`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT_TOKEN}`
            },
            body: JSON.stringify({
                includeAlreadyCategorized: true,
                forceRefresh: true // Force fresh analysis
            })
        });

        if (!analysisResponse.ok) {
            throw new Error(`Analysis failed: ${analysisResponse.status}`);
        }

        const analysisData = await analysisResponse.json();
        console.log('✅ Analysis complete - checking for categorized transactions');
        
        if (!analysisData.categorizedTransactions || analysisData.categorizedTransactions.length === 0) {
            console.log('❌ No transactions available for testing. Need some categorized transactions.');
            return;
        }

        // Step 3: Run categorization with debugging enabled
        console.log('\n🤖 Step 3: Running Categorization (Check AI Modules Console for Debug Output)\n');
        
        const selectedCategories = [
            'Fuel & Transport',
            'Technology', 
            'Professional Services',
            'Office Supplies'
        ];

        // Select first 2 transactions for fresh analysis
        const transactionsForTest = analysisData.categorizedTransactions.slice(0, 2).map(tx => ({
            ...tx,
            forceReanalysis: true
        }));

        console.log(`🔄 Testing with ${transactionsForTest.length} transactions:`);
        transactionsForTest.forEach((tx, i) => {
            console.log(`   ${i + 1}. ${tx.description} ($${Math.abs(tx.amount || 0).toFixed(2)})`);
        });
        console.log(`\n🎯 Selected categories: ${selectedCategories.join(', ')}`);
        
        console.log('\n📋 IMPORTANT: Check the AI Modules console for:');
        console.log('   🔍 "DEBUG - Incoming User Profile Data"');
        console.log('   🔍 "DEBUG - Extracted Profile Components"');  
        console.log('   🔍 "DEBUG - User Profile Context Being Sent"');
        console.log('   🔍 "DEBUG - Complete AI Prompt"');
        console.log('   🤖 "Using AI Model: gpt-4"');
        console.log('\n⏳ Making categorization request...');
        
        const categorizationResponse = await fetch(`${BASE_URL}/classify-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT_TOKEN}`
            },
            body: JSON.stringify({
                transactions: transactionsForTest,
                selectedCategories: selectedCategories,
                options: {
                    enableCategorization: true,
                    batchSize: 10,
                    confidenceThreshold: 0.8,
                    debug: true // Enable debug mode
                }
            })
        });

        if (!categorizationResponse.ok) {
            const errorText = await categorizationResponse.text();
            throw new Error(`Categorization failed: ${categorizationResponse.status} - ${errorText}`);
        }

        const categorizationData = await categorizationResponse.json();
        
        console.log('\n✅ Categorization Request Completed!');
        console.log('=====================================');
        console.log(`📊 Processed: ${categorizationData.results?.length || 0} transactions`);
        console.log(`🤖 AI calls: ${categorizationData.openaiDetails?.totalCalls || 0}`);
        console.log(`📝 Tokens: ${categorizationData.openaiDetails?.totalTokens || 0}`);
        console.log(`💰 Model: ${categorizationData.openaiDetails?.model || 'Not specified'}`);
        
        if (categorizationData.results && categorizationData.results.length > 0) {
            console.log('\n🎯 Sample Results:');
            categorizationData.results.forEach((result, index) => {
                console.log(`\n${index + 1}. ${result.description}`);
                console.log(`   📋 Category: ${result.category}`);
                console.log(`   🎯 Method: ${result.source || result.classificationSource || 'Unknown'}`);
                console.log(`   💯 Confidence: ${Math.round((result.confidence || 0) * 100)}%`);
                console.log(`   🧠 Reasoning: ${result.reasoning || 'N/A'}`);
            });
        }

        // Step 4: Verification checklist
        console.log('\n🔍 Step 4: Verification Checklist\n');
        
        const checks = [
            {
                name: 'GPT-4 Model Used',
                instruction: 'Look for "Using AI Model: gpt-4" in AI modules console',
                expected: 'Should show gpt-4, not gpt-3.5-turbo'
            },
            {
                name: 'User Profile Data Received',
                instruction: 'Look for "DEBUG - Incoming User Profile Data" in console',
                expected: 'Should show businessType, industry, profession, countryCode, aiContextInput'
            },
            {
                name: 'Complete Profile in Prompt',
                instruction: 'Look for "DEBUG - Complete AI Prompt" in console',
                expected: 'Should include Business Type, Industry, Profession, Country, User Context'
            },
            {
                name: 'Fresh AI Analysis',
                instruction: 'Check if AI calls > 0 and reasoning is not "Cached"',
                expected: `AI calls: ${categorizationData.openaiDetails?.totalCalls || 0}, Fresh reasoning`
            }
        ];

        checks.forEach((check, index) => {
            console.log(`${index + 1}. ✅ ${check.name}`);
            console.log(`   📋 Check: ${check.instruction}`);
            console.log(`   🎯 Expected: ${check.expected}\n`);
        });

        console.log('🎉 Test completed! Review the AI modules console output to verify:');
        console.log('   1. GPT-4 is being used (not GPT-3.5)');
        console.log('   2. Complete user profile data is in the prompt');
        console.log('   3. AI context/psychology input is included');
        console.log('   4. Fresh AI analysis is occurring');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('\n🔧 Debugging steps:');
        console.error('   1. Ensure both AI modules and core app are running');
        console.error('   2. Check AI modules console for debug output');
        console.error('   3. Verify JWT token is valid');
        console.error('   4. Check network connectivity');
    }
}

// Run the test
testGPT4AndUserProfile(); 