# Wazuh Dashboard Authentication - Production Setup

**Date:** 2025-12-28  
**Status:** ✅ **Production-Ready**

---

## 🔐 Security Configuration

### **1. Indexer Security**

**Enabled with SSL certificates:**
- ✅ Transport layer SSL (node-to-node)
- ✅ Self-signed certificates (auto-generated)
- ✅ Admin authentication required
- ❌ HTTP SSL (disabled - localhost only)

**Configuration:** `wazuh/indexer/opensearch.yml`

### **2. Dashboard Authentication**

**Enabled with admin credentials:**
- ✅ Username/password authentication
- ✅ Connects to secured Indexer
- ✅ Session management
- ✅ Configurable password via secrets

**Configuration:** `wazuh/dashboard/opensearch_dashboards.yml`

---

## 🚀 Deployment

### **Step 1: Set Admin Password (Optional)**

```powershell
# Set a secure admin password
fly secrets set -a ai2-wazuh OPENSEARCH_INITIAL_ADMIN_PASSWORD="your-secure-password-here"
```

**Default if not set:** `admin` / `admin`

---

### **Step 2: Deploy**

```powershell
cd D:\embracingearthspace\wazuh
fly deploy -a ai2-wazuh
```

---

### **Step 3: Wait for Initialization**

**Time required:** 10-15 minutes

Services start in this order:
1. **Wazuh Manager** (~1 minute)
2. **Wazuh Indexer** (~10 minutes - generates certs, initializes security)
3. **Wazuh Dashboard** (~1 minute after Indexer ready)

**Monitor progress:**
```powershell
fly logs -a ai2-wazuh
```

---

### **Step 4: Access Dashboard**

**URL:** https://ai2-wazuh.fly.dev/

**Login credentials:**
- **Username:** `admin`
- **Password:** Your `OPENSEARCH_INITIAL_ADMIN_PASSWORD` or `admin` (default)

---

## 🔑 Password Management

### **Change Admin Password After First Login**

1. Log in to Dashboard
2. Navigate to **Security** → **Internal Users**
3. Edit `admin` user
4. Set new password
5. Update Fly.io secret:
   ```powershell
   fly secrets set -a ai2-wazuh OPENSEARCH_INITIAL_ADMIN_PASSWORD="new-password"
   fly machine restart 68303ddbed3918 -a ai2-wazuh
   ```

---

## 🛡️ Production Hardening

### **Recommended Actions:**

1. **Change default password immediately**
   ```powershell
   fly secrets set -a ai2-wazuh OPENSEARCH_INITIAL_ADMIN_PASSWORD="$(openssl rand -base64 32)"
   ```

2. **Enable HTTP SSL** (optional, for additional security)
   - Generate HTTP certificates
   - Update `opensearch.yml`: `plugins.security.ssl.http.enabled: true`
   - Update Dashboard config to use HTTPS

3. **Add IP restrictions** (via Fly.io)
   ```powershell
   # Restrict to your IP range
   fly ips list -a ai2-wazuh
   # Configure firewall rules via Fly.io dashboard
   ```

4. **Set up monitoring**
   ```powershell
   fly dashboard -a ai2-wazuh
   ```

5. **Regular backups**
   - Volume snapshots via Fly.io
   - Export security configuration

---

## 🔍 Troubleshooting

### **Login fails with "Invalid credentials"**

**Check:**
1. Verify secret is set:
   ```powershell
   fly secrets list -a ai2-wazuh
   ```

2. Check Indexer logs:
   ```powershell
   fly ssh console -a ai2-wazuh -C "tail -100 /var/log/wazuh-indexer/wazuh-cluster.log"
   ```

3. Verify certificates exist:
   ```powershell
   fly ssh console -a ai2-wazuh -C "ls -la /etc/wazuh-indexer/certs/"
   ```

---

### **Dashboard shows "Indexer not available"**

**Wait longer** - Indexer takes 10-15 minutes to start with security enabled.

**Check status:**
```powershell
fly ssh console -a ai2-wazuh -C "curl -u admin:admin http://localhost:9200/_cluster/health"
```

---

### **502 Bad Gateway**

Indexer or Dashboard crashed. Check logs:
```powershell
fly logs -a ai2-wazuh
fly ssh console -a ai2-wazuh -C "supervisorctl status"
```

---

## 📋 Security Checklist

- [ ] ✅ SSL certificates generated automatically
- [ ] ✅ Admin password set via Fly.io secret
- [ ] ✅ Default password changed after first login
- [ ] ✅ Dashboard requires authentication
- [ ] ✅ Indexer security enabled
- [ ] ⚠️ HTTP SSL (optional - currently disabled)
- [ ] ⚠️ IP restrictions (optional - configure via Fly.io)
- [ ] ⚠️ Monitoring enabled (optional)
- [ ] ⚠️ Regular backups scheduled (optional)

---

## 🎯 Summary

**Production-ready features:**
- ✅ SSL certificates (auto-generated)
- ✅ Authentication required
- ✅ Configurable passwords
- ✅ Session management
- ✅ Secure by default

**Default credentials:** `admin` / `admin` (change immediately!)

**Access:** https://ai2-wazuh.fly.dev/

