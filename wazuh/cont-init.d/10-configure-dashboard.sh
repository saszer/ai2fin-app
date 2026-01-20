#!/bin/bash
# Configure Wazuh Dashboard with credentials from environment variables
# This ensures credentials are never hardcoded in the repo
# embracingearth.space

set -e

CONFIG_FILE="/usr/share/wazuh-dashboard/data/wazuh/config/wazuh.yml"
TEMPLATE_FILE="/etc/wazuh-dashboard-template/wazuh.yml.template"

echo "🔧 Configuring Wazuh Dashboard API connection from environment..."

# Get credentials from environment (set via Fly secrets)
WAZUH_USER="${WAZUH_API_USER:-wazuh}"
WAZUH_PASS="${WAZUH_API_PASSWORD:-wazuh}"

# Create config directory if it doesn't exist
mkdir -p "$(dirname "$CONFIG_FILE")"

# Generate config from template
if [ -f "$TEMPLATE_FILE" ]; then
    echo "Using template: $TEMPLATE_FILE"
    sed "s/__WAZUH_API_USER__/$WAZUH_USER/g; s/__WAZUH_API_PASSWORD__/$WAZUH_PASS/g" \
        "$TEMPLATE_FILE" > "$CONFIG_FILE"
else
    echo "⚠️ Template not found, creating config directly"
    cat > "$CONFIG_FILE" << EOF
# Wazuh Dashboard - API Configuration
# Generated at runtime from Fly secrets
# embracingearth.space

hosts:
  - default:
      url: https://127.0.0.1
      port: 55000
      username: $WAZUH_USER
      password: $WAZUH_PASS
      run_as: false
      # Skip SSL verification for self-signed certs
      ssl:
        verify: false

customization.logo.app: "custom/images/customization.logo.app.png?v=1767320479282"
EOF
fi

# Set proper permissions
chown wazuh-dashboard:wazuh-dashboard "$CONFIG_FILE" 2>/dev/null || true
chmod 640 "$CONFIG_FILE"

echo "✅ Dashboard API configuration complete"
echo "   User: $WAZUH_USER"
echo "   Config: $CONFIG_FILE"
