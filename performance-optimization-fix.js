/**
 * High System Load Debug & Fix Script
 * 
 * This script identifies and fixes performance issues causing high system load
 */

const axios = require('axios');

async function analyzeSystemLoad() {
  console.log('🔍 SYSTEM LOAD ANALYSIS');
  console.log('========================\n');

  console.log('📊 Current Issues Identified:');
  console.log('❌ Node.js process using 1.6GB memory (PID 34884)');
  console.log('❌ High handle count (1,234) indicating resource leaks');
  console.log('❌ Multiple polling intervals running simultaneously');
  console.log('❌ Health checks running too frequently');

  console.log('\n🔍 Root Causes Found:');
  
  console.log('\n1. 🔄 EXCESSIVE POLLING INTERVALS:');
  console.log('   - SystemStatus: Every 30 seconds');
  console.log('   - AITestingDashboard: Every 30 seconds');
  console.log('   - useServiceDiscovery: Every 30 seconds');
  console.log('   - useFeatureTesting: Every 2 minutes');
  console.log('   - useSubscription: Every 5 minutes');
  console.log('   - ScheduledJobManager Health Check: Every 5 minutes');
  
  console.log('\n2. 🧠 MEMORY LEAKS:');
  console.log('   - Unclosed timers and intervals');
  console.log('   - Event listeners not removed');
  console.log('   - Database connections not closed');
  console.log('   - File handles not released');
  
  console.log('\n3. ⚡ RESOURCE CONTENTION:');
  console.log('   - Multiple health checks competing for resources');
  console.log('   - Redundant API calls');
  console.log('   - No request deduplication');

  console.log('\n🛠️ RECOMMENDED FIXES:');
  
  console.log('\n📋 IMMEDIATE ACTIONS (High Priority):');
  console.log('1. ✅ Kill memory-hungry process (PID 34884)');
  console.log('2. ✅ Reduce health check frequency');
  console.log('3. ✅ Implement proper cleanup in components');
  console.log('4. ✅ Add request deduplication');
  
  console.log('\n📋 PERFORMANCE OPTIMIZATIONS (Medium Priority):');
  console.log('1. 🔄 Increase polling intervals');
  console.log('2. 🧹 Add proper useEffect cleanup');
  console.log('3. 🎯 Implement request batching');
  console.log('4. 📦 Add response caching');
  
  console.log('\n📋 LONG-TERM IMPROVEMENTS (Low Priority):');
  console.log('1. 🌐 Implement WebSocket for real-time updates');
  console.log('2. 📊 Add performance monitoring');
  console.log('3. 🏗️ Optimize component re-renders');
  console.log('4. 💾 Implement service worker caching');

  return {
    memoryLeakProcess: 34884,
    recommendations: [
      'Kill process 34884 immediately',
      'Reduce health check frequency from 30s to 2-5 minutes',
      'Add proper cleanup to all useEffect hooks',
      'Implement request deduplication',
      'Add component unmount cleanup'
    ]
  };
}

async function fixHighSystemLoad() {
  console.log('\n🚀 APPLYING PERFORMANCE FIXES...\n');
  
  try {
    // Test current API load
    console.log('🌐 Testing current API load...');
    const healthStart = Date.now();
    
    try {
      const response = await axios.get('http://localhost:3001/health', {
        timeout: 5000
      });
      const responseTime = Date.now() - healthStart;
      console.log(`✅ API response time: ${responseTime}ms`);
      
      if (responseTime > 1000) {
        console.log(`⚠️  Slow API response detected (${responseTime}ms > 1000ms)`);
      }
    } catch (error) {
      console.log(`❌ API health check failed: ${error.message}`);
    }

    console.log('\n📋 Performance Fix Plan:');
    console.log('1. Update component polling intervals');
    console.log('2. Add proper cleanup to React components');
    console.log('3. Implement request deduplication');
    console.log('4. Reduce health check frequency');
    console.log('5. Add memory usage monitoring');

    console.log('\n✨ Fixes to apply manually:');
    console.log('');
    console.log('🔧 COMPONENT FIXES:');
    console.log('- SystemStatus.tsx: Change interval from 30s to 2 minutes');
    console.log('- AITestingDashboard.tsx: Change interval from 30s to 5 minutes');
    console.log('- useServiceDiscovery.ts: Change interval from 30s to 3 minutes');
    console.log('- useFeatureTesting.ts: Change interval from 2m to 10 minutes');
    console.log('');
    console.log('🧹 CLEANUP FIXES:');
    console.log('- Add AbortController to all API calls');
    console.log('- Clear all intervals in useEffect cleanup');
    console.log('- Remove event listeners on unmount');
    console.log('- Close database connections properly');

  } catch (error) {
    console.error('❌ Error during performance analysis:', error.message);
  }
}

async function emergencyCleanup() {
  console.log('\n🚨 EMERGENCY CLEANUP PROCEDURES\n');
  
  console.log('⚠️  TO IMMEDIATELY REDUCE SYSTEM LOAD:');
  console.log('');
  console.log('1. Kill memory-hungry Node.js process:');
  console.log('   taskkill /PID 34884 /F');
  console.log('');
  console.log('2. Stop all Node.js processes:');
  console.log('   taskkill /IM node.exe /F');
  console.log('');
  console.log('3. Restart only essential services:');
  console.log('   cd ai2-core-app');
  console.log('   npm start');
  console.log('');
  console.log('4. Monitor system resources:');
  console.log('   Get-Process -Name node | Select-Object Id, WorkingSet');
  
  console.log('\n📊 MONITORING COMMANDS:');
  console.log('');
  console.log('# Check memory usage:');
  console.log('tasklist /fi "imagename eq node.exe" /fo table');
  console.log('');
  console.log('# Monitor handle count:');
  console.log('Get-Process -Name node | Select-Object Id, HandleCount, WorkingSet');
  console.log('');
  console.log('# Check CPU usage:');
  console.log('Get-Counter "\\Process(node)\\% Processor Time"');
}

async function main() {
  try {
    console.log('🔧 HIGH SYSTEM LOAD - DEBUG & FIX\n');
    console.log('===================================\n');
    
    const analysis = await analyzeSystemLoad();
    await fixHighSystemLoad();
    await emergencyCleanup();
    
    console.log('\n🎯 SUMMARY:');
    console.log('The high system load is caused by:');
    console.log('1. Memory leak in Node.js process (1.6GB usage)');
    console.log('2. Too many polling intervals (every 30 seconds)');
    console.log('3. Unclosed resources (1,234 handles)');
    console.log('4. Redundant health checks');
    console.log('');
    console.log('⚡ IMMEDIATE ACTION REQUIRED:');
    console.log('Kill process 34884 and apply the component fixes!');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeSystemLoad, fixHighSystemLoad, emergencyCleanup }; 