# Wazuh Agent Setup Guide

**Purpose:** Connect your applications to Wazuh for security monitoring

---

## 🎯 Overview

Wazuh agents will monitor:
- ✅ Security events (failed logins, JWT failures)
- ✅ System logs
- ✅ Application logs
- ✅ File integrity
- ✅ Configuration changes

---

## 📦 Option 1: Filebeat Agent (Recommended for Fly.io)

Filebeat is lightweight and perfect for containerized environments.

### **Installation in Core App**

**1. Add to `ai2-core-app/Dockerfile`:**
```dockerfile
# Install Filebeat
RUN curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.11.0-linux-x86_64.tar.gz && \
    tar xzvf filebeat-8.11.0-linux-x86_64.tar.gz && \
    mv filebeat-8.11.0-linux-x86_64 /usr/share/filebeat && \
    rm filebeat-8.11.0-linux-x86_64.tar.gz
```

**2. Create `ai2-core-app/filebeat.yml`:**
```yaml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /app/logs/*.log
      - /var/log/app/*.log
    fields:
      service: ai2-core-app
      environment: production
    json.keys_under_root: true
    json.add_error_key: true

  - type: log
    enabled: true
    paths:
      - /proc/self/fd/1  # Docker stdout
      - /proc/self/fd/2  # Docker stderr
    fields:
      service: ai2-core-app
      environment: production

output.logstash:
  hosts: ["ai2-wazuh.fly.dev:5044"]

processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded
  - add_docker_metadata: ~
  - add_kubernetes_metadata: ~
```

---

## 📦 Option 2: Wazuh Agent (Full Monitoring)

For complete endpoint protection (file integrity, malware detection, etc.)

### **Installation:**

**1. Add to `ai2-core-app/Dockerfile`:**
```dockerfile
# Install Wazuh Agent
RUN curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import && \
    chmod 644 /usr/share/keyrings/wazuh.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | tee -a /etc/apt/sources.list.d/wazuh.list && \
    apt-get update && \
    WAZUH_MANAGER="ai2-wazuh.fly.dev" apt-get install -y wazuh-agent
```

**2. Configure agent:**
```bash
# Set manager IP
echo "ai2-wazuh.fly.dev" > /var/ossec/etc/ossec.conf
```

---

## 🔌 Option 3: Direct API Integration (Easiest)

Send security events directly to Wazuh API (no agent needed).

**Best for:** Application-level security events

### **Implementation:**

See `wazuh-integration.ts` for code implementation.

---

## 🚀 Quick Start: API Integration

**1. Install Wazuh client:**
```bash
cd ai2-core-app
npm install axios
```

**2. Use Wazuh integration:**
```typescript
import { wazuhClient } from './lib/wazuh';

// Send security event
await wazuhClient.sendSecurityEvent({
  type: 'authentication_failure',
  severity: 'high',
  message: 'JWT verification failed',
  ip: req.ip,
  userAgent: req.headers['user-agent']
});
```

---

## 📋 Recommended Setup

**For Your Use Case:**
- ✅ **API Integration** - For application security events
- ✅ **Filebeat** - For log aggregation
- ⚠️ **Wazuh Agent** - Optional (for full endpoint protection)

**Start with API Integration** (easiest, no Docker changes needed)

