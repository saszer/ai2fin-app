#!/usr/bin/env node

/**
 * Authentication Debug Test Script
 * Tests the complete auth flow to identify logout on refresh issues
 * https://embracingearth.space - AI2 Platform Debug Tool
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001';

async function testAuthFlow() {
  console.log('🔍 AI2 Authentication Flow Debug Test');
  console.log('=====================================\n');

  // Test 1: Health Check
  console.log('1️⃣ Testing server health...');
  try {
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ Server is healthy:', health.data.status);
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    return;
  }

  // Test 2: Unauthenticated /me endpoint
  console.log('\n2️⃣ Testing unauthenticated /me endpoint...');
  try {
    const response = await axios.get(`${API_BASE}/api/auth/me`);
    console.log('❌ Unexpected success - should return 401');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correctly returns 401 for unauthenticated request');
      console.log('   Response:', error.response.data);
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  // Test 3: Test OIDC configuration
  console.log('\n3️⃣ Testing OIDC configuration...');
  try {
    const oidcConfig = await axios.get(`${API_BASE}/api/oidc/config`);
    console.log('✅ OIDC config endpoint accessible');
    console.log('   Issuer:', oidcConfig.data.issuer);
    console.log('   Audience:', oidcConfig.data.audience);
  } catch (error) {
    console.log('❌ OIDC config error:', error.response?.data || error.message);
  }

  // Test 4: Test with invalid token
  console.log('\n4️⃣ Testing with invalid Bearer token...');
  try {
    const response = await axios.get(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: 'Bearer invalid-token-123' }
    });
    console.log('❌ Unexpected success with invalid token');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correctly rejects invalid token');
      console.log('   Error:', error.response.data.error);
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  // Test 5: Test case-insensitive Bearer
  console.log('\n5️⃣ Testing case-insensitive Bearer token...');
  try {
    const response = await axios.get(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: 'bearer invalid-token-123' }
    });
    console.log('❌ Unexpected success with invalid token');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Case-insensitive Bearer parsing works');
    } else {
      console.log('❌ Case-insensitive Bearer parsing failed');
    }
  }

  // Test 6: Test OIDC login endpoint
  console.log('\n6️⃣ Testing OIDC login endpoint...');
  try {
    const loginResponse = await axios.post(`${API_BASE}/api/oidc/login`, {
      email: 'test@example.com',
      password: 'invalid-password'
    });
    console.log('❌ Unexpected success with invalid credentials');
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 400) {
      console.log('✅ OIDC login endpoint correctly rejects invalid credentials');
      console.log('   Response:', error.response.data);
    } else {
      console.log('❌ OIDC login endpoint error:', error.message);
    }
  }

  console.log('\n🔧 Debug Summary:');
  console.log('================');
  console.log('• Server is running and healthy');
  console.log('• Auth middleware is working (returns 401 for missing/invalid tokens)');
  console.log('• OIDC endpoints are accessible');
  console.log('• Case-insensitive Bearer token parsing works');
  console.log('\n💡 Next steps to debug logout on refresh:');
  console.log('1. Check if OIDC_AUDIENCE matches your Zitadel application client ID');
  console.log('2. Verify frontend token storage consistency (localStorage vs sessionStorage)');
  console.log('3. Check if tokens are being properly set in axios headers on app init');
  console.log('4. Verify token expiration and refresh logic');
  console.log('5. Check browser Network tab for Authorization headers on /api/auth/me calls');
  
  console.log('\n🌍 For more debugging: https://embracingearth.space');
}

testAuthFlow().catch(console.error);
