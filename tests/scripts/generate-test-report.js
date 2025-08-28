// Test Report Generator
// embracingearth.space - CI/CD test reporting
const fs = require('fs');
const path = require('path');

function generateTestReport() {
  console.log('📊 Generating Test Report...\n');
  
  const reports = [];
  const reportFiles = [
    'auth-test-results.json',
    'jwt-debug-results.json'
  ];
  
  // Collect all test results
  for (const file of reportFiles) {
    if (fs.existsSync(file)) {
      try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        reports.push({
          type: file.replace('-results.json', '').replace('-', ' '),
          file: file,
          data: data
        });
      } catch (error) {
        console.log(`❌ Failed to read ${file}:`, error.message);
      }
    }
  }
  
  if (reports.length === 0) {
    console.log('❌ No test results found');
    process.exit(1);
  }
  
  // Generate comprehensive report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalReports: reports.length,
      overallStatus: 'UNKNOWN'
    },
    reports: reports,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };
  
  // Calculate overall status
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let hasErrors = false;
  
  reports.forEach(r => {
    if (r.data.summary) {
      totalTests += r.data.summary.total || 0;
      totalPassed += r.data.summary.passed || 0;
      totalFailed += r.data.summary.failed || 0;
    }
    if (r.data.errors && r.data.errors.length > 0) {
      hasErrors = true;
    }
  });
  
  report.summary.totalTests = totalTests;
  report.summary.totalPassed = totalPassed;
  report.summary.totalFailed = totalFailed;
  report.summary.successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';
  report.summary.overallStatus = hasErrors || totalFailed > 0 ? 'FAILED' : 'PASSED';
  
  // Write comprehensive report
  fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
  
  // Generate markdown report
  const markdown = generateMarkdownReport(report);
  fs.writeFileSync('test-report.md', markdown);
  
  // Console output
  console.log('📊 Test Report Summary');
  console.log('=====================');
  console.log(`Overall Status: ${report.summary.overallStatus}`);
  console.log(`Total Tests: ${report.summary.totalTests}`);
  console.log(`Passed: ${report.summary.totalPassed}`);
  console.log(`Failed: ${report.summary.totalFailed}`);
  console.log(`Success Rate: ${report.summary.successRate}%`);
  console.log(`Reports Generated: test-report.json, test-report.md`);
  
  return report.summary.overallStatus === 'PASSED';
}

function generateMarkdownReport(report) {
  let markdown = `# AI2 Platform Test Report\n\n`;
  markdown += `**Generated:** ${report.timestamp}\n\n`;
  
  // Summary
  markdown += `## Summary\n\n`;
  markdown += `| Metric | Value |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Overall Status | ${report.summary.overallStatus === 'PASSED' ? '✅ PASSED' : '❌ FAILED'} |\n`;
  markdown += `| Total Tests | ${report.summary.totalTests} |\n`;
  markdown += `| Passed | ${report.summary.totalPassed} |\n`;
  markdown += `| Failed | ${report.summary.totalFailed} |\n`;
  markdown += `| Success Rate | ${report.summary.successRate}% |\n\n`;
  
  // Environment
  markdown += `## Environment\n\n`;
  markdown += `- Node.js: ${report.environment.nodeVersion}\n`;
  markdown += `- Platform: ${report.environment.platform}\n`;
  markdown += `- Architecture: ${report.environment.arch}\n\n`;
  
  // Individual Reports
  markdown += `## Test Results\n\n`;
  
  report.reports.forEach(r => {
    markdown += `### ${r.type.toUpperCase()}\n\n`;
    
    if (r.data.summary) {
      markdown += `**Summary:** ${r.data.summary.passed}/${r.data.summary.total} tests passed (${r.data.summary.successRate}%)\n\n`;
      
      if (r.data.tests) {
        markdown += `**Test Details:**\n\n`;
        r.data.tests.forEach(test => {
          const status = test.passed ? '✅' : '❌';
          markdown += `- ${status} ${test.name}`;
          if (test.details) {
            markdown += `: ${test.details}`;
          }
          markdown += `\n`;
        });
        markdown += `\n`;
      }
    }
    
    if (r.data.errors && r.data.errors.length > 0) {
      markdown += `**Errors:**\n\n`;
      r.data.errors.forEach(error => {
        markdown += `- ❌ ${error}\n`;
      });
      markdown += `\n`;
    }
  });
  
  return markdown;
}

// Run if called directly
if (require.main === module) {
  const success = generateTestReport();
  process.exit(success ? 0 : 1);
}

module.exports = { generateTestReport };
