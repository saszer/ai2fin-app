import { FeatureFlags, ModuleConfig } from '../types';
export declare const DEFAULT_FEATURE_FLAGS: FeatureFlags;
export declare const DEPLOYMENT_CONFIGS: {
    CORE_ONLY: FeatureFlags;
    PREMIUM: FeatureFlags;
    ENTERPRISE: FeatureFlags;
};
export declare const DEFAULT_MODULE_CONFIG: ModuleConfig;
export declare class FeatureFlagManager {
    private flags;
    private modules;
    constructor(customFlags?: Partial<FeatureFlags>, customModules?: Partial<ModuleConfig>);
    isFeatureEnabled(feature: keyof FeatureFlags): boolean;
    isModuleEnabled(module: keyof ModuleConfig): boolean;
    isModuleHealthy(module: keyof ModuleConfig): boolean;
    isAIEnabled(): boolean;
    isSubscriptionEnabled(): boolean;
    isConnectorsEnabled(): boolean;
    isAnalyticsEnabled(): boolean;
    isNotificationsEnabled(): boolean;
    isEnterpriseEnabled(): boolean;
    getFeatureFlags(): FeatureFlags;
    getModuleConfig(): ModuleConfig;
    getEnabledModules(): string[];
    getHealthyModules(): string[];
    updateFeatureFlag(feature: keyof FeatureFlags, enabled: boolean): void;
    updateModuleStatus(module: keyof ModuleConfig, status: Partial<typeof this.modules[typeof module]>): void;
    getBusinessModel(): 'core' | 'premium' | 'enterprise';
    getAvailableFeatures(): string[];
    validateDeployment(): {
        valid: boolean;
        issues: string[];
    };
}
export declare const featureFlags: FeatureFlagManager;
export default featureFlags;
//# sourceMappingURL=features.d.ts.map