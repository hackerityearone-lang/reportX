-- Fix January 18th inflated profits specifically

-- Check what's causing the high profits on Jan 18
SELECT 
  t.id,
  t.created_at,
  t.total_amount,
  t.total_profit,
  soi.product_id,
  p.name,
  soi.quantity,
  soi.selling_price,
  soi.buying_price,
  soi.selling_price - soi.buying_price as profit_per_unit
FROM stock_transactions t
JOIN stock_out_items soi ON t.id = soi.transaction_id
JOIN products p ON soi.product_id = p.id
WHERE DATE(t.created_at) = '2026-01-18'
  AND t.type = 'OUT'
ORDER BY soi.selling_price - soi.buying_price DESC;

-- Fix items with unrealistic profit margins (>50%)
UPDATE stock_out_items 
SET 
  selling_price = (
    SELECT p.selling_price 
    FROM products p 
    WHERE p.id = stock_out_items.product_id
  ),
  buying_price = (
    SELECT CASE 
      WHEN p.unit_type = 'box' AND p.pieces_per_box > 0 THEN ROUND(p.price / p.pieces_per_box, 2)
      ELSE p.price
    END
    FROM products p 
    WHERE p.id = stock_out_items.product_id
  )
WHERE transaction_id IN (
  SELECT id FROM stock_transactions 
  WHERE DATE(created_at) = '2026-01-18' AND type = 'OUT'
)
AND (selling_price - buying_price) / NULLIF(selling_price, 0) > 0.5;

-- Recalculate Jan 18 transaction totals
UPDATE stock_transactions 
SET 
  total_amount = (
    SELECT SUM(quantity * selling_price)
    FROM stock_out_items 
    WHERE transaction_id = stock_transactions.id
  ),
  total_profit = (
    SELECT SUM(quantity * (selling_price - buying_price))
    FROM stock_out_items 
    WHERE transaction_id = stock_transactions.id
  )
WHERE DATE(created_at) = '2026-01-18' AND type = 'OUT';

-- Verification
SELECT 
  DATE(created_at) as date,
  COUNT(*) as transactions,
  SUM(total_amount) as total_sales,
  SUM(total_profit) as total_profit,
  ROUND(AVG(total_profit / NULLIF(total_amount, 0) * 100), 2) as avg_profit_margin
FROM stock_transactions 
WHERE DATE(created_at) = '2026-01-18' 
  AND type = 'OUT' 
  AND is_deleted = false
GROUP BY DATE(created_at);