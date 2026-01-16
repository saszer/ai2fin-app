# 🔒 Wazuh Local Development Setup

**embracingearth.space - Enterprise Security Monitoring**

Run Wazuh Manager, Indexer, and Dashboard locally using Docker Compose.

---

## 🚀 Quick Start

### **1. Prerequisites**

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)
- PowerShell (Windows) or Bash (Linux/Mac)

### **2. Setup Environment**

```powershell
# Navigate to wazuh directory
cd wazuh

# Copy environment template
Copy-Item .env.example .env

# Edit .env and set your passwords
notepad .env
```

**Required Environment Variables:**
- `WAZUH_API_USER` - Username for Wazuh API (default: `szsah`)
- `WAZUH_API_PASSWORD` - Secure password for Wazuh API
- `OPENSEARCH_INITIAL_ADMIN_PASSWORD` - OpenSearch admin password (default: `admin`)
- `OPENSEARCH_DASHBOARDS_PASSWORD` - Dashboard user password (default: `kibanaserver`)

### **3. Start Wazuh**

**Windows (PowerShell):**
```powershell
.\start-wazuh-local.ps1
```

**Linux/Mac (Bash):**
```bash
docker-compose -f docker-compose.local.yml up -d
```

**First startup takes 5-10 minutes** (Indexer initialization)

---

## 📊 Access Points

Once services are running:

- **Dashboard UI**: http://localhost:5601
  - Username: `szsah` (or value from `WAZUH_API_USER`)
  - Password: Value from `WAZUH_API_PASSWORD` in `.env`

- **Manager API**: https://localhost:55000
  - Username: `szsah` (or value from `WAZUH_API_USER`)
  - Password: Value from `WAZUH_API_PASSWORD` in `.env`

- **Indexer API**: https://localhost:9200
  - Username: `admin`
  - Password: Value from `OPENSEARCH_INITIAL_ADMIN_PASSWORD` in `.env`

---

## 🛠️ Management Commands

### **View Logs**
```powershell
# All services
docker-compose -f docker-compose.local.yml logs -f

# Specific service
docker-compose -f docker-compose.local.yml logs -f wazuh-manager
docker-compose -f docker-compose.local.yml logs -f wazuh-indexer
docker-compose -f docker-compose.local.yml logs -f wazuh-dashboard
```

### **Check Status**
```powershell
docker-compose -f docker-compose.local.yml ps
```

### **Stop Services**
```powershell
docker-compose -f docker-compose.local.yml down
```

### **Stop and Remove Data (Clean Start)**
```powershell
docker-compose -f docker-compose.local.yml down -v
```

### **Restart Services**
```powershell
docker-compose -f docker-compose.local.yml restart
```

---

## 🏗️ Architecture

The local setup runs 4 services:

1. **wazuh-manager** - Core security monitoring engine
   - Ports: 55000 (API), 1514 (Agents), 1515 (Enrollment)
   - Data: `wazuh-manager-data` volume

2. **wazuh-indexer** - OpenSearch for event storage
   - Ports: 9200 (API), 9300 (Transport)
   - Data: `wazuh-indexer-data` volume
   - **Takes 5-10 minutes to initialize on first start**

3. **wazuh-dashboard** - Web UI for security monitoring
   - Port: 5601 (UI)
   - Data: `wazuh-dashboard-data` volume

4. **filebeat** - Ships alerts from Manager to Indexer
   - No exposed ports (internal only)

All services communicate via `wazuh-network` Docker network.

---

## 🔐 Security Notes

- **Credentials**: Never commit `.env` file to git (already in `.gitignore`)
- **API Access**: Manager API uses HTTPS with self-signed certificates
- **Network**: Services communicate on internal Docker network
- **Data Persistence**: All data stored in Docker volumes

---

## 🐛 Troubleshooting

### **Services won't start**

1. Check Docker is running:
   ```powershell
   docker info
   ```

2. Check for port conflicts:
   ```powershell
   netstat -ano | findstr "55000 5601 9200"
   ```

3. View service logs:
   ```powershell
   docker-compose -f docker-compose.local.yml logs
   ```

### **Indexer taking too long**

- Normal: Indexer takes 5-10 minutes on first start
- Check logs: `docker-compose -f docker-compose.local.yml logs wazuh-indexer`
- Wait for health check: `docker inspect wazuh-indexer | findstr Health`

### **Dashboard can't connect to Manager**

1. Verify Manager is healthy:
   ```powershell
   docker inspect wazuh-manager | findstr Health
   ```

2. Check Manager API:
   ```powershell
   curl -k https://localhost:55000 -u szsah:YOUR_PASSWORD
   ```

3. Verify credentials in `.env` match

### **Reset Everything**

```powershell
# Stop and remove all containers and volumes
docker-compose -f docker-compose.local.yml down -v

# Remove network
docker network rm wazuh-network

# Start fresh
.\start-wazuh-local.ps1
```

---

## 📚 Next Steps

1. **Access Dashboard**: http://localhost:5601
2. **Configure Agents**: See `wazuh-agent-setup.md`
3. **Send Events**: Configure your apps to send events to `https://localhost:55000`
4. **View Alerts**: Check Dashboard for security events

---

## 🔄 Integration with Core App

To connect `ai2-core-api` to local Wazuh:

```powershell
# Set environment variables in your core app
$env:WAZUH_ENABLED = "true"
$env:WAZUH_MANAGER_URL = "https://localhost:55000"
$env:WAZUH_API_USER = "szsah"
$env:WAZUH_API_PASSWORD = "<your-password-from-.env>"
```

**Note**: If running in Docker, use `host.docker.internal` instead of `localhost`:
```powershell
$env:WAZUH_MANAGER_URL = "https://host.docker.internal:55000"
```

---

**embracingearth.space** - Enterprise-grade security monitoring 🔒
