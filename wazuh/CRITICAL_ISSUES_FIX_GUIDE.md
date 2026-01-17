# 🚨 Wazuh Critical Issues - Fix Guide

**Date:** 2026-01-17  
**Status:** 🔴 **CRITICAL ISSUES DETECTED**

---

## 📊 Issues Identified

From Wazuh Dashboard Health Check:

1. ❌ **Wazuh API Connection:** "No API available to connect"
2. ❌ **Alerts Index Pattern:** "No template found for [wazuh-alerts-*]"
3. ⚠️ **Wazuh API Version:** Pending (depends on API connection)
4. ✅ **Monitoring Index Pattern:** Passing
5. ✅ **Statistics Index Pattern:** Passing

---

## 🔧 Fix 1: Fix Wazuh API Connection

### **Step 1: Diagnose API Status**

```bash
# SSH into Wazuh machine
fly ssh console -a ai2-wazuh

# Check if API process is running
ps aux | grep wazuh-api
# Should show: wazuh-apid process

# Check if port 55000 is listening
netstat -tuln | grep 55000
# OR
ss -tuln | grep 55000
# Should show: 0.0.0.0:55000 LISTEN

# Check API logs for errors
tail -100 /var/ossec/logs/api.log | grep -i "error\|fail\|bind\|listen"
```

### **Step 2: Check API Configuration**

```bash
# Check API config file
cat /var/ossec/api/configuration/api.yaml

# Should show:
# host: '0.0.0.0'  (or host: ['0.0.0.0', '::'])
# port: 55000

# Check API security config
ls -la /var/ossec/api/configuration/security/
cat /var/ossec/api/configuration/security/security.yaml
```

### **Step 3: Restart API Service**

```bash
# Method 1: Use wazuh-control
/var/ossec/bin/wazuh-control restart wazuh-api

# Method 2: Use supervisorctl (if using supervisord)
supervisorctl restart wazuh-api

# Method 3: Kill process (s6 will auto-restart)
pkill -f wazuh-apid

# Wait 10 seconds, then check if it restarted
ps aux | grep wazuh-api
```

### **Step 4: Test API Connection**

```bash
# Test API locally (from inside container)
curl -k https://localhost:55000/status \
  -u wazuh:$WAZUH_API_PASSWORD

# Expected response:
# {"data":{"status":"running","version":"4.8.0"}}

# Test from Dashboard (should work if API is up)
# Dashboard connects to: https://localhost:55000
```

### **Step 5: Verify API is Accessible**

```bash
# Check if port is now listening
netstat -tuln | grep 55000
# Should show: tcp 0 0 0.0.0.0:55000 0.0.0.0:* LISTEN

# Test from another Fly app (internal network)
fly ssh console -a ai2-core-app
curl -k https://ai2-wazuh.internal:55000/status \
  -u $WAZUH_API_USER:$WAZUH_API_PASSWORD
```

---

## 🔧 Fix 2: Fix Filebeat Authentication (CRITICAL - Must Fix First)

### **Root Cause:**
Filebeat cannot authenticate to OpenSearch because the password placeholder `${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}` in `filebeat.yml` is not being substituted. Filebeat doesn't support environment variable substitution in YAML files.

### **Step 1: Check Filebeat Authentication Errors**

```bash
# SSH into Wazuh machine
fly ssh console -a ai2-wazuh

# Check Filebeat logs for authentication errors
tail -50 /var/log/filebeat/filebeat | grep -i "401\|unauthorized\|auth"
# Should show: "401 Unauthorized: Unauthorized"

# Check if Filebeat is running
ps aux | grep filebeat
# Should show: filebeat process
```

### **Step 2: Verify Password Substitution Script**

```bash
# Check if password substitution script exists
ls -la /etc/cont-init.d/09-configure-filebeat-password.sh

# If missing, the script needs to be added to the Dockerfile
# The script should substitute ${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}
# with the actual password from environment variable
```

### **Step 3: Manual Password Fix (Temporary)**

If the init script doesn't exist yet, manually fix the password:

