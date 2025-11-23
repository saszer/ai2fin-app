-- ============================================
-- ELITE+ Setup SQL for Neon Database
-- ============================================
-- Service: ai2-subscription-service
-- Database: Neon PostgreSQL
-- 
-- This script creates ELITE+ subscription plans (monthly and yearly)
-- Run this AFTER creating products/prices in Stripe and getting Price IDs
--
-- embracingearth.space - Enterprise subscription management
-- ============================================

-- ============================================
-- STEP 1: ELITE+ MONTHLY PLAN
-- ============================================
-- Replace 'price_xxxxx' with your actual ELITE+ monthly Price ID from Stripe
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
  "stripePriceId",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,  -- Auto-generate ID (or use cuid() if available)
  'AI2 ELITE+',
  'Full access with connectors, advanced analytics, and premium features',
  49.00,
  'USD',
  'month',
  1,
  0,  -- No trial
  '["dashboard","category_management","travel_expenses","patterns","bank_import","all_transactions","expense_management","custom_rules","privacy_management","email_processing","ato_export","ai_categorization","ai_tax_analysis","chat_file_upload","budget_allocations","tax_reports","ai_assistant","transactions_bills_analytics","connectors","admin_panel"]'::text,
  true,
  'price_xxxxx',  -- ⚠️ REPLACE with your ELITE+ monthly Price ID from Stripe
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
  "stripePriceId" = EXCLUDED."stripePriceId",
  "updatedAt" = NOW();

-- ============================================
-- STEP 2: ELITE+ YEARLY PLAN (OPTIONAL)
-- ============================================
-- Replace 'price_yyyyy' with your actual ELITE+ yearly Price ID from Stripe
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
  "stripePriceId",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'AI2 ELITE+ (Yearly)',
  'Full access with connectors, advanced analytics, and premium features - Yearly billing',
  490.00,
  'USD',
  'year',
  1,
  0,  -- No trial
  '["dashboard","category_management","travel_expenses","patterns","bank_import","all_transactions","expense_management","custom_rules","privacy_management","email_processing","ato_export","ai_categorization","ai_tax_analysis","chat_file_upload","budget_allocations","tax_reports","ai_assistant","transactions_bills_analytics","connectors","admin_panel"]'::text,
  true,
  'price_yyyyy',  -- ⚠️ REPLACE with your ELITE+ yearly Price ID from Stripe
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
  "stripePriceId" = EXCLUDED."stripePriceId",
  "updatedAt" = NOW();

-- ============================================
-- STEP 3: VERIFY PREMIUM PLANS EXIST
-- ============================================
-- Ensure Premium plans exist (if not, create them)
-- Replace 'price_premium_monthly' and 'price_premium_yearly' with your Premium Price IDs

-- Premium Monthly
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
  "stripePriceId",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'AI2 Premium',
  'Full access to AI2 Platform features',
  23.00,
  'USD',
  'month',
  1,
  0,
  '["dashboard","category_management","travel_expenses","patterns","bank_import","all_transactions","expense_management","custom_rules","privacy_management","ato_export","ai_categorization","ai_tax_analysis","chat_file_upload","transactions_bills_analytics"]'::text,
  true,
  'price_premium_monthly',  -- ⚠️ REPLACE with your Premium monthly Price ID from Stripe
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
  "stripePriceId" = EXCLUDED."stripePriceId",
  "updatedAt" = NOW();

-- Premium Yearly
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
  "stripePriceId",
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
  '["dashboard","category_management","travel_expenses","patterns","bank_import","all_transactions","expense_management","custom_rules","privacy_management","ato_export","ai_categorization","ai_tax_analysis","chat_file_upload","transactions_bills_analytics"]'::text,
  true,
  'price_premium_yearly',  -- ⚠️ REPLACE with your Premium yearly Price ID from Stripe
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
  "stripePriceId" = EXCLUDED."stripePriceId",
  "updatedAt" = NOW();

-- ============================================
-- STEP 4: VERIFY PLANS CREATED
-- ============================================
-- Run this query to verify all plans are created correctly
SELECT 
  name,
  description,
  price,
  currency,
  interval,
  "stripePriceId",
  "isActive",
  features
FROM subscription_plans
WHERE name IN ('AI2 Premium', 'AI2 Premium (Yearly)', 'AI2 ELITE+', 'AI2 ELITE+ (Yearly)')
ORDER BY 
  CASE name
    WHEN 'AI2 Premium' THEN 1
    WHEN 'AI2 Premium (Yearly)' THEN 2
    WHEN 'AI2 ELITE+' THEN 3
    WHEN 'AI2 ELITE+ (Yearly)' THEN 4
  END;

-- ============================================
-- NOTES:
-- ============================================
-- 1. Replace 'price_xxxxx' with your actual ELITE+ monthly Price ID from Stripe
-- 2. Replace 'price_yyyyy' with your actual ELITE+ yearly Price ID from Stripe
-- 3. Replace 'price_premium_monthly' with your Premium monthly Price ID
-- 4. Replace 'price_premium_yearly' with your Premium yearly Price ID
-- 5. The ON CONFLICT clause ensures idempotency (safe to run multiple times)
-- 6. Features list matches ACCESS_CONFIG.plans['elite+'] from core app
-- 7. Premium features match ACCESS_CONFIG.plans['pro'] from core app
--
-- ============================================
-- CORE APP DATABASE:
-- ============================================
-- The core app (ai2-core-app) does NOT need database changes for ELITE+.
-- Feature access is controlled by:
-- 1. ACCESS_CONFIG in ai2-core-app/src/services/accessControl/config.ts
-- 2. Subscription status from subscription-service API
-- 3. Middleware checks subscription tier and grants access
--
-- No SQL needed for core app database.
-- ============================================

