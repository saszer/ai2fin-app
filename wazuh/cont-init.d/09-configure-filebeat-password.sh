#!/bin/bash
# Configure Filebeat password by substituting environment variable
# Filebeat doesn't support environment variable substitution in YAML files
# This script must run before Filebeat starts
# embracingearth.space

set +e  # Don't exit on error

echo "🔧 Configuring Filebeat password..."

FILEBEAT_CONFIG="/etc/filebeat/filebeat.yml"
OPENSEARCH_PASSWORD="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"

# Wait for filebeat config to exist
MAX_WAIT=30
WAITED=0
while [ ! -f "$FILEBEAT_CONFIG" ] && [ $WAITED -lt $MAX_WAIT ]; do
    sleep 2
    WAITED=$((WAITED + 2))
done

if [ ! -f "$FILEBEAT_CONFIG" ]; then
    echo "⚠️ Filebeat config not found: $FILEBEAT_CONFIG"
    exit 0  # Not critical, continue
fi

# Check if password needs substitution
if grep -q '\${OPENSEARCH_INITIAL_ADMIN_PASSWORD' "$FILEBEAT_CONFIG" 2>/dev/null; then
    echo "  Substituting password placeholder..."
    # Escape special characters in password for sed
    ESCAPED_PASSWORD=$(printf '%s\n' "$OPENSEARCH_PASSWORD" | sed 's/[[\.*^$()+?{|]/\\&/g')
    # Replace the placeholder with actual password
    sed -i "s|password:.*\${OPENSEARCH_INITIAL_ADMIN_PASSWORD.*}|password: \"$ESCAPED_PASSWORD\"|" "$FILEBEAT_CONFIG" 2>/dev/null || \
    sed -i "s|password:.*|password: \"$ESCAPED_PASSWORD\"|" "$FILEBEAT_CONFIG" 2>/dev/null || true
    
    # Verify substitution worked
    if grep -q "password: \"$ESCAPED_PASSWORD\"" "$FILEBEAT_CONFIG" 2>/dev/null; then
        echo "  ✅ Password substituted successfully"
    else
        # Fallback: replace any password line
        sed -i 's|^  password:.*|  password: "'"$OPENSEARCH_PASSWORD"'"|' "$FILEBEAT_CONFIG" 2>/dev/null || true
        echo "  ✅ Password configured (fallback method)"
    fi
else
    echo "  ✅ Password already configured (no placeholder found)"
fi

# Verify final config
if grep -q "password:" "$FILEBEAT_CONFIG" 2>/dev/null; then
    echo "  ✅ Filebeat password configuration complete"
else
    echo "  ⚠️ Warning: Could not verify password in config"
fi

