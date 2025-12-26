# 🔒 Wazuh Self-Hosted SIEM/XDR Setup

**embracingearth.space - Enterprise Security Monitoring**

---

## 📦 What is Wazuh?

Wazuh is an open-source security platform that provides:
- ✅ **SIEM** (Security Information and Event Management)
- ✅ **XDR** (Extended Detection and Response)
- ✅ **Threat Detection** - Real-time security monitoring
- ✅ **Compliance** - SOC 2, PCI DSS, GDPR ready
- ✅ **Free** - 100% open source

---

## 🚀 Quick Start

### **1. Deploy Wazuh Server**

```powershell
cd D:\embracingearthspace\wazuh
.\setup-wazuh.ps1
```

**Or manually:**
```powershell
# Create app
fly apps create ai2-wazuh --org embracingearth

# Generate secure password
$wazuhPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Set secrets
fly secrets set -a ai2-wazuh WAZUH_API_USER="wazuh"
fly secrets set -a ai2-wazuh WAZUH_API_PASSWORD="$wazuhPassword"

# Create volume
fly volumes create wazuh_data --size 10 --app ai2-wazuh --region syd

# Deploy
fly deploy --app ai2-wazuh --config fly.toml
```

**⚠️ Save the password!**

---

### **2. Configure Core App**

Set these secrets in `ai2-core-api`:

```powershell
fly secrets set -a ai2-core-api WAZUH_ENABLED="true"
fly secrets set -a ai2-core-api WAZUH_MANAGER_URL="https://ai2-wazuh.fly.dev"
fly secrets set -a ai2-core-api WAZUH_API_USER="wazuh"
fly secrets set -a ai2-core-api WAZUH_API_PASSWORD="<your-password>"
```

---

### **3. Access Dashboard**

- **URL:** `https://ai2-wazuh.fly.dev:55000`
- **Username:** `wazuh`
- **Password:** (from setup)

---

## 📊 What Gets Monitored

- ✅ Failed authentication attempts
- ✅ JWT verification failures
- ✅ Rate limit violations
- ✅ Suspicious activity
- ✅ Credential access (bank connectors)
- ✅ Brute force attacks
- ✅ Authorization failures

---

## 🔧 Files

- `Dockerfile` - Wazuh server container
- `fly.toml` - Fly.io deployment config
- `wazuh.conf` - Wazuh manager configuration
- `local_internal_options.conf` - Internal options
- `setup-wazuh.ps1` - Automated setup script

---

## 📚 Documentation

- **Wazuh Docs:** https://documentation.wazuh.com/
- **Wazuh API:** https://documentation.wazuh.com/current/user-manual/api/index.html

---

## ✅ Status

**Ready for deployment!** 🚀

