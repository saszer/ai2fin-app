-- ============================================
-- ELITE+ Setup SQL for Core App Database (Fallback)
-- ============================================
-- Service: ai2-core-app
-- Database: Neon PostgreSQL
-- 
-- NOTE: Core app uses subscription-service as PRIMARY source
-- This database is used as FALLBACK when subscription-service is unavailable
-- Feature access is controlled by ACCESS_CONFIG in code (config.ts)
--
-- embracingearth.space - Enterprise subscription management
-- ============================================

-- ============================================
-- ELITE+ MONTHLY PLAN (Fallback/Cache)
-- ============================================
INSERT INTO subscription_plans (
  id,
  name,
  description,
  price,
  currency,
  interval,
  "intervalCount",
  "trialPeriodDays",
  features,
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,  -- Auto-generate UUID for ID
  'AI2 ELITE+',
  'Full access with connectors, advanced analytics, and premium features',
  49.00,
  'USD',
  'month',
  1,
  0,
  '["dashboard","category_management","travel_expenses","patterns","bank_import","all_transactions","expense_management","custom_rules","privacy_management","email_processing","ato_export","ai_categorization","ai_tax_analysis","chat_file_upload","budget_allocations","tax_reports","ai_assistant","transactions_bills_analytics","connectors","admin_panel"]',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  interval = EXCLUDED.interval,
  "intervalCount" = EXCLUDED."intervalCount",
  "trialPeriodDays" = EXCLUDED."trialPeriodDays",
  features = EXCLUDED.features,
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- ============================================
-- ELITE+ YEARLY PLAN (Fallback/Cache)
-- ============================================
INSERT INTO subscription_plans (
  id,
  name,
  description,
  price,
  currency,
  interval,
  "intervalCount",
  "trialPeriodDays",
  features,
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,  -- Auto-generate UUID for ID
  'AI2 ELITE+ (Yearly)',
  'Full access with connectors, advanced analytics, and premium features - Yearly billing',
  490.00,
  'USD',
  'year',
  1,
  0,
  '["dashboard","category_management","travel_expenses","patterns","bank_import","all_transactions","expense_management","custom_rules","privacy_management","email_processing","ato_export","ai_categorization","ai_tax_analysis","chat_file_upload","budget_allocations","tax_reports","ai_assistant","transactions_bills_analytics","connectors","admin_panel"]',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  interval = EXCLUDED.interval,
  "intervalCount" = EXCLUDED."intervalCount",
  "trialPeriodDays" = EXCLUDED."trialPeriodDays",
  features = EXCLUDED.features,
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- ============================================
-- PREMIUM YEARLY PLAN (Fallback/Cache)
-- ============================================
INSERT INTO subscription_plans (
  id,
  name,
  description,
  price,
  currency,
  interval,
  "intervalCount",
  "trialPeriodDays",
  features,
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'AI2 Premium (Yearly)',
  'Full access to AI2 Platform features - Yearly billing',
  222.00,
  'USD',
  'year',
  1,
  0,
  '["dashboard","category_management","travel_expenses","patterns","bank_import","all_transactions","expense_management","custom_rules","privacy_management","ato_export","ai_categorization","ai_tax_analysis","chat_file_upload","transactions_bills_analytics"]',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  interval = EXCLUDED.interval,
  "intervalCount" = EXCLUDED."intervalCount",
  "trialPeriodDays" = EXCLUDED."trialPeriodDays",
  features = EXCLUDED.features,
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- ============================================
-- VERIFY PLANS
-- ============================================
SELECT 
  id,
  name,
  price,
  currency,
  interval,
  "isActive",
  "createdAt"
FROM subscription_plans
WHERE name LIKE '%ELITE+%' OR name LIKE '%Premium%'
ORDER BY name;

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- ✅ Core app database is FALLBACK ONLY
-- ✅ Primary source: subscription-service database
-- ✅ Feature access: Controlled by ACCESS_CONFIG in code (config.ts)
-- ✅ No stripePriceId needed (core app doesn't create subscriptions)
-- ✅ Uses gen_random_uuid() for ID generation
-- ✅ Safe to run multiple times (idempotent)
-- ============================================

