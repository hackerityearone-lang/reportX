-- Fix Credits Table Schema
-- This script adds missing columns to the credits table
-- Run this in your Supabase SQL Editor

-- Step 1: Check current credits table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'credits'
ORDER BY ordinal_position;

-- Step 2: Add missing columns to credits table
ALTER TABLE credits ADD COLUMN IF NOT EXISTS amount_owed DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE credits ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE credits ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIAL', 'PAID'));
ALTER TABLE credits ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE credits ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE credits ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE credits ADD COLUMN IF NOT EXISTS payment_due_date DATE;
ALTER TABLE credits ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE credits ADD COLUMN IF NOT EXISTS transaction_id UUID;
ALTER TABLE credits ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE credits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 3: If the old 'amount' column exists, migrate data to amount_owed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'credits' 
    AND column_name = 'amount'
  ) THEN
    -- Copy amount to amount_owed where amount_owed is 0 or null
    UPDATE credits 
    SET amount_owed = amount 
    WHERE (amount_owed IS NULL OR amount_owed = 0) AND amount IS NOT NULL;
    
    RAISE NOTICE 'Migrated data from amount to amount_owed';
  END IF;
END $$;

-- Step 4: If is_paid column exists, migrate to status
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'credits' 
    AND column_name = 'is_paid'
  ) THEN
    UPDATE credits 
    SET status = CASE 
      WHEN is_paid = TRUE THEN 'PAID'
      WHEN amount_paid > 0 AND amount_paid < amount_owed THEN 'PARTIAL'
      ELSE 'PENDING'
    END
    WHERE status IS NULL;
    
    RAISE NOTICE 'Migrated is_paid to status';
  END IF;
END $$;

-- Step 5: Verify the final schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'credits'
ORDER BY ordinal_position;
