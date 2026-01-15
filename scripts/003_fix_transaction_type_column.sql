-- Migration Script: Fix transaction_type column in stock_transactions table
-- This script resolves the error: "Could not find the 'transaction_type' column of 'stock_transactions' in the schema cache"
--
-- The issue: The original 001_create_tables.sql uses 'type' column, but the application code
-- and 001-create-tables.sql expect 'transaction_type' column.
--
-- Run this script in your Supabase SQL Editor to fix the issue.

-- Step 1: Check if 'type' column exists and rename it to 'transaction_type'
DO $$
BEGIN
  -- Check if 'type' column exists (from 001_create_tables.sql)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_transactions' 
    AND column_name = 'type'
  ) THEN
    -- Rename 'type' to 'transaction_type'
    ALTER TABLE stock_transactions RENAME COLUMN type TO transaction_type;
    RAISE NOTICE 'Renamed column "type" to "transaction_type"';
  END IF;
END $$;

-- Step 2: If transaction_type doesn't exist at all, add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_transactions' 
    AND column_name = 'transaction_type'
  ) THEN
    ALTER TABLE stock_transactions 
    ADD COLUMN transaction_type TEXT NOT NULL DEFAULT 'OUT' 
    CHECK (transaction_type IN ('IN', 'OUT'));
    RAISE NOTICE 'Added column "transaction_type"';
  END IF;
END $$;

-- Step 3: Update the constraint if needed (ensure it uses correct values)
DO $$
BEGIN
  -- Drop old constraint if it exists with wrong name
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'stock_transactions' 
    AND constraint_name = 'stock_transactions_type_check'
  ) THEN
    ALTER TABLE stock_transactions DROP CONSTRAINT stock_transactions_type_check;
    RAISE NOTICE 'Dropped old constraint "stock_transactions_type_check"';
  END IF;
  
  -- Add new constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'stock_transactions' 
    AND constraint_name = 'stock_transactions_transaction_type_check'
  ) THEN
    ALTER TABLE stock_transactions 
    ADD CONSTRAINT stock_transactions_transaction_type_check 
    CHECK (transaction_type IN ('IN', 'OUT'));
    RAISE NOTICE 'Added constraint "stock_transactions_transaction_type_check"';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint already exists';
END $$;

-- Step 4: Update any existing data that might have old values
UPDATE stock_transactions 
SET transaction_type = 'OUT' 
WHERE transaction_type = 'STOCK_OUT';

UPDATE stock_transactions 
SET transaction_type = 'IN' 
WHERE transaction_type = 'STOCK_IN';

-- Step 5: Refresh the schema cache (Supabase specific)
-- Note: In Supabase, you may need to:
-- 1. Go to Settings > API
-- 2. Click "Reload schema cache" button
-- Or wait a few minutes for automatic refresh

-- Verify the column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stock_transactions' 
AND column_name = 'transaction_type';
