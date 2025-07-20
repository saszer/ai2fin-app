// Quick test to verify pattern analysis fix
// This will test the fixed OfflineBillPatternEngine

console.log('🧪 Testing Fixed Pattern Analysis...\n');

// Simple test that can be run from browser console
const testData = `
// Copy this into browser console after the backend restarts:

async function testFixedPatternAnalysis() {
  console.log('🔧 Testing Fixed Pattern Analysis...');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ Please log in first');
    return;
  }

  const startTime = performance.now();
  
  try {
    const response = await fetch('/api/bills/analyze-patterns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${token}\`
      },
      body: JSON.stringify({
        transactions: [
          {
            id: 'test1',
            description: 'Netflix',
            amount: -14.99,
            date: '2024-07-01',
            merchant: 'Netflix'
          },
          {
            id: 'test2',
            description: 'Netflix',
            amount: -14.99,
            date: '2024-06-01',
            merchant: 'Netflix'
          }
        ]
      })
    });
    
    const endTime = performance.now();
    console.log(\`⏱️  Response time: \${Math.round(endTime - startTime)}ms\`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS!', data);
      console.log(\`🎉 Found \${data.patterns ? data.patterns.length : 0} patterns\`);
    } else {
      console.error('❌ Failed:', response.status, await response.text());
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testFixedPatternAnalysis();
`;

console.log(testData);
console.log('\n🔧 Pattern Analysis Fix Applied!');
console.log('📋 Next Steps:');
console.log('1. Wait for backend to fully restart');
console.log('2. Copy the test function above into browser console');
console.log('3. Test should complete in <1 second instead of hanging');
console.log('4. Try the Bill Pattern Analysis modal again'); 