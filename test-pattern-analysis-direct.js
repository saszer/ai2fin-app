// Use Node.js built-in fetch (Node 18+)
async function testPatternAnalysis() {
    console.log('\n🔍 Testing Pattern Analysis Direct Route...\n');
    
    try {
        const response = await fetch('http://localhost:3001/test-pattern-analysis', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response Status:', response.status);
        console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.text();
        console.log('Response Body:', data);
        
        if (response.ok) {
            console.log('\n✅ Pattern analysis route working!');
            try {
                const jsonData = JSON.parse(data);
                console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
            } catch (e) {
                console.log('Response is not JSON, raw text:', data);
            }
        } else {
            console.log('\n❌ Pattern analysis route failed');
        }
        
    } catch (error) {
        console.error('\n💥 Error testing pattern analysis:', error.message);
    }
}

testPatternAnalysis(); 