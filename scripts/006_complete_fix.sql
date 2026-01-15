-- Complete Fix Script for stock_transactions table
-- This script fixes ALL issues with the stock_transactions table
-- Run this in your Supabase SQL Editor
--
-- The error "check constraint is violated by some row" means there's existing data
-- with old values that don't match the new constraint. We need to update the data FIRST.

-- Step 1: First, let's see what values exist in the table
SELECT DISTINCT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'type') 
    THEN (SELECT type FROM stock_transactions LIMIT 1)
    ELSE NULL 
  END as type_value,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'transaction_type') 
    THEN (SELECT transaction_type FROM stock_transactions LIMIT 1)
    ELSE NULL 
  END as transaction_type_value
FROM stock_transactions
LIMIT 10;

-- Step 2: Drop ALL existing constraints on the table related to type
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'stock_transactions'::regclass 
    AND (conname LIKE '%type%' OR conname LIKE '%check%')
  ) LOOP
    EXECUTE 'ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    RAISE NOTICE 'Dropped constraint: %', r.conname;
  END LOOP;
END $$;

-- Step 3: Handle the 'type' column - rename or migrate data
DO $$
BEGIN
  -- If 'type' column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_transactions' 
    AND column_name = 'type'
  ) THEN
    -- If 'transaction_type' also exists, migrate data and drop 'type'
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'stock_transactions' 
      AND column_name = 'transaction_type'
    ) THEN
      -- Copy data from type to transaction_type where transaction_type is null
      UPDATE stock_transactions 
      SET transaction_type = CASE 
        WHEN type = 'STOCK_IN' THEN 'IN'
        WHEN type = 'STOCK_OUT' THEN 'OUT'
        WHEN type = 'IN' THEN 'IN'
        WHEN type = 'OUT' THEN 'OUT'
        ELSE 'OUT'
      END
      WHERE transaction_type IS NULL;
      
      -- Drop the old type column
      ALTER TABLE stock_transactions DROP COLUMN type;
      RAISE NOTICE 'Migrated data from type to transaction_type and dropped type column';
    ELSE
      -- Only 'type' exists, rename it
      ALTER TABLE stock_transactions RENAME COLUMN type TO transaction_type;
      RAISE NOTICE 'Renamed type to transaction_type';
    END IF;
  END IF;
END $$;

-- Step 4: Ensure transaction_type column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_transactions' 
    AND column_name = 'transaction_type'
  ) THEN
    ALTER TABLE stock_transactions ADD COLUMN transaction_type TEXT DEFAULT 'OUT';
    RAISE NOTICE 'Added transaction_type column';
  END IF;
END $$;

-- Step 5: Update ALL existing data to use correct values BEFORE adding constraint
UPDATE stock_transactions 
SET transaction_type = 'OUT' 
WHERE transaction_type = 'STOCK_OUT' OR transaction_type IS NULL;

UPDATE stock_transactions 
SET transaction_type = 'IN' 
WHERE transaction_type = 'STOCK_IN';

-- Step 6: Make sure all values are valid
UPDATE stock_transactions 
SET transaction_type = 'OUT' 
WHERE transaction_type NOT IN ('IN', 'OUT');

-- Step 7: Now add the constraint (after data is clean)
ALTER TABLE stock_transactions 
ADD CONSTRAINT stock_transactions_transaction_type_check 
CHECK (transaction_type IN ('IN', 'OUT'));

-- Step 8: Make product_id nullable
DO $$
BEGIN
  ALTER TABLE stock_transactions ALTER COLUMN product_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'product_id already nullable or does not exist';
END $$;

-- Step 9: Add all required columns for advanced stock out
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS total_profit DECIMAL(10, 2);
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS cancelled_reason TEXT;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS payment_type TEXT;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS quantity INTEGER;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 10: Verify the final schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stock_transactions'
ORDER BY ordinal_position;

-- Step 11: Show all constraints
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'stock_transactions'::regclass;

-- Step 12: Show sample data
SELECT id, transaction_type, payment_type, total_amount, is_cancelled
FROM stock_transactions
LIMIT 5;
