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
    
    # Check if host is set to 0.0.0.0
    if grep -q "0.0.0.0" "$API_CONFIG" 2>/dev/null; then
        echo "✓ API config contains 0.0.0.0"
        
        # Verify the format is correct
        if grep -A 2 "host:" "$API_CONFIG" | grep -q "0.0.0.0" 2>/dev/null; then
            echo "✓ API host binding looks correct"
        else
            echo "⚠ Fixing API host binding format..."
            # Use sed to fix the host binding if needed
            sed -i "s/host:.*/host:\n  - '0.0.0.0'\n  - '::'/" "$API_CONFIG" 2>/dev/null || true
        fi
    else
        echo "⚠ API config missing 0.0.0.0 binding, adding..."
        # Add host binding if missing
        if grep -q "^host:" "$API_CONFIG" 2>/dev/null; then
            sed -i "s/^host:.*/host:\n  - '0.0.0.0'\n  - '::'/" "$API_CONFIG" 2>/dev/null || true
        else
            # Insert after port if host is missing
            sed -i "/^port:/a host:\n  - '0.0.0.0'\n  - '::'" "$API_CONFIG" 2>/dev/null || true
        fi
    fi
else
    echo "⚠ API config file not found, creating default..."
    cat > "$API_CONFIG" <<EOF
# Wazuh API Configuration
# Auto-generated to ensure 0.0.0.0 binding
# embracingearth.space

host:
  - '0.0.0.0'
  - '::'
port: 55000
https:
  enabled: yes
  key: /var/ossec/etc/sslmanager.key
  cert: /var/ossec/etc/sslmanager.cert
  use_ca: no
auth:
  auth_token_exp_timeout: 900
  rbac_mode: white
cors:
  enabled: yes
  source_route: '*'
  expose_headers: '*'
  allow_headers: '*'
  allow_credentials: yes
cache:
  enabled: yes
  time_to_live: 350
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

