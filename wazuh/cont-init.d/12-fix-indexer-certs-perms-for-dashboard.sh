#!/usr/bin/with-contenv sh
# Ensure Wazuh Dashboard can read Indexer CA cert
# Root cause seen in Fly logs:
#   Error: EACCES: permission denied, open '/etc/wazuh-indexer/certs/root-ca.pem'
# This prevents the UI from starting, which then causes Fly health checks on 5601 to fail (503 externally).
# embracingearth.space

set +e  # Don't fail container startup on permission adjustments

CERT_DIR="/etc/wazuh-indexer/certs"
CA_CERT="${CERT_DIR}/root-ca.pem"

echo "Fixing Indexer cert permissions for Dashboard compatibility..."

# Ensure parent dirs are traversable by non-root users (Dashboard runs as wazuh-dashboard)
chmod 755 /etc/wazuh-indexer 2>/dev/null || true
chmod 755 "$CERT_DIR" 2>/dev/null || true

# Ensure CA cert is world-readable (Dashboard needs to read it)
if [ -f "$CA_CERT" ]; then
  chmod 644 "$CA_CERT" 2>/dev/null || true
  echo "✓ CA cert permissions set: $CA_CERT"
else
  echo "⚠ CA cert not found yet: $CA_CERT (may be generated later)"
fi

# Diagnostics (safe: no secrets)
ls -la "$CERT_DIR" 2>/dev/null | head -20 || true

echo "Indexer cert permission fix completed."

