#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Cost optimization for Fly.io and GCP
async function optimizeCosts() {
  console.log('🔧 Running cost optimization checks...\n');
  
  // 1. Check Fly.io instance usage
  console.log('📊 Checking Fly.io instances...');
  const { stdout: flyStatus } = await execAsync('flyctl status --json');
  const instances = JSON.parse(flyStatus);
  
  // Recommend scaling based on CPU/memory usage
  for (const instance of instances) {
    if (instance.cpu < 20 && instance.memory < 30) {
      console.log(`⚠️  Instance ${instance.id} is underutilized`);
      console.log(`   Consider scaling down or using shared-cpu-1x`);
    }
  }
  
  // 2. Check GCP resource usage
  console.log('\n📊 Checking GCP resources...');
  
  // Cloud SQL
  const { stdout: sqlInstances } = await execAsync(
    'gcloud sql instances list --format=json'
  );
  const databases = JSON.parse(sqlInstances);
  
  for (const db of databases) {
    console.log(`\n💾 Database: ${db.name}`);
    console.log(`   Tier: ${db.settings.tier}`);
    
    // Check for overprovisioning
    if (db.settings.tier.includes('high') && db.currentDiskSize < 50) {
      console.log(`   ⚠️  Consider downgrading to a smaller tier`);
    }
  }
  
  // Storage buckets
  const { stdout: buckets } = await execAsync(
    'gsutil du -s gs://*/  | sort -n'
  );
  console.log('\n📦 Storage usage:');
  console.log(buckets);
  
  // 3. Recommend optimizations
  console.log('\n💡 Cost Optimization Recommendations:');
  console.log('1. Enable Cloud SQL automatic storage increase');
  console.log('2. Set lifecycle policies on GCS buckets');
  console.log('3. Use Fly.io autoscaling instead of fixed instances');
  console.log('4. Consider committed use discounts for GCP');
  console.log('5. Monitor embracingearth.space CDN cache hit rates');
  
  // 4. Estimate monthly costs
  console.log('\n💰 Estimated Monthly Costs:');
  console.log('- Fly.io: ~$50-100 (based on current usage)');
  console.log('- GCP Cloud SQL: ~$25-50');
  console.log('- GCP Storage: ~$5-10');
  console.log('- Cloudflare: Free tier sufficient');
  console.log('- Total: ~$80-160/month');
}

// Run optimization
optimizeCosts().catch(console.error); 