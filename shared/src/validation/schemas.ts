/**
 * Validation Schemas for AI2 Enterprise Platform
 * Comprehensive input validation using Joi for all API endpoints
 */

import Joi from 'joi';

// Common validation patterns
const commonPatterns = {
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required(),
  uuid: Joi.string().uuid().required(),
  amount: Joi.number().precision(2).min(-999999.99).max(999999.99).required(),
  date: Joi.date().iso().required(),
  description: Joi.string().min(1).max(500).required(),
  category: Joi.string().min(1).max(100).required(),
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  url: Joi.string().uri(),
};

// User-related schemas
export const userSchemas = {
  register: Joi.object({
    email: commonPatterns.email,
    password: commonPatterns.password,
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    phoneNumber: commonPatterns.phoneNumber.optional(),
    companyName: Joi.string().min(1).max(100).optional(),
    businessType: Joi.string().valid(
      'individual', 'small_business', 'corporation', 'partnership', 'llc', 'other'
    ).optional()
  }),

  login: Joi.object({
    email: commonPatterns.email,
    password: Joi.string().required(),
    rememberMe: Joi.boolean().optional()
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(1).max(50).optional(),
    lastName: Joi.string().min(1).max(50).optional(),
    phoneNumber: commonPatterns.phoneNumber.optional(),
    companyName: Joi.string().min(1).max(100).optional(),
    businessType: Joi.string().valid(
      'individual', 'small_business', 'corporation', 'partnership', 'llc', 'other'
    ).optional(),
    preferences: Joi.object({
      currency: Joi.string().length(3).uppercase().optional(),
      timezone: Joi.string().optional(),
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        sms: Joi.boolean().optional(),
        push: Joi.boolean().optional()
      }).optional()
    }).optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: commonPatterns.password,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
  })
};

// Transaction-related schemas
export const transactionSchemas = {
  create: Joi.object({
    amount: commonPatterns.amount,
    description: commonPatterns.description,
    category: commonPatterns.category,
    date: commonPatterns.date,
    merchant: Joi.string().min(1).max(100).optional(),
    location: Joi.string().min(1).max(200).optional(),
    notes: Joi.string().max(1000).optional(),
    tags: Joi.array().items(Joi.string().min(1).max(50)).max(10).optional(),
    receiptUrl: commonPatterns.url.optional(),
    source: Joi.string().valid('manual', 'import', 'api', 'bank_feed').default('manual'),
    type: Joi.string().valid('income', 'expense', 'transfer').required()
  }),

  update: Joi.object({
    amount: commonPatterns.amount.optional(),
    description: Joi.string().min(1).max(500).optional(),
    category: Joi.string().min(1).max(100).optional(),
    date: commonPatterns.date.optional(),
    merchant: Joi.string().min(1).max(100).optional(),
    location: Joi.string().min(1).max(200).optional(),
    notes: Joi.string().max(1000).optional(),
    tags: Joi.array().items(Joi.string().min(1).max(50)).max(10).optional(),
    receiptUrl: commonPatterns.url.optional(),
    type: Joi.string().valid('income', 'expense', 'transfer').optional()
  }),

  query: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    category: Joi.string().optional(),
    minAmount: Joi.number().optional(),
    maxAmount: Joi.number().min(Joi.ref('minAmount')).optional(),
    type: Joi.string().valid('income', 'expense', 'transfer').optional(),
    search: Joi.string().min(1).max(100).optional(),
    limit: Joi.number().integer().min(1).max(1000).default(50),
    offset: Joi.number().integer().min(0).default(0),
    sortBy: Joi.string().valid('date', 'amount', 'description', 'category').default('date'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  bulkImport: Joi.object({
    transactions: Joi.array().items(
      Joi.object({
        amount: commonPatterns.amount,
        description: commonPatterns.description,
        date: commonPatterns.date,
        category: Joi.string().min(1).max(100).optional(),
        merchant: Joi.string().min(1).max(100).optional(),
        type: Joi.string().valid('income', 'expense', 'transfer').required()
      })
    ).min(1).max(1000).required(),
    skipDuplicates: Joi.boolean().default(true),
    autoClassify: Joi.boolean().default(true)
  })
};

// Category-related schemas
export const categorySchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
    icon: Joi.string().min(1).max(50).optional(),
    parentId: commonPatterns.uuid.optional(),
    isActive: Joi.boolean().default(true),
    sortOrder: Joi.number().integer().min(0).optional()
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(500).optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
    icon: Joi.string().min(1).max(50).optional(),
    parentId: commonPatterns.uuid.optional(),
    isActive: Joi.boolean().optional(),
    sortOrder: Joi.number().integer().min(0).optional()
  })
};

