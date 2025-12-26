# Wazuh Manager Dockerfile for Fly.io
# Self-hosted Wazuh SIEM/XDR platform
FROM wazuh/wazuh-manager:4.8.0

# Install jq if not present (curl is already in Wazuh image)
# Wazuh uses Amazon Linux which has curl-minimal, so we only need jq
RUN (command -v dnf >/dev/null 2>&1 && dnf install -y jq --allowerasing || \
     command -v yum >/dev/null 2>&1 && yum install -y jq --allowerasing || \
     echo "jq may already be installed or package manager not found") && \
    rm -rf /var/cache/yum /var/cache/dnf 2>/dev/null || true

# Configure Wazuh
COPY wazuh.conf /var/ossec/etc/ossec.conf
COPY local_internal_options.conf /var/ossec/etc/local_internal_options.conf

# Expose Wazuh API port
EXPOSE 55000

# Health check (using wget if curl not available)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD (curl -f http://localhost:55000/ || wget -q --spider http://localhost:55000/ || /var/ossec/bin/wazuh-control status) || exit 1

# Start Wazuh
CMD ["/var/ossec/bin/wazuh-control", "start"]

