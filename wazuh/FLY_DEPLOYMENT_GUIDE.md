# 🚀 Fly.io Deployment Guide for Wazuh

**Git Root:** `embracingearthspace`  
**Wazuh Directory:** `wazuh/`

---

## 📋 Fly.io Deployment Form Values

### **Organization:**
- ✅ **Personal** (or your organization name)

### **Branch to deploy:**
- ✅ **master** (or **main** - check your default branch)

### **Current Working Directory:**
- ✅ **wazuh**
- **Why:** Your git root is `embracingearthspace`, but Wazuh files are in `wazuh/` subdirectory

### **Config path:**
- ✅ **wazuh/fly.toml**
- **Why:** The `fly.toml` file is located at `wazuh/fly.toml` relative to git root

---

## 🎯 Complete Form Values

```
Organization: Personal
Branch to deploy: master
Current Working Directory: wazuh
Config path: wazuh/fly.toml
```

---

## ⚠️ Important Notes

1. **Current Working Directory** must be `wazuh` because:
   - Git root = `embracingearthspace/`
   - Wazuh files = `embracingearthspace/wazuh/`
   - Fly.io needs to know to run commands from `wazuh/` directory

2. **Config path** must be `wazuh/fly.toml` because:
   - The config file is at `embracingearthspace/wazuh/fly.toml`
   - Fly.io needs the relative path from git root

---

## 🚀 After Deployment

Once deployed, you'll need to:

1. **Set secrets:**
```powershell
fly secrets set -a ai2-wazuh WAZUH_API_USER="wazuh"
fly secrets set -a ai2-wazuh WAZUH_API_PASSWORD="<generate-secure-password>"
```

2. **Create volume:**
```powershell
fly volumes create wazuh_data --size 10 --app ai2-wazuh --region syd
```

3. **Access dashboard:**
- URL: `https://ai2-wazuh.fly.dev:55000`
- Username: `wazuh`
- Password: (from secrets)

---

## ✅ Quick Checklist

- [ ] Organization: Personal
- [ ] Branch: master (or main)
- [ ] Current Working Directory: **wazuh**
- [ ] Config path: **wazuh/fly.toml**
- [ ] Click "Deploy" button
- [ ] Set secrets after deployment
- [ ] Create volume after deployment
- [ ] Test dashboard access

---

**Ready to deploy!** 🚀

