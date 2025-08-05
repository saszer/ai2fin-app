# 🚀 Cluster Mode Performance Guide

## Overview

AI2 Enterprise Platform includes a sophisticated cluster mode implementation designed for high-performance deployments. This guide helps you understand when and how to use cluster mode effectively.

## 🎯 Understanding Cluster Mode

### What is Cluster Mode?

Cluster mode leverages Node.js's built-in cluster module to spawn multiple worker processes, each running on a separate CPU core. This allows the application to handle multiple requests simultaneously and maximize CPU utilization.

### AI2's Cluster Implementation

```javascript
// Cluster configuration options
{
  workers: 4-8,              // Number of worker processes
  memoryLimit: 4096MB,       // Per-worker memory allocation
  respawnLimit: 15,          // Auto-restart failed workers
  healthCheckInterval: 15s,  // Worker health monitoring
  gcInterval: 60s           // Garbage collection optimization
}
```

## 📊 Performance Scaling Phases

### Phase 1: Development Mode
- **Workers**: 1 (no clustering)
- **Memory**: 512MB
- **Use Case**: Local development, testing

### Phase 2: Cluster Mode
- **Workers**: 4
- **Memory**: 2GB per worker
- **Use Case**: Single server deployment
- **Capacity**: ~300 req/s

### Phase 3: Database Mode
- **Workers**: 6
- **Memory**: 4GB per worker
- **Features**: PostgreSQL + Redis
- **Capacity**: ~1000 req/s

### Phase 4: Enterprise Mode
- **Workers**: 8
- **Memory**: 8GB per worker
- **Features**: Full platform, multi-region
- **Capacity**: ~5000 req/s

## 🔍 When to Use Cluster Mode

### ✅ Use Cluster Mode When:

1. **Self-Hosted/VPS Deployment**
   - Running on dedicated servers
   - Have 4+ CPU cores available
   - Need to maximize single-server performance

2. **High CPU Workloads**
   - Heavy AI processing
   - Complex financial calculations
   - Large CSV processing

3. **Predictable Traffic**
   - Consistent load patterns
   - Known peak hours
   - Internal enterprise use

### ❌ Avoid Cluster Mode When:

1. **Using Fly.io or Similar PaaS**
   - Platform handles horizontal scaling
   - Each instance should be single-process
   - Let the platform manage distribution

2. **Memory-Constrained Environments**
   - Less than 4GB total RAM
   - Shared hosting environments
   - Development machines

3. **I/O Bound Workloads**
   - Primarily database operations
   - File upload/download heavy
   - Minimal CPU processing

## 🚀 Deployment Recommendations

### For Fly.io Deployment (Recommended)

```toml
# fly.toml
[[vm]]
  memory = "512mb"  # Single process per instance
  cpus = 1

# Scale horizontally instead
flyctl scale count 4 --app ai2-production
flyctl autoscale balanced min=2 max=10
```

**Why?** Fly.io automatically distributes instances across regions and handles load balancing. Running cluster mode inside Fly.io instances would be redundant and wasteful.

### For VPS/Dedicated Server

```bash
# Enable cluster mode with optimal workers
export CLUSTER_MODE=true
export CLUSTER_WORKERS=4  # Match CPU cores
npm run start:enterprise
```

**Why?** Maximizes single-server performance by utilizing all CPU cores.

### For Kubernetes

```yaml
# deployment.yaml
spec:
  replicas: 4  # Multiple pods
  containers:
    - name: ai2-app
      env:
        - name: CLUSTER_MODE
          value: "false"  # Single process per pod
```

**Why?** Kubernetes handles scaling at the pod level, similar to Fly.io.

## 📈 Performance Benchmarks

### Single Process Mode
- **Requests/sec**: 75-100
- **Latency p99**: 200ms
- **Memory**: 512MB
- **CPU**: 1 core at 60%

### Cluster Mode (4 workers)
- **Requests/sec**: 300-400
- **Latency p99**: 150ms
- **Memory**: 2GB total
- **CPU**: 4 cores at 70%

### Cluster Mode (8 workers)
- **Requests/sec**: 600-800
- **Latency p99**: 100ms
- **Memory**: 4GB total
- **CPU**: 8 cores at 75%

## 🔧 Configuration Examples

### Development Setup
```bash
# No clustering, minimal resources
npm run start:core:standalone
```

### Production - Fly.io
```bash
# Single process per instance
CLUSTER_MODE=false npm start

# Scale horizontally
flyctl scale count 4
flyctl scale memory 512
```

### Production - VPS
```bash
# Full cluster mode
CLUSTER_MODE=true CLUSTER_WORKERS=8 npm run start:enterprise
```

### Production - Docker
```dockerfile
# Dockerfile
ENV CLUSTER_MODE=false  # Let orchestrator handle scaling
CMD ["node", "dist/server.js"]
```

## 🎯 Best Practices

### 1. **Monitor Resource Usage**
```bash
# Check worker health
curl http://localhost:3001/health/workers

# Monitor memory per worker
npm run monitor:cluster
```

### 2. **Graceful Shutdown**
```javascript
// Handled automatically in cluster.js
process.on('SIGTERM', gracefulShutdown);
```

### 3. **Session Management**
- Use Redis for session storage in cluster mode
- Sticky sessions not required with proper session store

### 4. **Load Testing**
```bash
# Test cluster performance
npm run test:load -- --workers 4 --duration 60s
```

## 🚨 Common Issues

### Issue: High Memory Usage
**Solution**: Reduce workers or memory per worker
```bash
CLUSTER_WORKERS=4 MEMORY_LIMIT=1024 npm start
```

### Issue: Worker Crashes
**Solution**: Check logs and increase respawn limit
```bash
DEBUG=cluster:* npm start
```

### Issue: Uneven Load Distribution
**Solution**: Ensure proper load balancing
```javascript
// Already handled by Node.js cluster module
```

## 📊 Monitoring & Metrics

### Health Check Endpoint
```bash
GET /health
{
  "status": "healthy",
  "cluster": {
    "mode": true,
    "workers": 4,
    "active": 4,
    "memory": {
      "total": "2048MB",
      "used": "1536MB"
    }
  }
}
```

### Performance Metrics
- Worker CPU usage
- Memory per worker
- Request distribution
- Response times per worker

## 🎯 Decision Matrix

| Deployment Type | Cluster Mode | Workers | Scaling Method |
|----------------|--------------|---------|----------------|
| Fly.io | ❌ No | 1 | Horizontal (instances) |
| Kubernetes | ❌ No | 1 | Horizontal (pods) |
| VPS/Dedicated | ✅ Yes | 4-8 | Vertical (workers) |
| AWS ECS | ❌ No | 1 | Horizontal (tasks) |
| Docker Swarm | ❌ No | 1 | Horizontal (replicas) |
| Bare Metal | ✅ Yes | CPU cores | Vertical (workers) |

## 💡 Summary

**For Cloud Platforms (Fly.io, Kubernetes, ECS):**
- Disable cluster mode
- Single process per container/instance
- Scale horizontally via platform

**For Traditional Hosting (VPS, Dedicated Servers):**
- Enable cluster mode
- Workers = CPU cores
- Monitor resource usage closely

**Key Takeaway**: Let your infrastructure platform handle scaling when possible. Only use cluster mode when you need to maximize single-server performance.

---

**Performance matters, but so does simplicity. Choose the right tool for your deployment scenario.** 🚀