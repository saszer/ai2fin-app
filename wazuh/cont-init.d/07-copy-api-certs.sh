#!/usr/bin/with-contenv sh
# Generate or copy SSL certificates for Wazuh API
# Wazuh API needs certificates in /var/ossec/api/configuration/ssl/
# embracingearth.space

set +e  # Don't exit on error

echo "Setting up SSL certificates for Wazuh API..."

# Create SSL directory
mkdir -p /var/ossec/api/configuration/ssl
mkdir -p /var/ossec/etc

# Strategy: Try to use Manager's certificates, or generate our own
CERT_SOURCE="/var/ossec/etc/sslmanager.key"
CERT_DEST="/var/ossec/api/configuration/ssl/sslmanager.key"

# Wait for Manager to generate certificates (up to 90 seconds)
MAX_WAIT=90
WAITED=0
while [ ! -f "$CERT_SOURCE" ] && [ $WAITED -lt $MAX_WAIT ]; do
  sleep 2
  WAITED=$((WAITED + 2))
  if [ $((WAITED % 10)) -eq 0 ]; then
    echo "  Waiting for Manager certificates... (${WAITED}s)"
  fi
done

# If Manager certificates exist, copy them
if [ -f "$CERT_SOURCE" ] && [ -f "/var/ossec/etc/sslmanager.cert" ]; then
  echo "  Found Manager certificates, copying to API location..."
  cp /var/ossec/etc/sslmanager.key "$CERT_DEST"
  cp /var/ossec/etc/sslmanager.cert /var/ossec/api/configuration/ssl/sslmanager.cert
  echo "✓ SSL certificates copied from Manager to API location"
else
  # Generate self-signed certificates if Manager hasn't created them
  echo "  Manager certificates not found, generating self-signed certificates..."
  
  # Check if openssl is available
  if command -v openssl >/dev/null 2>&1; then
    # Generate self-signed certificate
    openssl req -x509 -newkey rsa:2048 \
      -keyout "$CERT_DEST" \
      -out /var/ossec/api/configuration/ssl/sslmanager.cert \
      -days 365 \
      -nodes \
      -subj "/CN=wazuh-manager/O=Wazuh/C=US" \
      2>/dev/null
    
    if [ $? -eq 0 ] && [ -f "$CERT_DEST" ]; then
      echo "✓ Self-signed SSL certificates generated"
    else
      echo "⚠ WARNING: Failed to generate SSL certificates"
    fi
  else
    echo "⚠ WARNING: openssl not found, cannot generate certificates"
  fi
fi

# Set correct permissions (critical for API to read certificates)
if [ -f "$CERT_DEST" ]; then
  chown -R wazuh:wazuh /var/ossec/api/configuration/ssl
  chmod 600 "$CERT_DEST"
  chmod 644 /var/ossec/api/configuration/ssl/sslmanager.cert
  echo "✓ SSL certificate permissions set correctly"
else
  echo "⚠ WARNING: SSL certificates not available, API may fail to start"
fi

