#!/usr/bin/with-contenv sh
# Ensure Wazuh API configuration is correct (merged from scripts 03, 04, 05)
# This consolidates config checking and fixing into one efficient script
# embracingearth.space

set +e  # Don't exit on error

echo "Ensuring Wazuh API configuration is correct..."

API_CONFIG="/var/ossec/api/configuration/api.yaml"
API_CONFIG_BACKUP="${API_CONFIG}.backup"

# Wait for API config directory to exist
MAX_WAIT=30
WAITED=0
while [ ! -d "/var/ossec/api/configuration" ] && [ $WAITED -lt $MAX_WAIT ]; do
    sleep 2
    WAITED=$((WAITED + 2))
done

if [ ! -d "/var/ossec/api/configuration" ]; then
    echo "⚠ API configuration directory not found, creating..."
    mkdir -p /var/ossec/api/configuration
fi

# Backup existing config if it exists
if [ -f "$API_CONFIG" ]; then
    cp "$API_CONFIG" "$API_CONFIG_BACKUP" 2>/dev/null || true
fi

# Check and fix API config
CONFIG_CHANGED=false

if [ -f "$API_CONFIG" ]; then
    echo "✓ API configuration file found: $API_CONFIG"
    
    # Check if host is set to 0.0.0.0 (must be a string, not a list for Wazuh 4.8)
    if grep -q "^host:.*0.0.0.0" "$API_CONFIG" 2>/dev/null || grep -q "^host: '0.0.0.0'" "$API_CONFIG" 2>/dev/null; then
        # Verify it's a string format (not a list)
        if ! grep -q "^host: '0.0.0.0'" "$API_CONFIG" 2>/dev/null && ! grep -q '^host: "0.0.0.0"' "$API_CONFIG" 2>/dev/null; then
            echo "⚠ Fixing API host binding to string format..."
            sed -i "s/^host:.*/host: '0.0.0.0'/" "$API_CONFIG" 2>/dev/null || true
            sed -i "/^  - '0.0.0.0'/d" "$API_CONFIG" 2>/dev/null || true
            sed -i "/^  - '::'/d" "$API_CONFIG" 2>/dev/null || true
            CONFIG_CHANGED=true
        else
            echo "✓ API host binding format is correct (string format)"
        fi
    else
        echo "⚠ API config missing 0.0.0.0 binding, adding..."
        if grep -q "^host:" "$API_CONFIG" 2>/dev/null; then
            sed -i "s/^host:.*/host: '0.0.0.0'/" "$API_CONFIG" 2>/dev/null || true
        else
            sed -i "/^port:/a host: '0.0.0.0'" "$API_CONFIG" 2>/dev/null || true
        fi
        CONFIG_CHANGED=true
    fi
    
    # Verify port is 55000
    if ! grep -q "^port:.*55000" "$API_CONFIG" 2>/dev/null; then
        echo "⚠ Fixing API port to 55000..."
        sed -i "s/^port:.*/port: 55000/" "$API_CONFIG" 2>/dev/null || true
        CONFIG_CHANGED=true
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
    CONFIG_CHANGED=true
    echo "✓ Created API config with 0.0.0.0 binding"
fi

# Check if API process is running
if pgrep -f "wazuh-apid" >/dev/null 2>&1; then
    echo "✓ Wazuh API process is running"
    
    # If config changed, trigger reload
    if [ "$CONFIG_CHANGED" = true ]; then
        echo "  Config changed, triggering API reload..."
        API_PID=$(pgrep -f "wazuh-apid" | head -1)
        if [ -n "$API_PID" ]; then
            kill -HUP "$API_PID" 2>/dev/null || true
            sleep 2
        fi
    fi
else
    echo "ℹ Wazuh API process not yet running (will start via s6)"
fi

echo "✓ API configuration check completed"

