/**
 * Test script to verify OpenAI API key loading and connectivity
 */

require('dotenv').config();

async function testAPIKeyLoading() {
    console.log('🔍 Testing API Key Configuration...\n');
    
    // Check if API key is loaded
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('1. Environment Variable Check:');
    console.log(`   OPENAI_API_KEY exists: ${!!apiKey}`);
    console.log(`   OPENAI_API_KEY length: ${apiKey ? apiKey.length : 0}`);
    console.log(`   OPENAI_API_KEY preview: ${apiKey ? apiKey.substring(0, 7) + '...' : 'NOT SET'}\n`);
    
    if (!apiKey || apiKey === 'your-actual-openai-api-key-here') {
        console.log('❌ CRITICAL: OpenAI API key is not configured!');
        console.log('💡 Instructions:');
        console.log('   1. Get your API key from: https://platform.openai.com/api-keys');
        console.log('   2. Edit the .env file in the root directory');
        console.log('   3. Replace "your-actual-openai-api-key-here" with your real API key');
        console.log('   4. Restart the AI services\n');
        return false;
    }
    
    // Test basic OpenAI connectivity
    try {
        console.log('2. Testing OpenAI API Connectivity...');
        
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ API Connection: SUCCESS`);
            console.log(`✅ Available models: ${data.data.length} models found`);
            console.log(`✅ GPT-4 available: ${data.data.some(m => m.id.includes('gpt-4'))}\n`);
            return true;
        } else {
            console.log(`❌ API Connection: FAILED (${response.status})`);
            console.log(`❌ Error: ${response.statusText}\n`);
            return false;
        }
        
    } catch (error) {
        console.log(`❌ API Connection: FAILED`);
        console.log(`❌ Error: ${error.message}\n`);
        return false;
    }
}

// Test simple classification
async function testSimpleClassification() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your-actual-openai-api-key-here') {
        console.log('⏭️  Skipping classification test - API key not configured\n');
        return;
    }
    
    try {
        console.log('3. Testing Transaction Classification...');
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: 'Classify this transaction: "Microsoft Office 365 subscription $15.99". Return only: {"category": "Software", "confidence": 0.95}'
                    }
                ],
                max_tokens: 100,
                temperature: 0.1
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Classification Test: SUCCESS`);
            console.log(`✅ Response: ${data.choices[0].message.content}`);
            console.log(`✅ Usage: ${data.usage.total_tokens} tokens\n`);
        } else {
            console.log(`❌ Classification Test: FAILED (${response.status})`);
            console.log(`❌ Error: ${response.statusText}\n`);
        }
        
    } catch (error) {
        console.log(`❌ Classification Test: FAILED`);
        console.log(`❌ Error: ${error.message}\n`);
    }
}

async function main() {
    console.log('🚀 AI2 API Key Test Suite');
    console.log('==========================\n');
    
    const apiWorking = await testAPIKeyLoading();
    
    if (apiWorking) {
        await testSimpleClassification();
        console.log('🎉 All tests completed! Your OpenAI API key is working.');
        console.log('💡 You can now expect real AI analysis instead of mock responses.');
    } else {
        console.log('❌ Please configure your OpenAI API key to enable AI features.');
    }
}

main().catch(console.error); 