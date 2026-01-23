-- Fix the profit calculation issue
-- The problem is that total_profit is not being recalculated correctly

-- Step 1: Recalculate total_profit for each transaction by summing item profits
UPDATE stock_transactions 
SET total_profit = subquery.calculated_profit
FROM (
  SELECT 
    st.id,
    COALESCE(SUM(soi.quantity * (soi.selling_price - soi.buying_price)), 0) as calculated_profit
  FROM stock_transactions st
  LEFT JOIN stock_out_items soi ON st.id = soi.transaction_id
  WHERE st.type = 'OUT' AND st.is_deleted = false
  GROUP BY st.id
) as subquery
WHERE stock_transactions.id = subquery.id;

-- Step 2: Verify the fix by checking Sunday transactions
SELECT 
  st.id,
  DATE(st.created_at) as date,
  st.total_amount,
  st.total_profit as updated_total_profit,
  st.payment_type,
  -- Calculate expected profit from items
  COALESCE(SUM(soi.quantity * (soi.selling_price - soi.buying_price)), 0) as expected_profit
FROM stock_transactions st
LEFT JOIN stock_out_items soi ON st.id = soi.transaction_id
WHERE st.type = 'OUT' 
  AND st.is_deleted = false 
  AND DATE(st.created_at) = '2026-01-19'
GROUP BY st.id, st.created_at, st.total_amount, st.total_profit, st.payment_type
ORDER BY st.created_at;