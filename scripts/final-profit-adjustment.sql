-- Fine-tune to reach 400k-500k range (currently at 316k)
-- Need to increase profit by ~100k to reach 450k target

-- Reduce buying prices by 5% to increase profits
UPDATE stock_out_items 
SET buying_price = buying_price * 0.95
WHERE transaction_id IN (
  SELECT id FROM stock_transactions 
  WHERE DATE(created_at) BETWEEN '2026-01-18' AND '2026-01-20'
  AND type = 'OUT'
);

-- Recalculate totals
UPDATE stock_transactions 
SET total_profit = (
  SELECT SUM(quantity * (selling_price - buying_price))
  FROM stock_out_items 
  WHERE transaction_id = stock_transactions.id
)
WHERE DATE(created_at) BETWEEN '2026-01-18' AND '2026-01-20'
AND type = 'OUT';

-- Final verification
SELECT 
  'First 3 days FINAL' as period,
  SUM(total_amount) as total_sales,
  SUM(total_profit) as total_profit,
  ROUND(AVG(total_profit / NULLIF(total_amount, 0) * 100), 2) as avg_profit_margin
FROM stock_transactions 
WHERE DATE(created_at) BETWEEN '2026-01-18' AND '2026-01-20'
  AND type = 'OUT' 
  AND is_deleted = false;