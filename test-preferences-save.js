// Test script to verify preferences save functionality
const fetch = require('node-fetch');

// Replace with valid JWT token from browser
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWQ3cHIyNGgwMDAwcDk5Z2xtYW4ydDU5IiwiZW1haWwiOiJzei5zYWhhakBnbWFpbC5jb20iLCJmaXJzdE5hbWUiOiJTYWhhaiIsImxhc3ROYW1lIjoiR2FyZyIsImJ1c2luZXNzVHlwZSI6IiIsImNvdW50cnlDb2RlIjoiQVUiLCJpYXQiOjE3NTI5NDE3NjEsImV4cCI6MTc1MzAyODE2MX0.74XOvunbK2NXNiApJDVWmhM_Sa0ScHJ_dkzt7ou9vcQ';

const BASE_URL = 'http://localhost:3001';

async function testPreferencesSave() {
    console.log('🧪 Testing User Preferences Save Functionality');
    console.log('==============================================\n');

    try {
        // Test AI Context Input (the failing part)
        console.log('🎯 Step 1: Testing AI Profile Update with Context Input\n');
        
        const testAiProfile = {
            profession: 'Software Developer',
            industry: 'Technology',
            businessType: 'INDIVIDUAL',
            aiProfile: {
                contextInput: 'suggest new categories'
            }
        };

        console.log('📤 Sending AI profile update...');
        console.log('Data:', JSON.stringify(testAiProfile, null, 2));
        
        const aiProfileResponse = await fetch(`${BASE_URL}/api/ai/profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT_TOKEN}`
            },
            body: JSON.stringify(testAiProfile)
        });

        console.log(`📥 Response status: ${aiProfileResponse.status}`);
        
        if (!aiProfileResponse.ok) {
            const errorText = await aiProfileResponse.text();
            throw new Error(`AI Profile update failed: ${aiProfileResponse.status} - ${errorText}`);
        }

        const aiProfileData = await aiProfileResponse.json();
        console.log('✅ AI Profile update successful!');
        console.log('Response:', JSON.stringify(aiProfileData, null, 2));
        
        // Verify contextInput was saved
        if (aiProfileData.profile?.aiProfile?.contextInput === 'suggest new categories') {
            console.log('✅ Context input was correctly saved!');
        } else {
            console.log('❌ Context input was not saved correctly');
            console.log('Expected: "suggest new categories"');
            console.log('Actual:', aiProfileData.profile?.aiProfile?.contextInput);
        }

        // Step 2: Test Country Preferences
        console.log('\n🌍 Step 2: Testing Country Preferences Update\n');
        
        const countryPrefs = {
            countryCode: 'AU',
            businessType: 'INDIVIDUAL',
            industry: 'Technology'
        };

        const countryResponse = await fetch(`${BASE_URL}/api/country/preferences`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT_TOKEN}`
            },
            body: JSON.stringify(countryPrefs)
        });

        if (countryResponse.ok) {
            const countryData = await countryResponse.json();
            console.log('✅ Country preferences update successful!');
        } else {
            console.log('⚠️  Country preferences update failed, but this is non-critical');
        }

        // Step 3: Test Auth Profile
        console.log('\n👤 Step 3: Testing Auth Profile Update\n');
        
        const authProfile = {
            businessType: 'INDIVIDUAL'
        };

        const authResponse = await fetch(`${BASE_URL}/api/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT_TOKEN}`
            },
            body: JSON.stringify(authProfile)
        });

        if (authResponse.ok) {
            const authData = await authResponse.json();
            console.log('✅ Auth profile update successful!');
        } else {
            console.log('⚠️  Auth profile update failed, but this is non-critical');
        }

        // Step 4: Verify the AI context is retrievable
        console.log('\n🔍 Step 4: Verifying AI Context Retrieval\n');
        
        const getProfileResponse = await fetch(`${BASE_URL}/api/ai/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${JWT_TOKEN}`
            }
        });

        if (getProfileResponse.ok) {
            const getProfileData = await getProfileResponse.json();
            console.log('📖 Retrieved AI Profile:');
            console.log(JSON.stringify(getProfileData, null, 2));
            
            if (getProfileData.profile?.aiProfile?.contextInput === 'suggest new categories') {
                console.log('✅ AI Context persisted correctly!');
                console.log('\n🎉 All preference save tests PASSED!');
                console.log('\n📋 Summary:');
                console.log('   ✅ AI Profile update works');
                console.log('   ✅ Context input is saved and retrieved');
                console.log('   ✅ Data persists across requests');
                console.log('\n💡 The User Preferences modal should now work correctly!');
            } else {
                console.log('❌ AI Context did not persist correctly');
                console.log('Expected: "suggest new categories"');
                console.log('Actual:', getProfileData.profile?.aiProfile?.contextInput);
            }
        } else {
            console.log('❌ Failed to retrieve AI profile for verification');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('\n🔧 Debugging info:');
        console.error('   - Check if the backend is running on port 3001');
        console.error('   - Verify JWT token is valid');
        console.error('   - Check server logs for detailed error messages');
    }
}

// Run the test
testPreferencesSave(); 