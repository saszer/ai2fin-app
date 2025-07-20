const axios = require('axios');

async function debugPatternAnalysis() {
  console.log('🔍 DEBUGGING PATTERN ANALYSIS ISSUES\n');
  
  try {
    // Get token from environment or ask user to provide it
    const token = process.env.AUTH_TOKEN || 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWQzMHpmYjUwMDAwcDlpd2pmcGo4MWRvIiwiZW1haWwiOiJzYWhhajEwQGdtYWlsLmNvbSIsImZpcnN0TmFtZSI6IlNhaGFqIiwibGFzdE5hbWUiOiJHYXJnIiwiYnVzaW5lc3NUeXBlIjoiU09MRV9UUkFERVIiLCJjb3VudHJ5Q29kZSI6IkFVIiwiaWF0IjoxNzUyNjMwMDUwLCJleHAiOjE3NTI3MTY0NTB9.aiFin-supe...';

    // Step 1: Get actual user transactions
    console.log('1️⃣ Fetching user transactions...');
    
    const transactionsResponse = await axios.get('http://localhost:3001/api/bank/transactions', {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    const transactions = transactionsResponse.data.transactions || transactionsResponse.data;
    console.log(`   ✅ Fetched ${transactions.length} transactions\n`);

    if (transactions.length === 0) {
      console.log('❌ No transactions found. Please upload some test data first.');
      return;
    }

    // Step 2: Analyze merchant distribution
    console.log('2️⃣ Analyzing merchant distribution...');
    const merchantCount = {};
    const merchantSamples = {};
    
    transactions.forEach(tx => {
      const rawMerchant = tx.merchant || tx.description || 'Unknown';
      const normalizedMerchant = rawMerchant.toUpperCase().replace(/[^A-Z0-9\s]/g, '').trim();
      
      if (!merchantCount[normalizedMerchant]) {
        merchantCount[normalizedMerchant] = 0;
        merchantSamples[normalizedMerchant] = [];
      }
      merchantCount[normalizedMerchant]++;
      
      if (merchantSamples[normalizedMerchant].length < 5) {
        merchantSamples[normalizedMerchant].push({
          description: tx.description,
          amount: tx.amount,
          date: tx.date,
          rawMerchant: rawMerchant
        });
      }
    });

    // Show merchants with multiple transactions (potential patterns)
    console.log('   📊 MERCHANTS WITH MULTIPLE TRANSACTIONS:');
    const potentialPatterns = Object.entries(merchantCount)
      .filter(([merchant, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1]);

    if (potentialPatterns.length === 0) {
      console.log('   ❌ No merchants with 2+ transactions found!');
      console.log('   📋 All merchants (showing first 10):');
      Object.entries(merchantCount)
        .slice(0, 10)
        .forEach(([merchant, count]) => {
          console.log(`      "${merchant}": ${count} transaction(s)`);
          console.log(`         Sample: ${merchantSamples[merchant][0]?.description}`);
        });
    } else {
      potentialPatterns.forEach(([merchant, count]) => {
        console.log(`      "${merchant}": ${count} transactions`);
        merchantSamples[merchant].forEach((sample, i) => {
          console.log(`         ${i + 1}. ${sample.description} - $${Math.abs(sample.amount)} (${sample.date})`);
        });
        console.log('');
      });
    }

    // Step 3: Test date interval analysis
    console.log('3️⃣ Testing date interval analysis...');
    for (const [merchant, count] of potentialPatterns.slice(0, 3)) {
      const merchantTxns = transactions.filter(tx => {
        const normalized = (tx.merchant || tx.description || '').toUpperCase().replace(/[^A-Z0-9\s]/g, '').trim();
        return normalized === merchant;
      });

      console.log(`   🔍 Analyzing "${merchant}" (${count} transactions):`);
      
      // Sort by date and calculate intervals
      const sorted = merchantTxns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const intervals = [];
      
      for (let i = 1; i < sorted.length; i++) {
        const prevDate = new Date(sorted[i - 1].date);
        const currDate = new Date(sorted[i].date);
        const daysDiff = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        intervals.push(daysDiff);
        
        console.log(`      ${sorted[i - 1].date} → ${sorted[i].date} = ${daysDiff} days`);
      }
      
      // Check pattern compliance
      const monthlyIntervals = intervals.filter(interval => interval >= 25 && interval <= 35);
      const weeklyIntervals = intervals.filter(interval => interval >= 6 && interval <= 8);
      
      const monthlyConfidence = intervals.length > 0 ? monthlyIntervals.length / intervals.length : 0;
      const weeklyConfidence = intervals.length > 0 ? weeklyIntervals.length / intervals.length : 0;
      
      console.log(`      📊 Monthly pattern confidence: ${(monthlyConfidence * 100).toFixed(1)}% (need 70%+)`);
      console.log(`      📊 Weekly pattern confidence: ${(weeklyConfidence * 100).toFixed(1)}% (need 80%+)`);
      
      if (monthlyConfidence >= 0.7) {
        console.log('      ✅ SHOULD BE DETECTED as monthly pattern!');
      } else if (weeklyConfidence >= 0.8) {
        console.log('      ✅ SHOULD BE DETECTED as weekly pattern!');
      } else {
        console.log('      ❌ Does not meet pattern criteria');
      }
      console.log('');
    }

    // Step 4: Test actual pattern analysis endpoint
    console.log('4️⃣ Testing pattern analysis endpoint...');
    const patternResponse = await axios.post('http://localhost:3001/api/bills-patterns/analyze-patterns', {
      transactions: transactions
    }, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   ✅ Pattern analysis status: ${patternResponse.status}`);
    console.log(`   ⏱️ Processing time: ${patternResponse.data.processingTime}ms`);
    console.log(`   📊 Patterns detected: ${patternResponse.data.patterns?.length || 0}`);
    
    if (patternResponse.data.patterns && patternResponse.data.patterns.length > 0) {
      console.log('   🎯 DETECTED PATTERNS:');
      patternResponse.data.patterns.forEach((pattern, i) => {
        console.log(`      ${i + 1}. ${pattern.name}`);
        console.log(`         Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
        console.log(`         Transactions: ${pattern.transactionCount}`);
        console.log(`         Frequency: ${pattern.frequency}`);
      });
    } else {
      console.log('   ❌ NO PATTERNS DETECTED - This indicates a bug!');
    }

    // Step 5: Create minimal test case
    console.log('\n5️⃣ Testing with minimal synthetic data...');
    const testTransactions = [
      {
        id: 'test1',
        description: 'NETFLIX SUBSCRIPTION',
        merchant: 'NETFLIX',
        amount: -15.99,
        date: '2024-01-15'
      },
      {
        id: 'test2', 
        description: 'NETFLIX SUBSCRIPTION',
        merchant: 'NETFLIX',
        amount: -15.99,
        date: '2024-02-15'
      },
      {
        id: 'test3',
        description: 'NETFLIX SUBSCRIPTION', 
        merchant: 'NETFLIX',
        amount: -15.99,
        date: '2024-03-15'
      }
    ];

    const testResponse = await axios.post('http://localhost:3001/api/bills-patterns/analyze-patterns', {
      transactions: testTransactions
    }, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   ✅ Test response status: ${testResponse.status}`);
    console.log(`   📊 Test patterns detected: ${testResponse.data.patterns?.length || 0}`);
    
    if (testResponse.data.patterns && testResponse.data.patterns.length > 0) {
      console.log('   ✅ ALGORITHM WORKS - Issue is with your transaction data');
      testResponse.data.patterns.forEach(p => {
        console.log(`      Pattern: ${p.name} (${(p.confidence * 100).toFixed(1)}% confidence)`);
      });
    } else {
      console.log('   ❌ ALGORITHM BROKEN - Even perfect test data fails');
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

debugPatternAnalysis(); 