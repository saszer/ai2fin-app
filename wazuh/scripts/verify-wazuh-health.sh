#!/bin/bash
# Verification script to check Wazuh health
# Run this after deployment to verify everything is working
# embracingearth.space

set +e

echo "🔍 Verifying Wazuh Health..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check API
echo "1. Wazuh API Connection:"
if pgrep -f "wazuh-apid" >/dev/null 2>&1; then
    if curl -k -s -o /dev/null -w "%{http_code}" https://localhost:55000/ 2>/dev/null | grep -q "[0-9]"; then
        echo -e "   ${GREEN}✅ API is running and accepting connections${NC}"
        
        # Try to get status
        API_USER="${WAZUH_API_USER:-wazuh}"
        API_PASS="${WAZUH_API_PASSWORD:-}"
        if [ -n "$API_PASS" ]; then
            STATUS=$(curl -k -s -u "$API_USER:$API_PASS" https://localhost:55000/status 2>/dev/null)
            if echo "$STATUS" | grep -q "running"; then
                VERSION=$(echo "$STATUS" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
                echo -e "   ${GREEN}   Version: ${VERSION}${NC}"
            else
                echo -e "   ${YELLOW}   ⚠️ Could not authenticate to get status${NC}"
            fi
        fi
    else
        echo -e "   ${RED}❌ API process running but not accepting connections${NC}"
    fi
else
    echo -e "   ${RED}❌ API process not running${NC}"
fi

# 2. Check Filebeat
echo ""
echo "2. Filebeat Status:"
if pgrep -f "[f]ilebeat" >/dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Filebeat is running${NC}"
    
    # Check password config
    if grep -q '\${OPENSEARCH_INITIAL_ADMIN_PASSWORD' /etc/filebeat/filebeat.yml 2>/dev/null; then
        echo -e "   ${RED}❌ Password placeholder not substituted${NC}"
    else
        echo -e "   ${GREEN}✅ Password configured${NC}"
    fi
    
    # Check for errors
    if [ -f "/var/log/filebeat/filebeat" ]; then
        if tail -50 /var/log/filebeat/filebeat 2>/dev/null | grep -q "401\|Unauthorized"; then
            echo -e "   ${RED}❌ Auth errors in logs${NC}"
        else
            echo -e "   ${GREEN}✅ No auth errors${NC}"
        fi
    fi
else
    echo -e "   ${RED}❌ Filebeat not running${NC}"
fi

# 3. Check OpenSearch
echo ""
echo "3. OpenSearch Status:"
OPENSEARCH_PASSWORD="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"
if curl -s -k -u "admin:$OPENSEARCH_PASSWORD" https://localhost:9200/_cluster/health >/dev/null 2>&1; then
    HEALTH=$(curl -s -k -u "admin:$OPENSEARCH_PASSWORD" https://localhost:9200/_cluster/health 2>/dev/null)
    STATUS=$(echo "$HEALTH" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$STATUS" = "green" ] || [ "$STATUS" = "yellow" ]; then
        echo -e "   ${GREEN}✅ OpenSearch is healthy (status: $STATUS)${NC}"
    else
        echo -e "   ${YELLOW}⚠️ OpenSearch status: $STATUS${NC}"
    fi
else
    echo -e "   ${RED}❌ OpenSearch not accessible${NC}"
fi

# 4. Check Index Template
echo ""
echo "4. Index Template:"
TEMPLATE_NAME="wazuh-alerts"
TEMPLATE_EXISTS=$(curl -s -k -u "admin:$OPENSEARCH_PASSWORD" \
    "https://localhost:9200/_index_template/$TEMPLATE_NAME" 2>/dev/null | grep -q "$TEMPLATE_NAME" && echo "yes" || echo "no")

if [ "$TEMPLATE_EXISTS" = "yes" ]; then
    echo -e "   ${GREEN}✅ Index template '$TEMPLATE_NAME' exists${NC}"
    
    # Check if indices exist
    INDICES=$(curl -s -k -u "admin:$OPENSEARCH_PASSWORD" \
        "https://localhost:9200/_cat/indices/wazuh-alerts-*?h=index" 2>/dev/null | wc -l)
    if [ "$INDICES" -gt 0 ]; then
        echo -e "   ${GREEN}   Found $INDICES alert index(es)${NC}"
    else
        echo -e "   ${YELLOW}   No alert indices yet (will be created when alerts arrive)${NC}"
    fi
else
    echo -e "   ${RED}❌ Index template '$TEMPLATE_NAME' missing${NC}"
fi

# 5. Check Dashboard
echo ""
echo "5. Dashboard Status:"
if pgrep -f "[o]pensearch-dashboards" >/dev/null 2>&1; then
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5601/api/status 2>/dev/null | grep -q "200"; then
        echo -e "   ${GREEN}✅ Dashboard is running and accessible${NC}"
    else
        echo -e "   ${YELLOW}⚠️ Dashboard process running but not yet accepting connections${NC}"
    fi
else
    echo -e "   ${RED}❌ Dashboard not running${NC}"
fi

# 6. Check Dashboard API Config
echo ""
echo "6. Dashboard API Configuration:"
DASHBOARD_CONFIG="/usr/share/wazuh-dashboard/data/wazuh/config/wazuh.yml"
if [ -f "$DASHBOARD_CONFIG" ]; then
    if grep -q "url:.*55000" "$DASHBOARD_CONFIG" 2>/dev/null; then
        echo -e "   ${GREEN}✅ Dashboard API config exists${NC}"
        USER=$(grep -o "username:.*" "$DASHBOARD_CONFIG" 2>/dev/null | cut -d' ' -f2 || echo "not found")
        echo -e "   ${GREEN}   Username: $USER${NC}"
    else
        echo -e "   ${RED}❌ Dashboard API config missing or incorrect${NC}"
    fi
else
    echo -e "   ${RED}❌ Dashboard config file not found${NC}"
fi

echo ""
echo "📋 Summary:"
echo "  Visit https://ai2-wazuh.fly.dev/app/wz-home#/health-check to see Dashboard health check"
echo "  All checks should show green ✅"

