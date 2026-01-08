#!/usr/bin/with-contenv sh
# Ensure Dashboard binds to [::]:5602 (IPv6 all interfaces)
# Nginx proxy listens on 5601 (Fly `internal_port`) and proxies UI traffic to Dashboard on 5602.
# Fly.io uses IPv6 internally, so we bind Dashboard to :: (not IPv4-only 0.0.0.0).
# embracingearth.space

set +e  # Don't exit on error

echo "Ensuring Dashboard binds to [::]:5602 (IPv6 for Fly.io compatibility)..."

DASHBOARD_CONFIG="/etc/wazuh-dashboard/opensearch_dashboards.yml"

if [ ! -f "$DASHBOARD_CONFIG" ]; then
    echo "⚠ Dashboard config file not found: $DASHBOARD_CONFIG"
    exit 0
fi

# Backup original config
if [ ! -f "${DASHBOARD_CONFIG}.backup" ]; then
    cp "$DASHBOARD_CONFIG" "${DASHBOARD_CONFIG}.backup"
fi

# Ensure server.host is set to :: (IPv6 all interfaces - works with Fly.io)
# Note: 0.0.0.0 is IPv4 only, Fly.io uses IPv6 internally!
if ! grep -q '^server.host:.*"::"' "$DASHBOARD_CONFIG" 2>/dev/null; then
    echo "Fixing Dashboard host binding to :: (IPv6 for Fly.io)..."
    
    # Remove any existing server.host line
    sed -i '/^server\.host:/d' "$DASHBOARD_CONFIG" 2>/dev/null || true
    
    # Add correct host binding (:: for IPv6, must be quoted in YAML)
    if grep -q "^server.port:" "$DASHBOARD_CONFIG" 2>/dev/null; then
        # Insert after server.port
        sed -i '/^server\.port:/a server.host: "::"' "$DASHBOARD_CONFIG" 2>/dev/null || true
    else
        # Add at beginning of file
        sed -i '1i server.host: "::"' "$DASHBOARD_CONFIG" 2>/dev/null || true
    fi
    
    echo "✓ Updated Dashboard config to bind to :: (IPv6)"
else
    echo "✓ Dashboard config already has server.host: ::"
fi

# Nginx proxy architecture: Dashboard listens on 5602, nginx listens on 5601
if ! grep -q "^server.port:.*5602" "$DASHBOARD_CONFIG" 2>/dev/null; then
    echo "Fixing Dashboard port binding to 5602 (proxied behind nginx on 5601)..."
    
    # Remove any existing server.port line
    sed -i '/^server\.port:/d' "$DASHBOARD_CONFIG" 2>/dev/null || true
    
    # Add correct port (5602 - proxied UI)
    if grep -q "^server.host:" "$DASHBOARD_CONFIG" 2>/dev/null; then
        # Insert after server.host
        sed -i '/^server\.host:/a server.port: 5602' "$DASHBOARD_CONFIG" 2>/dev/null || true
    else
        # Add at beginning of file
        sed -i '1i server.port: 5602' "$DASHBOARD_CONFIG" 2>/dev/null || true
    fi
    
    echo "✓ Updated Dashboard config to use port 5602 (proxied UI)"
else
    echo "✓ Dashboard config already has server.port: 5602"
fi

# Verify config
echo "Verifying Dashboard config:"
grep -E "^server\.(host|port):" "$DASHBOARD_CONFIG" || echo "⚠ Warning: Could not find server.host or server.port in config"

echo "Dashboard binding fix completed."





