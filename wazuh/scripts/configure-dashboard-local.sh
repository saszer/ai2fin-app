#!/bin/bash
# Configure Wazuh Dashboard API connection for local development
# embracingearth.space

set -e

CONFIG_DIR="/usr/share/wazuh-dashboard/data/wazuh/config"
CONFIG_FILE="$CONFIG_DIR/wazuh.yml"

echo "🔧 Configuring Wazuh Dashboard API connection..."

# Wait for dashboard to be ready
echo "⏳ Waiting for Dashboard to be ready..."
for i in {1..30}; do
    if curl -f -s http://localhost:5601/api/status > /dev/null 2>&1; then
        echo "✅ Dashboard is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Dashboard not ready after 5 minutes"
        exit 1
    fi
    echo "   Attempt $i/30..."
    sleep 10
done

# Get credentials from environment
WAZUH_USER="${WAZUH_API_USER:-szsah}"
WAZUH_PASS="${WAZUH_API_PASSWORD}"
WAZUH_URL="${WAZUH_API_URL:-https://wazuh-manager:55000}"

if [ -z "$WAZUH_PASS" ]; then
    echo "❌ WAZUH_API_PASSWORD not set"
    exit 1
fi

# Create config directory
mkdir -p "$CONFIG_DIR"

# Generate config file
cat > "$CONFIG_FILE" << EOF
# Wazuh Dashboard - API Configuration
# Generated for local development
# embracingearth.space

hosts:
  - default:
      url: ${WAZUH_URL/https:\/\//}
      port: 55000
      username: ${WAZUH_USER}
      password: ${WAZUH_PASS}
      run_as: false

customization.logo.app: "custom/images/customization.logo.app.png?v=1767320479282"
EOF

# Set permissions
chown wazuh-dashboard:wazuh-dashboard "$CONFIG_FILE" 2>/dev/null || true
chmod 640 "$CONFIG_FILE"

echo "✅ Dashboard API configuration complete"
echo "   User: $WAZUH_USER"
echo "   URL: $WAZUH_URL"
echo "   Config: $CONFIG_FILE"
