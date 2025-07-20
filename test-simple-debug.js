// Test renamed simple debug endpoint
async function testSimpleDebug() {
    console.log('\n🔍 Testing Renamed Debug Endpoint...\n');
    
    try {
        console.log('Testing POST /api/bills-patterns/simple-debug');
        const response = await fetch('http://localhost:3001/api/bills-patterns/simple-debug', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transactions: [{
                    id: 'test1',
                    description: 'Test Transaction',
                    amount: -15.99,
                    date: '2025-01-01'
                }]
            })
        });
        
        console.log('Status:', response.status);
        const data = await response.text();
        console.log('Response:', data.substring(0, 200) + '...');
        
        if (response.status === 200) {
            console.log('\n✅ SUCCESS! Renamed debug endpoint is working!');
            try {
                const jsonData = JSON.parse(data);
                console.log('✅ Valid JSON response with patterns:', jsonData.patterns?.length || 0);
            } catch (e) {
                console.log('⚠️ Response is not JSON');
            }
        } else {
            console.log('\n❌ Debug endpoint failed');
        }
        
    } catch (error) {
        console.error('\n💥 Error:', error.message);
    }
}

testSimpleDebug(); 