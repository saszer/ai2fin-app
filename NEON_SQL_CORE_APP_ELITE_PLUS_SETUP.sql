-- ============================================
-- ELITE+ Setup SQL for Core App Database (Neon)
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
-- This is a fallback plan for when subscription-service is unavailable
-- Replace 'YOUR_ELITE_PLUS_MONTHLY_PRICE_ID' with your actual Price ID (optional)
INSERT INTO subscription_plans (
  name,
  description,
  price,
  currency,
  interval,
  "intervalCount",
  "trialPeriodDays",
  features,
  "isActive"
) VALUES (
  'AI2 ELITE+',
  'Full access with connectors, advanced analytics, and premium features',
  49.00,
  'USD',
  'month',
  1,
  0,
  '["dashboard","category_management","travel_expenses","patterns","bank_import","all_transactions","expense_management","custom_rules","privacy_management","email_processing","ato_export","ai_categorization","ai_tax_analysis","chat_file_upload","budget_allocations","tax_reports","ai_assistant","transactions_bills_analytics","connectors","admin_panel"]',
  true
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  "updatedAt" = NOW();

-- ============================================
-- ELITE+ YEARLY PLAN (Fallback/Cache)
-- ============================================
INSERT INTO subscription_plans (
  name,
  description,
  price,
  currency,
  interval,
  "intervalCount",
  "trialPeriodDays",
  features,
  "isActive"
) VALUES (
  'AI2 ELITE+ (Yearly)',
  'Full access with connectors, advanced analytics, and premium features - Yearly billing',
  490.00,
  'USD',
  'year',
  1,
  0,
  '["dashboard","category_management","travel_expenses","patterns","bank_import","all_transactions","expense_management","custom_rules","privacy_management","email_processing","ato_export","ai_categorization","ai_tax_analysis","chat_file_upload","budget_allocations","tax_reports","ai_assistant","transactions_bills_analytics","connectors","admin_panel"]',
  true
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  "updatedAt" = NOW();

-- ============================================
-- VERIFY PLANS
-- ============================================
SELECT 
  name,
  price,
  currency,
  interval,
  "isActive",
  features
FROM subscription_plans
WHERE name LIKE '%ELITE+%' OR name LIKE '%Premium%'
ORDER BY name;

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- ✅ Core app database is FALLBACK ONLY
-- ✅ Primary source: subscription-service database
-- ✅ Feature access: Controlled by ACCESS_CONFIG in code (config.ts)
-- ✅ These plans are for fallback when subscription-service is down
-- ✅ No stripePriceId needed (core app doesn't create subscriptions)
-- ✅ Safe to run multiple times (idempotent)
--
-- ============================================
-- HOW IT WORKS:
-- ============================================
-- 1. Core app tries subscription-service API first
-- 2. If unavailable, falls back to local database
-- 3. Feature access checked against ACCESS_CONFIG.plans['elite+']
-- 4. ACCESS_CONFIG is the SINGLE SOURCE OF TRUTH for features
--
-- ============================================

