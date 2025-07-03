/**
 * Enterprise Scaling Configuration System
 * 
 * Automatically detects and configures for different scaling phases:
 * - Phase 1: Node.js Clustering (Current)
 * - Phase 2: Database Scaling (PostgreSQL + Redis)
 * - Phase 3: Cloud Enterprise (Multi-region, Auto-scaling)
 * 
 * Backwards and forwards compatible with all phases.
 */

export interface ScalingConfig {
  // Phase Detection
  phase: 'development' | 'cluster' | 'database' | 'enterprise';
  
  // Memory & Performance
  memoryLimit: number;
  gcThreshold: number;
  
  // Clustering
  clusterMode: boolean;
  workerCount: number;
  
  // Database
  usePostgreSQL: boolean;
  useRedis: boolean;
  connectionPooling: boolean;
  
  // Rate Limiting
  rateLimitingMode: 'basic' | 'advanced' | 'enterprise';
  apiRequestLimit: number;
  burstLimit: number;
  
  // Health Monitoring
  healthCheckInterval: number;
  memoryThreshold: number;
  
  // Enterprise Features
  useLoadBalancer: boolean;
  useAutoScaling: boolean;
  useMultiRegion: boolean;
}

class ScalingConfigManager {
  private static instance: ScalingConfigManager;
  private config: ScalingConfig;

  private constructor() {
    this.config = this.detectAndConfigurePhase();
  }

  static getInstance(): ScalingConfigManager {
    if (!ScalingConfigManager.instance) {
      ScalingConfigManager.instance = new ScalingConfigManager();
    }
    return ScalingConfigManager.instance;
  }

  private detectAndConfigurePhase(): ScalingConfig {
    // Phase detection based on environment and available services
    const hasClusterMode = process.env.CLUSTER_MODE === 'true' || process.env.NODE_ENV === 'production';
    const hasPostgreSQL = process.env.DATABASE_URL?.includes('postgresql://');
    const hasRedis = Boolean(process.env.REDIS_URL);
    const hasLoadBalancer = Boolean(process.env.LOAD_BALANCER_URL);
    
    let phase: ScalingConfig['phase'];
    
    if (hasLoadBalancer && hasPostgreSQL && hasRedis) {
      phase = 'enterprise';
    } else if (hasPostgreSQL || hasRedis) {
      phase = 'database';
    } else if (hasClusterMode) {
      phase = 'cluster';
    } else {
      phase = 'development';
    }

    return this.getConfigForPhase(phase);
  }

  private getConfigForPhase(phase: ScalingConfig['phase']): ScalingConfig {
    const baseConfig: ScalingConfig = {
      phase,
      memoryLimit: 1024, // MB
      gcThreshold: 70, // %
      clusterMode: false,
      workerCount: 1,
      usePostgreSQL: false,
      useRedis: false,
      connectionPooling: false,
      rateLimitingMode: 'basic',
      apiRequestLimit: 100,
      burstLimit: 20,
      healthCheckInterval: 30000, // 30 seconds
      memoryThreshold: 0.85,
      useLoadBalancer: false,
      useAutoScaling: false,
      useMultiRegion: false
    };

    switch (phase) {
      case 'development':
        return {
          ...baseConfig,
          memoryLimit: 512,
          apiRequestLimit: 50,
          burstLimit: 10,
          healthCheckInterval: 60000, // Less frequent in dev
        };

      case 'cluster':
        return {
          ...baseConfig,
          clusterMode: true,
          workerCount: parseInt(process.env.CLUSTER_WORKERS || '4'),
          memoryLimit: 2048,
          rateLimitingMode: 'advanced',
          apiRequestLimit: 300,
          burstLimit: 50,
          gcThreshold: 75,
        };

      case 'database':
        return {
          ...baseConfig,
          clusterMode: true,
          workerCount: parseInt(process.env.CLUSTER_WORKERS || '6'),
          memoryLimit: 4096,
          usePostgreSQL: true,
          useRedis: true,
          connectionPooling: true,
          rateLimitingMode: 'advanced',
          apiRequestLimit: 1000,
          burstLimit: 200,
          gcThreshold: 80,
          healthCheckInterval: 15000, // More frequent monitoring
        };

      case 'enterprise':
        return {
          ...baseConfig,
          clusterMode: true,
          workerCount: parseInt(process.env.CLUSTER_WORKERS || '8'),
          memoryLimit: 8192,
          usePostgreSQL: true,
          useRedis: true,
          connectionPooling: true,
          rateLimitingMode: 'enterprise',
          apiRequestLimit: 5000,
          burstLimit: 1000,
          gcThreshold: 85,
          healthCheckInterval: 10000, // High-frequency monitoring
          useLoadBalancer: true,
          useAutoScaling: true,
          useMultiRegion: Boolean(process.env.MULTI_REGION),
        };

      default:
        return baseConfig;
    }
  }

  getConfig(): ScalingConfig {
    return { ...this.config };
  }

  getCurrentPhase(): string {
    return this.config.phase;
  }

  // Backwards compatibility methods
  getMemoryLimit(): number {
    return this.config.memoryLimit;
  }

  shouldUseCluster(): boolean {
    return this.config.clusterMode;
  }

  getWorkerCount(): number {
    return this.config.workerCount;
  }

  getRateLimitConfig() {
    return {
      maxRequests: this.config.apiRequestLimit,
      burstSize: this.config.burstLimit,
      mode: this.config.rateLimitingMode
    };
  }

  // Future compatibility methods
  shouldUsePostgreSQL(): boolean {
    return this.config.usePostgreSQL;
  }

  shouldUseRedis(): boolean {
    return this.config.useRedis;
  }

  shouldUseConnectionPooling(): boolean {
    return this.config.connectionPooling;
  }

  // Monitoring and health
  getHealthConfig() {
    return {
      interval: this.config.healthCheckInterval,
      memoryThreshold: this.config.memoryThreshold,
      gcThreshold: this.config.gcThreshold
    };
  }

  // Enterprise features
  isEnterpriseMode(): boolean {
    return this.config.phase === 'enterprise';
  }

  // Debug information
  getPhaseInfo() {
    return {
      currentPhase: this.config.phase,
      features: {
        cluster: this.config.clusterMode,
        database: this.config.usePostgreSQL,
        cache: this.config.useRedis,
        loadBalancer: this.config.useLoadBalancer,
        autoScaling: this.config.useAutoScaling,
        multiRegion: this.config.useMultiRegion
      },
      limits: {
        memory: this.config.memoryLimit,
        workers: this.config.workerCount,
        apiRequests: this.config.apiRequestLimit,
        burst: this.config.burstLimit
      }
    };
  }
}

// Export singleton instance
export const scalingConfig = ScalingConfigManager.getInstance(); 