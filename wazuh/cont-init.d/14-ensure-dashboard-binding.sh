#!/usr/bin/with-contenv sh
# Ensure Dashboard binds to 0.0.0.0:5601
# Fixes Dashboard not listening on expected address
# embracingearth.space

set +e  # Don't exit on error

echo "Ensuring Dashboard binds to 0.0.0.0:5601..."

DASHBOARD_CONFIG="/etc/wazuh-dashboard/opensearch_dashboards.yml"

if [ ! -f "$DASHBOARD_CONFIG" ]; then
    echo "⚠ Dashboard config file not found: $DASHBOARD_CONFIG"
    exit 0
fi

# Backup original config
if [ ! -f "${DASHBOARD_CONFIG}.backup" ]; then
    cp "$DASHBOARD_CONFIG" "${DASHBOARD_CONFIG}.backup"
fi

# Ensure server.host is set to 0.0.0.0
if ! grep -q "^server.host:.*0.0.0.0" "$DASHBOARD_CONFIG" 2>/dev/null; then
    echo "Fixing Dashboard host binding..."
    
    # Remove any existing server.host line
    sed -i '/^server\.host:/d' "$DASHBOARD_CONFIG" 2>/dev/null || true
    
    # Add correct host binding
    if grep -q "^server.port:" "$DASHBOARD_CONFIG" 2>/dev/null; then
        # Insert after server.port
        sed -i '/^server\.port:/a server.host: 0.0.0.0' "$DASHBOARD_CONFIG" 2>/dev/null || true
    else
        # Add at beginning of file
        sed -i '1i server.host: 0.0.0.0' "$DASHBOARD_CONFIG" 2>/dev/null || true
    fi
    
    echo "✓ Updated Dashboard config to bind to 0.0.0.0"
else
    echo "✓ Dashboard config already has server.host: 0.0.0.0"
fi

# Ensure server.port is set to 5602 (Dashboard listens on 5602, nginx proxy on 5601 routes to it)
if ! grep -q "^server.port:.*5602" "$DASHBOARD_CONFIG" 2>/dev/null; then
    echo "Fixing Dashboard port binding..."
    
    # Remove any existing server.port line
    sed -i '/^server\.port:/d' "$DASHBOARD_CONFIG" 2>/dev/null || true
    
    # Add correct port (5602 - nginx proxy on 5601 routes to Dashboard on 5602)
    if grep -q "^server.host:" "$DASHBOARD_CONFIG" 2>/dev/null; then
        # Insert after server.host
        sed -i '/^server\.host:/a server.port: 5602' "$DASHBOARD_CONFIG" 2>/dev/null || true
    else
        # Add at beginning of file
        sed -i '1i server.port: 5602' "$DASHBOARD_CONFIG" 2>/dev/null || true
    fi
    
    echo "✓ Updated Dashboard config to use port 5602 (nginx proxy on 5601 routes to it)"
else
    echo "✓ Dashboard config already has server.port: 5602"
fi

# Verify config
echo "Verifying Dashboard config:"
grep -E "^server\.(host|port):" "$DASHBOARD_CONFIG" || echo "⚠ Warning: Could not find server.host or server.port in config"

echo "Dashboard binding fix completed."



