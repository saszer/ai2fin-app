# 🚀 Quick Start: Deploy Connectors Service

**Repository:** https://github.com/saszer/ai2fin-app/tree/master/ai2-connectors

---

## ⚡ **3-Step Deployment**

### **1. Navigate to Connectors Directory**

```powershell
cd "Z:\ai2fin graphigxs\MAIN\embracingearthspace\ai2-connectors"
```

### **2. Set Required Secrets**

```powershell
fly secrets set JWT_SECRET="your-jwt-secret" `
  CORE_APP_URL="https://ai2-core-api.fly.dev" `
  SERVICE_SECRET="your-service-secret" `
  FRONTEND_URL="https://your-frontend-domain.com" `
  BASIQ_API_KEY="your-basiq-key" `
  APIDECK_API_KEY="your-apideck-key" `
  APIDECK_APP_ID="your-apideck-app-id"
```

### **3. Deploy**

```powershell
fly deploy
```

---

## ✅ **Verify Deployment**

```powershell
# Check status
fly status

# View logs
fly logs

# Test health endpoint
fly curl /health
```

---

## 🔗 **Update Core App**

After deployment, update core app to use connectors service:

```powershell
cd "Z:\ai2fin graphigxs\MAIN\embracingearthspace\ai2-core-app"
fly secrets set CONNECTORS_URL="https://ai2-connectors.fly.dev"
fly secrets set CONNECTORS_PORT="443"
```

---

**Full guide:** See `DEPLOYMENT_GUIDE.md` for detailed instructions.

**embracingearth.space - Enterprise deployment**

