-- Check if there are ANY stock-out transactions in your database
-- and what date range they cover

-- Query 1: Check for transactions around Jan 24-26, 2026
SELECT 
  DATE(created_at) as transaction_date,
  COUNT(*) as transaction_count,
  SUM(quantity) as total_quantity
FROM stock_transactions
WHERE type = 'OUT'
  AND created_at >= '2026-01-20 00:00:00'::timestamptz
  AND created_at <= '2026-01-31 23:59:59'::timestamptz
GROUP BY DATE(created_at)
ORDER BY transaction_date;

-- Query 2: Check the is_deleted and is_cancelled flags
SELECT 
  COUNT(*) as total_out_transactions,
  COUNT(CASE WHEN COALESCE(is_deleted, FALSE) = TRUE THEN 1 END) as deleted_count,
  COUNT(CASE WHEN COALESCE(is_cancelled, FALSE) = TRUE THEN 1 END) as cancelled_count,
  COUNT(CASE WHEN COALESCE(is_deleted, FALSE) = FALSE AND COALESCE(is_cancelled, FALSE) = FALSE THEN 1 END) as active_count
FROM stock_transactions
WHERE type = 'OUT'
  AND created_at >= '2026-01-24 00:00:00'::timestamptz
  AND created_at <= '2026-01-26 23:59:59'::timestamptz;

-- Query 3: Show sample transactions from Jan 24-26
SELECT 
  id,
  created_at,
  product_id,
  quantity,
  unit_sold,
  is_deleted,
  is_cancelled
FROM stock_transactions
WHERE type = 'OUT'
  AND created_at >= '2026-01-24 00:00:00'::timestamptz
  AND created_at <= '2026-01-26 23:59:59'::timestamptz
ORDER BY created_at
LIMIT 10;
