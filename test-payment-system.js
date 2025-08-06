// Test script for payment system endpoints
// Run with: node test-payment-system.js

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001'; // Core app
const SUBSCRIPTION_URL = 'http://localhost:3006'; // Subscription service

async function testPaymentSystem() {
  console.log('🧪 Testing Payment System...\n');

  try {
    // Test 1: Payment methods endpoint
    console.log('1. Testing payment methods endpoint...');
    const methodsResponse = await fetch(`${BASE_URL}/api/payment/methods`);
    const methodsData = await methodsResponse.json();
    
    if (methodsData.success) {
      console.log('✅ Payment methods endpoint working');
      console.log(`   - Found ${methodsData.data.methods.length} payment methods`);
      console.log(`   - Monthly price: $${methodsData.data.pricing.monthly.price}`);
      console.log(`   - Yearly price: $${methodsData.data.pricing.yearly.price} (${methodsData.data.pricing.yearly.discount}% off)`);
    } else {
      console.log('❌ Payment methods endpoint failed:', methodsData.error);
    }

    // Test 2: Subscription service health
    console.log('\n2. Testing subscription service health...');
    const healthResponse = await fetch(`${SUBSCRIPTION_URL}/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.status === 'healthy') {
      console.log('✅ Subscription service healthy');
      console.log(`   - Service: ${healthData.service}`);
      console.log(`   - Version: ${healthData.version}`);
      console.log(`   - Features: ${Object.keys(healthData.features).join(', ')}`);
    } else {
      console.log('❌ Subscription service unhealthy:', healthData);
    }

    // Test 3: Core app health
    console.log('\n3. Testing core app health...');
    const coreHealthResponse = await fetch(`${BASE_URL}/health`);
    const coreHealthData = await coreHealthResponse.json();
    
    if (coreHealthData.status === 'healthy') {
      console.log('✅ Core app healthy');
      console.log(`   - Service: ${coreHealthData.service}`);
      console.log(`   - Version: ${coreHealthData.version}`);
    } else {
      console.log('❌ Core app unhealthy:', coreHealthData);
    }

    // Test 4: Service discovery
    console.log('\n4. Testing service discovery...');
    const servicesResponse = await fetch(`${BASE_URL}/api/services/status`);
    const servicesData = await servicesResponse.json();
    
    console.log(`✅ Service discovery working`);
    console.log(`   - Online services: ${servicesData.onlineCount}/${servicesData.totalCount}`);
    servicesData.services.forEach(service => {
      console.log(`   - ${service.name}: ${service.status} (${service.port})`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n🎯 Payment System Test Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Configure Stripe and GoCardless API keys in environment');
  console.log('2. Test checkout flow with sandbox credentials');
  console.log('3. Set up webhook endpoints for payment confirmations');
  console.log('4. Deploy to production with SSL certificates');
}

// Run the test
testPaymentSystem().catch(console.error);

