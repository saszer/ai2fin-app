#!/bin/bash
# Test Security Alerts - ai2fin.com
# This script tests the security alert system

set -e

echo "🧪 Testing Security Alert System for ai2fin.com"
echo "=============================================="

# Check if API is accessible
API_URL="https://api.ai2fin.com"

echo "🔍 Checking API accessibility..."
if curl -s -f "$API_URL/health" > /dev/null; then
    echo "✅ API is accessible"
else
    echo "❌ API is not accessible. Please check your deployment."
    exit 1
fi

echo ""
echo "🚨 Testing Security Alerts..."

# Test 1: Basic security alert
echo "1. Testing basic security alert..."
RESPONSE1=$(curl -s "$API_URL/api/security/test-alert")
if echo "$RESPONSE1" | grep -q "success.*true"; then
    echo "✅ Basic security alert test passed"
else
    echo "❌ Basic security alert test failed"
    echo "Response: $RESPONSE1"
fi

# Test 2: Critical security alert
echo "2. Testing critical security alert..."
RESPONSE2=$(curl -s "$API_URL/api/security/test-critical")
if echo "$RESPONSE2" | grep -q "success.*true"; then
    echo "✅ Critical security alert test passed"
else
    echo "❌ Critical security alert test failed"
    echo "Response: $RESPONSE2"
fi

# Test 3: Security status
echo "3. Testing security status..."
RESPONSE3=$(curl -s "$API_URL/api/security/status")
if echo "$RESPONSE3" | grep -q "success.*true"; then
    echo "✅ Security status test passed"
else
    echo "❌ Security status test failed"
    echo "Response: $RESPONSE3"
fi

# Test 4: Security summary
echo "4. Testing security summary..."
RESPONSE4=$(curl -s "$API_URL/api/security/summary")
if echo "$RESPONSE4" | grep -q "success.*true"; then
    echo "✅ Security summary test passed"
else
    echo "❌ Security summary test failed"
    echo "Response: $RESPONSE4"
fi

# Test 5: Data flow metrics
echo "5. Testing data flow metrics..."
RESPONSE5=$(curl -s "$API_URL/api/data-flow/metrics")
if echo "$RESPONSE5" | grep -q "success.*true"; then
    echo "✅ Data flow metrics test passed"
else
    echo "❌ Data flow metrics test failed"
    echo "Response: $RESPONSE5"
fi

echo ""
echo "📊 Test Results Summary:"
echo "========================"

# Count successful tests
SUCCESS_COUNT=0
TOTAL_TESTS=5

if echo "$RESPONSE1" | grep -q "success.*true"; then ((SUCCESS_COUNT++)); fi
if echo "$RESPONSE2" | grep -q "success.*true"; then ((SUCCESS_COUNT++)); fi
if echo "$RESPONSE3" | grep -q "success.*true"; then ((SUCCESS_COUNT++)); fi
if echo "$RESPONSE4" | grep -q "success.*true"; then ((SUCCESS_COUNT++)); fi
if echo "$RESPONSE5" | grep -q "success.*true"; then ((SUCCESS_COUNT++)); fi

echo "✅ Successful tests: $SUCCESS_COUNT/$TOTAL_TESTS"

if [ $SUCCESS_COUNT -eq $TOTAL_TESTS ]; then
    echo "🎉 All security alert tests passed!"
    echo ""
    echo "🔔 Check your Slack channel for security alerts"
    echo "📊 Monitor security dashboard at: $API_URL/api/security/summary"
    echo "🌍 Check data flow metrics at: $API_URL/api/data-flow/metrics"
else
    echo "⚠️  Some tests failed. Please check the responses above."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Ensure SLACK_SECURITY_WEBHOOK_URL is configured"
    echo "2. Check that the security services are running"
    echo "3. Verify API endpoints are accessible"
fi

echo ""
echo "🚀 Security Alert System Test Complete!"
