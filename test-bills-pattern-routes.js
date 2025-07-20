// Test bills-pattern router endpoints
async function testBillsPatternRoutes() {
    console.log('\n🔍 Testing Bills-Pattern Router Endpoints...\n');
    
    try {
        // Test simple GET endpoint
        console.log('1. Testing GET /api/bills-patterns/test');
        const getResponse = await fetch('http://localhost:3001/api/bills-patterns/test');
        console.log('   Status:', getResponse.status);
        const getData = await getResponse.text();
        console.log('   Response:', getData);
        
        console.log('\n2. Testing POST /api/bills-patterns/test-post');
        const postResponse = await fetch('http://localhost:3001/api/bills-patterns/test-post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                test: 'bills-pattern data'
            })
        });
        console.log('   Status:', postResponse.status);
        const postData = await postResponse.text();
        console.log('   Response:', postData);
        
        if (getResponse.status === 200 && postResponse.status === 200) {
            console.log('\n✅ Bills-pattern router is working!');
            console.log('✅ Now testing the debug endpoint...');
            
            // Test the debug endpoint
            console.log('\n3. Testing /api/bills-patterns/analyze-patterns-debug');
            const debugResponse = await fetch('http://localhost:3001/api/bills-patterns/analyze-patterns-debug', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    transactions: [
                        {
                            id: 'test1',
                            description: 'Test Transaction',
                            amount: -15.99,
                            date: '2025-01-01'
                        }
                    ]
                })
            });
            console.log('   Status:', debugResponse.status);
            const debugData = await debugResponse.text();
            console.log('   Response:', debugData.substring(0, 200) + '...');
            
        } else {
            console.log('\n❌ Bills-pattern router is not working');
        }
        
    } catch (error) {
        console.error('\n💥 Error testing bills-pattern routes:', error.message);
    }
}

testBillsPatternRoutes(); 