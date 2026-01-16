# 🚀 Wazuh Local - Quick Start Guide

**embracingearth.space - Get Wazuh running locally in 5 minutes**

---

## ⚡ Quick Start (3 Steps)

### **1. Setup Environment**

```powershell
cd wazuh
Copy-Item .env.example .env
# Edit .env and set WAZUH_API_PASSWORD (or let script generate it)
```

### **2. Start Wazuh**

```powershell
.\start-wazuh-local.ps1
```

**First start takes 5-10 minutes** (Indexer initialization)

### **3. Access Dashboard**

- **URL**: http://localhost:5601
- **Username**: `szsah` (or your `WAZUH_API_USER`)
- **Password**: From `.env` file (`WAZUH_API_PASSWORD`)

---

## ✅ What Gets Started

1. **Wazuh Manager** (port 55000) - Security monitoring engine
2. **Wazuh Indexer** (port 9200) - Event storage (OpenSearch)
3. **Wazuh Dashboard** (port 5601) - Web UI
4. **Filebeat** - Ships alerts to Indexer

---

## 📋 Common Commands

```powershell
# View logs
docker-compose -f docker-compose.local.yml logs -f

# Stop services
docker-compose -f docker-compose.local.yml down

# Restart services
docker-compose -f docker-compose.local.yml restart

# Check status
docker-compose -f docker-compose.local.yml ps
```

---

## 🔧 Troubleshooting

**Services won't start?**
- Check Docker is running: `docker info`
- Check ports aren't in use: `netstat -ano | findstr "55000 5601 9200"`

**Dashboard can't connect?**
- Wait 5-10 minutes for Indexer to initialize
- Check logs: `docker-compose -f docker-compose.local.yml logs wazuh-indexer`

**Reset everything:**
```powershell
docker-compose -f docker-compose.local.yml down -v
.\start-wazuh-local.ps1
```

---

## 📚 Full Documentation

See `README_LOCAL.md` for complete documentation.

---

**embracingearth.space** - Enterprise Security Monitoring 🔒
