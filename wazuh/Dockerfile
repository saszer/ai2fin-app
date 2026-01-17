# Wazuh Manager Dockerfile for Fly.io
# Self-hosted Wazuh SIEM/XDR platform
# Official image: https://hub.docker.com/r/wazuh/wazuh-manager
FROM wazuh/wazuh-manager:4.8.0

# Note: Wazuh container handles initialization automatically
# We just need to provide configuration files

# Configure Wazuh (container will merge with defaults)
COPY wazuh.conf /var/ossec/etc/ossec.conf
COPY local_internal_options.conf /var/ossec/etc/local_internal_options.conf

# Copy custom rules and decoders for financial app
COPY custom_rules/ /var/ossec/etc/custom_rules/
COPY custom_decoders/ /var/ossec/etc/custom_decoders/

# Create required shared directory and copy ar.conf file (prevents config error)
# Wazuh requires this file even if active response is disabled
RUN mkdir -p /var/ossec/etc/shared
COPY etc/shared/ar.conf /var/ossec/etc/shared/ar.conf

# Copy init scripts for s6-overlay (runs before services start)
# These scripts fix common issues like Filebeat lock conflicts
# Note: Scripts run in alphabetical order (01-, 02-, etc.)
COPY scripts/ /etc/cont-init.d/scripts/
COPY cont-init.d/ /etc/cont-init.d/
# Fix line endings (CRLF to LF) and set execute permissions
RUN find /etc/cont-init.d/ -name "*.sh" -type f -exec sed -i 's/\r$//' {} \; && \
    chmod +x /etc/cont-init.d/*.sh 2>/dev/null || true

# Note: We don't override services.d/wazuh-api/run - let official image handle it
# The official Wazuh image already has the wazuh-api service properly configured
# We only add finish scripts if needed (but not for wazuh-api to avoid conflicts)

# Create missing audit-keys list file (prevents rule warnings)
RUN mkdir -p /var/ossec/etc/lists
COPY etc/lists/audit-keys /var/ossec/etc/lists/audit-keys

# Configure Wazuh API (separate service in Wazuh 4.x, not a wodle)
# API configuration file location: /var/ossec/api/configuration/api.yaml
RUN mkdir -p /var/ossec/api/configuration/ssl
COPY api/configuration/api.yaml /var/ossec/api/configuration/api.yaml

# Fix API database permissions (API needs write access to its database)
# The certificate copy script (07-copy-api-certs.sh) and permission fix (08-fix-permissions.sh) 
# are already copied via COPY cont-init.d/ above
RUN mkdir -p /var/ossec/api/configuration/security && \
    mkdir -p /var/ossec/etc/lists && \
    chown -R wazuh:wazuh /var/ossec/api/configuration && \
    chown -R wazuh:wazuh /var/ossec/etc/lists

# Expose Wazuh API port (standard port per official docs)
EXPOSE 55000

# Health check - Check if Wazuh API is responding
# Wazuh API uses HTTPS on port 55000
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD (curl -k -f https://localhost:55000/ || wget -q --no-check-certificate --spider https://localhost:55000/ || /var/ossec/bin/wazuh-control status) || exit 1

# Note: Wazuh Docker image uses s6-overlay (/init) as entrypoint
# This automatically manages all Wazuh processes and keeps them running
# We don't need to override CMD - the image handles it

