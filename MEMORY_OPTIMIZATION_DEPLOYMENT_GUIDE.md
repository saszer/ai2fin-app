# Memory Optimization Deployment Guide
# Comprehensive guide to fix OOM crashes and optimize memory usage

##  CRITICAL: Memory Optimization for AI2 Core App

### Problem Analysis
- **OOM Crash**: Process killed due to memory exhaustion
- **Current Memory**: 256MB (insufficient)
- **Memory Usage**: 21.4GB virtual memory, 99MB RSS
- **Root Causes**: Unbounded caches, AI processing, security sessions

### Immediate Fixes (Deploy Now)

#### 1. Increase Fly.io Memory
`ash
# Increase memory to 512MB minimum
fly scale memory 512 -a ai2-core-api

# Or use the optimized fly.toml
cp ai2-core-app/fly.optimized.toml ai2-core-app/fly.toml
fly deploy -a ai2-core-api
`

#### 2. Disable AI+ Services (Memory Saver)
`ash
# Set environment variables to disable AI+
fly secrets set ENABLE_AI=false -a ai2-core-api
fly secrets set ENABLE_AI_CATEGORIES=false -a ai2-core-api
fly secrets set ENABLE_AI_TAX_DEDUCTION=false -a ai2-core-api
fly secrets set ENABLE_AI_INSIGHTS=false -a ai2-core-api
fly secrets set ENABLE_AI_REPORTING=false -a ai2-core-api

# Keep analytics enabled
fly secrets set ENABLE_ANALYTICS=true -a ai2-core-api
`

#### 3. Add Memory Monitoring
`ash
# Enable memory monitoring and garbage collection
fly secrets set NODE_OPTIONS="--max-old-space-size=400 --expose-gc" -a ai2-core-api
fly secrets set MEMORY_MONITORING=true -a ai2-core-api
fly secrets set GC_INTERVAL_MS=30000 -a ai2-core-api
`

### Code Optimizations (Next Deployment)

#### 1. Replace Unbounded Caches
- Replace 
ew Map() with MemoryOptimizedCache
- Set size limits: 1000-5000 entries max
- Add TTL: 5-15 minutes

#### 2. Optimize AI Processing
- Reduce batch sizes: 24  12 transactions
- Limit concurrent batches: 3  2
- Add memory checks before processing

#### 3. Security Service Limits
- Reduce max sessions: 50K  10K
- Add session cleanup every 5 minutes
- Implement LRU eviction

### Memory Usage Targets
- **Heap Usage**: < 300MB (60% of 512MB)
- **Cache Size**: < 50MB total
- **Concurrent Requests**: < 100
- **AI Batch Size**: < 12 transactions

### Monitoring & Alerts
- Memory usage alerts at 80%
- Automatic garbage collection at 70%
- Cache size monitoring
- OOM prevention triggers

### Cost Impact
- **Memory Increase**: +256MB = ~.25/month
- **AI+ Disabled**: --10/month (OpenAI costs)
- **Net Savings**: .75-8.75/month
- **Stability**: Prevents crashes and downtime

### Deployment Steps
1. **Immediate**: Increase memory to 512MB
2. **Quick**: Disable AI+ services
3. **Next**: Deploy memory-optimized code
4. **Monitor**: Watch memory usage and adjust

### Verification
`ash
# Check memory usage
fly logs -a ai2-core-api | grep -i memory

# Monitor health endpoint
curl https://ai2-core-api.fly.dev/health

# Check service status
fly status -a ai2-core-api
`

### Rollback Plan
If issues occur:
`ash
# Revert memory to 256MB
fly scale memory 256 -a ai2-core-api

# Re-enable AI+ if needed
fly secrets set ENABLE_AI=true -a ai2-core-api
`

### Long-term Optimizations
1. **Database Caching**: Move large caches to Redis
2. **Streaming**: Process large datasets in streams
3. **Microservices**: Split heavy services
4. **CDN**: Cache static responses
5. **Compression**: Enable gzip compression

### Success Metrics
-  No OOM crashes for 7 days
-  Memory usage < 80% consistently
-  Response times < 2 seconds
-  99.9% uptime
-  Cost reduction from AI+ disable
