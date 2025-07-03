// ========================================
// Subscription & Pricing Types
// ========================================

export enum SubscriptionTier {
  FREE_TRIAL = 'FREE_TRIAL',
  BASIC = 'BASIC', 
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE'
}

export enum SubscribableModule {
  // AI Modules
  AI_CLASSIFICATION = 'AI_CLASSIFICATION',
  AI_CATEGORIZATION = 'AI_CATEGORIZATION',
  AI_TAX_ANALYSIS = 'AI_TAX_ANALYSIS',
  AI_EXPENSE_PREDICTION = 'AI_EXPENSE_PREDICTION',
  AI_QUERY_ASSISTANT = 'AI_QUERY_ASSISTANT',
  AI_REPORT_GENERATION = 'AI_REPORT_GENERATION',
  
  // Business Modules
  BANK_FEED_LIVE = 'BANK_FEED_LIVE',
  AUTOMATION_RULES = 'AUTOMATION_RULES',
  ADVANCED_ANALYTICS = 'ADVANCED_ANALYTICS',
  
  // Enterprise Modules
  CUSTOM_INTEGRATIONS = 'CUSTOM_INTEGRATIONS',
  WHITE_LABEL = 'WHITE_LABEL'
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  tier: SubscriptionTier;
  pricing: {
    monthly: number;
    yearly: number;
    currency: string;
    yearlyDiscount?: number;
  };
  features: PlanFeature[];
  tokenAllocation: {
    monthlyTokens: number;
    rolloverTokens: number;
    maxRolloverTokens: number;
    bonusTokens: number;
  };
  limits: PlanLimits;
  isPopular: boolean;
  isActive: boolean;
  trialDays: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  limit?: number;
  isAvailable: boolean;
  module: SubscribableModule;
}

export interface PlanLimits {
  transactions: number | null;
  csvUploads: number | null;
  taxReports: number | null;
  apiCalls: number | null;
  storage: number; // in MB
  users: number;
  aiTokens: number;
  aiModules: string[];
  bankFeedConnections: number | null;
  automationRules: number | null;
  customCategories: number | null;
} 