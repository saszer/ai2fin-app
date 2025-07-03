// Pricing types for subscription system
export enum SubscriptionTier {
  FREE_TRIAL = 'FREE_TRIAL',
  LITE = 'LITE', 
  PRO = 'PRO',
  ELITE = 'ELITE'
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

// ================================
// SUBSCRIPTION PLANS CONFIGURATION
// ================================

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // FREE TRIAL PLAN
  {
    id: 'plan_free_trial',
    name: 'Trial',
    description: 'Try AI2 for 1 day with limited AI tokens',
    tier: SubscriptionTier.FREE_TRIAL,
    pricing: {
      monthly: 0,
      yearly: 0,
      currency: 'USD'
    },
    features: [
      {
        id: 'trial_access',
        name: 'Full Platform Access',
        description: 'Access to all core financial management features',
        enabled: true,
        isAvailable: true,
        module: SubscribableModule.AI_CLASSIFICATION
      },
      {
        id: 'trial_ai_tokens',
        name: 'AI Trial Tokens',
        description: '10 AI tokens to test AI features',
        enabled: true,
        limit: 10,
        isAvailable: true,
        module: SubscribableModule.AI_CLASSIFICATION
      },
      {
        id: 'trial_support',
        name: 'Community Support',
        description: 'Access to community forums and documentation',
        enabled: true,
        isAvailable: true,
        module: SubscribableModule.ADVANCED_ANALYTICS
      }
    ],
    tokenAllocation: {
      monthlyTokens: 10,
      rolloverTokens: 0,
      maxRolloverTokens: 0,
      bonusTokens: 0
    },
    limits: {
      transactions: 100, // Limited for trial
      csvUploads: 2,
      taxReports: 1,
      apiCalls: 50,
      storage: 50, // 50MB
      users: 1,
      aiTokens: 10,
      aiModules: [
        SubscribableModule.AI_CLASSIFICATION,
        SubscribableModule.AI_CATEGORIZATION
      ],
      bankFeedConnections: 0,
      automationRules: 0,
      customCategories: 5
    },
    isPopular: false,
    isActive: true,
    trialDays: 1,
    metadata: {
      trialOnly: true,
      autoExpire: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // LITE PLAN - $11/month, $111/year
  {
    id: 'plan_lite',
    name: 'Lite',
    description: 'Perfect for individuals and freelancers getting started with AI-powered finance',
    tier: SubscriptionTier.LITE,
    pricing: {
      monthly: 11,
      yearly: 111,
      currency: 'USD',
      yearlyDiscount: 17 // ~17% discount for yearly (111 vs 132)
    },
    features: [
      {
        id: 'lite_transactions',
        name: 'Transaction Management',
        description: 'Manage up to 1,000 transactions per month',
        enabled: true,
        limit: 1000,
        isAvailable: true,
        module: SubscribableModule.AI_CLASSIFICATION
      },
      {
        id: 'lite_ai_tokens',
        name: 'AI Tokens',
        description: '100 AI tokens per month for smart categorization',
        enabled: true,
        limit: 100,
        isAvailable: true,
        module: SubscribableModule.AI_CLASSIFICATION
      },
      {
        id: 'lite_reports',
        name: 'Essential Reports',
        description: 'Generate monthly tax reports and expense summaries',
        enabled: true,
        limit: 5,
        isAvailable: true,
        module: SubscribableModule.AI_REPORT_GENERATION
      },
      {
        id: 'lite_support',
        name: 'Email Support',
        description: 'Email support with 48-hour response time',
        enabled: true,
        isAvailable: true,
        module: SubscribableModule.ADVANCED_ANALYTICS
      },
      {
        id: 'lite_csv',
        name: 'CSV Import',
        description: 'Import transactions from CSV files',
        enabled: true,
        limit: 10,
        isAvailable: true,
        module: SubscribableModule.ADVANCED_ANALYTICS
      }
    ],
    tokenAllocation: {
      monthlyTokens: 100,
      rolloverTokens: 25, // 25% rollover allowed
      maxRolloverTokens: 50, // Maximum 50 tokens can be rolled over
      bonusTokens: 0
    },
    limits: {
      transactions: 1000,
      csvUploads: 10,
      taxReports: 5,
      apiCalls: 500,
      storage: 100, // 100MB
      users: 1,
      aiTokens: 100,
      aiModules: [
        SubscribableModule.AI_CLASSIFICATION,
        SubscribableModule.AI_CATEGORIZATION,
        SubscribableModule.AI_TAX_ANALYSIS
      ],
      bankFeedConnections: 1,
      automationRules: 5,
      customCategories: 20
    },
    isPopular: false,
    isActive: true,
    trialDays: 0,
    metadata: {
      targetAudience: 'individuals',
      recommendedFor: 'light_usage'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // PRO PLAN - $22/month, $222/year
  {
    id: 'plan_pro',
    name: 'Pro',
    description: 'For growing businesses with advanced AI needs and automation',
    tier: SubscriptionTier.PRO,
    pricing: {
      monthly: 22,
      yearly: 222,
      currency: 'USD',
      yearlyDiscount: 16 // ~16% discount for yearly (222 vs 264)
    },
    features: [
      {
        id: 'pro_transactions',
        name: 'Transaction Management',
        description: 'Manage up to 5,000 transactions per month',
        enabled: true,
        limit: 5000,
        isAvailable: true,
        module: SubscribableModule.AI_CLASSIFICATION
      },
      {
        id: 'pro_ai_tokens',
        name: 'AI Tokens',
        description: '500 AI tokens per month for all AI features',
        enabled: true,
        limit: 500,
        isAvailable: true,
        module: SubscribableModule.AI_CLASSIFICATION
      },
      {
        id: 'pro_reports',
        name: 'Advanced Reports',
        description: 'Generate unlimited tax reports with AI insights',
        enabled: true,
        isAvailable: true,
        module: SubscribableModule.AI_REPORT_GENERATION
      },
      {
        id: 'pro_support',
        name: 'Priority Support',
        description: 'Priority email support with 24-hour response time',
        enabled: true,
        isAvailable: true,
        module: SubscribableModule.ADVANCED_ANALYTICS
      },
      {
        id: 'pro_automation',
        name: 'Smart Automation',
        description: 'Set up automated categorization and tagging rules',
        enabled: true,
        limit: 25,
        isAvailable: true,
        module: SubscribableModule.AUTOMATION_RULES
      },
      {
        id: 'pro_analytics',
        name: 'AI Analytics',
        description: 'Advanced spending insights and predictions',
        enabled: true,
        isAvailable: true,
        module: SubscribableModule.ADVANCED_ANALYTICS
      },
      {
        id: 'pro_bank_feeds',
        name: 'Bank Connect',
        description: 'Connect up to 3 bank accounts for live feeds',
        enabled: true,
        limit: 3,
        isAvailable: true,
        module: SubscribableModule.BANK_FEED_LIVE
      }
    ],
    tokenAllocation: {
      monthlyTokens: 500,
      rolloverTokens: 125, // 25% rollover allowed
      maxRolloverTokens: 200, // Maximum 200 tokens can be rolled over
      bonusTokens: 50 // Welcome bonus
    },
    limits: {
      transactions: 5000,
      csvUploads: 25,
      taxReports: null, // unlimited
      apiCalls: 2500,
      storage: 500, // 500MB
      users: 2,
      aiTokens: 500,
      aiModules: [
        SubscribableModule.AI_CLASSIFICATION,
        SubscribableModule.AI_CATEGORIZATION,
        SubscribableModule.AI_TAX_ANALYSIS,
        SubscribableModule.AI_EXPENSE_PREDICTION,
        SubscribableModule.AI_QUERY_ASSISTANT,
        SubscribableModule.ADVANCED_ANALYTICS
      ],
      bankFeedConnections: 3,
      automationRules: 25,
      customCategories: 100
    },
    isPopular: true, // Most popular plan
    isActive: true,
    trialDays: 0,
    metadata: {
      targetAudience: 'small_to_medium_business',
      recommendedFor: 'moderate_to_heavy_usage',
      bestValue: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // ELITE PLAN - $44/month, $444/year
  {
    id: 'plan_elite',
    name: 'Elite',
    description: 'Ultimate solution for enterprises with unlimited AI power and premium features',
    tier: SubscriptionTier.ELITE,
    pricing: {
      monthly: 44,
      yearly: 444,
      currency: 'USD',
      yearlyDiscount: 16 // ~16% discount for yearly (444 vs 528)
    },
    features: [
      {
        id: 'elite_transactions',
        name: 'Unlimited Transactions',
        description: 'Manage unlimited transactions with enterprise-grade performance',
        enabled: true,
        isAvailable: true,
        module: SubscribableModule.AI_CLASSIFICATION
      },
      {
        id: 'elite_ai_tokens',
        name: 'AI Power Pack',
        description: '2000 AI tokens per month plus rollover benefits',
        enabled: true,
        limit: 2000,
        isAvailable: true,
        module: SubscribableModule.AI_CLASSIFICATION
      },
      {
        id: 'elite_reports',
        name: 'Elite Reports',
        description: 'Unlimited custom reports with white-label options',
        enabled: true,
        isAvailable: true,
        module: SubscribableModule.AI_REPORT_GENERATION
      },
      {
        id: 'elite_support',
        name: 'VIP Support',
        description: 'Dedicated account manager and phone support',
        enabled: true,
        isAvailable: true,
        module: SubscribableModule.ADVANCED_ANALYTICS
      },
      {
        id: 'elite_automation',
        name: 'Elite Automation',
        description: 'Unlimited automation rules and custom workflows',
        enabled: true,
        isAvailable: true,
        module: SubscribableModule.AUTOMATION_RULES
      },
      {
        id: 'elite_integrations',
        name: 'Custom Integrations',
        description: 'API access and custom integrations',
        enabled: true,
        isAvailable: true,
        module: SubscribableModule.CUSTOM_INTEGRATIONS
      },
      {
        id: 'elite_white_label',
        name: 'White Label',
        description: 'Brand the platform with your company identity',
        enabled: true,
        isAvailable: true,
        module: SubscribableModule.WHITE_LABEL
      },
      {
        id: 'elite_multi_user',
        name: 'Team Command',
        description: 'Support for up to 10 team members',
        enabled: true,
        limit: 10,
        isAvailable: true,
        module: SubscribableModule.ADVANCED_ANALYTICS
      }
    ],
    tokenAllocation: {
      monthlyTokens: 2000,
      rolloverTokens: 800, // 40% rollover allowed for elite
      maxRolloverTokens: 1000, // Maximum 1000 tokens can be rolled over
      bonusTokens: 200 // Generous welcome bonus
    },
    limits: {
      transactions: null, // unlimited
      csvUploads: null, // unlimited
      taxReports: null, // unlimited
      apiCalls: null, // unlimited
      storage: 5000, // 5GB
      users: 10,
      aiTokens: 2000,
      aiModules: [
        // All AI modules available
        SubscribableModule.AI_CLASSIFICATION,
        SubscribableModule.AI_CATEGORIZATION,
        SubscribableModule.AI_TAX_ANALYSIS,
        SubscribableModule.AI_EXPENSE_PREDICTION,
        SubscribableModule.AI_QUERY_ASSISTANT,
        SubscribableModule.AI_REPORT_GENERATION,
        SubscribableModule.ADVANCED_ANALYTICS,
        SubscribableModule.CUSTOM_INTEGRATIONS,
        SubscribableModule.WHITE_LABEL
      ],
      bankFeedConnections: null, // unlimited
      automationRules: null, // unlimited
      customCategories: null // unlimited
    },
    isPopular: false,
    isActive: true,
    trialDays: 0,
    metadata: {
      targetAudience: 'enterprise',
      recommendedFor: 'heavy_usage',
      customizable: true,
      dedicatedSupport: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ================================
// PLAN UTILITIES
// ================================

export const getPlanByTier = (tier: SubscriptionTier): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.tier === tier);
};

export const getPlanById = (id: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === id);
};

export const getAvailablePlans = (): SubscriptionPlan[] => {
  return SUBSCRIPTION_PLANS.filter(plan => plan.isActive && plan.tier !== SubscriptionTier.FREE_TRIAL);
};

export const calculateYearlySavings = (plan: SubscriptionPlan): number => {
  const monthlyCost = plan.pricing.monthly * 12;
  const yearlyCost = plan.pricing.yearly;
  return monthlyCost - yearlyCost;
};

export const getTokensForPlan = (tier: SubscriptionTier): number => {
  const plan = getPlanByTier(tier);
  return plan?.tokenAllocation.monthlyTokens || 0;
};

export const isModuleAvailableForPlan = (module: SubscribableModule, tier: SubscriptionTier): boolean => {
  const plan = getPlanByTier(tier);
  return plan?.limits.aiModules.includes(module as string) || false;
};

// ================================
// TRIAL CONFIGURATION
// ================================

export const TRIAL_CONFIG = {
  durationDays: 1, // Currently set to 1 day as requested
  tokensLimit: 10,
  transactionsLimit: 100,
  csvUploadsLimit: 2,
  gracePeriodHours: 24, // 24 hours grace period after trial expires
  reminderHours: [12, 6, 1], // Send reminders at these hours before expiry
  autoUpgradeToTier: SubscriptionTier.LITE // Auto-suggest this tier after trial
};

// ================================
// MODULE COSTS CONFIGURATION
// ================================

export const MODULE_TOKEN_COSTS: Record<SubscribableModule, number> = {
  [SubscribableModule.AI_CLASSIFICATION]: 1,
  [SubscribableModule.AI_CATEGORIZATION]: 1,
  [SubscribableModule.AI_TAX_ANALYSIS]: 2,
  [SubscribableModule.AI_EXPENSE_PREDICTION]: 3,
  [SubscribableModule.AI_QUERY_ASSISTANT]: 2,
  [SubscribableModule.AI_REPORT_GENERATION]: 5,
  [SubscribableModule.BANK_FEED_LIVE]: 0, // Not token-based, subscription-based
  [SubscribableModule.AUTOMATION_RULES]: 0, // Not token-based
  [SubscribableModule.ADVANCED_ANALYTICS]: 3,
  [SubscribableModule.CUSTOM_INTEGRATIONS]: 1,
  [SubscribableModule.WHITE_LABEL]: 0 // Feature unlock, not token-based
}; 