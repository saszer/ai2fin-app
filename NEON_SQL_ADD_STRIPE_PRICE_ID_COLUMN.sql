-- ============================================
-- Add stripePriceId Column to subscription_plans
-- ============================================
-- Service: ai2-subscription-service
-- Database: Neon PostgreSQL
-- 
-- This migration adds the stripePriceId column if it doesn't exist
-- Run this BEFORE running the ELITE+ setup SQL
--
-- embracingearth.space - Enterprise subscription management
-- ============================================

-- Check if column exists, if not add it
DO $$
BEGIN
  -- Add stripePriceId column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' 
    AND column_name = 'stripePriceId'
  ) THEN
    ALTER TABLE subscription_plans 
    ADD COLUMN "stripePriceId" VARCHAR(255);
    
    RAISE NOTICE '✅ Added stripePriceId column to subscription_plans';
  ELSE
    RAISE NOTICE '✅ Column stripePriceId already exists';
  END IF;
END $$;

-- Verify column was added
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
AND column_name = 'stripePriceId';

-- ============================================
-- NOTES:
-- ============================================
-- ✅ Safe to run multiple times (idempotent)
-- ✅ Only adds column if it doesn't exist
-- ✅ Run this BEFORE running ELITE+ setup SQL
-- ============================================

