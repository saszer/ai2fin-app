// Test the actual pattern analysis endpoint that the frontend uses
async function testPatternAnalysis() {
    console.log('\n🔍 Testing Actual Pattern Analysis Endpoint...\n');
    
    const sampleTransactions = [
        {
            id: "1",
            description: "Netflix Subscription",
            amount: -15.99,
            date: "2025-01-15",
            userId: "test"
        },
        {
            id: "2", 
            description: "Netflix Subscription",
            amount: -15.99,
            date: "2025-02-15",
            userId: "test"
        },
        {
            id: "3",
            description: "Spotify Premium", 
            amount: -12.99,
            date: "2025-01-10",
            userId: "test"
        },
        {
            id: "4",
            description: "Spotify Premium",
            amount: -12.99,
            date: "2025-02-10", 
            userId: "test"
        }
    ];
    
    try {
        // Test the frontend endpoint
        console.log('🎯 Testing /api/bills/analyze-patterns (frontend endpoint)');
        const response = await fetch('http://localhost:3001/api/bills/analyze-patterns', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer fake-token-for-testing' // This might fail but let's see the response
            },
            body: JSON.stringify({
                transactions: sampleTransactions
            })
        });
        
        console.log('Response Status:', response.status);
        const responseText = await response.text();
        console.log('Response Body:', responseText);
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('\n✅ SUCCESS! Parsed Response:');
                console.log('- Success:', data.success);
                console.log('- Patterns Count:', data.patterns?.length || 0);
                
                if (data.patterns && data.patterns.length > 0) {
                    console.log('\n🔍 First Pattern Details:');
                    const pattern = data.patterns[0];
                    console.log('- ID:', pattern.id);
                    console.log('- Name:', pattern.name);
                    console.log('- Merchant:', pattern.merchant);
                    console.log('- Frequency:', pattern.frequency);
                    console.log('- Confidence:', pattern.confidence);
                    console.log('- IsRecommended:', pattern.isRecommended);
                    console.log('- TransactionCount:', pattern.transactionCount);
                    console.log('- Transactions:', pattern.transactions?.length, 'items');
                    console.log('- Has reasoning:', !!pattern.reasoning);
                    console.log('- Has interval:', !!pattern.interval);
                    console.log('- Has averageAmount:', !!pattern.averageAmount);
                    console.log('- Has categoryId:', !!pattern.categoryId);
                    console.log('- Has categoryName:', !!pattern.categoryName);
                }
            } catch (e) {
                console.log('⚠️ Response is not valid JSON');
            }
        } else {
            console.log('❌ Request failed with status:', response.status);
        }
        
    } catch (error) {
        console.error('\n💥 Error:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Also test our GET endpoint for comparison
    try {
        console.log('🧪 Testing /test-pattern-analysis (our test endpoint)');
        const testResponse = await fetch('http://localhost:3001/test-pattern-analysis');
        const testData = await testResponse.text();
        console.log('Test Endpoint Response:', testData.substring(0, 200) + '...');
    } catch (error) {
        console.error('Test endpoint error:', error.message);
    }
}

testPatternAnalysis(); 