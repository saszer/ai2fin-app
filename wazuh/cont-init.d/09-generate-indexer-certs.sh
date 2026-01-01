#!/bin/bash
# Generate Wazuh Indexer certificates for single-node setup
# Stores certificates in persistent volume to survive restarts
# embracingearth.space

set +e  # Don't exit on error

echo "=== Generating Wazuh Indexer certificates ==="

# Use persistent storage for certificates
PERSISTENT_CERT_DIR="/var/ossec/data/certs"
CERT_DIR="/etc/wazuh-indexer/certs"

mkdir -p "$PERSISTENT_CERT_DIR"
mkdir -p "$CERT_DIR"

# Check if we already have certificates in persistent storage
if [ -f "$PERSISTENT_CERT_DIR/wazuh-indexer.pem" ] && [ -f "$PERSISTENT_CERT_DIR/root-ca.pem" ]; then
    echo "✓ Found existing certificates in persistent storage"
    # Copy to expected location
    cp -p "$PERSISTENT_CERT_DIR"/*.pem "$CERT_DIR/" 2>/dev/null || true
else
    echo "Generating new certificates..."
    
    # Generate root CA
    openssl genrsa -out "$PERSISTENT_CERT_DIR/root-ca-key.pem" 2048
    openssl req -new -x509 -days 3650 -subj "/CN=wazuh-ca" \
        -key "$PERSISTENT_CERT_DIR/root-ca-key.pem" \
        -out "$PERSISTENT_CERT_DIR/root-ca.pem"
    echo "✓ Root CA generated"

    # Generate Indexer certificate with SAN for localhost
    openssl genrsa -out "$PERSISTENT_CERT_DIR/wazuh-indexer-key.pem" 2048
    
    # Create config for SAN
    cat > /tmp/indexer-cert.cnf <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = wazuh-indexer

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = wazuh-indexer
IP.1 = 127.0.0.1
EOF

    openssl req -new -config /tmp/indexer-cert.cnf \
        -key "$PERSISTENT_CERT_DIR/wazuh-indexer-key.pem" \
        -out "$PERSISTENT_CERT_DIR/wazuh-indexer.csr"
    
    openssl x509 -req -in "$PERSISTENT_CERT_DIR/wazuh-indexer.csr" \
        -CA "$PERSISTENT_CERT_DIR/root-ca.pem" \
        -CAkey "$PERSISTENT_CERT_DIR/root-ca-key.pem" \
        -CAcreateserial \
        -out "$PERSISTENT_CERT_DIR/wazuh-indexer.pem" \
        -days 3650 \
        -extensions v3_req \
        -extfile /tmp/indexer-cert.cnf
    
    rm -f "$PERSISTENT_CERT_DIR/wazuh-indexer.csr" /tmp/indexer-cert.cnf
    echo "✓ Indexer certificate generated"

    # Generate Admin certificate for security initialization
    # DN MUST match plugins.security.authcz.admin_dn in opensearch.yml
    openssl genrsa -out "$PERSISTENT_CERT_DIR/admin-key.pem" 2048
    openssl req -new -subj "/C=AU/ST=NSW/L=Sydney/O=Wazuh/CN=admin" \
        -key "$PERSISTENT_CERT_DIR/admin-key.pem" \
        -out "$PERSISTENT_CERT_DIR/admin.csr"
    openssl x509 -req -in "$PERSISTENT_CERT_DIR/admin.csr" \
        -CA "$PERSISTENT_CERT_DIR/root-ca.pem" \
        -CAkey "$PERSISTENT_CERT_DIR/root-ca-key.pem" \
        -CAcreateserial \
        -out "$PERSISTENT_CERT_DIR/admin.pem" \
        -days 3650
    rm -f "$PERSISTENT_CERT_DIR/admin.csr"
    echo "✓ Admin certificate generated with DN: CN=admin,O=Wazuh,L=Sydney,ST=NSW,C=AU"

    # Copy to expected location
    cp -p "$PERSISTENT_CERT_DIR"/*.pem "$CERT_DIR/"
fi

# Set permissions - both Indexer and Dashboard need to read these certs
chown -R wazuh-indexer:wazuh-indexer "$CERT_DIR" 2>/dev/null || true
# Make CA cert readable by all (needed by Dashboard)
chmod 644 "$CERT_DIR"/root-ca.pem 2>/dev/null || true
# Keep private keys restricted
chmod 600 "$CERT_DIR"/*-key.pem 2>/dev/null || true
chmod 640 "$CERT_DIR"/wazuh-indexer.pem 2>/dev/null || true
chmod 640 "$CERT_DIR"/admin.pem 2>/dev/null || true
chmod 755 "$CERT_DIR"

# Verify certificates
echo "Certificate files:"
ls -la "$CERT_DIR"/*.pem 2>/dev/null || echo "⚠️ No certificate files found!"

echo "✓ Indexer certificates ready"

