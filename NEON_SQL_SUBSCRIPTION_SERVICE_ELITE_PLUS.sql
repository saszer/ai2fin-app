-- ============================================
-- ELITE+ Setup SQL for Subscription Service Database
-- ============================================
-- Service: ai2-subscription-service
-- Database: Neon PostgreSQL
-- 
-- INSTRUCTIONS:
-- 1. FIRST: Ensure stripePriceId column exists (script includes this)
-- 2. Create products/prices in Stripe Dashboard
-- 3. Copy the Price IDs from Stripe
-- 4. Replace 'YOUR_ELITE_PLUS_MONTHLY_PRICE_ID' and 'YOUR_ELITE_PLUS_YEARLY_PRICE_ID' below
-- 5. Run this script in Neon SQL Editor
--
-- embracingearth.space - Enterprise subscription management
-- ============================================

-- ============================================
-- STEP 1: Ensure stripePriceId column exists
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' 
    AND column_name = 'stripePriceId'
  ) THEN
    ALTER TABLE subscription_plans 
    ADD COLUMN "stripePriceId" VARCHAR(255);
    RAISE NOTICE '✅ Added stripePriceId column';
  END IF;
END $$;

-- ============================================
-- STEP 2: ELITE+ MONTHLY PLAN
-- ============================================
-- Replace 'YOUR_ELITE_PLUS_MONTHLY_PRICE_ID' with your actual Stripe Price ID
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
  'YOUR_ELITE_PLUS_MONTHLY_PRICE_ID',  -- ⚠️ REPLACE THIS with your Stripe Price ID
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
-- STEP 3: ELITE+ YEARLY PLAN
-- ============================================
-- Replace 'YOUR_ELITE_PLUS_YEARLY_PRICE_ID' with your actual Stripe Price ID
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
  'YOUR_ELITE_PLUS_YEARLY_PRICE_ID',  -- ⚠️ REPLACE THIS with your Stripe Price ID
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
-- STEP 4: PREMIUM YEARLY PLAN (if not exists)
-- ============================================
-- Replace 'YOUR_PREMIUM_YEARLY_PRICE_ID' with your actual Stripe Price ID
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
  '["dashboard","category_management","travel_expenses","patterns","bank_import","all_transactions","expense_management","custom_rules","privacy_management","ato_export","ai_categorization","ai_tax_analysis","chat_file_upload","transactions_bills_analytics"]',
  true,
  'YOUR_PREMIUM_YEARLY_PRICE_ID',  -- ⚠️ REPLACE THIS with your Stripe Price ID
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
-- STEP 5: VERIFY PLANS CREATED
-- ============================================
SELECT 
  id,
  name,
  price,
  currency,
  interval,
  "stripePriceId",
  "isActive",
  "createdAt"
FROM subscription_plans
WHERE name LIKE '%ELITE+%' OR name LIKE '%Premium%'
ORDER BY 
  CASE name
    WHEN 'AI2 Premium' THEN 1
    WHEN 'AI2 Premium (Yearly)' THEN 2
    WHEN 'AI2 ELITE+' THEN 3
    WHEN 'AI2 ELITE+ (Yearly)' THEN 4
    ELSE 5
  END,
  name;

-- ============================================
-- NOTES:
-- ============================================
-- ✅ Safe to run multiple times (idempotent)
-- ✅ Automatically adds stripePriceId column if missing
-- ✅ Uses gen_random_uuid() for ID generation
-- ✅ ON CONFLICT updates existing plans instead of erroring
-- ✅ Replace Price IDs with your actual Stripe Price IDs
-- ============================================

