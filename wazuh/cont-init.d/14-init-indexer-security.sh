#!/usr/bin/with-contenv sh
# Initialize Wazuh Indexer security after certificates are ready
# This must run AFTER 09-generate-indexer-certs.sh
# embracingearth.space

set +e  # Don't exit on error

echo "Initializing Indexer security..."

# Wait for certificates to be generated
CERT_DIR="/etc/wazuh-indexer/certs"
MAX_WAIT=60
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
    if [ -f "$CERT_DIR/wazuh-indexer.pem" ] && [ -f "$CERT_DIR/wazuh-indexer-key.pem" ] && [ -f "$CERT_DIR/root-ca.pem" ]; then
        echo "✓ Certificates found"
        break
    fi
    sleep 2
    ELAPSED=$((ELAPSED + 2))
done

if [ ! -f "$CERT_DIR/wazuh-indexer.pem" ]; then
    echo "⚠️ WARNING: Certificates not found, security may not work"
    exit 0
fi

# Set proper permissions on certificates
chown -R wazuh-indexer:wazuh-indexer "$CERT_DIR" 2>/dev/null || true
chmod 600 "$CERT_DIR"/*.pem "$CERT_DIR"/*.key 2>/dev/null || true
chmod 755 "$CERT_DIR"

# Get admin password from environment or use default
ADMIN_PASSWORD="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"

if [ "$ADMIN_PASSWORD" = "admin" ]; then
    echo "⚠️ WARNING: Using default admin password"
    echo "⚠️ Set OPENSEARCH_INITIAL_ADMIN_PASSWORD secret for production!"
fi

echo "✓ Indexer security initialized"
echo "  Admin username: admin"
echo "  Admin password: ${ADMIN_PASSWORD}"
echo ""
echo "⚠️ Dashboard login credentials:"
echo "  Username: admin"
echo "  Password: ${ADMIN_PASSWORD}"

