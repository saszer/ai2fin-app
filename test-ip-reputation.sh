#!/bin/bash
# Test IP Reputation APIs - ai2fin.com
# This script tests if your API keys are working correctly

set -e

echo "🧪 Testing IP Reputation APIs for ai2fin.com"
echo "============================================="

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
echo "🔑 Testing API Configuration..."

# Test 1: Check API configuration status
echo "1. Checking API configuration status..."
RESPONSE1=$(curl -s "$API_URL/api/ip-test/status")
if echo "$RESPONSE1" | grep -q "success.*true"; then
    echo "✅ API configuration check passed"
    echo "   Response: $RESPONSE1"
else
    echo "❌ API configuration check failed"
    echo "   Response: $RESPONSE1"
fi

echo ""
echo "🌐 Testing IP Reputation Services..."

# Test 2: Test with Google DNS (should be clean)
echo "2. Testing with Google DNS (8.8.8.8) - should be clean..."
RESPONSE2=$(curl -s "$API_URL/api/ip-test/check?ip=8.8.8.8")
if echo "$RESPONSE2" | grep -q "success.*true"; then
    echo "✅ Google DNS test passed"
    echo "   Reputation: $(echo "$RESPONSE2" | grep -o '"reputation":"[^"]*"' | cut -d'"' -f4)"
    echo "   Confidence: $(echo "$RESPONSE2" | grep -o '"confidence":[0-9]*' | cut -d':' -f2)"
    echo "   Sources: $(echo "$RESPONSE2" | grep -o '"sources":\[[^]]*\]' | cut -d'[' -f2 | cut -d']' -f1)"
else
    echo "❌ Google DNS test failed"
    echo "   Response: $RESPONSE2"
fi

# Test 3: Test with Cloudflare DNS (should be clean)
echo "3. Testing with Cloudflare DNS (1.1.1.1) - should be clean..."
RESPONSE3=$(curl -s "$API_URL/api/ip-test/check?ip=1.1.1.1")
if echo "$RESPONSE3" | grep -q "success.*true"; then
    echo "✅ Cloudflare DNS test passed"
    echo "   Reputation: $(echo "$RESPONSE3" | grep -o '"reputation":"[^"]*"' | cut -d'"' -f4)"
    echo "   Confidence: $(echo "$RESPONSE3" | grep -o '"confidence":[0-9]*' | cut -d':' -f2)"
    echo "   Sources: $(echo "$RESPONSE3" | grep -o '"sources":\[[^]]*\]' | cut -d'[' -f2 | cut -d']' -f1)"
else
    echo "❌ Cloudflare DNS test failed"
    echo "   Response: $RESPONSE3"
fi

# Test 4: Test with a potentially suspicious IP
echo "4. Testing with potentially suspicious IP (1.2.3.4)..."
RESPONSE4=$(curl -s "$API_URL/api/ip-test/check?ip=1.2.3.4")
if echo "$RESPONSE4" | grep -q "success.*true"; then
    echo "✅ Suspicious IP test passed"
    echo "   Reputation: $(echo "$RESPONSE4" | grep -o '"reputation":"[^"]*"' | cut -d'"' -f4)"
    echo "   Confidence: $(echo "$RESPONSE4" | grep -o '"confidence":[0-9]*' | cut -d':' -f2)"
    echo "   Sources: $(echo "$RESPONSE4" | grep -o '"sources":\[[^]]*\]' | cut -d'[' -f2 | cut -d']' -f1)"
else
    echo "❌ Suspicious IP test failed"
    echo "   Response: $RESPONSE4"
fi

echo ""
echo "📊 Testing All APIs..."

# Test 5: Test all APIs at once
echo "5. Testing all APIs at once..."
RESPONSE5=$(curl -s "$API_URL/api/ip-test/test-apis")
if echo "$RESPONSE5" | grep -q "success.*true"; then
    echo "✅ All APIs test passed"
    echo "   Results: $RESPONSE5"
else
    echo "❌ All APIs test failed"
    echo "   Response: $RESPONSE5"
fi

echo ""
echo "📈 Getting Reputation Summary..."

# Test 6: Get reputation summary
echo "6. Getting reputation summary..."
RESPONSE6=$(curl -s "$API_URL/api/ip-test/summary")
if echo "$RESPONSE6" | grep -q "success.*true"; then
    echo "✅ Reputation summary test passed"
    echo "   Summary: $RESPONSE6"
else
    echo "❌ Reputation summary test failed"
    echo "   Response: $RESPONSE6"
fi

echo ""
echo "📊 Test Results Summary:"
echo "========================"

# Count successful tests
SUCCESS_COUNT=0
TOTAL_TESTS=6

if echo "$RESPONSE1" | grep -q "success.*true"; then ((SUCCESS_COUNT++)); fi
if echo "$RESPONSE2" | grep -q "success.*true"; then ((SUCCESS_COUNT++)); fi
if echo "$RESPONSE3" | grep -q "success.*true"; then ((SUCCESS_COUNT++)); fi
if echo "$RESPONSE4" | grep -q "success.*true"; then ((SUCCESS_COUNT++)); fi
if echo "$RESPONSE5" | grep -q "success.*true"; then ((SUCCESS_COUNT++)); fi
if echo "$RESPONSE6" | grep -q "success.*true"; then ((SUCCESS_COUNT++)); fi

echo "✅ Successful tests: $SUCCESS_COUNT/$TOTAL_TESTS"

if [ $SUCCESS_COUNT -eq $TOTAL_TESTS ]; then
    echo "🎉 All IP reputation tests passed!"
    echo ""
    echo "🔑 API Keys Status:"
    echo "   IPInfo: $(echo "$RESPONSE1" | grep -o '"ipinfo":true' && echo "✅ Working" || echo "❌ Not configured")"
    echo "   AbuseIPDB: $(echo "$RESPONSE1" | grep -o '"abuseipdb":true' && echo "✅ Working" || echo "❌ Not configured")"
    echo "   IPQualityScore: $(echo "$RESPONSE1" | grep -o '"ipqualityscore":true' && echo "✅ Working" || echo "❌ Not configured")"
    echo "   VirusTotal: $(echo "$RESPONSE1" | grep -o '"virustotal":true' && echo "✅ Working" || echo "❌ Not configured")"
    echo ""
    echo "🚀 Your IP reputation system is fully operational!"
else
    echo "⚠️  Some tests failed. Please check the responses above."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Ensure API keys are set in environment variables"
    echo "2. Check that the IP reputation service is running"
    echo "3. Verify API endpoints are accessible"
    echo "4. Check API key validity and quotas"
fi

echo ""
echo "🚀 IP Reputation Test Complete!"