// AI-related schemas
export const aiSchemas = {
  analyzeTransaction: Joi.object({
    transactionId: commonPatterns.uuid.optional(),
    transaction: Joi.object({
      amount: commonPatterns.amount,
      description: commonPatterns.description,
      date: commonPatterns.date,
      merchant: Joi.string().min(1).max(100).optional()
    }).optional(),
    context: Joi.object({
      includePersonalHistory: Joi.boolean().default(true),
      includeDomainKnowledge: Joi.boolean().default(true),
      maxHistoryDays: Joi.number().integer().min(1).max(365).default(90)
    }).optional(),
    options: Joi.object({
      suggestCategory: Joi.boolean().default(true),
      analyzeTaxImplications: Joi.boolean().default(true),
      generateInsights: Joi.boolean().default(false)
    }).optional()
  }).or('transactionId', 'transaction'),

  batchAnalyze: Joi.object({
    transactionIds: Joi.array().items(commonPatterns.uuid).min(1).max(100).required(),
    options: Joi.object({
      suggestCategory: Joi.boolean().default(true),
      analyzeTaxImplications: Joi.boolean().default(true),
      generateInsights: Joi.boolean().default(false),
      parallel: Joi.boolean().default(true)
    }).optional()
  }),

  feedback: Joi.object({
    transactionId: commonPatterns.uuid,
    originalClassification: Joi.string().required(),
    correctedClassification: Joi.string().required(),
    confidence: Joi.number().min(1).max(5).required(),
    notes: Joi.string().max(500).optional()
  }),

  generateInsights: Joi.object({
    timeframe: Joi.string().valid('week', 'month', 'quarter', 'year').default('month'),
    categories: Joi.array().items(Joi.string()).optional(),
    includeForecasting: Joi.boolean().default(true),
    includeTaxOptimization: Joi.boolean().default(true)
  })
};

// Subscription-related schemas
export const subscriptionSchemas = {
  create: Joi.object({
    planId: commonPatterns.uuid,
    paymentMethodId: Joi.string().required(),
    billingAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().length(2).uppercase().required()
    }).required(),
    promoCode: Joi.string().optional()
  }),

  update: Joi.object({
    planId: commonPatterns.uuid.optional(),
    paymentMethodId: Joi.string().optional(),
    billingAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().length(2).uppercase().required()
    }).optional()
  }),

  usage: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    includeBreakdown: Joi.boolean().default(false)
  })
};

// Notification-related schemas
export const notificationSchemas = {
  create: Joi.object({
    type: Joi.string().valid('email', 'sms', 'push', 'webhook').required(),
    title: Joi.string().min(1).max(100).required(),
    message: Joi.string().min(1).max(1000).required(),
    recipient: Joi.string().required(),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
    scheduledAt: Joi.date().iso().min('now').optional(),
    metadata: Joi.object().optional()
  }),

  preference: Joi.object({
    email: Joi.boolean().optional(),
    sms: Joi.boolean().optional(),
    push: Joi.boolean().optional(),
    transactionAlerts: Joi.boolean().optional(),
    weeklyReports: Joi.boolean().optional(),
    monthlyReports: Joi.boolean().optional(),
    securityAlerts: Joi.boolean().optional(),
    marketingEmails: Joi.boolean().optional()
  })
};

// Analytics-related schemas
export const analyticsSchemas = {
  report: Joi.object({
    type: Joi.string().valid(
      'spending_summary', 'category_breakdown', 'trend_analysis', 
      'tax_summary', 'budget_performance', 'custom'
    ).required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    groupBy: Joi.string().valid('day', 'week', 'month', 'quarter', 'year').optional(),
    categories: Joi.array().items(Joi.string()).optional(),
    includeForecasting: Joi.boolean().default(false),
    format: Joi.string().valid('json', 'csv', 'pdf', 'excel').default('json')
  }),

  customQuery: Joi.object({
    filters: Joi.object({
      dateRange: Joi.object({
        start: Joi.date().iso().required(),
        end: Joi.date().iso().min(Joi.ref('start')).required()
      }).required(),
      categories: Joi.array().items(Joi.string()).optional(),
      amountRange: Joi.object({
        min: Joi.number().optional(),
        max: Joi.number().min(Joi.ref('min')).optional()
      }).optional(),
      merchants: Joi.array().items(Joi.string()).optional(),
      types: Joi.array().items(Joi.string().valid('income', 'expense', 'transfer')).optional()
    }).required(),
    aggregations: Joi.array().items(
      Joi.string().valid('sum', 'avg', 'count', 'min', 'max', 'std_dev')
    ).required(),
    groupBy: Joi.array().items(
      Joi.string().valid('category', 'merchant', 'date', 'type', 'amount_range')
    ).optional()
  })
};

// Common query parameter validation
export const commonQuerySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(1000).default(50),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  dateRange: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  }),

  search: Joi.object({
    q: Joi.string().min(1).max(100).optional(),
    fields: Joi.array().items(Joi.string()).optional()
  })
};

// Export all schemas as a single object for easy import
export const validationSchemas = {
  user: userSchemas,
  transaction: transactionSchemas,
  category: categorySchemas,
  ai: aiSchemas,
  subscription: subscriptionSchemas,
  notification: notificationSchemas,
  analytics: analyticsSchemas,
  common: commonQuerySchemas
};

// Utility function to validate request data
export const validateRequest = (schema: Joi.ObjectSchema, data: any) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });

  if (error) {
    const details = error.details.map((detail: any) => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/"/g, ''),
      type: detail.type,
      value: detail.context?.value
    }));

    return {
      isValid: false,
      errors: details,
      data: null
    };
  }

  return {
    isValid: true,
    errors: null,
    data: value
  };
};

export default validationSchemas;