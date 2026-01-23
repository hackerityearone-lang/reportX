-- Remove unique constraint on customer_id in credits table to allow multiple credits per customer
-- Run this in your Supabase SQL Editor

-- Check for existing constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'credits'::regclass;

-- Drop unique constraint on customer_id if it exists
DO $$
BEGIN
    -- Try to drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'credits'::regclass 
        AND conname LIKE '%customer_id%'
        AND contype = 'u'
    ) THEN
        EXECUTE 'ALTER TABLE credits DROP CONSTRAINT ' || (
            SELECT conname FROM pg_constraint 
            WHERE conrelid = 'credits'::regclass 
            AND conname LIKE '%customer_id%'
            AND contype = 'u'
            LIMIT 1
        );
        RAISE NOTICE 'Dropped unique constraint on customer_id';
    END IF;
END $$;

-- Also check for any triggers that might prevent multiple credits
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'credits';

-- Remove any trigger that prevents multiple credits (if exists)
DROP TRIGGER IF EXISTS prevent_multiple_credits ON credits;
DROP TRIGGER IF EXISTS trigger_check_single_active_credit ON credits;
DROP FUNCTION IF EXISTS check_single_credit_per_customer();
DROP FUNCTION IF EXISTS check_single_active_credit();

-- Verify no constraints remain
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'credits'::regclass
AND contype = 'u';