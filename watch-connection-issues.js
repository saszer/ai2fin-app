#!/usr/bin/env node

/**
 * Real-time Connection Issue Monitor - embracingearth.space
 * Watches Fly.io logs for connection problems and provides real-time alerts
 */

const { spawn } = require('child_process');

class ConnectionMonitor {
  constructor() {
    this.appName = 'ai2-core-api';
    this.region = 'syd';
    this.connectionCount = 0;
    this.errorCount = 0;
    this.lastAlert = 0;
  }

  start() {
    console.log('🔍 Starting Real-time Connection Monitor...');
    console.log(`📱 App: ${this.appName}`);
    console.log(`🌏 Region: ${this.region}`);
    console.log('⏰ Monitoring for connection issues...\n');

    const flyLogs = spawn('fly', ['logs', '--app', this.appName, '--region', this.region], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    flyLogs.stdout.on('data', (data) => {
      this.processLogLine(data.toString());
    });

    flyLogs.stderr.on('data', (data) => {
      this.processLogLine(data.toString());
    });

    flyLogs.on('close', (code) => {
      console.log(`\n📊 Monitor stopped with code: ${code}`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping monitor...');
      flyLogs.kill();
      process.exit(0);
    });
  }

  processLogLine(line) {
    const now = Date.now();
    const lines = line.split('\n').filter(l => l.trim());

    lines.forEach(logLine => {
      // Check for critical connection issues
      if (logLine.includes('reached hard limit of 500 concurrent connections')) {
        this.connectionCount++;
        console.log(`🚨 CRITICAL: Connection limit reached! (${this.connectionCount} times)`);
        console.log(`   ${logLine}`);
        this.alert('CONNECTION_LIMIT', logLine);
      }

      // Check for service failures
      if (logLine.includes('Service analytics call failed') || 
          logLine.includes('Service.*call failed.*attempt')) {
        this.errorCount++;
        console.log(`⚠️  SERVICE FAILURE: Analytics service failing (${this.errorCount} times)`);
        console.log(`   ${logLine}`);
        this.alert('SERVICE_FAILURE', logLine);
      }

      // Check for timeouts
      if (logLine.includes('timeout.*exceeded') || 
          logLine.includes('ECONNABORTED')) {
        console.log(`⏰ TIMEOUT: Request timeout detected`);
        console.log(`   ${logLine}`);
        this.alert('TIMEOUT', logLine);
      }

      // Check for high CPU/memory
      if (logLine.includes('high CPU') || 
          logLine.includes('memory.*high') || 
          logLine.includes('concurrent.*high')) {
        console.log(`📊 HIGH RESOURCE: CPU/Memory usage high`);
        console.log(`   ${logLine}`);
        this.alert('HIGH_RESOURCE', logLine);
      }

      // Check for successful operations
      if (logLine.includes('✅') || logLine.includes('success')) {
        console.log(`✅ SUCCESS: ${logLine}`);
      }

      // Check for API call patterns
      if (logLine.match(/(GET|POST|PUT|DELETE)\s+\/api/)) {
        const endpoint = logLine.match(/(GET|POST|PUT|DELETE)\s+(\/api\/[^\s]+)/);
        if (endpoint) {
          console.log(`📡 API CALL: ${endpoint[1]} ${endpoint[2]}`);
        }
      }
    });
  }

  alert(type, message) {
    const now = Date.now();
    
    // Rate limit alerts to avoid spam
    if (now - this.lastAlert < 5000) {
      return;
    }
    
    this.lastAlert = now;
    
    console.log(`\n🚨 ALERT: ${type}`);
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    console.log(`📝 Message: ${message}`);
    console.log('---\n');
  }
}

// Start monitoring
const monitor = new ConnectionMonitor();
monitor.start();

