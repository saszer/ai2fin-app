#!/usr/bin/with-contenv sh
# Generate Wazuh Indexer certificates for single-node setup
# This script creates self-signed certificates for Indexer
# embracingearth.space

set +e  # Don't exit on error

echo "Generating Wazuh Indexer certificates..."

CERT_DIR="/etc/wazuh-indexer/certs"
mkdir -p "$CERT_DIR"

# Generate root CA
if [ ! -f "$CERT_DIR/root-ca.pem" ]; then
    openssl genrsa -out "$CERT_DIR/root-ca-key.pem" 2048
    openssl req -new -x509 -days 3650 -subj "/CN=wazuh-ca" \
        -key "$CERT_DIR/root-ca-key.pem" \
        -out "$CERT_DIR/root-ca.pem"
    echo "✓ Root CA generated"
fi

# Generate Indexer certificate
if [ ! -f "$CERT_DIR/wazuh-indexer.pem" ]; then
    openssl genrsa -out "$CERT_DIR/wazuh-indexer-key.pem" 2048
    openssl req -new -subj "/CN=wazuh-indexer" \
        -key "$CERT_DIR/wazuh-indexer-key.pem" \
        -out "$CERT_DIR/wazuh-indexer.csr"
    openssl x509 -req -in "$CERT_DIR/wazuh-indexer.csr" \
        -CA "$CERT_DIR/root-ca.pem" \
        -CAkey "$CERT_DIR/root-ca-key.pem" \
        -CAcreateserial \
        -out "$CERT_DIR/wazuh-indexer.pem" \
        -days 3650
    rm -f "$CERT_DIR/wazuh-indexer.csr"
    echo "✓ Indexer certificate generated"
fi

# Generate Manager certificate for Indexer connection
if [ ! -f "$CERT_DIR/wazuh-manager.pem" ]; then
    openssl genrsa -out "$CERT_DIR/wazuh-manager-key.pem" 2048
    openssl req -new -subj "/CN=wazuh-manager" \
        -key "$CERT_DIR/wazuh-manager-key.pem" \
        -out "$CERT_DIR/wazuh-manager.csr"
    openssl x509 -req -in "$CERT_DIR/wazuh-manager.csr" \
        -CA "$CERT_DIR/root-ca.pem" \
        -CAkey "$CERT_DIR/root-ca-key.pem" \
        -CAcreateserial \
        -out "$CERT_DIR/wazuh-manager.pem" \
        -days 3650
    rm -f "$CERT_DIR/wazuh-manager.csr"
    echo "✓ Manager certificate generated"
fi

# Set permissions
chown -R wazuh-indexer:wazuh-indexer "$CERT_DIR"
chmod 600 "$CERT_DIR"/*.pem "$CERT_DIR"/*.key 2>/dev/null || true

echo "✓ Indexer certificates ready"

