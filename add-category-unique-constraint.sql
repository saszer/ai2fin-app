-- Add unique constraint on category names per user to prevent duplicates
-- This ensures no duplicate category names can be created for the same user

-- First, create a unique index on (userId, LOWER(name))
-- This prevents case-insensitive duplicates
CREATE UNIQUE INDEX IF NOT EXISTS "Category_userId_name_unique" 
ON "Category" ("userId", LOWER("name"));

-- Add a comment to document the constraint
COMMENT ON INDEX "Category_userId_name_unique" IS 'Prevents duplicate category names (case-insensitive) per user';

-- Verify the constraint works by checking for any existing duplicates
-- This query should return 0 rows if no duplicates exist
SELECT 
    "userId",
    LOWER("name") as lower_name,
    COUNT(*) as duplicate_count
FROM "Category"
GROUP BY "userId", LOWER("name")
HAVING COUNT(*) > 1; 