```bash
# Get the actual password from environment
echo $OPENSEARCH_INITIAL_ADMIN_PASSWORD
# Should show: actual password (not placeholder)

# Manually edit filebeat.yml
sed -i 's|password:.*|password: "'"$OPENSEARCH_INITIAL_ADMIN_PASSWORD"'"|' /etc/filebeat/filebeat.yml

# Verify the change
grep "password:" /etc/filebeat/filebeat.yml
# Should show: password: "actual-password" (not placeholder)

# Restart Filebeat
supervisorctl restart filebeat

# Wait 10 seconds, then check logs
sleep 10
tail -20 /var/log/filebeat/filebeat
# Should NOT show 401 errors anymore
```

---

## 🔧 Fix 3: Fix Alerts Index Pattern

**Note:** This fix requires Filebeat authentication to be working first (Fix 2).

### **Step 1: Check Filebeat Status**

```bash
# SSH into Wazuh machine
fly ssh console -a ai2-wazuh

# Check if Filebeat is running
ps aux | grep filebeat
# Should show: filebeat process

# Check Filebeat logs (should NOT show 401 errors after Fix 2)
tail -100 /var/log/filebeat/filebeat | grep -i "error\|template\|index"
```

### **Step 2: Check Index Template**

```bash
# Check if template file exists
ls -la /etc/filebeat/wazuh-template.json

# Check if template was created in OpenSearch
curl -k "https://localhost:9200/_index_template/wazuh" \
  -u admin:$OPENSEARCH_INITIAL_ADMIN_PASSWORD

# Check all templates
curl -k "https://localhost:9200/_cat/templates" \
  -u admin:$OPENSEARCH_INITIAL_ADMIN_PASSWORD
```

### **Step 3: Manually Create Template**

If template is missing:

```bash
# Download template if missing
curl -s https://raw.githubusercontent.com/wazuh/wazuh/v4.8.0/extensions/elasticsearch/7.x/wazuh-template.json \
  -o /etc/filebeat/wazuh-template.json

# Create template in OpenSearch
curl -X PUT "https://localhost:9200/_index_template/wazuh-alerts" \
  -k -u admin:$OPENSEARCH_INITIAL_ADMIN_PASSWORD \
  -H "Content-Type: application/json" \
  -d @/etc/filebeat/wazuh-template.json
```

### **Step 4: Restart Filebeat**

```bash
# Restart Filebeat to create templates
supervisorctl restart filebeat

# OR if using systemd
systemctl restart filebeat

# Wait 30 seconds, then check logs
tail -f /var/log/filebeat/filebeat
# Should show: "Template successfully loaded"
```

### **Step 5: Verify Index Pattern**

```bash
# Check if wazuh-alerts-* index exists
curl -k "https://localhost:9200/_cat/indices/wazuh-alerts-*" \
  -u admin:$OPENSEARCH_INITIAL_ADMIN_PASSWORD

# Check index pattern in Dashboard
# Go to: Stack Management > Index Patterns
# Should see: wazuh-alerts-*
```

---

## 🔧 Fix 4: Verify Dashboard Configuration

### **Check Dashboard API Config**

```bash
# Check Dashboard config
cat /usr/share/wazuh-dashboard/config/wazuh.yml

# Should have:
# url: https://localhost:55000
# username: wazuh
# password: (from environment)

# Check if Dashboard can reach API
curl -k https://localhost:55000/status \
  -u wazuh:$WAZUH_API_PASSWORD
```

---

## 🚀 Quick Fix Script

Create a fix script to run all diagnostics and fixes:

