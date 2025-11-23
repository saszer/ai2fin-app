-- ============================================
-- ELITE+ Setup SQL for Neon Database
-- ============================================
-- Service: ai2-subscription-service
-- Database: Neon PostgreSQL
-- 
-- INSTRUCTIONS:
-- 1. FIRST: Run NEON_SQL_ADD_STRIPE_PRICE_ID_COLUMN.sql to add the column
-- 2. Create products/prices in Stripe Dashboard
-- 3. Copy the Price IDs from Stripe
-- 4. Replace the placeholder Price IDs below with your actual Stripe Price IDs
-- 5. Run this script in Neon SQL Editor
--
-- embracingearth.space - Enterprise subscription management
-- ============================================

-- ============================================
-- STEP 0: Ensure stripePriceId column exists
-- ============================================
-- Add column if it doesn't exist (safe to run multiple times)
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
  END IF;
END $$;

-- ============================================
-- ELITE+ MONTHLY PLAN
-- ============================================
-- Replace 'YOUR_ELITE_PLUS_MONTHLY_PRICE_ID' with your actual Price ID
INSERT INTO subscription_plans (
  name,
  description,
  price,
  currency,
  interval,
  "intervalCount",
  "trialPeriodDays",
  features,
  "isActive",
  "stripePriceId"
) VALUES (
  'AI2 ELITE+',
  'Full access with connectors, advanced analytics, and premium features',
  49.00,
  'USD',
  'month',
  1,
  0,
  '["dashboard","category_management","travel_expenses","patterns","bank_import","all_transactions","expense_management","custom_rules","privacy_management","email_processing","ato_export","ai_categorization","ai_tax_analysis","chat_file_upload","budget_allocations","tax_reports","ai_assistant","transactions_bills_analytics","connectors","admin_panel"]',
  true,
  'YOUR_ELITE_PLUS_MONTHLY_PRICE_ID'  -- ⚠️ REPLACE THIS
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  "stripePriceId" = EXCLUDED."stripePriceId",
  features = EXCLUDED.features,
  "updatedAt" = NOW();

-- ============================================
-- ELITE+ YEARLY PLAN
-- ============================================
-- Replace 'YOUR_ELITE_PLUS_YEARLY_PRICE_ID' with your actual Price ID
INSERT INTO subscription_plans (
  name,
  description,
  price,
  currency,
  interval,
  "intervalCount",
  "trialPeriodDays",
  features,
  "isActive",
  "stripePriceId"
) VALUES (
  'AI2 ELITE+ (Yearly)',
  'Full access with connectors, advanced analytics, and premium features - Yearly billing',
  490.00,
  'USD',
  'year',
  1,
  0,
  '["dashboard","category_management","travel_expenses","patterns","bank_import","all_transactions","expense_management","custom_rules","privacy_management","email_processing","ato_export","ai_categorization","ai_tax_analysis","chat_file_upload","budget_allocations","tax_reports","ai_assistant","transactions_bills_analytics","connectors","admin_panel"]',
  true,
  'YOUR_ELITE_PLUS_YEARLY_PRICE_ID'  -- ⚠️ REPLACE THIS
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  "stripePriceId" = EXCLUDED."stripePriceId",
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
  "stripePriceId",
  "isActive"
FROM subscription_plans
WHERE name LIKE '%ELITE+%' OR name LIKE '%Premium%'
ORDER BY name;

-- ============================================
-- NOTES:
-- ============================================
-- ✅ Core app (ai2-core-app) does NOT need database changes
-- ✅ Feature access is controlled by ACCESS_CONFIG in code
-- ✅ Only subscription-service database needs these plans
-- ✅ Replace Price IDs with your actual Stripe Price IDs
-- ✅ Safe to run multiple times (idempotent)

