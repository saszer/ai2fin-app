# 🔧 Wazuh API Configuration Fix

**Date:** 2025-12-26  
**Issue:** Wazuh API not binding to 0.0.0.0:55000 - process running but port not listening

---

## 🚨 Problem

**Symptoms:**
- Wazuh API process (`wazuh-apid`) is running
- TCP health check passes (port appears open)
- But API not actually listening on `0.0.0.0:55000`
- Deployment fails health check timeout

**Root Cause:**
- In Wazuh 4.x, the API is a **separate service** with its own configuration file
- The `wodle` configuration in `ossec.conf` is **deprecated/ignored** in 4.x
- API configuration must be in `/var/ossec/api/configuration/api.yaml`
- Default configuration may not bind to `0.0.0.0` (only localhost)

---

## ✅ Fixes Applied

### **1. Created API Configuration File** ✅

**File:** `api/configuration/api.yaml`

**Configuration:**
```yaml
host: ['0.0.0.0', '::']  # Listen on all interfaces (IPv4 and IPv6)
port: 55000
https:
  enabled: yes
  key: /var/ossec/etc/sslmanager.key
  cert: /var/ossec/etc/sslmanager.cert
```

**Why:**
- Explicitly configures API to listen on all interfaces
- Uses correct SSL certificate paths from Wazuh image
- Matches Wazuh 4.x API configuration format

### **2. Removed Deprecated Wodle Configuration** ✅

**File:** `wazuh.conf`

**Change:**
- Removed `<wodle name="wazuh-api">` configuration
- Added comment explaining API is now separate service
- API configuration handled by `api.yaml` file

**Why:**
- Wodle configuration is deprecated in Wazuh 4.x
- May cause conflicts or be ignored
- API service uses its own configuration file

### **3. Updated Dockerfile** ✅

**Change:**
- Added copy command for API configuration file
- Creates directory structure if needed
- Places config at correct location: `/var/ossec/api/configuration/api.yaml`

---

## 📋 Files Changed

1. **`api/configuration/api.yaml`** ✅
   - New API configuration file
   - Configured to listen on `0.0.0.0:55000`

2. **`wazuh.conf`** ✅
   - Removed deprecated wodle API configuration
   - Added explanatory comments

3. **`Dockerfile`** ✅
   - Added API configuration file copying
   - Creates necessary directory structure

---

## 🔍 How Wazuh 4.x API Works

**Architecture:**
- API is a **separate Node.js service** (`wazuh-apid`)
- Managed by s6-overlay (like other Wazuh services)
- Configuration in `/var/ossec/api/configuration/api.yaml`
- NOT configured via `ossec.conf` wodle anymore

**Configuration File Location:**
```
/var/ossec/api/configuration/api.yaml
```

**Key Settings:**
- `host: ['0.0.0.0', '::']` - Listen on all interfaces
- `port: 55000` - Standard Wazuh API port
- `https.enabled: yes` - HTTPS required
- SSL certificates from `/var/ossec/etc/sslmanager.*`

---

## 🚀 Next Steps

1. **Rebuild and Deploy:**
   ```bash
   cd embracingearthspace/wazuh
   fly deploy -a ai2-wazuh
   ```

2. **Verify API is Listening:**
   ```bash
   fly ssh console -a ai2-wazuh
   netstat -tuln | grep 55000
   # Should show: tcp 0 0 0.0.0.0:55000 0.0.0.0:* LISTEN
   ```

3. **Test API Endpoint:**
   ```bash
   curl -k https://localhost:55000/
   # Should return API information
   ```

---

## ⚠️ Additional Notes

1. **Filebeat Elasticsearch Connection Errors:**
   - Filebeat is trying to connect to `wazuh.indexer:9200`
   - This is expected if you don't have an Elasticsearch indexer
   - Can be safely ignored or configure Filebeat to disable indexer output

2. **API Credentials:**
   - API requires authentication (basic auth)
   - Credentials should be set via Fly.io secrets:
     ```bash
     fly secrets set WAZUH_API_USER=admin -a ai2-wazuh
     fly secrets set WAZUH_API_PASSWORD=<password> -a ai2-wazuh
     ```

3. **API Initialization:**
   - First-time API setup may require initialization
   - Default credentials may need to be set
   - Check `/var/ossec/logs/api.log` for initialization status

---

**embracingearth.space**

