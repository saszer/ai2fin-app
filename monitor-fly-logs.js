#!/usr/bin/env node

/**
 * Fly.io Log Monitor - embracingearth.space
 * Monitors Fly.io logs for connection issues, high CPU, and API call patterns
 */

const { exec } = require('child_process');
const fs = require('fs');

class FlyLogMonitor {
  constructor() {
    this.appName = 'ai2-core-api';
    this.region = 'syd';
    this.issues = {
      connectionLimits: 0,
      serviceFailures: 0,
      timeouts: 0,
      highCpu: 0,
      apiCalls: 0
    };
    this.startTime = Date.now();
  }

  async run() {
    console.log('🔍 Starting Fly.io Log Monitor...');
    console.log(`📱 App: ${this.appName}`);
    console.log(`🌏 Region: ${this.region}`);
    console.log('⏰ Monitoring for 60 seconds...\n');

    // Monitor for 60 seconds
    const monitorInterval = setInterval(() => {
      this.checkLogs();
    }, 5000); // Check every 5 seconds

    setTimeout(() => {
      clearInterval(monitorInterval);
      this.generateReport();
    }, 60000);
  }

  async checkLogs() {
    return new Promise((resolve) => {
      const command = `fly logs --app ${this.appName} --region ${this.region} --no-tail`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.log(`❌ Error fetching logs: ${error.message}`);
          resolve();
          return;
        }

        const logs = stdout + stderr;
        this.analyzeLogs(logs);
        resolve();
      });
    });
  }

  analyzeLogs(logs) {
    const lines = logs.split('\n');
    const now = new Date().toISOString();

    lines.forEach(line => {
      // Check for connection limit errors
      if (line.includes('reached hard limit of 500 concurrent connections') || 
          line.includes('Instance.*reached hard limit')) {
        this.issues.connectionLimits++;
        console.log(`🚨 CONNECTION LIMIT: ${line}`);
      }

      // Check for service failures
      if (line.includes('Service analytics call failed') || 
          line.includes('Service.*call failed.*attempt')) {
        this.issues.serviceFailures++;
        console.log(`⚠️ SERVICE FAILURE: ${line}`);
      }

      // Check for timeouts
      if (line.includes('timeout.*exceeded') || 
          line.includes('ECONNABORTED')) {
        this.issues.timeouts++;
        console.log(`⏰ TIMEOUT: ${line}`);
      }

      // Check for high CPU
      if (line.includes('high CPU') || 
          line.includes('memory.*high') || 
          line.includes('concurrent.*high')) {
        this.issues.highCpu++;
        console.log(`📊 HIGH CPU: ${line}`);
      }

      // Count API calls
      if (line.match(/(GET|POST|PUT|DELETE)\s+\/api/)) {
        this.issues.apiCalls++;
      }
    });
  }

  generateReport() {
    const duration = (Date.now() - this.startTime) / 1000;
    
    console.log('\n📊 MONITORING REPORT');
    console.log('==================');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`🚨 Connection Limits: ${this.issues.connectionLimits}`);
    console.log(`⚠️  Service Failures: ${this.issues.serviceFailures}`);
    console.log(`⏰ Timeouts: ${this.issues.timeouts}`);
    console.log(`📊 High CPU Events: ${this.issues.highCpu}`);
    console.log(`📈 API Calls: ${this.issues.apiCalls}`);
    
    // Calculate rates
    const apiCallRate = (this.issues.apiCalls / duration * 60).toFixed(2);
    console.log(`📈 API Call Rate: ${apiCallRate} calls/minute`);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (this.issues.connectionLimits > 0) {
      console.log('🚨 URGENT: Connection limits being hit - check AbortController fixes');
    }
    
    if (this.issues.serviceFailures > 5) {
      console.log('⚠️  HIGH: Service failures detected - check service discovery timeouts');
    }
    
    if (this.issues.timeouts > 3) {
      console.log('⏰ MEDIUM: Timeouts detected - check analytics service performance');
    }
    
    if (apiCallRate > 100) {
      console.log('📈 HIGH: High API call rate - check polling frequency fixes');
    }
    
    if (this.issues.connectionLimits === 0 && this.issues.serviceFailures < 3 && apiCallRate < 50) {
      console.log('✅ GOOD: No critical issues detected - fixes appear to be working');
    }
  }
}

// Run the monitor
const monitor = new FlyLogMonitor();
monitor.run().catch(console.error);

