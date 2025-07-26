const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const AI_MODULES_URL = 'http://localhost:3002'; // Direct AI modules port

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

async function testAIModulesDebug() {
  try {
    console.log('🔍 Debugging AI Modules Service...\n');

    // Step 1: Login to get auth token
    console.log('🔐 Step 1: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Configure axios with auth token
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Step 2: Test core app's service discovery
    console.log('\n📡 Step 2: Testing service discovery from core app...');
    try {
      const servicesResponse = await axios.get(`${BASE_URL}/api/services/status`);
      console.log('✅ Service discovery accessible');
      console.log('   Services status:', JSON.stringify(servicesResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Service discovery failed:', error.response?.data || error.message);
    }
    
    // Step 3: Test direct AI modules health
    console.log('\n🤖 Step 3: Testing AI modules service directly...');
    try {
      const aiHealthResponse = await axios.get(`${AI_MODULES_URL}/health`);
      console.log('✅ AI modules service is healthy');
      console.log('   Health data:', aiHealthResponse.data);
    } catch (error) {
      console.log('❌ AI modules service not accessible:', error.code || error.message);
    }
    
    // Step 4: Test AI modules tax analysis endpoint directly
    console.log('\n💰 Step 4: Testing AI tax analysis endpoint directly...');
    try {
      const taxAnalysisResponse = await axios.post(`${AI_MODULES_URL}/api/ai-tax/analyze-transaction`, {
        description: 'Office supplies from Officeworks',
        amount: 150.00,
        date: '2024-01-15',
        category: 'Office Supplies',
        userProfile: {
          businessType: 'SOLE_TRADER',
          countryCode: 'AU',
          occupation: 'Software Developer'
        },
        type: 'expense'
      });
      console.log('✅ Direct AI tax analysis successful');
      console.log('   Analysis result:', JSON.stringify(taxAnalysisResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Direct AI tax analysis failed:', error.response?.data || error.message);
      
      if (error.response?.status === 404) {
        console.log('   → Endpoint not found - check AI modules routing');
      } else if (error.response?.status === 500) {
        console.log('   → Internal server error - check AI modules logs');
      } else if (error.code === 'ECONNREFUSED') {
        console.log('   → Connection refused - AI modules service not running on port 3002');
      }
    }
    
    // Step 5: Test via core app service discovery
    console.log('\n🔗 Step 5: Testing AI analysis via core app service discovery...');
    try {
      // This should use the same path that IntelligentTaxDeductionService uses
      const coreAppAIResponse = await axios.post(`${BASE_URL}/api/intelligent-tax-deduction/analyze-batch`, {
        transactions: [{
          id: 'test-1',
          description: 'Office supplies from Officeworks',
          amount: 150.00,
          date: '2024-01-15',
          category: 'Office Supplies',
          primaryType: 'expense',
          secondaryType: 'expense'
        }],
        userContext: {
          businessType: 'SOLE_TRADER',
          countryCode: 'AU',
          occupation: 'Software Developer'
        }
      });
      console.log('✅ Core app AI analysis successful');
      console.log('   Analysis result:', JSON.stringify(coreAppAIResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Core app AI analysis failed:', error.response?.data || error.message);
    }
    
    // Step 6: Check environment variables
    console.log('\n🔧 Step 6: Environment check...');
    console.log(`   - OPENAI_API_KEY present: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
    console.log(`   - AI_MODEL: ${process.env.AI_MODEL || 'Not set'}`);
    console.log(`   - Node environment: ${process.env.NODE_ENV || 'development'}`);
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('\n⚠️  CRITICAL: No OpenAI API key found!');
      console.log('   This is likely why AI analysis is failing and falling back to "Analysis failed - requires manual review"');
      console.log('   To fix: Add OPENAI_API_KEY=your-key-here to your .env file');
    }
    
  } catch (error) {
    console.error('❌ Error in AI modules debug:', error.message);
  }
}

// Run the test
testAIModulesDebug(); 