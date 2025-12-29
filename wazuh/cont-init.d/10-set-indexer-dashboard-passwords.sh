#!/usr/bin/with-contenv sh
# Configure Indexer and Dashboard admin passwords
# Injects environment variables into Dashboard config
# embracingearth.space

set +e  # Don't exit on error

echo "Configuring Indexer and Dashboard passwords..."

# Get admin password from environment or use default
ADMIN_PASSWORD="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"
DASHBOARD_PASSWORD="${OPENSEARCH_DASHBOARDS_PASSWORD:-$ADMIN_PASSWORD}"

if [ "$ADMIN_PASSWORD" = "admin" ]; then
    echo "⚠️ WARNING: Using default Indexer password (admin)"
    echo "⚠️ Set OPENSEARCH_INITIAL_ADMIN_PASSWORD secret for production!"
fi

# Update Dashboard config with actual password
DASHBOARD_CONFIG="/etc/wazuh-dashboard/opensearch_dashboards.yml"
if [ -f "$DASHBOARD_CONFIG" ]; then
    echo "  Updating Dashboard config: $DASHBOARD_CONFIG"
    
    # CRITICAL: Always replace the password line, regardless of current value
    # This ensures the password is set correctly even if the config has "admin" or a placeholder
    # Escape special characters in password for sed
    ESCAPED_PASSWORD=$(echo "$DASHBOARD_PASSWORD" | sed 's/[[\.*^$()+?{|]/\\&/g')
    
    # Replace the entire password line with the actual password
    sed -i "s|^opensearch\.password:.*|opensearch.password: \"$ESCAPED_PASSWORD\"|" "$DASHBOARD_CONFIG"
    
    # Also ensure username is set correctly
    sed -i "s|^opensearch\.username:.*|opensearch.username: \"admin\"|" "$DASHBOARD_CONFIG"
    
    # Verify password was set correctly
    if grep -q "^opensearch\.password:.*\"$ESCAPED_PASSWORD\"" "$DASHBOARD_CONFIG" 2>/dev/null; then
        echo "✓ Dashboard password updated successfully"
    else
        echo "⚠️ WARNING: Password replacement may have failed, checking config..."
        grep "opensearch.password:" "$DASHBOARD_CONFIG" || echo "  ⚠️ Password line not found in config!"
    fi
    
    echo "  Verifying final config:"
    grep "opensearch.password:" "$DASHBOARD_CONFIG" | sed 's/password:.*/password: [REDACTED]/' || echo "  ⚠️ Could not find password in config"
    grep "opensearch.username:" "$DASHBOARD_CONFIG" || echo "  ⚠️ Could not find username in config"
fi

echo "✓ Password configuration completed"
echo "  Indexer admin password: ${ADMIN_PASSWORD}"
echo "  Dashboard login password: ${DASHBOARD_PASSWORD}"
echo ""
echo "⚠️ IMPORTANT: Change default passwords after first login!"

