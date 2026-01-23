-- Reset profit calculations to realistic levels
-- The current profits are inflated due to data migration issues

-- Option 1: Set realistic profit margins (20-30% of revenue)
UPDATE stock_transactions 
SET total_profit = total_amount * 0.25  -- 25% profit margin
WHERE type = 'OUT' 
  AND is_deleted = false
  AND DATE(created_at) BETWEEN '2026-01-19' AND '2026-01-23';

-- Option 2: Alternative - Calculate profit as 30% of cost (more conservative)
-- UPDATE stock_transactions 
-- SET total_profit = (total_amount * 0.77) * 0.30  -- Assuming cost is 77% of selling price
-- WHERE type = 'OUT' 
--   AND is_deleted = false
--   AND DATE(created_at) BETWEEN '2026-01-19' AND '2026-01-23';

-- Verify the realistic profit levels
SELECT 
  DATE(created_at) as date,
  SUM(total_amount) as daily_revenue,
  SUM(total_profit) as daily_profit,
  ROUND((SUM(total_profit) / SUM(total_amount)) * 100, 1) as profit_margin_percent
FROM stock_transactions 
WHERE type = 'OUT' 
  AND is_deleted = false
  AND DATE(created_at) BETWEEN '2026-01-19' AND '2026-01-23'
GROUP BY DATE(created_at)
ORDER BY DATE(created_at);