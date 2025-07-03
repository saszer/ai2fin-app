import { FeatureFlags, ModuleConfig } from '../types';

// ========================================
// Default Feature Flags Configuration
// ========================================

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  // Core Features - Always enabled for basic functionality
  enableTransactionImport: true,
  enableManualTransactions: true,
  enableCategoryManagement: true,
  
  // AI Features - Controllable via environment variables
  enableAI: process.env.ENABLE_AI === 'true',
  enableAICategories: process.env.ENABLE_AI_CATEGORIES === 'true',
  enableAITaxDeduction: process.env.ENABLE_AI_TAX_DEDUCTION === 'true',
  enableAIInsights: process.env.ENABLE_AI_INSIGHTS === 'true',
  enableAIReporting: process.env.ENABLE_AI_REPORTING === 'true',
  
  // Subscription Features - Controlled via deployment
  enableSubscription: process.env.ENABLE_SUBSCRIPTION === 'true',
  enablePricing: process.env.ENABLE_PRICING === 'true',
  enableUsageTracking: process.env.ENABLE_USAGE_TRACKING === 'true',
  enableTokenSystem: process.env.ENABLE_TOKEN_SYSTEM === 'true',
  
  // Connector Features - Enterprise add-ons
  enableBankFeed: process.env.ENABLE_BANK_FEED === 'true',
  enableEmailConnector: process.env.ENABLE_EMAIL_CONNECTOR === 'true',
  enableAPIConnector: process.env.ENABLE_API_CONNECTOR === 'true',
  enableCSVImport: process.env.ENABLE_CSV_IMPORT !== 'false', // Default enabled
  
  // Analytics Features - Premium features
  enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
  enableAdvancedReporting: process.env.ENABLE_ADVANCED_REPORTING === 'true',
  enableDashboard: process.env.ENABLE_DASHBOARD !== 'false', // Default enabled
  enableExports: process.env.ENABLE_EXPORTS === 'true',
  
  // Notification Features - Optional add-ons
  enableNotifications: process.env.ENABLE_NOTIFICATIONS === 'true',
  enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
  enableSMSNotifications: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
  enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
  
  // Enterprise Features - High-end deployments
  enableMultiTenant: process.env.ENABLE_MULTI_TENANT === 'true',
  enableSSO: process.env.ENABLE_SSO === 'true',
  enableAuditLog: process.env.ENABLE_AUDIT_LOG === 'true',
  enableCompliance: process.env.ENABLE_COMPLIANCE === 'true',
};

// ========================================
// Deployment Configurations
// ========================================

export const DEPLOYMENT_CONFIGS = {
  // Core-only deployment (sellable standalone)
  CORE_ONLY: {
    ...DEFAULT_FEATURE_FLAGS,
    enableAI: false,
    enableSubscription: false,
    enableAnalytics: false,
    enableConnectors: false,
    enableNotifications: false,
    enableBankFeed: false,
    enableEmailConnector: false,
    enableAPIConnector: false,
    enableAdvancedReporting: false,
    enableExports: false,
    enableEmailNotifications: false,
    enableSMSNotifications: false,
    enablePushNotifications: false,
    enableMultiTenant: false,
    enableSSO: false,
    enableAuditLog: false,
    enableCompliance: false,
  } as FeatureFlags,

  // Premium deployment (AI + Core)
  PREMIUM: {
    ...DEFAULT_FEATURE_FLAGS,
    enableAI: true,
    enableAICategories: true,
    enableAITaxDeduction: true,
    enableAIInsights: true,
    enableSubscription: true,
    enablePricing: true,
    enableUsageTracking: true,
    enableTokenSystem: true,
    enableAnalytics: true,
    enableDashboard: true,
  } as FeatureFlags,

  // Enterprise deployment (All features)
  ENTERPRISE: {
    ...DEFAULT_FEATURE_FLAGS,
    enableAI: true,
    enableAICategories: true,
    enableAITaxDeduction: true,
    enableAIInsights: true,
    enableAIReporting: true,
    enableSubscription: true,
    enablePricing: true,
    enableUsageTracking: true,
    enableTokenSystem: true,
    enableBankFeed: true,
    enableEmailConnector: true,
    enableAPIConnector: true,
    enableAnalytics: true,
    enableAdvancedReporting: true,
    enableExports: true,
    enableNotifications: true,
    enableEmailNotifications: true,
    enableSMSNotifications: true,
    enablePushNotifications: true,
    enableMultiTenant: true,
    enableSSO: true,
    enableAuditLog: true,
    enableCompliance: true,
  } as FeatureFlags,
};

// ========================================
// Module Configuration
// ========================================

