// Test basic server connectivity
async function testServerBasic() {
    console.log('\n🔍 Testing Basic Server Connectivity...\n');
    
    const endpoints = [
        'http://localhost:3001/health',
        'http://localhost:3001/hello', 
        'http://localhost:3001/test-pattern-analysis'
    ];
    
    for (const endpoint of endpoints) {
        console.log(`\n🌐 Testing: ${endpoint}`);
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`   Status: ${response.status}`);
            const data = await response.text();
            console.log(`   Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
            
        } catch (error) {
            console.error(`   ❌ Failed: ${error.message}`);
        }
    }
}

testServerBasic(); 