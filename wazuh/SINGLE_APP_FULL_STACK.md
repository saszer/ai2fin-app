# 🎯 Single Fly.io App - Full Stack Deployment

**Date:** 2025-12-27  
**Question:** Can we run Manager + Indexer + Dashboard in ONE Fly.io app?

---

## ✅ **YES! Single App is Possible and CHEAPER**

### **How It Works:**

**Single Docker Container with All Services:**
- Manager (port 55000) - internal
- Indexer (port 9200) - internal  
- Dashboard (port 5601) - **exposed via Fly.io**

**Architecture:**
```
Single Fly.io App (ai2-wazuh)
├── Manager (localhost:55000) - API
├── Indexer (localhost:9200) - Elasticsearch
└── Dashboard (localhost:5601) - Web UI (exposed)
```

**Fly.io exposes:** Dashboard only (port 5601)  
**Internal networking:** All services on localhost

---

## 💰 **Cost Comparison**

### **Option 1: Single Fly.io App** ✅ **CHEAPEST**

**Resources:**
- 4GB RAM, 4 CPUs
- Single app
- Single volume

**Cost:**
- **Full time:** ~$50-60/month
- **With auto-stop:** ~$25-30/month (50% savings)
- **Storage (20GB):** ~$3/month
- **Total: ~$28-33/month**

---

### **Option 2: Three Separate Fly.io Apps**

**Resources:**
- Manager: 1GB RAM
- Indexer: 2GB RAM
- Dashboard: 1GB RAM

**Cost:**
- Manager: ~$15/month
- Indexer: ~$30/month
- Dashboard: ~$15/month
- Storage: ~$3/month
- **Total: ~$63/month**

**With auto-stop:** ~$35-40/month

---

### **Option 3: AWS EC2**

**Resources:**
- Single instance: t3.large (8GB RAM, 2 vCPU)

**Cost:**
- **On-demand:** ~$60/month
- **Reserved (1-year):** ~$40/month
- **Spot instances:** ~$20/month (risky)

---

## 🏆 **Winner: Single Fly.io App**

**Cost Savings:**
- ✅ **~$30/month cheaper** than 3 separate apps
- ✅ **~$10/month cheaper** than AWS (with auto-stop)
- ✅ **Simpler** - one deployment

---

## 🛠️ **Implementation: Single App Full Stack**

### **Approach: Multi-Service Docker Container**

**Use s6-overlay or supervisord** to run all three services in one container.

**Dockerfile Structure:**
```dockerfile
FROM wazuh/wazuh-manager:4.8.0 as manager
FROM wazuh/wazuh-indexer:4.8.0 as indexer
FROM wazuh/wazuh-dashboard:4.8.0 as dashboard

# Combine all three into one image
# Use s6-overlay to manage all services
```

**Or use official Wazuh Docker Compose approach:**
- Download official Wazuh Docker Compose
- Adapt to single container
- Use process manager (supervisord/s6)

---

## 📋 **Updated fly.toml for Full Stack**

```toml
app = "ai2-wazuh"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"  # Multi-service Dockerfile

[http_service]
  internal_port = 5601        # Dashboard port (exposed)
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = "4gb"              # Full stack needs 4GB
  cpu_kind = "shared"
  cpus = 2                    # 2 CPUs for better performance

[mounts]
  source = "wazuh_data"
  destination = "/var/ossec/data"
```

---

## ✅ **What I Can Do**

### **Single App Full Stack** ✅ **BEST OPTION**

**I can:**
1. ✅ Create multi-service Dockerfile (Manager + Indexer + Dashboard)
2. ✅ Use s6-overlay or supervisord to manage all services
3. ✅ Configure internal networking (localhost)
4. ✅ Expose Dashboard on port 5601
5. ✅ Update fly.toml for full stack
6. ✅ Test all services

**Time:** 3-4 hours  
**Complexity:** Medium  
**Confidence:** High (Docker is my strength)

---

## 🎯 **Final Recommendation**

### **Single Fly.io App - Full Stack** ✅ **BEST**

**Why:**
1. ✅ **Cheapest option** (~$28/month with auto-stop)
2. ✅ **Simpler** - one deployment
3. ✅ **I can do this properly** - Docker multi-service
4. ✅ **Easier maintenance** - one app to manage
5. ✅ **Cost-effective** - ~$10/month cheaper than AWS

**Cost Breakdown:**
- **Single app (4GB):** ~$50/month full-time
- **With auto-stop:** ~$25/month (50% savings)
- **Storage:** ~$3/month
- **Total: ~$28/month** ✅

**vs AWS:**
- AWS: ~$32/month (on-demand)
- AWS Reserved: ~$25/month (1-year commitment)
- **Fly.io: ~$28/month** (no commitment, auto-stop)

---

## 🚀 **Next Steps**

**If you choose Single App Full Stack:**

1. I'll create multi-service Dockerfile
2. Configure all three services (Manager, Indexer, Dashboard)
3. Update fly.toml for full stack
4. Test deployment
5. **Cost: ~$28/month** ✅

**Ready to proceed?** This is the cheapest and simplest option! 🎯

