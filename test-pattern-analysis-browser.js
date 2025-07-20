// Browser-based pattern analysis test
// Run this in the browser console when logged into AI2Fin

async function testPatternAnalysisFromBrowser() {
  console.log('🧪 Testing Pattern Analysis from Browser...\n');
  
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No auth token found. Please log in first.');
      return;
    }
    
    console.log('✅ Auth token found:', token.substring(0, 20) + '...');
    
    // Create test transactions similar to what would be passed from the UI
    const testTransactions = [
      {
        id: 'test1',
        description: 'Netflix Subscription',
        amount: -14.99,
        date: '2024-07-01',
        merchant: 'Netflix',
        category: 'Entertainment',
        primaryType: 'expense'
      },
      {
        id: 'test2', 
        description: 'Netflix Subscription',
        amount: -14.99,
        date: '2024-06-01',
        merchant: 'Netflix',
        category: 'Entertainment',
        primaryType: 'expense'
      },
      {
        id: 'test3',
        description: 'Spotify Premium',
        amount: -9.99,
        date: '2024-07-05',
        merchant: 'Spotify',
        category: 'Entertainment',
        primaryType: 'expense'
      }
    ];
    
    console.log('📤 Sending request to /api/bills/analyze-patterns...');
    console.log('📊 Test data:', testTransactions);
    
    const startTime = performance.now();
    
    const response = await fetch('/api/bills/analyze-patterns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        transactions: testTransactions
      })
    });
    
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    console.log(`📥 Response received in ${responseTime}ms`);
    console.log('📊 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Request failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return;
    }
    
    const data = await response.json();
    console.log('✅ Success! Response data:', data);
    
    if (data.success && data.patterns) {
      console.log(`🎉 Found ${data.patterns.length} patterns:`);
      data.patterns.forEach((pattern, index) => {
        console.log(`${index + 1}. ${pattern.name} (${pattern.merchant}) - ${pattern.frequency} - Confidence: ${pattern.confidence}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Also test auth status
function checkAuthStatus() {
  const token = localStorage.getItem('token');
  console.log('🔐 Auth Status Check:');
  console.log('Token exists:', !!token);
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token payload:', {
        userId: payload.userId,
        email: payload.email,
        exp: new Date(payload.exp * 1000),
        isExpired: payload.exp * 1000 < Date.now()
      });
    } catch (e) {
      console.log('Could not parse token');
    }
  }
}

// Export functions to window for easy access
window.testPatternAnalysisFromBrowser = testPatternAnalysisFromBrowser;
window.checkAuthStatus = checkAuthStatus;

console.log('🔧 Pattern Analysis Test Functions Loaded:');
console.log('- Run: testPatternAnalysisFromBrowser()');
console.log('- Run: checkAuthStatus()'); 