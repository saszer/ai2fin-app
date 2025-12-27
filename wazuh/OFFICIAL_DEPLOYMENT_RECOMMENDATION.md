# 🎯 Official Wazuh Deployment Recommendation - With Dashboard

**Date:** 2025-12-27  
**Based on:** [Official Wazuh Documentation](https://documentation.wazuh.com/current/deployment-options/index.html)

---

## 📊 **Official Wazuh Deployment Options**

According to the [official Wazuh documentation](https://documentation.wazuh.com/current/deployment-options/index.html), there are several deployment options:

### **1. All-in-One Deployment** ✅ **RECOMMENDED for Your Use Case**

**What it is:**
- All components (Manager + Indexer + Dashboard) on a single host
- Suitable for monitoring up to 100 endpoints
- Retains ~90 days of alert data
- Simplifies management

**Official Docker Images:**
- `wazuh/wazuh-manager:4.8.0` ✅ (we have this)
- `wazuh/wazuh-indexer:4.8.0` (need to add)
- `wazuh/wazuh-dashboard:4.8.0` (need to add)

**Resource Requirements:**
- Manager: ~1GB RAM
- Indexer: ~2GB RAM
- Dashboard: ~1GB RAM
- **Total: ~4GB RAM minimum**

---

### **2. Distributed Deployment**

**What it is:**
- Each component on separate servers
- Better for larger environments
- Higher performance and scalability

**For Fly.io:** Would require 3 separate apps (more complex)

---

### **3. Docker Compose** ✅ EASIEST APPROACH**

**Official Wazuh provides Docker Compose files** that set up all components automatically!

**Reference:** [Wazuh Docker Deployment](https://documentation.wazuh.com/current/deployment-options/docker/docker-deployment.html)

---

## 🎯 **Recommended Approach for Fly.io**

### **Option 1: Single App with Multiple Processes** ⚠️ **Complex**

**Pros:**
- Single deployment
- Shared networking

**Cons:**
- Fly.io doesn't easily support multiple Docker containers in one app
- Resource allocation is tricky
- Health checks become complex

**Verdict:** ❌ Not recommended for Fly.io

---

### **Option 2: Separate Apps (Manager + Indexer + Dashboard)** ✅ **RECOMMENDED**

**Architecture:**
```
ai2-wazuh-manager.fly.dev (Manager + API)
    ↓
ai2-wazuh-indexer.fly.dev (Elasticsearch)
    ↓
ai2-wazuh-dashboard.fly.dev (Kibana Dashboard)
```

**Pros:**
- ✅ Clean separation of concerns
- ✅ Independent scaling
- ✅ Easier to manage
- ✅ Follows official distributed architecture

**Cons:**
- ⚠️ 3 separate deployments
- ⚠️ More complex networking

**Verdict:** ✅ **Best for production**

---

### **Option 3: Use Official Docker Compose Locally, Deploy to Fly.io** ✅ **BALANCED**

**Approach:**
1. Use official Wazuh Docker Compose as reference
2. Adapt for Fly.io deployment
3. Deploy as single app with all components

**Pros:**
- ✅ Uses official configuration
- ✅ All components together
- ✅ Easier networking

**Cons:**
- ⚠️ Need to adapt Docker Compose to Fly.io
- ⚠️ Higher resource requirements

**Verdict:** ✅ **Good middle ground**

---

## 🚀 **Recommended Implementation: Option 3**

### **Step 1: Get Official Docker Compose**

**Official Wazuh Docker Compose:**
```bash
# Download official Wazuh Docker Compose
curl -sO https://raw.githubusercontent.com/wazuh/wazuh-docker/v4.8.0/docker-compose.yml
```

**Or use official repository:**
- https://github.com/wazuh/wazuh-docker

---

### **Step 2: Adapt for Fly.io**

**Key Changes Needed:**
1. **Single Dockerfile** that builds all components
2. **Or use multi-stage build** with all services
3. **Configure networking** between components
4. **Set up volumes** for data persistence

---

### **Step 3: Resource Planning**

**Fly.io VM Requirements:**
- **Memory:** 4GB minimum (recommend 8GB)
- **CPU:** 2 CPUs minimum
- **Storage:** 20GB+ volume for Indexer data

**Current Fly.io Limits:**
- ✅ Memory: Up to 8GB per VM
- ✅ CPU: Up to 8 CPUs
- ✅ Storage: Volumes supported

---

## 📋 **Implementation Plan**

### **Phase 1: Add Indexer** (Required for Dashboard)

**Create:** `wazuh-indexer/Dockerfile`
```dockerfile
FROM wazuh/wazuh-indexer:4.8.0
# Configure indexer
```

**Create:** `wazuh-indexer/fly.toml`
```toml
app = "ai2-wazuh-indexer"
internal_port = 9200
```

---

### **Phase 2: Add Dashboard** (What You Want)

**Create:** `wazuh-dashboard/Dockerfile`
```dockerfile
FROM wazuh/wazuh-dashboard:4.8.0
# Configure dashboard to connect to indexer
```

**Create:** `wazuh-dashboard/fly.toml`
```toml
app = "ai2-wazuh-dashboard"
internal_port = 5601
```

---

### **Phase 3: Update Manager** (Connect to Indexer)

**Update:** `wazuh/wazuh.conf`
```xml
<indexer>
  <enabled>yes</enabled>
  <hosts>
    <host>https://ai2-wazuh-indexer.fly.dev:9200</host>
  </hosts>
</indexer>
```

---

## 🎯 **Simpler Alternative: Use Official Docker Compose**

### **Best Approach: Use Official Wazuh Docker Compose**

**Official Wazuh provides a complete Docker Compose setup:**

1. **Download official compose file:**
   ```bash
   git clone https://github.com/wazuh/wazuh-docker.git
   cd wazuh-docker
   ```

2. **Use as reference** for Fly.io deployment

3. **Or deploy locally** and connect to Fly.io Manager

---

## ✅ **Recommended Solution: Hybrid Approach**

### **Keep Current Manager, Add Dashboard via Wazuh Cloud**

**Why this is best:**
- ✅ **No additional deployment** needed
- ✅ **Managed service** (always up-to-date)
- ✅ **Lower resource usage** on Fly.io
- ✅ **Easier to maintain**

**How it works:**
1. Keep current Manager deployment ✅
2. Sign up for Wazuh Cloud (free tier available)
3. Connect Manager to Wazuh Cloud
4. Access dashboard via Wazuh Cloud

**Reference:** https://wazuh.com/cloud/

---

## 📊 **Comparison**

| Approach | Complexity | Resources | Dashboard | Maintenance |
|----------|-----------|-----------|-----------|-------------|
| **Current (Manager only)** | ✅ Low | ✅ 1GB | ❌ No | ✅ Easy |
| **Full Stack (3 apps)** | ⚠️ High | ⚠️ 4GB+ | ✅ Yes | ⚠️ Complex |
| **Docker Compose (1 app)** | ⚠️ Medium | ⚠️ 4GB+ | ✅ Yes | ⚠️ Medium |
| **Wazuh Cloud** | ✅ Low | ✅ 1GB | ✅ Yes | ✅ Easy |

---

## 🎯 **Final Recommendation**

### **For Your Use Case (Need Dashboard):**

**Option A: Wazuh Cloud** ✅ **BEST**
- ✅ Easiest to set up
- ✅ No additional deployment
- ✅ Managed dashboard
- ✅ Free tier available

**Option B: Deploy Full Stack** ⚠️ **If you need self-hosted**
- Deploy Indexer + Dashboard as separate apps
- More complex but fully self-hosted
- Follow official Docker deployment guide

---

## 📚 **Official References**

1. **Docker Deployment:** https://documentation.wazuh.com/current/deployment-options/docker/docker-deployment.html
2. **Docker Repository:** https://github.com/wazuh/wazuh-docker
3. **Installation Guide:** https://documentation.wazuh.com/current/installation-guide/index.html
4. **Wazuh Cloud:** https://wazuh.com/cloud/

---

**Next Step:** Choose Option A (Wazuh Cloud) for easiest setup, or Option B (Full Stack) for self-hosted!

