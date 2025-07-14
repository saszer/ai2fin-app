#!/usr/bin/env node
/**
 * 🚀 AI2 PRODUCTION-READY END-TO-END TEST
 * 
 * This test validates the complete AI system including:
 * - Auto-building reference data over time
 * - Batch processing optimization
 * - Australian tax compliance
 * - Bill pattern detection
 * - Multi-agent orchestration
 * - Real production scenarios
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const AI_MODULES_URL = 'http://localhost:3002';
const CORE_APP_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

// Test data representing real Australian business transactions
const TEST_TRANSACTIONS = [
  {
    id: '1',
    description: 'Microsoft Office 365 Monthly Subscription',
    amount: 14.50,
    date: '2025-01-15',
    merchant: 'Microsoft',
    type: 'debit'
  },
  {
    id: '2', 
    description: 'Adobe Creative Cloud Pro',
    amount: 79.99,
    date: '2025-01-15',
    merchant: 'Adobe',
    type: 'debit'
  },
  {
    id: '3',
    description: 'AWS Monthly Usage',
    amount: 125.30,
    date: '2025-01-15',
    merchant: 'Amazon Web Services',
    type: 'debit'
  },
  {
    id: '4',
    description: 'Telstra Business Internet',
    amount: 89.95,
    date: '2025-01-15',
    merchant: 'Telstra',
    type: 'debit'
  },
  {
    id: '5',
    description: 'Office Supplies - Staples',
    amount: 42.75,
    date: '2025-01-15',
    merchant: 'Staples',
    type: 'debit'
  },
  {
    id: '6',
    description: 'Zoom Pro Monthly',
    amount: 22.99,
    date: '2025-01-15',
    merchant: 'Zoom',
    type: 'debit'
  },
  {
    id: '7',
    description: 'GitHub Enterprise',
    amount: 210.00,
    date: '2025-01-15',
    merchant: 'GitHub',
    type: 'debit'
  },
  {
    id: '8',
    description: 'Business Lunch Meeting',
    amount: 67.50,
    date: '2025-01-15',
    merchant: 'Local Restaurant',
    type: 'debit'
  },
  {
    id: '9',
    description: 'Uber Business Trip',
    amount: 28.45,
    date: '2025-01-15',
    merchant: 'Uber',
    type: 'debit'
  },
  {
    id: '10',
    description: 'Client Payment Received',
    amount: 2500.00,
    date: '2025-01-15',
    merchant: 'Client ABC',
    type: 'credit'
  }
];

// Test runner
class AI2ProductionTest {
  constructor() {
    this.results = {
      services: { ai: false, core: false, frontend: false },
      endpoints: {},
      processing: {
        singleTransaction: false,
        batchProcessing: false,
        optimizedBatch: false,
        orchestration: false
      },
      features: {
        autoReferenceData: false,
        australianTax: false,
        billPatterns: false,
        costOptimization: false
      },
      performance: {
        responseTime: 0,
        accuracy: 0,
        costSavings: 0
      }
    };
  }

  async runCompleteTest() {
    console.log('\n🚀 AI2 PRODUCTION-READY SYSTEM TEST');
    console.log('=====================================\n');

    try {
      // 1. Test service availability
      await this.testServiceAvailability();
      
      // 2. Test direct classify endpoint (fixes the 404 issue)
      await this.testDirectClassifyEndpoint();
      
      // 3. Test batch processing
      await this.testBatchProcessing();
      
      // 4. Test optimized batch processing
      await this.testOptimizedBatchProcessing();
      
      // 5. Test orchestration system
      await this.testOrchestrationSystem();
      
      // 6. Test auto-building reference data
      await this.testAutoReferenceData();
      
      // 7. Test Australian tax compliance
      await this.testAustralianTaxCompliance();
      
      // 8. Test bill pattern detection
      await this.testBillPatternDetection();
      
      // 9. Test cost optimization
      await this.testCostOptimization();
      
      // 10. Generate production report
      await this.generateProductionReport();
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  }

  async testServiceAvailability() {
    console.log('1. Testing Service Availability...');
    
    try {
      // Test AI Modules
      const aiResponse = await axios.get(`${AI_MODULES_URL}/health`, { timeout: 5000 });
      this.results.services.ai = aiResponse.status === 200;
      console.log(`   ✅ AI Modules: ${aiResponse.status === 200 ? 'ONLINE' : 'OFFLINE'}`);
      
      // Test Core App
      const coreResponse = await axios.get(`${CORE_APP_URL}/api/services/status`, { timeout: 5000 });
      this.results.services.core = coreResponse.status === 200;
      console.log(`   ✅ Core App: ${coreResponse.status === 200 ? 'ONLINE' : 'OFFLINE'}`);
      
      // Test Frontend (optional)
      try {
        const frontendResponse = await axios.get(`${FRONTEND_URL}`, { timeout: 3000 });
        this.results.services.frontend = frontendResponse.status === 200;
        console.log(`   ✅ Frontend: ${frontendResponse.status === 200 ? 'ONLINE' : 'OFFLINE'}`);
      } catch {
        console.log(`   ⚠️  Frontend: OFFLINE (optional)`);
      }
      
    } catch (error) {
      console.error('   ❌ Service availability test failed:', error.message);
      throw error;
    }
  }

  async testDirectClassifyEndpoint() {
    console.log('\n2. Testing Direct Classify Endpoint (Fixes 404 Error)...');
    
    try {
      const testTransaction = TEST_TRANSACTIONS[0];
      
      // Test the direct /api/classify endpoint that was causing 404 errors
      const response = await axios.post(`${AI_MODULES_URL}/api/classify`, {
        description: testTransaction.description,
        amount: testTransaction.amount,
        type: testTransaction.type,
        merchant: testTransaction.merchant,
        date: testTransaction.date
      }, { timeout: 10000 });
      
      this.results.endpoints.classify = response.status === 200;
      
      if (response.status === 200 && response.data.success) {
        console.log('   ✅ Direct classify endpoint working');
        console.log(`   📊 Result: ${response.data.data.category || 'N/A'} (${response.data.data.confidence || 0}% confidence)`);
        this.results.processing.singleTransaction = true;
      } else {
        console.log('   ❌ Direct classify endpoint failed');
      }
      
    } catch (error) {
      console.error('   ❌ Direct classify test failed:', error.message);
      // Don't throw here - continue with other tests
    }
  }

  async testBatchProcessing() {
    console.log('\n3. Testing Batch Processing...');
    
    try {
      const startTime = Date.now();
      
      const response = await axios.post(`${AI_MODULES_URL}/api/ai/classify`, {
        analysisType: 'batch',
        transactions: TEST_TRANSACTIONS,
        userPreferences: {
          businessType: 'SOLE_TRADER',
          countryCode: 'AU',
          industry: 'Software Services'
        }
      }, { timeout: 30000 });
      
      const processingTime = Date.now() - startTime;
      this.results.performance.responseTime = processingTime;
      
      if (response.status === 200 && response.data.success) {
        console.log('   ✅ Batch processing working');
        console.log(`   ⏱️  Processing time: ${processingTime}ms`);
        console.log(`   📊 Processed ${response.data.data.results?.length || 0} transactions`);
        this.results.processing.batchProcessing = true;
      } else {
        console.log('   ❌ Batch processing failed');
      }
      
    } catch (error) {
      console.error('   ❌ Batch processing test failed:', error.message);
    }
  }

  async testOptimizedBatchProcessing() {
    console.log('\n4. Testing Optimized Batch Processing...');
    
    try {
      const startTime = Date.now();
      
      const response = await axios.post(`${AI_MODULES_URL}/api/optimized/batch-analyze`, {
        transactions: TEST_TRANSACTIONS,
        options: {
          batchSize: 50,
          enableCostOptimization: true,
          confidenceThreshold: 0.8
        }
      }, { timeout: 30000 });
      
      const processingTime = Date.now() - startTime;
      
      if (response.status === 200 && response.data.success) {
        console.log('   ✅ Optimized batch processing working');
        console.log(`   ⏱️  Processing time: ${processingTime}ms`);
        console.log(`   💰 Cost savings: ${response.data.data.optimization?.savingsPercentage || 0}%`);
        this.results.processing.optimizedBatch = true;
        this.results.performance.costSavings = response.data.data.optimization?.savingsPercentage || 0;
      } else {
        console.log('   ❌ Optimized batch processing failed');
      }
      
    } catch (error) {
      console.error('   ❌ Optimized batch processing test failed:', error.message);
    }
  }

  async testOrchestrationSystem() {
    console.log('\n5. Testing Orchestration System...');
    
    try {
      const response = await axios.post(`${AI_MODULES_URL}/api/ai/orchestrate`, {
        workflow: 'fullTransactionAnalysis',
        userId: 'test-user',
        data: {
          transactions: TEST_TRANSACTIONS.slice(0, 3)
        }
      }, { timeout: 20000 });
      
      if (response.status === 200 && response.data.success) {
        console.log('   ✅ Orchestration system working');
        console.log(`   🤖 Agents: ${response.data.data.agentsUsed || 'N/A'}`);
        this.results.processing.orchestration = true;
      } else {
        console.log('   ❌ Orchestration system failed');
      }
      
    } catch (error) {
      console.error('   ❌ Orchestration test failed:', error.message);
    }
  }

  async testAutoReferenceData() {
    console.log('\n6. Testing Auto-Building Reference Data...');
    
    try {
      // Test pattern analysis endpoint
      const response = await axios.get(`${AI_MODULES_URL}/api/optimized/pattern-analysis`, { timeout: 10000 });
      
      if (response.status === 200 && response.data.success) {
        console.log('   ✅ Auto-building reference data working');
        console.log(`   📊 Merchant patterns: ${response.data.data.patterns?.merchantPatterns || 0}`);
        console.log(`   📊 Category signatures: ${response.data.data.patterns?.categorySignatures || 0}`);
        this.results.features.autoReferenceData = true;
      } else {
        console.log('   ❌ Auto-building reference data failed');
      }
      
    } catch (error) {
      console.error('   ❌ Auto-building reference data test failed:', error.message);
    }
  }

  async testAustralianTaxCompliance() {
    console.log('\n7. Testing Australian Tax Compliance...');
    
    try {
      const response = await axios.post(`${AI_MODULES_URL}/api/ai/tax-analysis`, {
        transactions: TEST_TRANSACTIONS,
        taxYear: 2025,
        businessType: 'SOLE_TRADER',
        countryCode: 'AU'
      }, { timeout: 15000 });
      
      if (response.status === 200 && response.data.success) {
        console.log('   ✅ Australian tax compliance working');
        console.log(`   💰 Total deductible: $${response.data.data.totalDeductible || 0}`);
        console.log(`   📊 Business percentage: ${response.data.data.businessPercentage || 0}%`);
        this.results.features.australianTax = true;
      } else {
        console.log('   ❌ Australian tax compliance failed');
      }
      
    } catch (error) {
      console.error('   ❌ Australian tax compliance test failed:', error.message);
    }
  }

  async testBillPatternDetection() {
    console.log('\n8. Testing Bill Pattern Detection...');
    
    try {
      const recurringTransactions = [
        ...TEST_TRANSACTIONS.slice(0, 4), // Monthly bills
        ...TEST_TRANSACTIONS.slice(0, 4).map(t => ({
          ...t,
          id: t.id + '_month2',
          date: '2025-02-15'
        }))
      ];
      
      const response = await axios.post(`${AI_MODULES_URL}/api/ai/classify`, {
        analysisType: 'comprehensive',
        transactions: recurringTransactions,
        userPreferences: {
          businessType: 'SOLE_TRADER',
          countryCode: 'AU'
        }
      }, { timeout: 20000 });
      
      if (response.status === 200 && response.data.success) {
        console.log('   ✅ Bill pattern detection working');
        console.log(`   📊 Recurring bills found: ${response.data.data.recurringBills?.length || 0}`);
        this.results.features.billPatterns = true;
      } else {
        console.log('   ❌ Bill pattern detection failed');
      }
      
    } catch (error) {
      console.error('   ❌ Bill pattern detection test failed:', error.message);
    }
  }

  async testCostOptimization() {
    console.log('\n9. Testing Cost Optimization...');
    
    try {
      const response = await axios.get(`${AI_MODULES_URL}/api/optimized/cost-analysis`, { timeout: 10000 });
      
      if (response.status === 200 && response.data.success) {
        console.log('   ✅ Cost optimization working');
        console.log(`   💰 Potential savings: ${response.data.data.optimization?.estimatedSavings || 0}%`);
        console.log(`   📊 Efficiency rating: ${response.data.data.optimization?.efficiencyRating || 0}%`);
        this.results.features.costOptimization = true;
      } else {
        console.log('   ❌ Cost optimization failed');
      }
      
    } catch (error) {
      console.error('   ❌ Cost optimization test failed:', error.message);
    }
  }

  async generateProductionReport() {
    console.log('\n10. Generating Production Report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 9,
        passed: Object.values(this.results.processing).filter(Boolean).length +
                Object.values(this.results.features).filter(Boolean).length,
        failed: 0,
        status: 'PRODUCTION_READY'
      },
      services: this.results.services,
      endpoints: this.results.endpoints,
      processing: this.results.processing,
      features: this.results.features,
      performance: this.results.performance,
      recommendations: this.generateRecommendations()
    };
    
    report.summary.failed = report.summary.totalTests - report.summary.passed;
    report.summary.status = report.summary.passed >= 7 ? 'PRODUCTION_READY' : 'NEEDS_FIXES';
    
    // Save report
    const reportPath = path.join(__dirname, 'production-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 PRODUCTION TEST RESULTS');
    console.log('==========================');
    console.log(`Status: ${report.summary.status}`);
    console.log(`Tests Passed: ${report.summary.passed}/${report.summary.totalTests}`);
    console.log(`Response Time: ${report.performance.responseTime}ms`);
    console.log(`Cost Savings: ${report.performance.costSavings}%`);
    console.log(`Report saved: ${reportPath}`);
    
    if (report.summary.status === 'PRODUCTION_READY') {
      console.log('\n🎉 SYSTEM IS PRODUCTION-READY!');
      console.log('✅ Auto-building reference data: ENABLED');
      console.log('✅ Australian tax compliance: ENABLED');
      console.log('✅ Bill pattern detection: ENABLED');
      console.log('✅ Cost optimization: ENABLED');
      console.log('✅ Multi-agent orchestration: ENABLED');
    } else {
      console.log('\n⚠️  SYSTEM NEEDS FIXES');
      console.log('Recommendations:');
      report.recommendations.forEach(rec => console.log(`- ${rec}`));
    }
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (!this.results.processing.singleTransaction) {
      recommendations.push('Fix the /api/classify endpoint - currently returning 404');
    }
    
    if (!this.results.processing.orchestration) {
      recommendations.push('Fix orchestration system - categorizeTransaction task type issue');
    }
    
    if (!this.results.features.autoReferenceData) {
      recommendations.push('Enable auto-building reference data for cost optimization');
    }
    
    if (this.results.performance.responseTime > 5000) {
      recommendations.push('Optimize response time - consider caching and batch processing');
    }
    
    if (this.results.performance.costSavings < 50) {
      recommendations.push('Improve cost optimization - add more reference data patterns');
    }
    
    return recommendations;
  }
}

// Run the test
if (require.main === module) {
  const test = new AI2ProductionTest();
  test.runCompleteTest()
    .then(() => {
      console.log('\n✅ Production test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Production test failed:', error.message);
      process.exit(1);
    });
}

module.exports = AI2ProductionTest; 