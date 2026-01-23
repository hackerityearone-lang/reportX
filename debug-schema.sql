-- Debug script to check actual database schema
-- Run this in Supabase SQL editor to see what columns actually exist

-- Check stock_transactions table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'stock_transactions' 
ORDER BY ordinal_position;

-- Check sample data from stock_transactions
SELECT id, payment_type, total_amount, quantity, transaction_type, created_at
FROM stock_transactions 
WHERE created_at >= '2026-01-23' 
LIMIT 5;

-- Check what transaction types exist
SELECT DISTINCT transaction_type FROM stock_transactions;