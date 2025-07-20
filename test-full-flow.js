const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Test the full AI analysis flow
console.log('🚀 AI2 Full Flow Test');
console.log('====================');

// Simple HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const { method = 'GET', headers = {}, body } = options;
    const { hostname, port, pathname } = new URL(url);
    
    const requestOptions = {
      hostname,
      port,
      path: pathname,
      method,
      headers: {
        'User-Agent': 'AI2-Test-Client',
        ...headers
      }
    };
    
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json: () => Promise.resolve(json), text: () => Promise.resolve(data) });
        } catch (error) {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json: () => Promise.reject(error), text: () => Promise.resolve(data) });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

async function testFullFlow() {
  try {
    // Test 1: Check if services are running
    console.log('\n1. Testing service availability...');
    
    // Check Core App
    try {
      const coreResponse = await makeRequest('http://localhost:3001/health');
      console.log('✅ Core App (3001):', coreResponse.ok ? 'RUNNING' : 'NOT RESPONDING');
    } catch (error) {
      console.log('❌ Core App (3001): NOT RUNNING');
    }
    
    // Check AI Modules
    try {
      const aiResponse = await makeRequest('http://localhost:3002/health');
      const aiData = await aiResponse.json();
      console.log('✅ AI Modules (3002):', aiResponse.ok ? 'RUNNING' : 'NOT RESPONDING');
      console.log('   Features:', aiData.features);
    } catch (error) {
      console.log('❌ AI Modules (3002): NOT RUNNING');
    }
    
    // Check Frontend
    try {
      const frontendResponse = await makeRequest('http://localhost:3000');
      console.log('✅ Frontend (3000):', frontendResponse.ok ? 'RUNNING' : 'NOT RESPONDING');
    } catch (error) {
      console.log('❌ Frontend (3000): NOT RUNNING');
    }
    
    // Test 2: Check OpenAI API key configuration
    console.log('\n2. Testing OpenAI API key configuration...');
    
    const dotenv = require('dotenv');
    dotenv.config({ path: path.join(__dirname, 'ai2-ai-modules', '.env') });
    
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    console.log('🔑 OpenAI API Key:', hasApiKey ? 'CONFIGURED' : 'NOT CONFIGURED');
    
    if (hasApiKey) {
      const keyLength = process.env.OPENAI_API_KEY.length;
      console.log(`   Key length: ${keyLength} characters`);
      console.log(`   Key prefix: ${process.env.OPENAI_API_KEY.substring(0, 7)}...`);
    }
    
    // Test 3: Test AI analysis endpoint
    console.log('\n3. Testing AI analysis endpoint...');
    
    const testData = {
      workflow: 'fullTransactionAnalysis',
      userId: 'test-user-flow',
      data: {
        transactions: [
          {
            id: 'test-flow-1',
            description: 'Adobe Creative Cloud Subscription',
            amount: -59.99,
            date: '2024-01-15',
            type: 'debit',
            merchant: 'Adobe Inc'
          },
          {
            id: 'test-flow-2',
            description: 'AWS Cloud Services',
            amount: -45.50,
            date: '2024-01-14',
            type: 'debit',
            merchant: 'Amazon Web Services'
          }
        ],
        userProfile: {
          businessType: 'SOLE_TRADER',
          industry: 'Technology',
          countryCode: 'AU',
          occupation: 'Software Developer'
        },
        options: {
          includeTaxAnalysis: true,
          includeBillDetection: true,
          confidenceThreshold: 0.7
        }
      }
    };
    
    console.log('📊 Sending test data to AI modules...');
    
    try {
      const aiAnalysisResponse = await makeRequest('http://localhost:3002/api/ai/orchestrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      console.log('📡 AI Analysis Response Status:', aiAnalysisResponse.status);
      
      if (aiAnalysisResponse.ok) {
        const aiResult = await aiAnalysisResponse.json();
        console.log('✅ AI Analysis Success:', aiResult.success);
        console.log('📈 Confidence:', aiResult.confidence);
        console.log('⏱️ Processing Time:', aiResult.processingTime, 'ms');
        
        if (aiResult.data) {
          console.log('📊 Results Summary:');
          console.log('   - Categorization:', aiResult.data.categorizeTransaction?.success ? 'SUCCESS' : 'FAILED');
          console.log('   - Classification:', aiResult.data.classifyTransaction?.success ? 'SUCCESS' : 'FAILED');
          console.log('   - Tax Analysis:', aiResult.data.analyzeTaxDeductibility?.success ? 'SUCCESS' : 'FAILED');
        }
      } else {
        const errorText = await aiAnalysisResponse.text();
        console.log('❌ AI Analysis Failed:', errorText);
      }
    } catch (error) {
      console.log('❌ AI Analysis Error:', error.message);
    }
    
    // Test 4: Check logs
    console.log('\n4. Checking log files...');
    
    const logsDir = path.join(__dirname, 'ai2-ai-modules', 'logs');
    const logFile = path.join(logsDir, 'api-requests.log');
    
    if (fs.existsSync(logFile)) {
      const logContent = fs.readFileSync(logFile, 'utf8');
      const lines = logContent.split('\n').filter(line => line.trim());
      
      console.log(`✅ Log file exists with ${lines.length} entries`);
      
      if (lines.length > 0) {
        console.log('📝 Recent log entries:');
        lines.slice(-3).forEach((line, index) => {
          try {
            const entry = JSON.parse(line);
            console.log(`   ${index + 1}. ${entry.timestamp} - ${entry.service}.${entry.method} - ${entry.response?.success ? 'SUCCESS' : 'FAILED'}`);
          } catch (error) {
            console.log(`   ${index + 1}. [Invalid JSON entry]`);
          }
        });
      }
    } else {
      console.log('❌ Log file does not exist');
    }
    
    // Test 5: Performance summary
    console.log('\n5. Performance summary...');
    
    try {
      const { LogViewerCLI } = require('./ai2-ai-modules/dist/utils/LogViewer');
      console.log('📊 Generating performance dashboard...');
      LogViewerCLI.dashboard('day');
    } catch (error) {
      console.log('❌ Could not generate performance dashboard:', error.message);
    }
    
    // Test 6: Log viewer test
    console.log('\n6. Testing log viewer endpoints...');
    
    try {
      const logDashboardResponse = await makeRequest('http://localhost:3002/api/logs/dashboard');
      
      if (logDashboardResponse.ok) {
        const dashboardData = await logDashboardResponse.json();
        console.log('✅ Log Dashboard API:', dashboardData.success ? 'WORKING' : 'FAILED');
        
        if (dashboardData.success) {
          console.log('📊 Dashboard Summary:');
          console.log(`   - Total Requests: ${dashboardData.data.totalRequests}`);
          console.log(`   - Success Rate: ${((dashboardData.data.successfulRequests / dashboardData.data.totalRequests) * 100).toFixed(1)}%`);
          console.log(`   - Average Time: ${dashboardData.data.averageProcessingTime}ms`);
          console.log(`   - Total Tokens: ${dashboardData.data.totalTokensUsed}`);
        }
      } else {
        console.log('❌ Log Dashboard API: NOT WORKING');
      }
    } catch (error) {
      console.log('❌ Log Dashboard API Error:', error.message);
    }
    
    console.log('\n🎉 Full flow test completed!');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFullFlow().catch(console.error); 