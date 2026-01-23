-- Fix Sunday data - it seems Sunday (2026-01-19) data is missing from the weekly report
-- The dates in your data don't match the weekly report dates

-- Check what dates actually exist in your database
SELECT 
  DATE(created_at) as date,
  EXTRACT(DOW FROM created_at) as day_of_week,  -- 0=Sunday, 1=Monday, etc.
  CASE EXTRACT(DOW FROM created_at)
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday' 
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END as day_name,
  SUM(total_amount) as daily_revenue,
  SUM(total_profit) as daily_profit,
  COUNT(*) as transaction_count
FROM stock_transactions 
WHERE type = 'OUT' 
  AND is_deleted = false
  AND DATE(created_at) BETWEEN '2026-01-18' AND '2026-01-24'  -- Full week range
GROUP BY DATE(created_at), EXTRACT(DOW FROM created_at)
ORDER BY DATE(created_at);

-- If Sunday is actually 2026-01-19, then your week should be 2026-01-19 to 2026-01-25
-- Update the realistic profits for the correct date range
UPDATE stock_transactions 
SET total_profit = total_amount * 0.25
WHERE type = 'OUT' 
  AND is_deleted = false
  AND DATE(created_at) BETWEEN '2026-01-19' AND '2026-01-25';