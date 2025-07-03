// ========================================
// Core Domain Types
// ========================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'ENTERPRISE';
  createdAt: Date;
  updatedAt: Date;
  subscription?: SubscriptionInfo;
  preferences: UserPreferences;
  features: FeatureFlags;
}

export interface UserPreferences {
  timezone: string;
  currency: string;
  language: string;
  country: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  categories: string[];
}

// ========================================
// Transaction & Financial Types
// ========================================

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  date: Date;
  category?: Category;
  categoryId?: string;
  type: TransactionType;
  source: TransactionSource;
  tags: string[];
  metadata: Record<string, any>;
  aiInsights?: AIInsights;
  bankData?: BankTransactionData;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type TransactionSource = 'MANUAL' | 'CSV_IMPORT' | 'BANK_FEED' | 'EMAIL_EXTRACTION' | 'API';

export interface BankTransactionData {
  bankId: string;
  accountId: string;
  reference: string;
  balance?: number;
  originalDescription: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  parentId?: string;
  children?: Category[];
  isSystem: boolean;
  taxDeductible: boolean;
  businessCategory: boolean;
}

export interface AIInsights {
  confidence: number;
  suggestedCategory: string;
  reasoning: string;
  taxDeductibility: TaxDeductibilityAnalysis;
  anomalyScore?: number;
  businessRelevance?: number;
}

export interface TaxDeductibilityAnalysis {
  isDeductible: boolean;
  confidence: number;
  category: string;
  reasoning: string;
  estimatedDeduction: number;
  jurisdiction: string;
}

// ========================================
// Subscription & Billing Types  
// ========================================

export interface SubscriptionInfo {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  usage: UsageInfo;
}

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'PAUSED';

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limits: PlanLimits;
  aiTokens: number;
}

export interface PlanLimits {
  transactions: number;
  categories: number;
  bankAccounts: number;
  emailConnections: number;
  apiCalls: number;
  storage: number; // in MB
}

export interface UsageInfo {
  transactions: number;
  aiTokensUsed: number;
  apiCallsUsed: number;
  storageUsed: number;
  period: {
    start: Date;
    end: Date;
  };
}

// ========================================
// Feature Flags & Module System
// ========================================

export interface FeatureFlags {
  // Core Features
  enableTransactionImport: boolean;
  enableManualTransactions: boolean;
  enableCategoryManagement: boolean;
  
  // AI Features  
  enableAI: boolean;
  enableAICategories: boolean;
  enableAITaxDeduction: boolean;
  enableAIInsights: boolean;
  enableAIReporting: boolean;
  
  // Subscription Features
  enableSubscription: boolean;
  enablePricing: boolean;
  enableUsageTracking: boolean;
  enableTokenSystem: boolean;
  
  // Connector Features
  enableBankFeed: boolean;
  enableEmailConnector: boolean;
  enableAPIConnector: boolean;
  enableCSVImport: boolean;
  
  // Analytics Features
  enableAnalytics: boolean;
  enableAdvancedReporting: boolean;
  enableDashboard: boolean;
  enableExports: boolean;
  
  // Notification Features
  enableNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  enablePushNotifications: boolean;
  
  // Enterprise Features
  enableMultiTenant: boolean;
  enableSSO: boolean;
  enableAuditLog: boolean;
  enableCompliance: boolean;
}

export interface ModuleConfig {
  core: ModuleStatus;
  ai: ModuleStatus;
  subscription: ModuleStatus;
  connectors: ModuleStatus;
  analytics: ModuleStatus;
  notifications: ModuleStatus;
}

export interface ModuleStatus {
  enabled: boolean;
  version: string;
  healthy: boolean;
  lastCheck: Date;
  endpoint?: string;
  features: string[];
}

// ========================================
// API & Response Types
// ========================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  timestamp: Date;
  requestId: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface FilterParams {
  search?: string;
  category?: string;
  type?: TransactionType;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ========================================
// Health & Monitoring Types
// ========================================

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: Date;
  checks: Record<string, HealthCheck>;
}

export interface HealthCheck {
  status: 'pass' | 'fail' | 'warn';
  responseTime: number;
  message?: string;
  details?: Record<string, any>;
}

// ========================================
// Configuration Types
// ========================================

export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  features: FeatureFlags;
  modules: ModuleConfig;
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  ui: {
    theme: string;
    brand: BrandConfig;
  };
}

export interface BrandConfig {
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  favicon: string;
}

// ========================================
// Event Types
// ========================================

export interface AppEvent {
  type: string;
  source: string;
  timestamp: Date;
  data: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export type TransactionEvent = AppEvent & {
  type: 'transaction.created' | 'transaction.updated' | 'transaction.deleted' | 'transaction.categorized';
  data: {
    transactionId: string;
    transaction?: Partial<Transaction>;
    changes?: Record<string, any>;
  };
};

export type SubscriptionEvent = AppEvent & {
  type: 'subscription.created' | 'subscription.updated' | 'subscription.canceled' | 'subscription.renewed';
  data: {
    subscriptionId: string;
    subscription?: Partial<SubscriptionInfo>;
    changes?: Record<string, any>;
  };
};

export type ModuleEvent = AppEvent & {
  type: 'module.enabled' | 'module.disabled' | 'module.health_changed';
  data: {
    moduleName: string;
    status?: ModuleStatus;
    previous?: ModuleStatus;
  };
};

// ========================================
// Utility Types
// ========================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Timestamps = {
  createdAt: Date;
  updatedAt: Date;
};

export type WithTimestamps<T> = T & Timestamps;

export type ID = string;

export type Currency = 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD' | 'JPY' | 'CHF' | 'CNY';

export type Country = 'US' | 'GB' | 'AU' | 'CA' | 'DE' | 'FR' | 'JP' | 'CH' | 'CN'; 