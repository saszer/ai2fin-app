// Test both debug endpoints
async function testBothDebugEndpoints() {
    console.log('\n🔍 Testing Both Debug Endpoints...\n');
    
    const testData = {
        transactions: [{
            id: 'test1',
            description: 'Test Transaction',
            amount: -15.99,
            date: '2025-01-01'
        }]
    };
    
    const endpoints = [
        '/api/bills-patterns/simple-debug',
        '/api/bills-patterns/analyze-patterns-debug'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`🎯 Testing: ${endpoint}`);
            const response = await fetch(`http://localhost:3001${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });
            
            console.log(`   Status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`   ✅ SUCCESS - Patterns: ${data.patterns?.length || 0}`);
            } else {
                console.log(`   ❌ FAILED - Status ${response.status}`);
            }
            
        } catch (error) {
            console.error(`   💥 ERROR: ${error.message}`);
        }
        console.log('');
    }
}

testBothDebugEndpoints(); 