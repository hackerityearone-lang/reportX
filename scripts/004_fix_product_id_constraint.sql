-- Migration Script: Fix product_id NOT NULL constraint in stock_transactions table
-- This script resolves the error: "null value in column 'product_id' of relation 'stock_transactions' violates not-null constraint"
--
-- The issue: The original schema requires product_id for each transaction, but the advanced
-- stock out system uses stock_out_items table for multiple products per transaction.
-- The main stock_transactions table should NOT require product_id when using the advanced system.
--
-- Run this script in your Supabase SQL Editor to fix the issue.

-- Step 1: Make product_id nullable in stock_transactions
-- This allows transactions to have multiple products via stock_out_items table
ALTER TABLE stock_transactions 
ALTER COLUMN product_id DROP NOT NULL;

-- Step 2: Add transaction_type column if it doesn't exist
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

-- Step 3: Rename 'type' to 'transaction_type' if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_transactions' 
    AND column_name = 'type'
  ) THEN
    -- First drop the old column if transaction_type already exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'stock_transactions' 
      AND column_name = 'transaction_type'
    ) THEN
      ALTER TABLE stock_transactions DROP COLUMN type;
    ELSE
      ALTER TABLE stock_transactions RENAME COLUMN type TO transaction_type;
    END IF;
    RAISE NOTICE 'Handled column "type" -> "transaction_type"';
  END IF;
END $$;

-- Step 4: Ensure all required columns exist for advanced stock out
DO $$
BEGIN
  -- Add total_amount if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_transactions' 
    AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE stock_transactions ADD COLUMN total_amount DECIMAL(10, 2);
  END IF;

  -- Add total_profit if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_transactions' 
    AND column_name = 'total_profit'
  ) THEN
    ALTER TABLE stock_transactions ADD COLUMN total_profit DECIMAL(10, 2);
  END IF;

  -- Add is_cancelled if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_transactions' 
    AND column_name = 'is_cancelled'
  ) THEN
    ALTER TABLE stock_transactions ADD COLUMN is_cancelled BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add cancelled_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_transactions' 
    AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE stock_transactions ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add cancelled_reason if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_transactions' 
    AND column_name = 'cancelled_reason'
  ) THEN
    ALTER TABLE stock_transactions ADD COLUMN cancelled_reason TEXT;
  END IF;

  -- Add customer_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_transactions' 
    AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE stock_transactions ADD COLUMN customer_id UUID;
  END IF;

  -- Add phone if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_transactions' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE stock_transactions ADD COLUMN phone TEXT;
  END IF;

  -- Add invoice_number if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_transactions' 
    AND column_name = 'invoice_number'
  ) THEN
    ALTER TABLE stock_transactions ADD COLUMN invoice_number TEXT UNIQUE;
  END IF;

  -- Add payment_type if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_transactions' 
    AND column_name = 'payment_type'
  ) THEN
    ALTER TABLE stock_transactions ADD COLUMN payment_type TEXT CHECK (payment_type IN ('CASH', 'CREDIT'));
  END IF;

  -- Add quantity if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_transactions' 
    AND column_name = 'quantity'
  ) THEN
    ALTER TABLE stock_transactions ADD COLUMN quantity INTEGER;
  END IF;

  -- Add notes if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_transactions' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE stock_transactions ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Step 5: Verify the schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stock_transactions'
ORDER BY ordinal_position;
