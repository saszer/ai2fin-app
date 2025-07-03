// ========================================
// Main Shared Package Exports
// ========================================

// Types
export * from './types';

// Configuration & Feature Flags
export * from './config/features';
export { default as featureFlags } from './config/features';

// Utilities
export * from './utils';

// Re-export commonly used types for convenience
export type {
  User,
  Transaction,
  Category,
  FeatureFlags,
  ModuleConfig,
  APIResponse,
  SubscriptionInfo,
  SubscriptionPlan,
  TransactionType,
  TransactionSource,
  HealthStatus,
  AppConfig,
} from './types';

// Export feature flag manager class
export { FeatureFlagManager } from './config/features';

// Version information
export const SHARED_VERSION = '1.0.0'; 