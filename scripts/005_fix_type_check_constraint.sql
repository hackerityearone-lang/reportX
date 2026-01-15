-- Migration Script: Fix type check constraint in stock_transactions table
-- This script resolves the error: "new row for relation 'stock_transactions' violates check constraint 'stock_transactions_type_check'"
--
-- The issue: The old schema has a constraint on 'type' column checking for 'STOCK_IN'/'STOCK_OUT'
-- but the new code uses 'transaction_type' column with 'IN'/'OUT' values.
--
-- Run this script in your Supabase SQL Editor to fix the issue.

-- Step 1: Drop the old type check constraint
DO $$
BEGIN
  -- Try to drop the old constraint (might have different names)
  ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS stock_transactions_type_check;
  ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS stock_transactions_check;
  ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS stock_transactions_check1;
  RAISE NOTICE 'Dropped old type check constraints';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No old constraints to drop or error: %', SQLERRM;
END $$;

-- Step 2: Drop the old 'type' column if it exists (after renaming to transaction_type)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_transactions' 
    AND column_name = 'type'
  ) THEN
    -- Check if transaction_type already exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'stock_transactions' 
      AND column_name = 'transaction_type'
    ) THEN
      -- Both exist, drop the old one
      ALTER TABLE stock_transactions DROP COLUMN type;
      RAISE NOTICE 'Dropped old "type" column';
    ELSE
      -- Only type exists, rename it
      ALTER TABLE stock_transactions RENAME COLUMN type TO transaction_type;
      RAISE NOTICE 'Renamed "type" to "transaction_type"';
    END IF;
  END IF;
END $$;

-- Step 3: Ensure transaction_type column exists with correct constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_transactions' 
    AND column_name = 'transaction_type'
  ) THEN
    ALTER TABLE stock_transactions 
    ADD COLUMN transaction_type TEXT NOT NULL DEFAULT 'OUT';
    RAISE NOTICE 'Added transaction_type column';
  END IF;
END $$;

-- Step 4: Drop any existing transaction_type constraint
DO $$
BEGIN
  ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS stock_transactions_transaction_type_check;
  ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS stock_transactions_transaction_type_check1;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No transaction_type constraints to drop';
END $$;

-- Step 5: Add the correct constraint for transaction_type
ALTER TABLE stock_transactions 
ADD CONSTRAINT stock_transactions_transaction_type_check 
CHECK (transaction_type IN ('IN', 'OUT'));

-- Step 6: Update any old values
UPDATE stock_transactions SET transaction_type = 'OUT' WHERE transaction_type = 'STOCK_OUT';
UPDATE stock_transactions SET transaction_type = 'IN' WHERE transaction_type = 'STOCK_IN';

-- Step 7: Make product_id nullable
ALTER TABLE stock_transactions ALTER COLUMN product_id DROP NOT NULL;

-- Step 8: Add all required columns for advanced stock out
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS total_profit DECIMAL(10, 2);
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS cancelled_reason TEXT;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Step 9: Fix payment_type constraint if needed
DO $$
BEGIN
  ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS stock_transactions_payment_type_check;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS payment_type TEXT;

DO $$
BEGIN
  ALTER TABLE stock_transactions 
  ADD CONSTRAINT stock_transactions_payment_type_check 
  CHECK (payment_type IS NULL OR payment_type IN ('CASH', 'CREDIT'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Verify the schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stock_transactions'
ORDER BY ordinal_position;

-- Show constraints
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'stock_transactions'::regclass;
