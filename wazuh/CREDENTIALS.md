# 🔒 Wazuh Security - Credentials Management

## ⚠️ **IMPORTANT: NO HARDCODED CREDENTIALS**

**Repository Status**: ✅ **PUBLIC-SAFE**

All credentials are managed via **Fly.io secrets**, never hardcoded.

---

## 🔐 **Current Configuration**

### **Wazuh Manager API**
- **Username**: `szsah` (set via `WAZUH_API_USER` secret)
- **Password**: (set via `WAZUH_API_PASSWORD` secret)

### **Set Secrets Command:**
```bash
# For ai2-wazuh (Wazuh Manager)
fly secrets set WAZUH_API_USER=szsah -a ai2-wazuh
fly secrets set WAZUH_API_PASSWORD=<your-secure-password> -a ai2-wazuh

# For ai2-core-api (sends events to Wazuh)
fly secrets set WAZUH_API_USER=szsah -a ai2-core-api  
fly secrets set WAZUH_API_PASSWORD=<your-secure-password> -a ai2-core-api
fly secrets set WAZUH_ENABLED=true -a ai2-core-api
```

---

## 🛡️ **How It Works**

1. **Template-based Config**: `wazuh/config/wazuh.yml.template` contains placeholders
2. **Runtime Injection**: `wazuh/cont-init.d/10-configure-dashboard.sh` reads secrets
3. **User Creation**: `wazuh/cont-init.d/11-create-api-user.sh` creates the API user
4. **No Git Commits**: `.gitignore` blocks all credential files

---

## ✅ **Security Checklist**

- ✅ No hardcoded passwords in repository
- ✅ All credentials via Fly secrets
- ✅ Template-based configuration
- ✅ Runtime credential injection
- ✅ `.gitignore` protection active
- ✅ Documentation uses placeholders only

---

## 🔄 **Rotating Credentials**

```bash
# Generate new password
NEW_PASS=$(openssl rand -base64 32)

# Update all secrets
fly secrets set WAZUH_API_PASSWORD=$NEW_PASS -a ai2-wazuh
fly secrets set WAZUH_API_PASSWORD=$NEW_PASS -a ai2-core-api

# Restart apps
fly apps restart ai2-wazuh ai2-core-api
```

---

## 📋 **Username: `szsah` (NOT `wazuh`)**

You set `szsah` as the username everywhere else. The Wazuh integration respects this:
- Init script creates user `szsah` (from `WAZUH_API_USER`)
- Dashboard connects with `szsah` (from `WAZUH_API_USER`)
- ai2-core-api sends events as `szsah` (from `WAZUH_API_USER`)

**Consistent across all services!** ✅

---

**embracingearth.space** - Secure by design 🔒