```bash
#!/bin/bash
# fix-wazuh-issues.sh

echo "🔍 Diagnosing Wazuh Issues..."

# 1. Check API
echo "1. Checking Wazuh API..."
if ! netstat -tuln | grep -q ":55000.*LISTEN"; then
  echo "   ❌ API not listening on port 55000"
  echo "   🔧 Restarting API..."
  /var/ossec/bin/wazuh-control restart wazuh-api
  sleep 5
  if netstat -tuln | grep -q ":55000.*LISTEN"; then
    echo "   ✅ API restarted successfully"
  else
    echo "   ❌ API still not listening - check logs"
    tail -20 /var/ossec/logs/api.log
  fi
else
  echo "   ✅ API is listening on port 55000"
fi

# 2. Fix Filebeat Password
echo "2. Fixing Filebeat authentication..."
OPENSEARCH_PASSWORD="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"
if grep -q '\${OPENSEARCH_INITIAL_ADMIN_PASSWORD' /etc/filebeat/filebeat.yml 2>/dev/null; then
  echo "   🔧 Substituting password placeholder..."
  sed -i 's|password:.*|password: "'"$OPENSEARCH_PASSWORD"'"|' /etc/filebeat/filebeat.yml
  echo "   ✅ Password configured"
  echo "   🔧 Restarting Filebeat..."
  supervisorctl restart filebeat
  sleep 5
else
  echo "   ✅ Filebeat password already configured"
fi

# 3. Check Filebeat
echo "3. Checking Filebeat..."
if ! ps aux | grep -q "[f]ilebeat"; then
  echo "   ❌ Filebeat not running"
  echo "   🔧 Starting Filebeat..."
  supervisorctl start filebeat
  sleep 5
else
  echo "   ✅ Filebeat is running"
fi

# Check for authentication errors
if tail -20 /var/log/filebeat/filebeat 2>/dev/null | grep -q "401\|Unauthorized"; then
  echo "   ⚠️ Filebeat still showing auth errors - check password"
fi

# 4. Check Index Template
echo "3. Checking index template..."
TEMPLATE_EXISTS=$(curl -s -k -u admin:$OPENSEARCH_INITIAL_ADMIN_PASSWORD \
  "https://localhost:9200/_index_template/wazuh-alerts" | grep -q "wazuh-alerts" && echo "yes" || echo "no")

if [ "$TEMPLATE_EXISTS" = "no" ]; then
  echo "   ❌ Index template missing"
  echo "   🔧 Creating template..."
  if [ -f /etc/filebeat/wazuh-template.json ]; then
    curl -X PUT "https://localhost:9200/_index_template/wazuh-alerts" \
      -k -u admin:$OPENSEARCH_INITIAL_ADMIN_PASSWORD \
      -H "Content-Type: application/json" \
      -d @/etc/filebeat/wazuh-template.json
    echo "   ✅ Template created"
  else
    echo "   ❌ Template file not found at /etc/filebeat/wazuh-template.json"
  fi
else
  echo "   ✅ Index template exists"
fi

echo "✅ Diagnostics complete!"
```

---

## 📋 Verification Checklist

After fixes, verify:

- [ ] API is listening on `0.0.0.0:55000`
- [ ] API responds to `curl https://localhost:55000/status`
- [ ] Dashboard health check shows "API connection" as passing
- [ ] **Filebeat password is substituted** (not placeholder in `/etc/filebeat/filebeat.yml`)
- [ ] **Filebeat logs show NO 401 errors**
- [ ] Filebeat is running
- [ ] Index template `wazuh-alerts` exists in OpenSearch
- [ ] Dashboard health check shows "Alerts index pattern" as passing
- [ ] Can view alerts in Dashboard

---

## 🎯 Root Causes

### **API Connection Failure:**
1. API not binding to `0.0.0.0:55000` (binding to localhost only)
2. API service not running
3. API configuration incorrect
4. API authentication failing

### **Filebeat Authentication Failure:**
1. **Password placeholder not substituted** - `filebeat.yml` has `${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}` which Filebeat cannot resolve
2. Missing init script to substitute password at runtime
3. Filebeat tries to authenticate with literal placeholder string
4. OpenSearch rejects authentication → Filebeat cannot create templates

### **Index Pattern Missing:**
1. **Filebeat authentication failing** (prevents template creation)
2. Filebeat not running
3. Filebeat template creation failed due to auth errors
4. Template file missing
5. OpenSearch connection issue

---

## 🔄 If Fixes Don't Work

### **Option 1: Redeploy Wazuh**

```bash
cd wazuh
fly deploy -a ai2-wazuh
```

### **Option 2: Check Fly Secrets**

```bash
# Verify API credentials are set
fly secrets list -a ai2-wazuh

# Should have:
# WAZUH_API_USER
# WAZUH_API_PASSWORD
# OPENSEARCH_INITIAL_ADMIN_PASSWORD
```

### **Option 3: Check Logs**

```bash
# View all logs
fly logs -a ai2-wazuh

# Filter for errors
fly logs -a ai2-wazuh | grep -i "error\|fail"
```

---

**embracingearth.space - Enterprise Security Monitoring**
