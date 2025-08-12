export type FeatureKey =
  | 'patterns'
  | 'travel_expenses'
  | 'personalize'
  | 'subscription'
  | 'all_transactions'
  | 'categories_management'
  | 'expenses'
  | 'tax_analysis'
  | 'ato_export'
  | 'emails'
  | 'ai_assistant';

export const FREE_AUTH_FEATURES: FeatureKey[] = [
  'patterns',
  'travel_expenses',
  'personalize',
  'subscription'
];

export const PREMIUM_FEATURES: FeatureKey[] = [
  'all_transactions',
  'categories_management',
  'expenses',
  'tax_analysis',
  'ato_export',
  'emails',
  'ai_assistant'
];

// Map backend API prefixes to feature enforcement
export const API_PREFIX_TO_FEATURE: Record<string, { auth: boolean; subscription: boolean }> = {
  '/api/bills-patterns': { auth: true, subscription: false },
  '/api/bank': { auth: true, subscription: true },
  '/api/bank-batch': { auth: true, subscription: true },
  '/api/bills': { auth: true, subscription: true },
  '/api/bills-ai': { auth: true, subscription: true },
  '/api/expenses': { auth: true, subscription: true },
  '/api/ai': { auth: true, subscription: true },
  '/api/ai-tax': { auth: true, subscription: true },
  '/api/bankFeed': { auth: true, subscription: true },
  '/api/databuckets': { auth: true, subscription: true },
  '/api/intelligent-categorization': { auth: true, subscription: true },
  '/api/enhanced-ai-categorization': { auth: true, subscription: true },
  '/api/intelligent-tax-deduction': { auth: true, subscription: true },
  '/api/custom-rules': { auth: true, subscription: true },
  '/api/vehicles': { auth: true, subscription: true },
  '/api/trips': { auth: true, subscription: true },
  '/api/export': { auth: true, subscription: true },
  '/api/categories': { auth: true, subscription: true },
};
