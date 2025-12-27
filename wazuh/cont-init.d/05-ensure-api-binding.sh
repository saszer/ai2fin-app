#!/usr/bin/with-contenv sh
# Ensure Wazuh API binds to 0.0.0.0:55000
# This script runs after services start to verify and fix API binding
# embracingearth.space

set +e  # Don't exit on error

echo "Ensuring Wazuh API binds to 0.0.0.0:55000..."

API_CONFIG="/var/ossec/api/configuration/api.yaml"
API_CONFIG_BACKUP="${API_CONFIG}.backup"

# Wait for Wazuh initialization to complete
# Wazuh Docker image does initialization that may overwrite configs
echo "Waiting for Wazuh initialization to complete..."
sleep 10

# Wait for API config directory to exist
MAX_WAIT=60
WAITED=0
while [ ! -d "/var/ossec/api/configuration" ] && [ $WAITED -lt $MAX_WAIT ]; do
    sleep 2
    WAITED=$((WAITED + 2))
    if [ $((WAITED % 10)) -eq 0 ]; then
        echo "  Still waiting for API config directory... (${WAITED}s)"
    fi
done

if [ ! -d "/var/ossec/api/configuration" ]; then
    echo "⚠ API configuration directory not found, creating..."
    mkdir -p /var/ossec/api/configuration
fi

# Backup existing config if it exists
if [ -f "$API_CONFIG" ]; then
    echo "Backing up existing API config..."
    cp "$API_CONFIG" "$API_CONFIG_BACKUP" 2>/dev/null || true
fi

# Ensure our config file exists and has correct binding
if [ -f "$API_CONFIG" ]; then
    echo "✓ API config file exists: $API_CONFIG"
    
    # Check if host is set to 0.0.0.0 (must be a string, not a list for Wazuh 4.8)
    if grep -q "^host:.*0.0.0.0" "$API_CONFIG" 2>/dev/null || grep -q "^host: '0.0.0.0'" "$API_CONFIG" 2>/dev/null; then
        echo "✓ API config contains 0.0.0.0 binding (correct format)"
        
        # Verify it's a string format (not a list) - Wazuh 4.8 requires string
        if grep -q "^host: '0.0.0.0'" "$API_CONFIG" 2>/dev/null || grep -q '^host: "0.0.0.0"' "$API_CONFIG" 2>/dev/null; then
            echo "✓ API host binding format is correct (string format)"
        else
            echo "⚠ Fixing API host binding to string format (Wazuh 4.8 requirement)..."
            # Convert list format to string format if needed
            sed -i "s/^host:.*/host: '0.0.0.0'/" "$API_CONFIG" 2>/dev/null || true
            # Remove list items if present
            sed -i "/^  - '0.0.0.0'/d" "$API_CONFIG" 2>/dev/null || true
            sed -i "/^  - '::'/d" "$API_CONFIG" 2>/dev/null || true
        fi
    else
        echo "⚠ API config missing 0.0.0.0 binding, adding..."
        # Add host binding as string (Wazuh 4.8 requirement)
        if grep -q "^host:" "$API_CONFIG" 2>/dev/null; then
            sed -i "s/^host:.*/host: '0.0.0.0'/" "$API_CONFIG" 2>/dev/null || true
        else
            # Insert after port if host is missing
            sed -i "/^port:/a host: '0.0.0.0'" "$API_CONFIG" 2>/dev/null || true
        fi
    fi
else
    echo "⚠ API config file not found, creating default..."
    cat > "$API_CONFIG" <<EOF
# Wazuh API Configuration
# Auto-generated to ensure 0.0.0.0 binding
# embracingearth.space

host: '0.0.0.0'
port: 55000
https:
  enabled: yes
  key: sslmanager.key
  cert: sslmanager.cert
  use_ca: no
cors:
  enabled: yes
  source_route: 'https://*.ai2fin.com,https://ai2fin.com,https://*.fly.dev'
  expose_headers: '*'
  allow_headers: '*'
  allow_credentials: yes
logs:
  level: info
  format: plain
EOF
    echo "✓ Created API config with 0.0.0.0 binding"
fi

# Verify the config one more time
echo "Final API config check:"
if [ -f "$API_CONFIG" ]; then
    echo "  Config file: $API_CONFIG"
    echo "  Host binding:"
    grep -A 3 "host:" "$API_CONFIG" 2>/dev/null | head -5 || echo "    (could not read)"
    echo "  Port:"
    grep "^port:" "$API_CONFIG" 2>/dev/null || echo "    (not found)"
else
    echo "  ⚠ Config file still not found!"
fi

echo "API binding configuration completed."

# Force API to reload config by touching the config file
# This triggers the API to re-read the configuration
if [ -f "$API_CONFIG" ]; then
    echo "Triggering API config reload..."
    touch "$API_CONFIG" 2>/dev/null || true
    
    # If API process is running, send SIGHUP to reload config
    API_PID=$(pgrep -f "wazuh-apid" | head -1)
    if [ -n "$API_PID" ]; then
        echo "Found API process (PID: $API_PID), attempting config reload..."
        kill -HUP "$API_PID" 2>/dev/null || true
    fi
fi

echo "Note: If API still doesn't bind, it may need a full restart."

