// Test simple endpoints to verify server is working
async function testSimpleEndpoints() {
    console.log('\n🔍 Testing Simple Endpoints...\n');
    
    try {
        // Test GET endpoint
        console.log('1. Testing GET /test-simple');
        const getResponse = await fetch('http://localhost:3001/test-simple');
        console.log('   Status:', getResponse.status);
        const getData = await getResponse.text();
        console.log('   Response:', getData);
        
        console.log('\n2. Testing POST /test-simple-post');
        const postResponse = await fetch('http://localhost:3001/test-simple-post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                test: 'data',
                timestamp: new Date().toISOString()
            })
        });
        console.log('   Status:', postResponse.status);
        const postData = await postResponse.text();
        console.log('   Response:', postData);
        
        console.log('\n3. Testing health endpoint');
        const healthResponse = await fetch('http://localhost:3001/health');
        console.log('   Status:', healthResponse.status);
        
        if (getResponse.status === 200 && postResponse.status === 200) {
            console.log('\n✅ Basic server functionality is working!');
            console.log('✅ The issue is likely with the bills-pattern routes specifically');
        } else {
            console.log('\n❌ Basic server functionality is not working');
        }
        
    } catch (error) {
        console.error('\n💥 Error testing simple endpoints:', error.message);
    }
}

testSimpleEndpoints(); 