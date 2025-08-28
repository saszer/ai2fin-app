/**
 * Master Test Runner
 * Orchestrates all test suites and generates comprehensive reports
 */

const BackendApiTester = require('./backend-api-tests');
const FrontendSimulationTester = require('./frontend-simulation-tests');
const EndToEndTester = require('./end-to-end-tests');
const fs = require('fs');
const path = require('path');

class MasterTestRunner {
  constructor(config = {}) {
    this.config = {
      apiBaseURL: config.apiBaseURL || 'http://localhost:3001',
      frontendURL: config.frontendURL || 'http://localhost:3000',
      runBackend: config.runBackend !== false,
      runFrontend: config.runFrontend !== false,
      runE2E: config.runE2E !== false,
      parallel: config.parallel !== false,
      timeout: config.timeout || 300000, // 5 minutes
      retries: config.retries || 0,
      outputDir: config.outputDir || './test-reports'
    };
    
    this.results = {
      backend: null,
      frontend: null,
      e2e: null,
      summary: null
    };
    
    this.startTime = Date.now();
  }

  async checkPrerequisites() {
    console.log('🔍 CHECKING TEST PREREQUISITES');
    console.log('='.repeat(50));

    const checks = [];

    // Check if backend is running
    try {
      const axios = require('axios');
      const response = await axios.get(`${this.config.apiBaseURL}/health`, { timeout: 5000 });
      checks.push({ name: 'Backend Health', status: 'PASS', details: `Uptime: ${response.data.uptime}s` });
    } catch (error) {
      checks.push({ name: 'Backend Health', status: 'FAIL', details: error.message });
    }

    // Check if test dependencies are available
    try {
      require('axios');
      checks.push({ name: 'Axios Dependency', status: 'PASS', details: 'Available' });
    } catch (error) {
      checks.push({ name: 'Axios Dependency', status: 'FAIL', details: 'Missing - run npm install' });
    }

    try {
      require('jsonwebtoken');
      checks.push({ name: 'JWT Dependency', status: 'PASS', details: 'Available' });
    } catch (error) {
      checks.push({ name: 'JWT Dependency', status: 'FAIL', details: 'Missing - run npm install' });
    }

    // Check output directory
    try {
      if (!fs.existsSync(this.config.outputDir)) {
        fs.mkdirSync(this.config.outputDir, { recursive: true });
      }
      checks.push({ name: 'Output Directory', status: 'PASS', details: this.config.outputDir });
    } catch (error) {
      checks.push({ name: 'Output Directory', status: 'FAIL', details: error.message });
    }

    // Display results
    checks.forEach(check => {
      const icon = check.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${check.name}: ${check.status} - ${check.details}`);
    });

    const failedChecks = checks.filter(c => c.status === 'FAIL');
    if (failedChecks.length > 0) {
      console.log(`\n❌ ${failedChecks.length} prerequisite checks failed. Please fix before running tests.`);
      return false;
    }

    console.log('\n✅ All prerequisite checks passed!');
    return true;
  }

  async runTestSuite(name, TesterClass, config = {}) {
    console.log(`\n🚀 RUNNING ${name.toUpperCase()} TEST SUITE`);
    console.log('='.repeat(60));

    const startTime = Date.now();
    let result = null;
    let error = null;

    try {
      const tester = new TesterClass(this.config.apiBaseURL, this.config.frontendURL);
      
      // Override the exit behavior for our master runner
      const originalExit = process.exit;
      let exitCode = 0;
      process.exit = (code) => { exitCode = code; };

      // Capture console output
      const originalLog = console.log;
      const logs = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };

      await tester.runAllTests();

      // Restore original functions
      process.exit = originalExit;
      console.log = originalLog;

      const duration = Date.now() - startTime;
      
      result = {
        suite: name,
        status: exitCode === 0 ? 'PASS' : 'FAIL',
        duration,
        exitCode,
        results: tester.testResults || [],
        logs: logs.slice(-50), // Keep last 50 log lines
        timestamp: new Date().toISOString()
      };

    } catch (err) {
      error = err;
      const duration = Date.now() - startTime;
      
      result = {
        suite: name,
        status: 'ERROR',
        duration,
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      };
    }

    const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '🚨';
    console.log(`\n${statusIcon} ${name} Test Suite: ${result.status} (${result.duration}ms)`);

    return result;
  }

  async runAllTests() {
    console.log('🎯 COMPREHENSIVE TEST SUITE EXECUTION');
    console.log('='.repeat(70));
    console.log(`Configuration:`);
    console.log(`  API URL: ${this.config.apiBaseURL}`);
    console.log(`  Frontend URL: ${this.config.frontendURL}`);
    console.log(`  Parallel Execution: ${this.config.parallel}`);
    console.log(`  Output Directory: ${this.config.outputDir}`);
    console.log(`  Started: ${new Date().toISOString()}`);

    // Check prerequisites
    const prerequisitesPassed = await this.checkPrerequisites();
    if (!prerequisitesPassed) {
      process.exit(1);
    }

    const testSuites = [];

    if (this.config.runBackend) {
      testSuites.push({ name: 'Backend API', class: BackendApiTester });
    }

    if (this.config.runFrontend) {
      testSuites.push({ name: 'Frontend Simulation', class: FrontendSimulationTester });
    }

    if (this.config.runE2E) {
      testSuites.push({ name: 'End-to-End', class: EndToEndTester });
    }

    if (this.config.parallel) {
      // Run test suites in parallel
      console.log('\n⚡ Running test suites in parallel...');
      const promises = testSuites.map(({ name, class: TesterClass }) => 
        this.runTestSuite(name, TesterClass)
      );
      
      const results = await Promise.all(promises);
      
      this.results.backend = results.find(r => r.suite === 'Backend API');
      this.results.frontend = results.find(r => r.suite === 'Frontend Simulation');
      this.results.e2e = results.find(r => r.suite === 'End-to-End');
    } else {
      // Run test suites sequentially
      console.log('\n🔄 Running test suites sequentially...');
      
      for (const { name, class: TesterClass } of testSuites) {
        const result = await this.runTestSuite(name, TesterClass);
        
        if (name === 'Backend API') this.results.backend = result;
        if (name === 'Frontend Simulation') this.results.frontend = result;
        if (name === 'End-to-End') this.results.e2e = result;
        
        // Stop on first failure if not running in parallel
        if (result.status === 'ERROR' || result.status === 'FAIL') {
          console.log(`\n⚠️ ${name} test suite failed. Stopping sequential execution.`);
          break;
        }
      }
    }

    await this.generateComprehensiveReport();
  }

  async generateComprehensiveReport() {
    const totalDuration = Date.now() - this.startTime;
    
    console.log('\n📊 COMPREHENSIVE TEST EXECUTION SUMMARY');
    console.log('='.repeat(70));

    const suiteResults = [
      this.results.backend,
      this.results.frontend,
      this.results.e2e
    ].filter(Boolean);

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalWarnings = 0;

    suiteResults.forEach(suite => {
      const icon = suite.status === 'PASS' ? '✅' : suite.status === 'FAIL' ? '❌' : '🚨';
      console.log(`${icon} ${suite.suite}: ${suite.status} (${suite.duration}ms)`);
      
      if (suite.results) {
        const passed = suite.results.filter(r => r.status === 'PASS' || r.type === 'PASS').length;
        const failed = suite.results.filter(r => r.status === 'FAIL' || r.type === 'FAIL').length;
        const warnings = suite.results.filter(r => r.status === 'WARN' || r.type === 'WARN').length;
        
        totalTests += suite.results.length;
        totalPassed += passed;
        totalFailed += failed;
        totalWarnings += warnings;
        
        console.log(`  Tests: ${suite.results.length}, Passed: ${passed}, Failed: ${failed}, Warnings: ${warnings}`);
      }
    });

    console.log('\n📈 OVERALL STATISTICS');
    console.log(`Total Test Suites: ${suiteResults.length}`);
    console.log(`Total Individual Tests: ${totalTests}`);
    console.log(`✅ Passed: ${totalPassed} (${totalTests > 0 ? (totalPassed/totalTests*100).toFixed(1) : 0}%)`);
    console.log(`❌ Failed: ${totalFailed} (${totalTests > 0 ? (totalFailed/totalTests*100).toFixed(1) : 0}%)`);
    console.log(`⚠️ Warnings: ${totalWarnings} (${totalTests > 0 ? (totalWarnings/totalTests*100).toFixed(1) : 0}%)`);
    console.log(`⏱️ Total Execution Time: ${totalDuration}ms`);

    // Generate comprehensive report
    const report = {
      execution: {
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date().toISOString(),
        duration: totalDuration,
        config: this.config
      },
      summary: {
        totalSuites: suiteResults.length,
        totalTests,
        totalPassed,
        totalFailed,
        totalWarnings,
        successRate: totalTests > 0 ? (totalPassed / totalTests * 100) : 0
      },
      suites: {
        backend: this.results.backend,
        frontend: this.results.frontend,
        e2e: this.results.e2e
      },
      recommendations: this.generateRecommendations(suiteResults)
    };

    // Save comprehensive report
    const reportPath = path.join(this.config.outputDir, `comprehensive-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    const htmlReportPath = path.join(this.config.outputDir, `test-report-${Date.now()}.html`);
    await this.generateHTMLReport(report, htmlReportPath);

    console.log(`\n💾 Reports saved:`);
    console.log(`  JSON: ${reportPath}`);
    console.log(`  HTML: ${htmlReportPath}`);

    // Determine overall success
    const overallSuccess = suiteResults.every(suite => suite.status === 'PASS');
    const hasErrors = suiteResults.some(suite => suite.status === 'ERROR');

    if (overallSuccess) {
      console.log('\n🎉 ALL TEST SUITES PASSED!');
      process.exit(0);
    } else if (hasErrors) {
      console.log('\n🚨 TEST EXECUTION ENCOUNTERED ERRORS!');
      process.exit(2);
    } else {
      console.log('\n❌ SOME TESTS FAILED!');
      process.exit(1);
    }
  }

  generateRecommendations(suiteResults) {
    const recommendations = [];

    suiteResults.forEach(suite => {
      if (suite.status === 'FAIL' || suite.status === 'ERROR') {
        recommendations.push({
          suite: suite.suite,
          priority: 'HIGH',
          issue: `${suite.suite} test suite failed`,
          recommendation: `Review ${suite.suite} test results and fix failing tests`
        });
      }

      if (suite.results) {
        const failedTests = suite.results.filter(r => r.status === 'FAIL' || r.type === 'FAIL');
        if (failedTests.length > 0) {
          recommendations.push({
            suite: suite.suite,
            priority: 'MEDIUM',
            issue: `${failedTests.length} individual tests failed`,
            recommendation: `Focus on fixing: ${failedTests.slice(0, 3).map(t => t.test || t.step || t.message).join(', ')}`
          });
        }

        const warningTests = suite.results.filter(r => r.status === 'WARN' || r.type === 'WARN');
        if (warningTests.length > 0) {
          recommendations.push({
            suite: suite.suite,
            priority: 'LOW',
            issue: `${warningTests.length} tests have warnings`,
            recommendation: 'Review warnings for potential improvements'
          });
        }
      }
    });

    return recommendations;
  }

  async generateHTMLReport(report, filePath) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>AI2 Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .pass { color: #28a745; }
        .fail { color: #dc3545; }
        .warn { color: #ffc107; }
        .suite { margin-bottom: 30px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .suite-header { background: #007bff; color: white; padding: 15px; font-weight: bold; }
        .suite-content { padding: 15px; }
        .test-result { padding: 8px; margin: 5px 0; border-radius: 4px; }
        .test-pass { background: #d4edda; color: #155724; }
        .test-fail { background: #f8d7da; color: #721c24; }
        .test-warn { background: #fff3cd; color: #856404; }
        .recommendations { background: #e9ecef; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .recommendation { margin: 10px 0; padding: 10px; border-left: 4px solid #007bff; background: white; }
        .high-priority { border-left-color: #dc3545; }
        .medium-priority { border-left-color: #ffc107; }
        .low-priority { border-left-color: #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 AI2 Comprehensive Test Report</h1>
            <p>Generated: ${report.execution.endTime}</p>
            <p>Duration: ${report.execution.duration}ms</p>
        </div>

        <div class="summary">
            <div class="stat-card">
                <div class="stat-number">${report.summary.totalSuites}</div>
                <div>Test Suites</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.summary.totalTests}</div>
                <div>Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number pass">${report.summary.totalPassed}</div>
                <div>Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number fail">${report.summary.totalFailed}</div>
                <div>Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number warn">${report.summary.totalWarnings}</div>
                <div>Warnings</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.summary.successRate.toFixed(1)}%</div>
                <div>Success Rate</div>
            </div>
        </div>

        ${Object.entries(report.suites).filter(([_, suite]) => suite).map(([name, suite]) => `
        <div class="suite">
            <div class="suite-header">
                ${suite.status === 'PASS' ? '✅' : suite.status === 'FAIL' ? '❌' : '🚨'} 
                ${suite.suite} Test Suite - ${suite.status} (${suite.duration}ms)
            </div>
            <div class="suite-content">
                ${suite.results ? suite.results.map(result => `
                <div class="test-result test-${(result.status || result.type || 'info').toLowerCase()}">
                    <strong>${result.test || result.step || result.message}</strong>
                    ${result.details ? ` - ${result.details}` : ''}
                    ${result.duration ? ` (${result.duration}ms)` : ''}
                </div>
                `).join('') : '<p>No detailed results available</p>'}
            </div>
        </div>
        `).join('')}

        ${report.recommendations.length > 0 ? `
        <div class="recommendations">
            <h3>🔧 Recommendations</h3>
            ${report.recommendations.map(rec => `
            <div class="recommendation ${rec.priority.toLowerCase()}-priority">
                <strong>[${rec.priority}] ${rec.issue}</strong><br>
                ${rec.recommendation}
            </div>
            `).join('')}
        </div>
        ` : ''}

        <div style="margin-top: 30px; text-align: center; color: #666;">
            <p>AI2 Platform - Automated Test Suite</p>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(filePath, html);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const config = {};

  // Parse command line arguments
  args.forEach(arg => {
    if (arg === '--backend-only') {
      config.runFrontend = false;
      config.runE2E = false;
    } else if (arg === '--frontend-only') {
      config.runBackend = false;
      config.runE2E = false;
    } else if (arg === '--e2e-only') {
      config.runBackend = false;
      config.runFrontend = false;
    } else if (arg === '--sequential') {
      config.parallel = false;
    } else if (arg.startsWith('--api-url=')) {
      config.apiBaseURL = arg.split('=')[1];
    } else if (arg.startsWith('--frontend-url=')) {
      config.frontendURL = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      config.outputDir = arg.split('=')[1];
    }
  });

  const runner = new MasterTestRunner(config);
  runner.runAllTests().catch(error => {
    console.error('❌ Master test runner failed:', error);
    process.exit(1);
  });
}

module.exports = MasterTestRunner;