export const DEFAULT_MODULE_CONFIG: ModuleConfig = {
  core: {
    enabled: true,
    version: '1.0.0',
    healthy: true,
    lastCheck: new Date(),
    endpoint: process.env.CORE_ENDPOINT || 'http://localhost:3001',
    features: ['transactions', 'categories', 'dashboard', 'csv-import'],
  },
  ai: {
    enabled: process.env.ENABLE_AI === 'true',
    version: '1.0.0',
    healthy: false,
    lastCheck: new Date(),
    endpoint: process.env.AI_ENDPOINT || 'http://localhost:3002',
    features: ['categorization', 'tax-deduction', 'insights', 'reporting'],
  },
  subscription: {
    enabled: process.env.ENABLE_SUBSCRIPTION === 'true',
    version: '1.0.0',
    healthy: false,
    lastCheck: new Date(),
    endpoint: process.env.SUBSCRIPTION_ENDPOINT || 'http://localhost:3010',
    features: ['billing', 'pricing', 'usage-tracking', 'tokens'],
  },
  connectors: {
    enabled: process.env.ENABLE_CONNECTORS === 'true',
    version: '1.0.0',
    healthy: false,
    lastCheck: new Date(),
    endpoint: process.env.CONNECTORS_ENDPOINT || 'http://localhost:3005',
    features: ['bank-feed', 'email-extraction', 'api-integration'],
  },
  analytics: {
    enabled: process.env.ENABLE_ANALYTICS === 'true',
    version: '1.0.0',
    healthy: false,
    lastCheck: new Date(),
    endpoint: process.env.ANALYTICS_ENDPOINT || 'http://localhost:3004',
    features: ['advanced-reporting', 'exports', 'insights'],
  },
  notifications: {
    enabled: process.env.ENABLE_NOTIFICATIONS === 'true',
    version: '1.0.0',
    healthy: false,
    lastCheck: new Date(),
    endpoint: process.env.NOTIFICATIONS_ENDPOINT || 'http://localhost:3006',
    features: ['email', 'sms', 'push', 'webhooks'],
  },
};

// ========================================
// Feature Flag Utilities
// ========================================

export class FeatureFlagManager {
  private flags: FeatureFlags;
  private modules: ModuleConfig;

  constructor(customFlags?: Partial<FeatureFlags>, customModules?: Partial<ModuleConfig>) {
    // Determine deployment type from environment
    const deploymentType = process.env.DEPLOYMENT_TYPE as keyof typeof DEPLOYMENT_CONFIGS;
    const baseFlags = deploymentType && DEPLOYMENT_CONFIGS[deploymentType] 
      ? DEPLOYMENT_CONFIGS[deploymentType] 
      : DEFAULT_FEATURE_FLAGS;

    this.flags = { ...baseFlags, ...customFlags };
    this.modules = { ...DEFAULT_MODULE_CONFIG, ...customModules };
  }

  // Feature flag getters
  isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.flags[feature];
  }

  isModuleEnabled(module: keyof ModuleConfig): boolean {
    return this.modules[module].enabled;
  }

  isModuleHealthy(module: keyof ModuleConfig): boolean {
    return this.modules[module].healthy;
  }

  // Feature groups
  isAIEnabled(): boolean {
    return this.flags.enableAI && this.modules.ai.enabled;
  }

  isSubscriptionEnabled(): boolean {
    return this.flags.enableSubscription && this.modules.subscription.enabled;
  }

  isConnectorsEnabled(): boolean {
    return (
      this.flags.enableBankFeed || 
      this.flags.enableEmailConnector || 
      this.flags.enableAPIConnector
    ) && this.modules.connectors.enabled;
  }

  isAnalyticsEnabled(): boolean {
    return this.flags.enableAnalytics && this.modules.analytics.enabled;
  }

  isNotificationsEnabled(): boolean {
    return this.flags.enableNotifications && this.modules.notifications.enabled;
  }

  isEnterpriseEnabled(): boolean {
    return this.flags.enableMultiTenant || this.flags.enableSSO || this.flags.enableCompliance;
  }

  // Configuration getters
  getFeatureFlags(): FeatureFlags {
    return { ...this.flags };
  }

  getModuleConfig(): ModuleConfig {
    return { ...this.modules };
  }

  getEnabledModules(): string[] {
    return Object.entries(this.modules)
      .filter(([_, config]) => config.enabled)
      .map(([name]) => name);
  }

  getHealthyModules(): string[] {
    return Object.entries(this.modules)
      .filter(([_, config]) => config.enabled && config.healthy)
      .map(([name]) => name);
  }

  // Dynamic feature updates
  updateFeatureFlag(feature: keyof FeatureFlags, enabled: boolean): void {
    this.flags[feature] = enabled;
  }

  updateModuleStatus(module: keyof ModuleConfig, status: Partial<typeof this.modules[typeof module]>): void {
    this.modules[module] = { ...this.modules[module], ...status };
  }

  // Business model checks
  getBusinessModel(): 'core' | 'premium' | 'enterprise' {
    if (this.isEnterpriseEnabled()) return 'enterprise';
    if (this.isAIEnabled() || this.isSubscriptionEnabled()) return 'premium';
    return 'core';
  }

  getAvailableFeatures(): string[] {
    return Object.entries(this.flags)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => feature);
  }

  // Deployment validation
  validateDeployment(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Core module must always be enabled
    if (!this.modules.core.enabled) {
      issues.push('Core module must be enabled');
    }

    // AI features require AI module
    if (this.isFeatureEnabled('enableAI') && !this.modules.ai.enabled) {
      issues.push('AI features enabled but AI module is disabled');
    }

    // Subscription features require subscription module
    if (this.isFeatureEnabled('enableSubscription') && !this.modules.subscription.enabled) {
      issues.push('Subscription features enabled but subscription module is disabled');
    }

    // Check connector dependencies
    const connectorFeatures = ['enableBankFeed', 'enableEmailConnector', 'enableAPIConnector'];
    if (connectorFeatures.some(f => this.isFeatureEnabled(f as keyof FeatureFlags)) && !this.modules.connectors.enabled) {
      issues.push('Connector features enabled but connectors module is disabled');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// ========================================
// Global Feature Flag Instance
// ========================================

export const featureFlags = new FeatureFlagManager();

export default featureFlags; 