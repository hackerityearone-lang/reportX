-- Recalculate historical transaction profits (fixed for generated columns)

-- Step 1: Fix selling prices in stock_out_items that used old box prices
UPDATE stock_out_items 
SET selling_price = (
  SELECT p.selling_price 
  FROM products p 
  WHERE p.id = stock_out_items.product_id
)
WHERE selling_price > 15000 
  AND EXISTS (
    SELECT 1 FROM products p 
    WHERE p.id = stock_out_items.product_id 
    AND p.pieces_per_box > 0 
    AND selling_price > p.selling_price * 5
  )
  AND transaction_id IN (
    SELECT id FROM stock_transactions 
    WHERE type = 'OUT' AND created_at >= '2026-01-18'
  );

-- Step 2: Update buying prices to match current product prices
UPDATE stock_out_items 
SET buying_price = (
  SELECT CASE 
    WHEN p.unit_type = 'box' AND p.pieces_per_box > 0 THEN p.price / p.pieces_per_box
    ELSE p.price
  END
  FROM products p 
  WHERE p.id = stock_out_items.product_id
)
WHERE transaction_id IN (
  SELECT id FROM stock_transactions 
  WHERE type = 'OUT' AND created_at >= '2026-01-18'
);

-- Step 3: Recalculate transaction totals (generated columns will auto-update)
UPDATE stock_transactions 
SET 
  total_amount = (
    SELECT COALESCE(SUM(quantity * selling_price), 0)
    FROM stock_out_items 
    WHERE transaction_id = stock_transactions.id
  ),
  total_profit = (
    SELECT COALESCE(SUM(quantity * (selling_price - buying_price)), 0)
    FROM stock_out_items 
    WHERE transaction_id = stock_transactions.id
  )
WHERE type = 'OUT' AND created_at >= '2026-01-18';

-- Verification query
SELECT 
  DATE(created_at) as date,
  COUNT(*) as transactions,
  SUM(total_amount) as total_sales,
  SUM(total_profit) as total_profit,
  ROUND(AVG(total_profit / NULLIF(total_amount, 0) * 100), 2) as avg_profit_margin
FROM stock_transactions 
WHERE type = 'OUT' 
  AND created_at >= '2026-01-18' 
  AND created_at < '2026-01-25'
  AND is_deleted = false
GROUP BY DATE(created_at)
ORDER BY date;