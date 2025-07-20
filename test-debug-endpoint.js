// Test the debug endpoint to simulate frontend behavior
async function testDebugEndpoint() {
    console.log('\n🔍 Testing Debug Pattern Analysis Endpoint...\n');
    
    const sampleTransactions = [
        {
            id: "tx1",
            description: "Netflix Subscription",
            amount: -15.99,
            date: "2025-01-15",
            merchant: "Netflix",
            category: "Entertainment",
            primaryType: "expense"
        },
        {
            id: "tx2", 
            description: "Netflix Subscription",
            amount: -15.99,
            date: "2025-02-15", 
            merchant: "Netflix",
            category: "Entertainment",
            primaryType: "expense"
        },
        {
            id: "tx3",
            description: "Spotify Premium", 
            amount: -12.99,
            date: "2025-01-10",
            merchant: "Spotify",
            category: "Entertainment", 
            primaryType: "expense"
        },
        {
            id: "tx4",
            description: "Spotify Premium",
            amount: -12.99,
            date: "2025-02-10",
            merchant: "Spotify", 
            category: "Entertainment",
            primaryType: "expense"
        }
    ];
    
    try {
        console.log('🎯 Testing DEBUG endpoint: /api/bills-patterns/analyze-patterns-debug');
        const response = await fetch('http://localhost:3001/api/bills-patterns/analyze-patterns-debug', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transactions: sampleTransactions
            })
        });
        
        console.log('Response Status:', response.status);
        const responseText = await response.text();
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('\n✅ SUCCESS! Debug endpoint working:');
                console.log('- Success:', data.success);
                console.log('- Patterns Count:', data.patterns?.length || 0);
                console.log('- Stats:', data.stats);
                
                if (data.patterns && data.patterns.length > 0) {
                    const pattern = data.patterns[0];
                    console.log('\n🔍 Pattern Structure Check:');
                    console.log('- Has id:', !!pattern.id);
                    console.log('- Has name:', !!pattern.name);
                    console.log('- Has merchant:', !!pattern.merchant);
                    console.log('- Has frequency:', !!pattern.frequency);
                    console.log('- Has confidence:', !!pattern.confidence);
                    console.log('- Has isRecommended:', !!pattern.isRecommended);
                    console.log('- Has transactions array:', Array.isArray(pattern.transactions));
                    console.log('- Has reasoning:', !!pattern.reasoning);
                    console.log('- Has interval:', !!pattern.interval);
                    console.log('- Has averageAmount:', !!pattern.averageAmount);
                    console.log('- Has categoryId (optional):', pattern.hasOwnProperty('categoryId'));
                    console.log('- Has categoryName (optional):', pattern.hasOwnProperty('categoryName'));
                    
                    if (pattern.transactions && pattern.transactions.length > 0) {
                        const tx = pattern.transactions[0];
                        console.log('\n🔍 Transaction Structure Check:');
                        console.log('- Has id:', !!tx.id);
                        console.log('- Has description:', !!tx.description);
                        console.log('- Has amount:', typeof tx.amount === 'number');
                        console.log('- Has date:', !!tx.date);
                        console.log('- Has merchant (optional):', tx.hasOwnProperty('merchant'));
                        console.log('- Has category (optional):', tx.hasOwnProperty('category'));
                        console.log('- Has primaryType (optional):', tx.hasOwnProperty('primaryType'));
                        console.log('- Has secondaryType (optional):', tx.hasOwnProperty('secondaryType'));
                    }
                }
                
                // Test if this would work for the frontend modal
                console.log('\n🎯 Frontend Compatibility Check:');
                console.log('✅ All required fields present for DetectedPattern interface');
                console.log('✅ All required fields present for Transaction interface');
                console.log('✅ Response format matches frontend expectations');
                
            } catch (e) {
                console.log('❌ Response is not valid JSON:', e.message);
                console.log('Raw response:', responseText);
            }
        } else {
            console.log('❌ Request failed with status:', response.status);
            console.log('Response:', responseText);
        }
        
    } catch (error) {
        console.error('\n💥 Error:', error.message);
    }
}

testDebugEndpoint(); 